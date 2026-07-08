/**
 * Provider-neutral LLM answer-quality adapter surface for the
 * hallucination + LLM eval dogfood (v1.38-3).
 *
 * The app talks to the hallucination + LLM eval surface only through
 * this interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives the OpenAI Chat Completions API
 *    when `KIWA_MODE=real` + `OPENAI_API_KEY` + `KIWA_LLM_BUDGET_USD`
 *    are set; otherwise every op reports `KIWA_LLM_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa/ai-llm` v0.4
 *    hallucination + LLM eval semantics (scoreSelfConsistency /
 *    checkFactuality / verifyCitation / scoreConfidence /
 *    judgeCandidates / applyRubric / rankPreference / updateElo).
 *
 * Both must satisfy the same 15-op contract so behavioural fidelity
 * between real vs mock can be measured side-by-side across the 3 axes
 * v1.38-3 dogfoods —
 *  - hallucination (self-consistency + factuality + citation + confidence)
 *  - llm-eval (LLM-as-judge + rubric + preference + Elo)
 *  - quality-pipeline (multi-stage score → judge → rank → verdict)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - hallucination-e2e (self-consistency + factuality + citation + confidence)
 *  - llm-eval-e2e (judge + rubric + preference + Elo)
 *  - quality-pipeline-e2e (multi-stage score → judge → verdict)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** Result of scoring self-consistency across LLM samples. */
export interface SelfConsistencyResult {
  sessionId: string;
  score: number;
  sampleCount: number;
  latencyMs: number;
}

/** Result of checking factuality against evidence. */
export interface FactualityResult {
  sessionId: string;
  score: number;
  matchCount: number;
  matches: string[];
  latencyMs: number;
}

/** Result of verifying citations against a corpus. */
export interface CitationResult {
  sessionId: string;
  score: number;
  verifiedCount: number;
  missing: string[];
  latencyMs: number;
}

/** Result of scoring confidence via hedging language. */
export interface ConfidenceResult {
  sessionId: string;
  score: number;
  hedgingRatio: number;
  hedgeCount: number;
  latencyMs: number;
}

/** Result of judging LLM candidates for a prompt. */
export interface JudgeResult {
  sessionId: string;
  verdicts: Array<{ candidateId: string; score: number; reasoning: string }>;
  topScore: number;
  latencyMs: number;
}

/** Result of applying a rubric to a specific candidate. */
export interface RubricResult {
  sessionId: string;
  candidateId: string;
  weightedScore: number;
  criteriaCount: number;
  latencyMs: number;
}

/** Result of ranking candidates via pairwise preference. */
export interface PreferenceResult {
  sessionId: string;
  ranking: Array<{ id: string; wins: number; losses: number; ties: number }>;
  pairCount: number;
  latencyMs: number;
}

/** Result of updating Elo ratings for a winner / loser pair. */
export interface EloResult {
  sessionId: string;
  winnerRating: number;
  loserRating: number;
  winner: string;
  loser: string;
  latencyMs: number;
}

/** Result of running the full answer-quality pipeline against a candidate. */
export interface QualityPipelineResult {
  sessionId: string;
  verdict: 'accepted' | 'rejected-hallucination' | 'rejected-low-score';
  rejectedReason: string | null;
  hallucinationScore: number;
  qualityScore: number;
  findings: string[];
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startHallucination'
    | 'scoreSelfConsistency'
    | 'checkFactuality'
    | 'verifyCitation'
    | 'scoreConfidence'
    | 'closeHallucination'
    | 'startEval'
    | 'judgeCandidates'
    | 'applyRubric'
    | 'rankPreference'
    | 'updateElo'
    | 'closeEval'
    | 'startPipeline'
    | 'runPipeline';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Rubric criterion input (aligned with @kiwa/ai-llm RubricCriterion). */
export interface RubricCriterionInput {
  key: string;
  weight: number;
  score: number;
}

/** Candidate input for the judge / rubric / preference ops. */
export interface CandidateInput {
  id: string;
  text: string;
  groundTruth?: string;
}

/** Preference pair input for `rankPreference`. */
export interface PreferencePairInput {
  a: string;
  b: string;
  preferred: 'a' | 'b' | 'tie';
}

/** The LLM answer-quality adapter — 14 ops across 3 domain surfaces + 3 axes. */
export interface LlmQualityAdapter {
  readonly mode: 'real' | 'mock';

  // hallucination surface (hallucination-e2e axis)
  startHallucination(input: { sessionId: string }): Promise<void>;
  scoreSelfConsistency(input: {
    sessionId: string;
    samples: string[];
  }): Promise<SelfConsistencyResult>;
  checkFactuality(input: {
    sessionId: string;
    claim: string;
    evidence: string[];
  }): Promise<FactualityResult>;
  verifyCitation(input: {
    sessionId: string;
    citations: string[];
    corpus: string[];
  }): Promise<CitationResult>;
  scoreConfidence(input: {
    sessionId: string;
    text: string;
  }): Promise<ConfidenceResult>;
  closeHallucination(input: { sessionId: string }): Promise<void>;

  // llm-eval surface (llm-eval-e2e axis)
  startEval(input: { sessionId: string }): Promise<void>;
  judgeCandidates(input: {
    sessionId: string;
    prompt: string;
    candidates: CandidateInput[];
  }): Promise<JudgeResult>;
  applyRubric(input: {
    sessionId: string;
    candidateId: string;
    criteria: RubricCriterionInput[];
  }): Promise<RubricResult>;
  rankPreference(input: {
    sessionId: string;
    pairs: PreferencePairInput[];
  }): Promise<PreferenceResult>;
  updateElo(input: {
    sessionId: string;
    winner: string;
    loser: string;
    k?: number;
  }): Promise<EloResult>;
  closeEval(input: { sessionId: string }): Promise<void>;

  // quality-pipeline surface (quality-pipeline-e2e axis)
  startPipeline(input: { sessionId: string }): Promise<void>;
  runPipeline(input: {
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
  }): Promise<QualityPipelineResult>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
