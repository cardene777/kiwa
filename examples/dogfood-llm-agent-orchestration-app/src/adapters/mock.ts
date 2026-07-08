/**
 * Mock adapter — drives `@kiwa/ai-llm` v0.4 agent-orchestration
 * semantics so the same app code exercises a deterministic planning
 * ceremony without a real Anthropic / Vercel AI SDK call. Both mock and
 * real adapters satisfy {@link LlmAgentAdapter}, so the fidelity harness
 * can diff them side-by-side.
 *
 * State model — one agent session per sessionId across the ReAct + ToT +
 * reflect + toolSelect axes (the semantics module keeps them in one
 * shared session so the state machine advances monotonically). The
 * pipeline surface allocates a fresh sub-session per
 * {@link runPipeline} call so multi-stage plans do not interfere with
 * the outer agent session.
 *
 * The mock piggy-backs on the same neutral event vocabulary that the
 * v1.38-1 semantics package emits — every op appends the matching neutral
 * event into the trace so the fidelity harness can assert the mock and
 * real adapters produce identical event orderings.
 */

import {
  expandToT,
  reactStep,
  reflectAndCorrect,
  selectTool,
  startAgentSession,
  type AgentSession,
} from '@kiwa/ai-llm';
import type {
  AgentPipelineResult,
  LlmAgentAdapter,
  PipelineInput,
  ReactStepResult,
  ReflectResult,
  ToolCandidateInput,
  ToolSelectResult,
  TotExpandResult,
  TotInput,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface AgentRoom {
  session: AgentSession;
  closed: boolean;
}

interface PipelineRoom {
  sessionId: string;
  closed: boolean;
}

export function makeMockAdapter(
  opts: MakeMockAdapterOptions = {},
): LlmAgentAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const agentRooms = new Map<string, AgentRoom>();
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

  return {
    mode: 'mock',

    async startAgent(input) {
      await sleep();
      if (agentRooms.has(input.sessionId)) {
        record('startAgent', false, { errorKind: 'DUPLICATE_SESSION' });
        throw new Error(`startAgent: duplicate session ${input.sessionId}`);
      }
      const session = startAgentSession({
        target: 'vercel-ai',
        sessionId: input.sessionId,
      });
      agentRooms.set(input.sessionId, { session, closed: false });
      record('startAgent', true, {
        detail: { sessionId: input.sessionId },
      });
    },

    async reactStep(input): Promise<ReactStepResult> {
      const t0 = Date.now();
      await sleep();
      const room = agentRooms.get(input.sessionId);
      if (!room) {
        record('reactStep', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`reactStep: no session ${input.sessionId}`);
      }
      const { step, trace: reactTrace } = reactStep(room.session, input.step);
      const out: ReactStepResult = {
        sessionId: input.sessionId,
        index: (step.metadata['index'] as number) ?? reactTrace.length - 1,
        traceLength: reactTrace.length,
        tool: input.step.action.tool,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('reactStep', true, { detail: out });
      return out;
    },

    async expandToT(input): Promise<TotExpandResult> {
      const t0 = Date.now();
      await sleep();
      const room = agentRooms.get(input.sessionId);
      if (!room) {
        record('expandToT', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`expandToT: no session ${input.sessionId}`);
      }
      const { nodeCount } = expandToT(room.session, input.plan);
      const rootScore = room.session.totTree?.score ?? 0;
      const out: TotExpandResult = {
        sessionId: input.sessionId,
        nodeCount,
        depth: input.plan.depth,
        branchFactor: input.plan.branches.length,
        rootScore,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('expandToT', true, { detail: out });
      return out;
    },

    async reflect(input): Promise<ReflectResult> {
      const t0 = Date.now();
      await sleep();
      const room = agentRooms.get(input.sessionId);
      if (!room) {
        record('reflect', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`reflect: no session ${input.sessionId}`);
      }
      const { reflection } = reflectAndCorrect(room.session, input.reflect);
      const violationCount = reflection.critique.includes('violated')
        ? Number(reflection.critique.match(/violated (\d+)/)?.[1] ?? 0)
        : 0;
      const out: ReflectResult = {
        sessionId: input.sessionId,
        cycle: reflection.cycle,
        critique: reflection.critique,
        revised: reflection.revised,
        violationCount,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('reflect', true, { detail: out });
      return out;
    },

    async selectTool(input): Promise<ToolSelectResult> {
      const t0 = Date.now();
      await sleep();
      const room = agentRooms.get(input.sessionId);
      if (!room) {
        record('selectTool', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`selectTool: no session ${input.sessionId}`);
      }
      const { selected, ranking } = selectTool(room.session, {
        intent: input.intent,
        candidates: input.candidates,
      });
      const out: ToolSelectResult = {
        sessionId: input.sessionId,
        selectedName: selected?.name ?? null,
        topScore: selected?.score ?? 0,
        candidateCount: input.candidates.length,
        ranking: ranking.map((r) => ({ name: r.name, score: r.score })),
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('selectTool', true, { detail: out });
      return out;
    },

    async closeAgent(input) {
      await sleep();
      const room = agentRooms.get(input.sessionId);
      if (!room) {
        record('closeAgent', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`closeAgent: no session ${input.sessionId}`);
      }
      room.closed = true;
      record('closeAgent', true, {
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

    async runPipeline(input): Promise<AgentPipelineResult> {
      const t0 = Date.now();
      await sleep();
      const room = pipelineRooms.get(input.sessionId);
      if (!room) {
        record('runPipeline', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`runPipeline: no session ${input.sessionId}`);
      }
      const subSessionId = `${input.sessionId}:agent`;
      const session = startAgentSession({
        target: 'vercel-ai',
        sessionId: subSessionId,
      });

      // The v0.4 agent-orchestration state machine only accepts one op
      // per state transition, so the pipeline sequences them so that
      // every op advances the state legally —
      //   idle → reactStep → react-stepped
      //   react-stepped → expandToT → tot-expanded
      //   tot-expanded → reflectAndCorrect → reflected
      //   reflected → selectTool → tool-selected
      // Doing selectTool earlier would trap the session in
      // `tool-selected`, from which the semantics module refuses further
      // reactStep + reflect ops. Running expandToT before the first
      // reactStep is fine (state=idle → tot-expanded) but then reactStep
      // would be blocked by the `tot-expanded` guard, so the pipeline
      // takes the react-first path — the v04-cross-axis fixture in the
      // parent semantics package (packages/ai-llm/tests/semantics/v04-
      // cross-axis.test.ts) uses the identical react → tot → reflect →
      // tool ordering.

      // Stage 1: act (ReAct trace). The mock replays every requested
      // step so the fidelity harness can compare the exercised action
      // sequence against the real Vercel AI SDK once the driver lands.
      let traceLength = 0;
      for (const step of input.reactSteps) {
        const { trace: rTrace } = reactStep(session, step);
        traceLength = rTrace.length;
      }

      // Stage 2: plan (Tree-of-Thought). Runs after reactStep because
      // expandToT re-accepts state=react-stepped even though it also
      // accepts idle.
      const { nodeCount } = expandToT(session, input.plan);
      const topScore = session.totTree?.score ?? 0;

      // Stage 3: reflect and (optionally) self-correct. The mock scans
      // the output for each critique rule and rewrites any hit with a
      // `[revised]` marker so downstream stages can decide whether to
      // block or complete.
      const { reflection } = reflectAndCorrect(session, input.reflect);
      const violationCount = reflection.critique.includes('violated')
        ? Number(reflection.critique.match(/violated (\d+)/)?.[1] ?? 0)
        : 0;

      // Stage 4: tool selection with fallback ladder. The ranker orders
      // candidates by intent-token overlap; the pipeline walks the
      // ranking from the top and picks the first candidate whose score
      // meets the threshold. Every skipped candidate raises
      // fallbackDepth so the release gate can score how brittle the
      // top-ranked tool was.
      const threshold = input.toolScoreThreshold ?? 0;
      const { ranking } = selectTool(session, {
        intent: input.intent,
        candidates: input.candidates,
      });
      let fallbackDepth = 0;
      let picked: (typeof ranking)[number] | null = null;
      for (const cand of ranking) {
        if (cand.score >= threshold && cand.score > 0) {
          picked = cand;
          break;
        }
        fallbackDepth += 1;
      }
      if (!picked) {
        const out: AgentPipelineResult = {
          sessionId: input.sessionId,
          stage: 'blocked-no-tool',
          blockedReason: `no candidate met threshold ${threshold}`,
          plan: { nodeCount, topScore },
          toolSelection: { selectedName: null, topScore: 0 },
          reactTraceLength: traceLength,
          reflection: {
            cycle: reflection.cycle,
            violationCount,
            revised: reflection.revised,
          },
          fallbackDepth,
          latencyMs: Math.max(1, Date.now() - t0),
        };
        record('runPipeline', true, { detail: out });
        return out;
      }

      const stage = violationCount > 0 ? 'blocked-reflection' : 'completed';
      const blockedReason =
        stage === 'blocked-reflection'
          ? `reflection critique: ${reflection.critique}`
          : null;

      const out: AgentPipelineResult = {
        sessionId: input.sessionId,
        stage,
        blockedReason,
        plan: { nodeCount, topScore },
        toolSelection: {
          selectedName: picked.name,
          topScore: picked.score,
        },
        reactTraceLength: traceLength,
        reflection: {
          cycle: reflection.cycle,
          violationCount,
          revised: reflection.revised,
        },
        fallbackDepth,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('runPipeline', true, { detail: out });
      return out;
    },

    traces() {
      return trace;
    },

    async reset() {
      agentRooms.clear();
      pipelineRooms.clear();
      trace.length = 0;
    },
  };
}
