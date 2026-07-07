/**
 * `/pipeline` HTTP handler — full answer-quality pipeline (score
 * hallucination signals → judge → verdict). Composes the hallucination +
 * eval surfaces so a single call takes a candidate answer plus evidence
 * / citations and returns either an accepted verdict or a rejected
 * reason.
 *
 * The pipeline surface is the highest-level integration point v1.38-3
 * ships — it is the surface real-world integrators would hit, so the
 * fidelity harness weighs the pipeline op most heavily when scoring
 * behavioural drift.
 */

import type {
  LlmQualityAdapter,
  QualityPipelineResult,
} from '../../adapters/interface.js';

export interface PipelineRequest {
  sessionId: string;
  prompt: string;
  samples: string[];
  evidence: string[];
  citations: string[];
  corpus: string[];
  candidateId: string;
  candidateText: string;
  minHallucinationScore?: number;
  minQualityScore?: number;
}

export interface PipelineResponse {
  ok: boolean;
  sessionId: string;
  result?: QualityPipelineResult;
  errorKind?: string;
}

export function validatePipelineRequest(
  body: unknown,
):
  | { ok: true; value: PipelineRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (typeof b['prompt'] !== 'string') {
    return { ok: false, errorKind: 'prompt_required' };
  }
  if (!Array.isArray(b['samples'])) {
    return { ok: false, errorKind: 'samples_required' };
  }
  if (!Array.isArray(b['evidence'])) {
    return { ok: false, errorKind: 'evidence_required' };
  }
  if (!Array.isArray(b['citations'])) {
    return { ok: false, errorKind: 'citations_required' };
  }
  if (!Array.isArray(b['corpus'])) {
    return { ok: false, errorKind: 'corpus_required' };
  }
  if (typeof b['candidateId'] !== 'string') {
    return { ok: false, errorKind: 'candidateId_required' };
  }
  if (typeof b['candidateText'] !== 'string') {
    return { ok: false, errorKind: 'candidateText_required' };
  }
  const req: PipelineRequest = {
    sessionId: b['sessionId'],
    prompt: b['prompt'],
    samples: b['samples'] as string[],
    evidence: b['evidence'] as string[],
    citations: b['citations'] as string[],
    corpus: b['corpus'] as string[],
    candidateId: b['candidateId'],
    candidateText: b['candidateText'],
  };
  if (typeof b['minHallucinationScore'] === 'number') {
    req.minHallucinationScore = b['minHallucinationScore'];
  }
  if (typeof b['minQualityScore'] === 'number') {
    req.minQualityScore = b['minQualityScore'];
  }
  return { ok: true, value: req };
}

export async function handlePipelineRequest(
  adapter: LlmQualityAdapter,
  request: PipelineRequest,
): Promise<PipelineResponse> {
  try {
    const result = await adapter.runPipeline(request);
    return {
      ok: true,
      sessionId: request.sessionId,
      result,
    };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}
