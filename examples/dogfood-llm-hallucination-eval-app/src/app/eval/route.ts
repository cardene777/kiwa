/**
 * `/eval` HTTP handler — LLM eval ops (judge + rubric + preference +
 * Elo). Shape-neutral so the fidelity harness can drive mock and real
 * symmetrically.
 *
 * The eval surface pairs the parent v1.38-1 `llm-eval` axis (LLM-as-
 * judge + rubric + preference + Elo + human-in-the-loop) with
 * `@kiwa/ai-llm` v0.4 — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type {
  CandidateInput,
  EloResult,
  JudgeResult,
  LlmQualityAdapter,
  PreferencePairInput,
  PreferenceResult,
  RubricCriterionInput,
  RubricResult,
} from '../../adapters/interface.js';

export type EvalOpKind =
  | 'judgeCandidates'
  | 'applyRubric'
  | 'rankPreference'
  | 'updateElo';

export interface EvalRequest {
  kind: EvalOpKind;
  sessionId: string;
  prompt?: string;
  candidates?: CandidateInput[];
  candidateId?: string;
  criteria?: RubricCriterionInput[];
  pairs?: PreferencePairInput[];
  winner?: string;
  loser?: string;
  k?: number;
}

export interface EvalResponse {
  ok: boolean;
  kind: EvalOpKind;
  sessionId: string;
  result?: JudgeResult | RubricResult | PreferenceResult | EloResult;
  errorKind?: string;
}

export function validateEvalRequest(
  body: unknown,
): { ok: true; value: EvalRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kinds: EvalOpKind[] = [
    'judgeCandidates',
    'applyRubric',
    'rankPreference',
    'updateElo',
  ];
  if (!kinds.includes(b['kind'] as EvalOpKind)) {
    return { ok: false, errorKind: 'kind_must_be_valid_op' };
  }
  const req: EvalRequest = {
    kind: b['kind'] as EvalOpKind,
    sessionId: b['sessionId'],
  };
  if (req.kind === 'judgeCandidates') {
    if (typeof b['prompt'] !== 'string') {
      return { ok: false, errorKind: 'prompt_required' };
    }
    if (!Array.isArray(b['candidates'])) {
      return { ok: false, errorKind: 'candidates_required' };
    }
    req.prompt = b['prompt'];
    req.candidates = b['candidates'] as CandidateInput[];
  }
  if (req.kind === 'applyRubric') {
    if (typeof b['candidateId'] !== 'string') {
      return { ok: false, errorKind: 'candidateId_required' };
    }
    if (!Array.isArray(b['criteria'])) {
      return { ok: false, errorKind: 'criteria_required' };
    }
    req.candidateId = b['candidateId'];
    req.criteria = b['criteria'] as RubricCriterionInput[];
  }
  if (req.kind === 'rankPreference') {
    if (!Array.isArray(b['pairs'])) {
      return { ok: false, errorKind: 'pairs_required' };
    }
    req.pairs = b['pairs'] as PreferencePairInput[];
  }
  if (req.kind === 'updateElo') {
    if (typeof b['winner'] !== 'string') {
      return { ok: false, errorKind: 'winner_required' };
    }
    if (typeof b['loser'] !== 'string') {
      return { ok: false, errorKind: 'loser_required' };
    }
    req.winner = b['winner'];
    req.loser = b['loser'];
    if (typeof b['k'] === 'number') req.k = b['k'];
  }
  return { ok: true, value: req };
}

export async function handleEvalRequest(
  adapter: LlmQualityAdapter,
  request: EvalRequest,
): Promise<EvalResponse> {
  try {
    if (request.kind === 'judgeCandidates') {
      const result = await adapter.judgeCandidates({
        sessionId: request.sessionId,
        prompt: request.prompt!,
        candidates: request.candidates!,
      });
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    if (request.kind === 'applyRubric') {
      const result = await adapter.applyRubric({
        sessionId: request.sessionId,
        candidateId: request.candidateId!,
        criteria: request.criteria!,
      });
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    if (request.kind === 'rankPreference') {
      const result = await adapter.rankPreference({
        sessionId: request.sessionId,
        pairs: request.pairs!,
      });
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    const eloInput: {
      sessionId: string;
      winner: string;
      loser: string;
      k?: number;
    } = {
      sessionId: request.sessionId,
      winner: request.winner!,
      loser: request.loser!,
    };
    if (request.k !== undefined) eloInput.k = request.k;
    const result = await adapter.updateElo(eloInput);
    return {
      ok: true,
      kind: request.kind,
      sessionId: request.sessionId,
      result,
    };
  } catch (err) {
    return {
      ok: false,
      kind: request.kind,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}
