/**
 * Mock adapter — drives `@kiwa-lab/ai-llm` v0.4 hallucination + LLM eval
 * semantics so the same app code exercises a deterministic answer-quality
 * ceremony without a real OpenAI Chat Completions call. Both mock and real
 * adapters satisfy {@link LlmQualityAdapter}, so the fidelity harness can
 * diff them side-by-side.
 *
 * State model — one hallucination session + one eval session + one
 * pipeline session per sessionId across each surface. Each session is
 * isolated so per-surface metrics stay separated. The pipeline surface
 * composes fresh hallucination + eval sub-sessions per {@link runPipeline}
 * call so multi-stage flows can be exercised without resetting state.
 *
 * The mock piggy-backs on the same neutral event vocabulary the v1.38-1
 * semantics package emits — every op appends the matching neutral event
 * into the trace so the fidelity harness can assert the mock and real
 * adapters produce identical event orderings.
 */

import {
  applyRubric,
  checkFactuality,
  judgeCandidates,
  rankPreference,
  scoreConfidence,
  scoreSelfConsistency,
  startEvalSession,
  startHallucinationSession,
  updateElo,
  verifyCitation,
  type EvalSession,
  type HallucinationSession,
} from '@kiwa-lab/ai-llm';
import type {
  CitationResult,
  ConfidenceResult,
  EloResult,
  FactualityResult,
  JudgeResult,
  LlmQualityAdapter,
  PreferenceResult,
  QualityPipelineResult,
  RubricResult,
  SelfConsistencyResult,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface HallucinationRoom {
  session: HallucinationSession;
  closed: boolean;
}

interface EvalRoom {
  session: EvalSession;
  closed: boolean;
}

interface PipelineRoom {
  sessionId: string;
  closed: boolean;
}

export function makeMockAdapter(
  opts: MakeMockAdapterOptions = {},
): LlmQualityAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const hallucinationRooms = new Map<string, HallucinationRoom>();
  const evalRooms = new Map<string, EvalRoom>();
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

    async startHallucination(input) {
      await sleep();
      if (hallucinationRooms.has(input.sessionId)) {
        record('startHallucination', false, {
          errorKind: 'DUPLICATE_SESSION',
        });
        throw new Error(
          `startHallucination: duplicate session ${input.sessionId}`,
        );
      }
      const session = startHallucinationSession({
        target: 'openai',
        sessionId: input.sessionId,
      });
      hallucinationRooms.set(input.sessionId, { session, closed: false });
      record('startHallucination', true, {
        detail: { sessionId: input.sessionId },
      });
    },

    async scoreSelfConsistency(input): Promise<SelfConsistencyResult> {
      const t0 = Date.now();
      await sleep();
      const room = hallucinationRooms.get(input.sessionId);
      if (!room) {
        record('scoreSelfConsistency', false, {
          errorKind: 'MISSING_SESSION',
        });
        throw new Error(
          `scoreSelfConsistency: no session ${input.sessionId}`,
        );
      }
      const result = scoreSelfConsistency(room.session, input.samples);
      const out: SelfConsistencyResult = {
        sessionId: input.sessionId,
        score: result.score,
        sampleCount: input.samples.length,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('scoreSelfConsistency', true, { detail: out });
      return out;
    },

    async checkFactuality(input): Promise<FactualityResult> {
      const t0 = Date.now();
      await sleep();
      const room = hallucinationRooms.get(input.sessionId);
      if (!room) {
        record('checkFactuality', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`checkFactuality: no session ${input.sessionId}`);
      }
      const result = checkFactuality(room.session, {
        claim: input.claim,
        evidence: input.evidence,
      });
      const out: FactualityResult = {
        sessionId: input.sessionId,
        score: result.score,
        matchCount: result.matches.length,
        matches: result.matches,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('checkFactuality', true, { detail: out });
      return out;
    },

    async verifyCitation(input): Promise<CitationResult> {
      const t0 = Date.now();
      await sleep();
      const room = hallucinationRooms.get(input.sessionId);
      if (!room) {
        record('verifyCitation', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`verifyCitation: no session ${input.sessionId}`);
      }
      const result = verifyCitation(room.session, {
        citations: input.citations,
        corpus: input.corpus,
      });
      const verifiedCount = input.citations.length - result.missing.length;
      const out: CitationResult = {
        sessionId: input.sessionId,
        score: result.score,
        verifiedCount,
        missing: result.missing,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('verifyCitation', true, { detail: out });
      return out;
    },

    async scoreConfidence(input): Promise<ConfidenceResult> {
      const t0 = Date.now();
      await sleep();
      const room = hallucinationRooms.get(input.sessionId);
      if (!room) {
        record('scoreConfidence', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`scoreConfidence: no session ${input.sessionId}`);
      }
      const result = scoreConfidence(room.session, input.text);
      const tokens = tokenize(input.text);
      const hedgingWords = new Set([
        'maybe',
        'might',
        'perhaps',
        'possibly',
        'could',
        'may',
        'seems',
        'appears',
        'likely',
      ]);
      const hedgeCount = tokens.filter((t) => hedgingWords.has(t)).length;
      const out: ConfidenceResult = {
        sessionId: input.sessionId,
        score: result.score,
        hedgingRatio: result.hedgingRatio,
        hedgeCount,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('scoreConfidence', true, { detail: out });
      return out;
    },

    async closeHallucination(input) {
      await sleep();
      const room = hallucinationRooms.get(input.sessionId);
      if (!room) {
        record('closeHallucination', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`closeHallucination: no session ${input.sessionId}`);
      }
      room.closed = true;
      record('closeHallucination', true, {
        detail: {
          sessionId: input.sessionId,
          historyLength: room.session.history.length,
        },
      });
    },

    async startEval(input) {
      await sleep();
      if (evalRooms.has(input.sessionId)) {
        record('startEval', false, { errorKind: 'DUPLICATE_SESSION' });
        throw new Error(`startEval: duplicate session ${input.sessionId}`);
      }
      const session = startEvalSession({
        target: 'openai',
        sessionId: input.sessionId,
      });
      evalRooms.set(input.sessionId, { session, closed: false });
      record('startEval', true, { detail: { sessionId: input.sessionId } });
    },

    async judgeCandidates(input): Promise<JudgeResult> {
      const t0 = Date.now();
      await sleep();
      const room = evalRooms.get(input.sessionId);
      if (!room) {
        record('judgeCandidates', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`judgeCandidates: no session ${input.sessionId}`);
      }
      const result = judgeCandidates(room.session, {
        prompt: input.prompt,
        candidates: input.candidates.map((c) => {
          const out: { id: string; text: string; groundTruth?: string } = {
            id: c.id,
            text: c.text,
          };
          if (c.groundTruth !== undefined) out.groundTruth = c.groundTruth;
          return out;
        }),
      });
      const topScore = Math.max(...result.verdicts.map((v) => v.score));
      const out: JudgeResult = {
        sessionId: input.sessionId,
        verdicts: result.verdicts.map((v) => ({
          candidateId: v.candidateId,
          score: v.score,
          reasoning: v.reasoning,
        })),
        topScore,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('judgeCandidates', true, { detail: out });
      return out;
    },

    async applyRubric(input): Promise<RubricResult> {
      const t0 = Date.now();
      await sleep();
      const room = evalRooms.get(input.sessionId);
      if (!room) {
        record('applyRubric', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`applyRubric: no session ${input.sessionId}`);
      }
      const result = applyRubric(room.session, {
        candidateId: input.candidateId,
        criteria: input.criteria,
      });
      const out: RubricResult = {
        sessionId: input.sessionId,
        candidateId: input.candidateId,
        weightedScore: result.weightedScore,
        criteriaCount: input.criteria.length,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('applyRubric', true, { detail: out });
      return out;
    },

    async rankPreference(input): Promise<PreferenceResult> {
      const t0 = Date.now();
      await sleep();
      const room = evalRooms.get(input.sessionId);
      if (!room) {
        record('rankPreference', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`rankPreference: no session ${input.sessionId}`);
      }
      const result = rankPreference(room.session, { pairs: input.pairs });
      const out: PreferenceResult = {
        sessionId: input.sessionId,
        ranking: result.ranking,
        pairCount: input.pairs.length,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('rankPreference', true, { detail: out });
      return out;
    },

    async updateElo(input): Promise<EloResult> {
      const t0 = Date.now();
      await sleep();
      const room = evalRooms.get(input.sessionId);
      if (!room) {
        record('updateElo', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`updateElo: no session ${input.sessionId}`);
      }
      const eloInput: { winner: string; loser: string; k?: number } = {
        winner: input.winner,
        loser: input.loser,
      };
      if (input.k !== undefined) eloInput.k = input.k;
      const result = updateElo(room.session, eloInput);
      const out: EloResult = {
        sessionId: input.sessionId,
        winnerRating: result.winnerRating,
        loserRating: result.loserRating,
        winner: input.winner,
        loser: input.loser,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('updateElo', true, { detail: out });
      return out;
    },

    async closeEval(input) {
      await sleep();
      const room = evalRooms.get(input.sessionId);
      if (!room) {
        record('closeEval', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`closeEval: no session ${input.sessionId}`);
      }
      room.closed = true;
      record('closeEval', true, {
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

    async runPipeline(input): Promise<QualityPipelineResult> {
      const t0 = Date.now();
      await sleep();
      const room = pipelineRooms.get(input.sessionId);
      if (!room) {
        record('runPipeline', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`runPipeline: no session ${input.sessionId}`);
      }
      const halSubId = `${input.sessionId}:hal`;
      const evalSubId = `${input.sessionId}:eval`;
      const halSession = startHallucinationSession({
        target: 'openai',
        sessionId: halSubId,
      });
      const evalSession = startEvalSession({
        target: 'openai',
        sessionId: evalSubId,
      });

      // Stage 1 — hallucination detection (self-consistency + factuality +
      // citation + confidence). Score is the min across the 4 signals so
      // any weak signal drags the verdict.
      const scStep = scoreSelfConsistency(halSession, input.samples);
      const factStep = checkFactuality(halSession, {
        claim: input.candidateText,
        evidence: input.evidence,
      });
      const citStep = verifyCitation(halSession, {
        citations: input.citations,
        corpus: input.corpus,
      });
      const confStep = scoreConfidence(halSession, input.candidateText);

      const hallucinationScore = Math.min(
        scStep.score,
        factStep.score,
        citStep.score,
        confStep.score,
      );

      const findings: string[] = [];
      findings.push(`self-consistency:${scStep.score.toFixed(3)}`);
      findings.push(`factuality:${factStep.score.toFixed(3)}`);
      findings.push(`citation:${citStep.score.toFixed(3)}`);
      findings.push(`confidence:${confStep.score.toFixed(3)}`);

      const minHal = input.minHallucinationScore ?? 0.5;
      if (hallucinationScore < minHal) {
        const out: QualityPipelineResult = {
          sessionId: input.sessionId,
          verdict: 'rejected-hallucination',
          rejectedReason: `hallucination:${hallucinationScore.toFixed(3)}<${minHal.toFixed(3)}`,
          hallucinationScore,
          qualityScore: 0,
          findings,
          latencyMs: Math.max(1, Date.now() - t0),
        };
        record('runPipeline', true, { detail: out });
        return out;
      }

      // Stage 2 — LLM eval (judge only; rubric requires ≥ 1 criterion which
      // the pipeline op does not accept — the standalone applyRubric op is
      // still exercised via the eval-e2e axis). Quality score = the judge's
      // top score across candidates.
      const judgeStep = judgeCandidates(evalSession, {
        prompt: input.prompt,
        candidates: [
          { id: input.candidateId, text: input.candidateText },
        ],
      });
      const qualityScore = Math.max(
        ...judgeStep.verdicts.map((v) => v.score),
      );
      findings.push(`judge:${qualityScore.toFixed(3)}`);

      const minQual = input.minQualityScore ?? 0.3;
      if (qualityScore < minQual) {
        const out: QualityPipelineResult = {
          sessionId: input.sessionId,
          verdict: 'rejected-low-score',
          rejectedReason: `quality:${qualityScore.toFixed(3)}<${minQual.toFixed(3)}`,
          hallucinationScore,
          qualityScore,
          findings,
          latencyMs: Math.max(1, Date.now() - t0),
        };
        record('runPipeline', true, { detail: out });
        return out;
      }

      const out: QualityPipelineResult = {
        sessionId: input.sessionId,
        verdict: 'accepted',
        rejectedReason: null,
        hallucinationScore,
        qualityScore,
        findings,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('runPipeline', true, { detail: out });
      return out;
    },

    traces() {
      return trace;
    },

    async reset() {
      hallucinationRooms.clear();
      evalRooms.clear();
      pipelineRooms.clear();
      trace.length = 0;
    },
  };
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}
