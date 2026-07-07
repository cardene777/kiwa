/**
 * `/hallucination` HTTP handler — hallucination detection ops (self-
 * consistency + factuality + citation + confidence). The route is
 * intentionally shape-neutral — the fidelity harness feeds plain objects
 * in and asserts on plain objects out, so the same test can exercise
 * mock and real without spinning up a real OpenAI client.
 *
 * The hallucination surface pairs the parent v1.38-1 `hallucination`
 * axis (self-consistency + factuality + citation + confidence +
 * hedging) with `@kiwa-test/ai-llm` v0.4 — every op has a neutral event
 * counterpart the fidelity harness can compare across mock vs real.
 */

import type {
  CitationResult,
  ConfidenceResult,
  FactualityResult,
  LlmQualityAdapter,
  SelfConsistencyResult,
} from '../../adapters/interface.js';

export type HallucinationOpKind =
  | 'scoreSelfConsistency'
  | 'checkFactuality'
  | 'verifyCitation'
  | 'scoreConfidence';

export interface HallucinationRequest {
  kind: HallucinationOpKind;
  sessionId: string;
  samples?: string[];
  claim?: string;
  evidence?: string[];
  citations?: string[];
  corpus?: string[];
  text?: string;
}

export interface HallucinationResponse {
  ok: boolean;
  kind: HallucinationOpKind;
  sessionId: string;
  result?:
    | SelfConsistencyResult
    | FactualityResult
    | CitationResult
    | ConfidenceResult;
  errorKind?: string;
}

export function validateHallucinationRequest(
  body: unknown,
):
  | { ok: true; value: HallucinationRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kinds: HallucinationOpKind[] = [
    'scoreSelfConsistency',
    'checkFactuality',
    'verifyCitation',
    'scoreConfidence',
  ];
  if (!kinds.includes(b['kind'] as HallucinationOpKind)) {
    return { ok: false, errorKind: 'kind_must_be_valid_op' };
  }
  const req: HallucinationRequest = {
    kind: b['kind'] as HallucinationOpKind,
    sessionId: b['sessionId'],
  };
  if (req.kind === 'scoreSelfConsistency') {
    if (!Array.isArray(b['samples'])) {
      return { ok: false, errorKind: 'samples_required' };
    }
    req.samples = b['samples'] as string[];
  }
  if (req.kind === 'checkFactuality') {
    if (typeof b['claim'] !== 'string') {
      return { ok: false, errorKind: 'claim_required' };
    }
    if (!Array.isArray(b['evidence'])) {
      return { ok: false, errorKind: 'evidence_required' };
    }
    req.claim = b['claim'];
    req.evidence = b['evidence'] as string[];
  }
  if (req.kind === 'verifyCitation') {
    if (!Array.isArray(b['citations'])) {
      return { ok: false, errorKind: 'citations_required' };
    }
    if (!Array.isArray(b['corpus'])) {
      return { ok: false, errorKind: 'corpus_required' };
    }
    req.citations = b['citations'] as string[];
    req.corpus = b['corpus'] as string[];
  }
  if (req.kind === 'scoreConfidence') {
    if (typeof b['text'] !== 'string') {
      return { ok: false, errorKind: 'text_required' };
    }
    req.text = b['text'];
  }
  return { ok: true, value: req };
}

export async function handleHallucinationRequest(
  adapter: LlmQualityAdapter,
  request: HallucinationRequest,
): Promise<HallucinationResponse> {
  try {
    if (request.kind === 'scoreSelfConsistency') {
      const result = await adapter.scoreSelfConsistency({
        sessionId: request.sessionId,
        samples: request.samples!,
      });
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    if (request.kind === 'checkFactuality') {
      const result = await adapter.checkFactuality({
        sessionId: request.sessionId,
        claim: request.claim!,
        evidence: request.evidence!,
      });
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    if (request.kind === 'verifyCitation') {
      const result = await adapter.verifyCitation({
        sessionId: request.sessionId,
        citations: request.citations!,
        corpus: request.corpus!,
      });
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    const result = await adapter.scoreConfidence({
      sessionId: request.sessionId,
      text: request.text!,
    });
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
