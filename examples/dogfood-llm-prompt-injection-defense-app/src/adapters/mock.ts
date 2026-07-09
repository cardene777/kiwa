/**
 * Mock adapter — drives `@kiwa-lab/ai-llm` v0.4 prompt-injection +
 * guardrails semantics so the same app code exercises a deterministic
 * defense ceremony without a real Anthropic API call. Both mock and real
 * adapters satisfy {@link LlmSafetyAdapter}, so the fidelity harness can
 * diff them side-by-side.
 *
 * State model — one injection session + one guardrail session + one
 * pipeline session per sessionId across each surface. Each session is
 * isolated so per-surface metrics stay separated. The pipeline surface
 * composes fresh injection + guardrail sub-sessions per {@link runPipeline}
 * call so multi-stage flows can be exercised without resetting state.
 *
 * The mock piggy-backs on the same neutral event vocabulary that the
 * v1.38-1 semantics package emits — every op appends the matching neutral
 * event into the trace so the fidelity harness can assert the mock and
 * real adapters produce identical event orderings.
 */

import {
  blockJailbreak,
  blockRoleHijacking,
  blockToxicity,
  checkConstitutional,
  classifyDirect,
  detectInjection,
  redactPii,
  startGuardrailSession,
  startInjectionSession,
  validateSchema,
  type GuardrailSession,
  type InjectionSession,
  type SimpleSchema,
} from '@kiwa-lab/ai-llm';
import type {
  ConstitutionalCheckResult,
  DefensePipelineResult,
  DirectClassifyResult,
  InjectionAnalyzeResult,
  JailbreakBlockResult,
  JsonSchemaInput,
  LlmSafetyAdapter,
  PiiRedactResult,
  RoleHijackBlockResult,
  SchemaValidateResult,
  ToxicityBlockResult,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface InjectionRoom {
  session: InjectionSession;
  closed: boolean;
}

interface GuardrailRoom {
  session: GuardrailSession;
  closed: boolean;
}

interface PipelineRoom {
  sessionId: string;
  closed: boolean;
}

export function makeMockAdapter(
  opts: MakeMockAdapterOptions = {},
): LlmSafetyAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const injectionRooms = new Map<string, InjectionRoom>();
  const guardrailRooms = new Map<string, GuardrailRoom>();
  const pipelineRooms = new Map<string, PipelineRoom>();
  const trace: TraceEvent[] = [];

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function sleep(): Promise<void> {
    if (latencyMs <= 0) return;
    await new Promise((r) => setTimeout(r, latencyMs));
  }

  function toSimpleSchema(input: JsonSchemaInput): SimpleSchema {
    const out: SimpleSchema = {
      type: input.type,
      properties: input.properties,
    };
    if (input.required !== undefined) out.required = input.required;
    return out;
  }

  return {
    mode: 'mock',

    async startInjection(input) {
      await sleep();
      if (injectionRooms.has(input.sessionId)) {
        record('startInjection', false, { errorKind: 'DUPLICATE_SESSION' });
        throw new Error(`startInjection: duplicate session ${input.sessionId}`);
      }
      const session = startInjectionSession({
        target: 'anthropic',
        sessionId: input.sessionId,
      });
      injectionRooms.set(input.sessionId, { session, closed: false });
      record('startInjection', true, {
        detail: { sessionId: input.sessionId },
      });
    },

    async analyzeInjection(input): Promise<InjectionAnalyzeResult> {
      const t0 = Date.now();
      await sleep();
      const room = injectionRooms.get(input.sessionId);
      if (!room) {
        record('analyzeInjection', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`analyzeInjection: no session ${input.sessionId}`);
      }
      const result = detectInjection(room.session, input.text);
      const detectedKinds = Array.from(
        new Set(result.detections.map((d) => d.kind)),
      );
      const out: InjectionAnalyzeResult = {
        sessionId: input.sessionId,
        detectionCount: result.detections.length,
        detectedKinds,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('analyzeInjection', true, { detail: out });
      return out;
    },

    async classifyDirect(input): Promise<DirectClassifyResult> {
      const t0 = Date.now();
      await sleep();
      const room = injectionRooms.get(input.sessionId);
      if (!room) {
        record('classifyDirect', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`classifyDirect: no session ${input.sessionId}`);
      }
      const step = classifyDirect(room.session, input.text);
      const out: DirectClassifyResult = {
        sessionId: input.sessionId,
        blocked: step.blocked,
        hitCount: (step.step.metadata['hitCount'] as number) ?? 0,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('classifyDirect', true, { detail: out });
      return out;
    },

    async blockJailbreak(input): Promise<JailbreakBlockResult> {
      const t0 = Date.now();
      await sleep();
      const room = injectionRooms.get(input.sessionId);
      if (!room) {
        record('blockJailbreak', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`blockJailbreak: no session ${input.sessionId}`);
      }
      const step = blockJailbreak(room.session, input.text);
      const out: JailbreakBlockResult = {
        sessionId: input.sessionId,
        blocked: step.blocked,
        hitCount: (step.step.metadata['hitCount'] as number) ?? 0,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('blockJailbreak', true, { detail: out });
      return out;
    },

    async blockRoleHijack(input): Promise<RoleHijackBlockResult> {
      const t0 = Date.now();
      await sleep();
      const room = injectionRooms.get(input.sessionId);
      if (!room) {
        record('blockRoleHijack', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`blockRoleHijack: no session ${input.sessionId}`);
      }
      const step = blockRoleHijacking(room.session, input.text);
      const out: RoleHijackBlockResult = {
        sessionId: input.sessionId,
        blocked: step.blocked,
        roleHitCount: (step.step.metadata['roleHitCount'] as number) ?? 0,
        xmlHitCount: (step.step.metadata['xmlHitCount'] as number) ?? 0,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('blockRoleHijack', true, { detail: out });
      return out;
    },

    async closeInjection(input) {
      await sleep();
      const room = injectionRooms.get(input.sessionId);
      if (!room) {
        record('closeInjection', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`closeInjection: no session ${input.sessionId}`);
      }
      room.closed = true;
      record('closeInjection', true, {
        detail: {
          sessionId: input.sessionId,
          historyLength: room.session.history.length,
        },
      });
    },

    async startGuardrail(input) {
      await sleep();
      if (guardrailRooms.has(input.sessionId)) {
        record('startGuardrail', false, { errorKind: 'DUPLICATE_SESSION' });
        throw new Error(`startGuardrail: duplicate session ${input.sessionId}`);
      }
      const session = startGuardrailSession({
        target: 'anthropic',
        sessionId: input.sessionId,
      });
      guardrailRooms.set(input.sessionId, { session, closed: false });
      record('startGuardrail', true, {
        detail: { sessionId: input.sessionId },
      });
    },

    async validateSchema(input): Promise<SchemaValidateResult> {
      const t0 = Date.now();
      await sleep();
      const room = guardrailRooms.get(input.sessionId);
      if (!room) {
        record('validateSchema', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`validateSchema: no session ${input.sessionId}`);
      }
      const result = validateSchema(room.session, {
        value: input.value,
        schema: toSimpleSchema(input.schema),
      });
      const out: SchemaValidateResult = {
        sessionId: input.sessionId,
        valid: result.valid,
        errorCount: result.errors.length,
        errors: result.errors,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('validateSchema', true, { detail: out });
      return out;
    },

    async blockToxicity(input): Promise<ToxicityBlockResult> {
      const t0 = Date.now();
      await sleep();
      const room = guardrailRooms.get(input.sessionId);
      if (!room) {
        record('blockToxicity', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`blockToxicity: no session ${input.sessionId}`);
      }
      const threshold = input.threshold ?? 0.05;
      const result = blockToxicity(room.session, {
        text: input.text,
        threshold,
      });
      const out: ToxicityBlockResult = {
        sessionId: input.sessionId,
        blocked: result.blocked,
        score: result.score,
        threshold,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('blockToxicity', true, { detail: out });
      return out;
    },

    async redactPii(input): Promise<PiiRedactResult> {
      const t0 = Date.now();
      await sleep();
      const room = guardrailRooms.get(input.sessionId);
      if (!room) {
        record('redactPii', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`redactPii: no session ${input.sessionId}`);
      }
      const result = redactPii(room.session, input.text);
      const out: PiiRedactResult = {
        sessionId: input.sessionId,
        redacted: result.redacted,
        hitKinds: result.hits.map((h) => h.kind),
        totalHits: result.hits.reduce((s, h) => s + h.count, 0),
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('redactPii', true, { detail: out });
      return out;
    },

    async checkConstitutional(input): Promise<ConstitutionalCheckResult> {
      const t0 = Date.now();
      await sleep();
      const room = guardrailRooms.get(input.sessionId);
      if (!room) {
        record('checkConstitutional', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`checkConstitutional: no session ${input.sessionId}`);
      }
      const result = checkConstitutional(room.session, {
        text: input.text,
        principles: input.principles,
      });
      const out: ConstitutionalCheckResult = {
        sessionId: input.sessionId,
        violationCount: result.violations.length,
        violations: result.violations.map((v) => ({
          principleId: v.id,
          word: v.word,
        })),
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('checkConstitutional', true, { detail: out });
      return out;
    },

    async closeGuardrail(input) {
      await sleep();
      const room = guardrailRooms.get(input.sessionId);
      if (!room) {
        record('closeGuardrail', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`closeGuardrail: no session ${input.sessionId}`);
      }
      room.closed = true;
      record('closeGuardrail', true, {
        detail: {
          sessionId: input.sessionId,
          historyLength: room.session.history.length,
        },
      });
    },

    async startPipeline(input) {
      await sleep();
      if (pipelineRooms.has(input.sessionId)) {
        record('startPipeline', false, { errorKind: 'DUPLICATE_SESSION' });
        throw new Error(`startPipeline: duplicate session ${input.sessionId}`);
      }
      pipelineRooms.set(input.sessionId, {
        sessionId: input.sessionId,
        closed: false,
      });
      record('startPipeline', true, {
        detail: { sessionId: input.sessionId },
      });
    },

    async runPipeline(input): Promise<DefensePipelineResult> {
      const t0 = Date.now();
      await sleep();
      const room = pipelineRooms.get(input.sessionId);
      if (!room) {
        record('runPipeline', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`runPipeline: no session ${input.sessionId}`);
      }
      const injSubId = `${input.sessionId}:inj`;
      const grSubId = `${input.sessionId}:gr`;
      const injSession = startInjectionSession({
        target: 'anthropic',
        sessionId: injSubId,
      });
      const grSession = startGuardrailSession({
        target: 'anthropic',
        sessionId: grSubId,
      });

      const analyzeStep = detectInjection(injSession, input.userInput);
      const injectionDetections = Array.from(
        new Set(analyzeStep.detections.map((d) => d.kind)),
      );

      if (analyzeStep.detections.length > 0) {
        // Injection detected → block early, do not run guardrails
        const out: DefensePipelineResult = {
          sessionId: input.sessionId,
          stage: 'blocked-injection',
          blockedReason: `injection:${injectionDetections.join(',')}`,
          redactedInput: input.userInput,
          detections: injectionDetections,
          guardrailFindings: [],
          latencyMs: Math.max(1, Date.now() - t0),
        };
        record('runPipeline', true, { detail: out });
        return out;
      }

      // No injection → run guardrails (schema stage skipped for pipeline mode
      // because the user input is free-form text; we still exercise regex →
      // toxicity → pii → constitutional).
      // Schema stage is validated by a trivial passing schema so the state
      // machine advances past 'idle' before toxicity checks; the guardrails
      // semantics module requires schema stage before subsequent checks.
      const wrapperSchema: SimpleSchema = {
        type: 'object',
        properties: { input: { type: 'string' } },
      };
      validateSchema(grSession, {
        value: { input: input.userInput },
        schema: wrapperSchema,
      });

      const pii = redactPii(grSession, input.userInput);
      const redactedInput = pii.redacted;

      const tox = blockToxicity(grSession, {
        text: redactedInput,
        threshold: input.toxicityThreshold ?? 0.05,
      });

      const findings: string[] = [];
      if (pii.hits.length > 0) {
        findings.push(`pii:${pii.hits.map((h) => h.kind).join(',')}`);
      }
      if (tox.blocked) {
        findings.push(`toxicity:${tox.score.toFixed(3)}`);
      }

      if (input.principles && input.principles.length > 0) {
        const con = checkConstitutional(grSession, {
          text: redactedInput,
          principles: input.principles,
        });
        if (con.violations.length > 0) {
          findings.push(
            `constitutional:${con.violations.map((v) => v.id).join(',')}`,
          );
        }
      }

      if (tox.blocked) {
        const out: DefensePipelineResult = {
          sessionId: input.sessionId,
          stage: 'blocked-guardrail',
          blockedReason: `toxicity:${tox.score.toFixed(3)}`,
          redactedInput,
          detections: [],
          guardrailFindings: findings,
          latencyMs: Math.max(1, Date.now() - t0),
        };
        record('runPipeline', true, { detail: out });
        return out;
      }

      const out: DefensePipelineResult = {
        sessionId: input.sessionId,
        stage: 'allowed',
        blockedReason: null,
        redactedInput,
        detections: [],
        guardrailFindings: findings,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('runPipeline', true, { detail: out });
      return out;
    },

    traces() {
      return trace;
    },

    async reset() {
      injectionRooms.clear();
      guardrailRooms.clear();
      pipelineRooms.clear();
      trace.length = 0;
    },
  };
}
