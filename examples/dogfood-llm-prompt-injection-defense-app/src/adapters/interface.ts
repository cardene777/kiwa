/**
 * Provider-neutral LLM safety adapter surface for the
 * prompt-injection + guardrails dogfood (v1.38-2).
 *
 * The app talks to the prompt-injection + guardrails surface only through
 * this interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives the Anthropic Messages API when
 *    `KIWA_MODE=real` + `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` are set;
 *    otherwise every op reports `KIWA_LLM_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-lab/ai-llm` v0.4
 *    prompt-injection + guardrails semantics (detectInjection /
 *    blockJailbreak / blockRoleHijacking / validateSchema / matchRegex /
 *    blockToxicity / redactPii / checkConstitutional).
 *
 * Both must satisfy the same 14-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 3 axes v1.38-2
 * dogfoods —
 *  - prompt-injection (direct + indirect + jailbreak + role hijacking + XML)
 *  - guardrails (schema + regex + toxicity + PII + Constitutional)
 *  - defense-pipeline (multi-stage classify → block → redact → allow)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - injection-e2e (direct + jailbreak + role hijacking detection)
 *  - guardrails-e2e (schema + toxicity + PII + Constitutional)
 *  - defense-pipeline-e2e (multi-stage classify → block → redact → verify)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** Result of analyzing an input for injection patterns. */
export interface InjectionAnalyzeResult {
  sessionId: string;
  detectionCount: number;
  detectedKinds: string[];
  latencyMs: number;
}

/** Result of blocking a jailbreak attempt. */
export interface JailbreakBlockResult {
  sessionId: string;
  blocked: boolean;
  hitCount: number;
  latencyMs: number;
}

/** Result of blocking a role hijacking attempt. */
export interface RoleHijackBlockResult {
  sessionId: string;
  blocked: boolean;
  roleHitCount: number;
  xmlHitCount: number;
  latencyMs: number;
}

/** Result of classifying an input as direct injection. */
export interface DirectClassifyResult {
  sessionId: string;
  blocked: boolean;
  hitCount: number;
  latencyMs: number;
}

/** Result of validating an output against a JSON schema. */
export interface SchemaValidateResult {
  sessionId: string;
  valid: boolean;
  errorCount: number;
  errors: string[];
  latencyMs: number;
}

/** Result of blocking a toxic response. */
export interface ToxicityBlockResult {
  sessionId: string;
  blocked: boolean;
  score: number;
  threshold: number;
  latencyMs: number;
}

/** Result of redacting PII from a response. */
export interface PiiRedactResult {
  sessionId: string;
  redacted: string;
  hitKinds: string[];
  totalHits: number;
  latencyMs: number;
}

/** Result of checking a response against Constitutional principles. */
export interface ConstitutionalCheckResult {
  sessionId: string;
  violationCount: number;
  violations: Array<{ principleId: string; word: string }>;
  latencyMs: number;
}

/** Result of running the full defense pipeline against a user input. */
export interface DefensePipelineResult {
  sessionId: string;
  stage: 'allowed' | 'blocked-injection' | 'blocked-guardrail';
  blockedReason: string | null;
  redactedInput: string;
  detections: string[];
  guardrailFindings: string[];
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startInjection'
    | 'analyzeInjection'
    | 'classifyDirect'
    | 'blockJailbreak'
    | 'blockRoleHijack'
    | 'closeInjection'
    | 'startGuardrail'
    | 'validateSchema'
    | 'blockToxicity'
    | 'redactPii'
    | 'checkConstitutional'
    | 'closeGuardrail'
    | 'startPipeline'
    | 'runPipeline';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Simple JSON schema used by validateSchema (aligned with @kiwa-lab/ai-llm SimpleSchema). */
export interface JsonSchemaInput {
  type: 'object';
  properties: Record<
    string,
    {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      minimum?: number;
      maximum?: number;
      minLength?: number;
      maxLength?: number;
      enum?: Array<string | number | boolean>;
    }
  >;
  required?: string[];
}

/** Constitutional principle input (aligned with @kiwa-lab/ai-llm ConstitutionalPrinciple). */
export interface ConstitutionalPrincipleInput {
  id: string;
  ruleText: string;
  forbidden: string[];
}

/** The LLM safety adapter — 14 ops across 3 domain surfaces + 3 axes. */
export interface LlmSafetyAdapter {
  readonly mode: 'real' | 'mock';

  // injection surface (injection-e2e axis)
  startInjection(input: { sessionId: string }): Promise<void>;
  analyzeInjection(input: {
    sessionId: string;
    text: string;
  }): Promise<InjectionAnalyzeResult>;
  classifyDirect(input: {
    sessionId: string;
    text: string;
  }): Promise<DirectClassifyResult>;
  blockJailbreak(input: {
    sessionId: string;
    text: string;
  }): Promise<JailbreakBlockResult>;
  blockRoleHijack(input: {
    sessionId: string;
    text: string;
  }): Promise<RoleHijackBlockResult>;
  closeInjection(input: { sessionId: string }): Promise<void>;

  // guardrails surface (guardrails-e2e axis)
  startGuardrail(input: { sessionId: string }): Promise<void>;
  validateSchema(input: {
    sessionId: string;
    value: unknown;
    schema: JsonSchemaInput;
  }): Promise<SchemaValidateResult>;
  blockToxicity(input: {
    sessionId: string;
    text: string;
    threshold?: number;
  }): Promise<ToxicityBlockResult>;
  redactPii(input: {
    sessionId: string;
    text: string;
  }): Promise<PiiRedactResult>;
  checkConstitutional(input: {
    sessionId: string;
    text: string;
    principles: ConstitutionalPrincipleInput[];
  }): Promise<ConstitutionalCheckResult>;
  closeGuardrail(input: { sessionId: string }): Promise<void>;

  // defense-pipeline surface (defense-pipeline-e2e axis)
  startPipeline(input: { sessionId: string }): Promise<void>;
  runPipeline(input: {
    sessionId: string;
    userInput: string;
    principles?: ConstitutionalPrincipleInput[];
    toxicityThreshold?: number;
  }): Promise<DefensePipelineResult>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
