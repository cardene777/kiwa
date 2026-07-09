/**
 * Provider-neutral Security Adapter surface for the SIEM + incident-
 * response dogfood.
 *
 * The app talks to the siem-audit + incident-response surface only
 * through this interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real Splunk + PagerDuty style
 *    SIEM + SOAR platform (KIWA_SIEM_ENDPOINT + KIWA_PAGERDUTY_URL +
 *    KIWA_LOKI_URL + KIWA_SIEM_TOKEN) when `KIWA_MODE=real` +
 *    `SIEM_STACK_READY=1` are set; otherwise every op reports
 *    `KIWA_SIEM_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-lab/security` v0.2
 *    siem-audit + incident-response semantics (startSiemAuditSession /
 *    structureEvent / sealEvents / applyRetention / correlate /
 *    startIncidentSession / triggerPlaybook / classifySeverity /
 *    escalate / captureForensics / recordPostMortem).
 *
 * Both must satisfy the same 16-op contract so behavioural fidelity
 * between real vs mock can be measured side-by-side across the 2 axes
 * this dogfood covers —
 *  - siem-audit (structured CIM event + tamper-evident seal + retention
 *    + correlation)
 *  - incident-response (playbook + severity + escalation + forensics +
 *    post-mortem)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness
 * runs against both adapters —
 *  - siem-e2e (structured + seal + retention + correlation)
 *  - incident-e2e (playbook + severity + escalation + forensics +
 *    post-mortem)
 *  - orchestrator-e2e (fused SIEM correlation → incident trigger path)
 * Each spec exercises a distinct subset of the ops below so the
 * fidelity report can point at the ops that diverged.
 */

/** Result of structuring a raw audit event into a CIM payload. */
export interface SiemStructureResult {
  sessionId: string;
  eventId: string;
  cimSchemaVersion: string;
  actor: string;
  action: string;
  latencyMs: number;
}

/** Result of sealing a batch of structured events into a hash-chain. */
export interface SiemSealResult {
  sessionId: string;
  sealHash: string;
  previousHash: string;
  eventCount: number;
  latencyMs: number;
}

/** Result of applying a hot/warm/cold retention policy. */
export interface SiemRetentionResult {
  sessionId: string;
  totalDays: number;
  hotDays: number;
  warmDays: number;
  coldDays: number;
  legalHold: boolean;
  latencyMs: number;
}

/** Result of running a correlation rule across the structured batch. */
export interface SiemCorrelateResult {
  sessionId: string;
  ruleId: string;
  matched: boolean;
  requiredCount: number;
  windowMs: number;
  latencyMs: number;
}

/** Result of triggering an incident playbook. */
export interface IrPlaybookResult {
  sessionId: string;
  playbookId: string;
  detectionSource: string;
  latencyMs: number;
}

/** Result of classifying incident severity (sev1-5). */
export interface IrSeverityResult {
  sessionId: string;
  severity: 'sev1' | 'sev2' | 'sev3' | 'sev4' | 'sev5';
  affectedUsers: number;
  latencyMs: number;
}

/** Result of escalating an incident to the on-call rotation. */
export interface IrEscalationResult {
  sessionId: string;
  channelCount: number;
  onCallPrimary: string;
  hasSecondary: boolean;
  latencyMs: number;
}

/** Result of capturing forensics artefacts. */
export interface IrForensicsResult {
  sessionId: string;
  artifactCount: number;
  memoryDumpMb: number;
  networkPcapMb: number;
  diskImageGb: number;
  latencyMs: number;
}

/** Result of recording an incident post-mortem. */
export interface IrPostMortemResult {
  sessionId: string;
  rootCause: string;
  actionItemCount: number;
  contributingFactorCount: number;
  latencyMs: number;
}

/** Result of a fused SIEM correlation → incident orchestrator decision. */
export interface OrchestrateResult {
  sessionId: string;
  correlationMatched: boolean;
  incidentTriggered: boolean;
  severity: 'sev1' | 'sev2' | 'sev3' | 'sev4' | 'sev5';
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startSiem'
    | 'structureEvent'
    | 'sealEvents'
    | 'applyRetention'
    | 'correlate'
    | 'closeSiem'
    | 'startIncident'
    | 'triggerPlaybook'
    | 'classifySeverity'
    | 'escalate'
    | 'captureForensics'
    | 'recordPostMortem'
    | 'closeIncident'
    | 'startOrchestrator'
    | 'orchestrateDecision'
    | 'closeOrchestrator';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

export type ProviderTarget = 'istio' | 'opa' | 'siem-splunk' | 'vault';

/** Input for opening a SIEM audit session. */
export interface SiemSessionInput {
  sessionId: string;
  target: ProviderTarget;
}

/** Input for opening an incident-response session. */
export interface IncidentSessionInput {
  sessionId: string;
  target: ProviderTarget;
}

/** Input for opening a fused orchestrator session. */
export interface OrchestratorSessionInput {
  sessionId: string;
  siemTarget: ProviderTarget;
  incidentTarget: ProviderTarget;
}

/** The Security Adapter — 16 ops across 3 domain surfaces + 2 axes. */
export interface SecurityAdapter {
  readonly mode: 'real' | 'mock';

  // siem-audit surface (siem-e2e axis: structured + seal + retention + correlate)
  startSiem(input: SiemSessionInput): Promise<void>;
  structureEvent(input: {
    sessionId: string;
    actor: string;
    action: string;
    target: string;
    timestamp: number;
    result: 'success' | 'failure';
  }): Promise<SiemStructureResult>;
  sealEvents(input: {
    sessionId: string;
    previousHash: string;
  }): Promise<SiemSealResult>;
  applyRetention(input: {
    sessionId: string;
    hotDays: number;
    warmDays: number;
    coldDays: number;
    legalHold: boolean;
  }): Promise<SiemRetentionResult>;
  correlate(input: {
    sessionId: string;
    ruleId: string;
    requiredEventIds: string[];
    windowMs: number;
  }): Promise<SiemCorrelateResult>;
  closeSiem(input: { sessionId: string }): Promise<void>;

  // incident-response surface (incident-e2e axis: playbook + severity + escalation + forensics + post-mortem)
  startIncident(input: IncidentSessionInput): Promise<void>;
  triggerPlaybook(input: {
    sessionId: string;
    playbookId: string;
    detectionSource: string;
    initialAlert: string;
  }): Promise<IrPlaybookResult>;
  classifySeverity(input: {
    sessionId: string;
    affectedUsers: number;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    serviceDown: boolean;
  }): Promise<IrSeverityResult>;
  escalate(input: {
    sessionId: string;
    channels: string[];
    onCallPrimary: string;
    onCallSecondary: string | null;
  }): Promise<IrEscalationResult>;
  captureForensics(input: {
    sessionId: string;
    memoryDumpMb: number;
    networkPcapMb: number;
    diskImageGb: number;
  }): Promise<IrForensicsResult>;
  recordPostMortem(input: {
    sessionId: string;
    rootCause: string;
    contributingFactors: string[];
    actionItems: string[];
  }): Promise<IrPostMortemResult>;
  closeIncident(input: { sessionId: string }): Promise<void>;

  // orchestrator surface (orchestrator-e2e axis: fused SIEM → incident)
  startOrchestrator(input: OrchestratorSessionInput): Promise<void>;
  orchestrateDecision(input: {
    sessionId: string;
    correlationMatched: boolean;
    affectedUsers: number;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    serviceDown: boolean;
  }): Promise<OrchestrateResult>;
  closeOrchestrator(input: { sessionId: string }): Promise<void>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
