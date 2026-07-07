import {
  providerAdvEventName,
  type AxisAdvStep,
  type NeutralAdvEventName,
  type SecurityAdvTarget,
} from './types.js';

/**
 * Incident response axis — playbook trigger + severity classification +
 * escalation + forensics capture + post-mortem recording state machine。
 *
 * Deterministic mock で 5 signal 系統を提供。 real driver 経路では PagerDuty /
 * Splunk Phantom SOAR platform への escalation を発火する。
 */

export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4' | 'sev5';

export type IncidentState =
  | 'idle'
  | 'playbook-triggered'
  | 'severity-classified'
  | 'escalated'
  | 'forensics-captured'
  | 'post-mortem-recorded';

export interface IncidentSession {
  target: SecurityAdvTarget;
  sessionId: string;
  state: IncidentState;
  history: AxisAdvStep<IncidentState>[];
  playbookId: string | null;
  severity: IncidentSeverity | null;
  forensicsArtifacts: string[];
}

export interface PlaybookInput {
  playbookId: string;
  detectionSource: string;
  initialAlert: string;
}

export interface SeverityInput {
  affectedUsers: number;
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  serviceDown: boolean;
}

export interface EscalationInput {
  channels: string[];
  onCallPrimary: string;
  onCallSecondary: string | null;
}

export interface ForensicsInput {
  memoryDumpMb: number;
  networkPcapMb: number;
  diskImageGb: number;
}

export interface PostMortemInput {
  rootCause: string;
  contributingFactors: string[];
  actionItems: string[];
}

export function startIncidentSession(input: {
  target: SecurityAdvTarget;
  sessionId: string;
}): IncidentSession {
  if (input.sessionId.length === 0) {
    throw new Error('startIncidentSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    playbookId: null,
    severity: null,
    forensicsArtifacts: [],
  };
}

export function triggerPlaybook(
  session: IncidentSession,
  input: PlaybookInput,
): AxisAdvStep<IncidentState> {
  if (session.state !== 'idle') {
    throw new Error(`triggerPlaybook: session is ${session.state}, must be idle`);
  }
  if (input.playbookId.length === 0) {
    throw new Error('triggerPlaybook: playbookId must not be empty');
  }
  session.playbookId = input.playbookId;
  session.state = 'playbook-triggered';
  return emit(session, 'ir.playbook_triggered', {
    playbookId: input.playbookId,
    detectionSource: input.detectionSource,
    initialAlert: input.initialAlert,
  });
}

export function classifySeverity(
  session: IncidentSession,
  input: SeverityInput,
): AxisAdvStep<IncidentState> {
  if (session.state !== 'playbook-triggered') {
    throw new Error('classifySeverity: playbook must be triggered first');
  }
  if (input.affectedUsers < 0) {
    throw new Error('classifySeverity: affectedUsers must be non-negative');
  }
  let sev: IncidentSeverity = 'sev5';
  if (input.dataClassification === 'restricted' && input.serviceDown) sev = 'sev1';
  else if (input.dataClassification === 'restricted') sev = 'sev2';
  else if (input.serviceDown && input.affectedUsers > 1000) sev = 'sev1';
  else if (input.serviceDown && input.affectedUsers > 100) sev = 'sev2';
  else if (input.dataClassification === 'confidential') sev = 'sev3';
  else if (input.affectedUsers > 10) sev = 'sev4';
  session.severity = sev;
  session.state = 'severity-classified';
  return emit(session, 'ir.severity_classified', {
    severity: sev,
    affectedUsers: input.affectedUsers,
    dataClassification: input.dataClassification,
    serviceDown: input.serviceDown,
  });
}

export function escalate(
  session: IncidentSession,
  input: EscalationInput,
): AxisAdvStep<IncidentState> {
  if (session.state !== 'severity-classified') {
    throw new Error('escalate: severity must be classified first');
  }
  if (input.channels.length === 0) {
    throw new Error('escalate: at least one channel required');
  }
  if (input.onCallPrimary.length === 0) {
    throw new Error('escalate: primary on-call must be assigned');
  }
  session.state = 'escalated';
  return emit(session, 'ir.escalation_sent', {
    channelCount: input.channels.length,
    onCallPrimary: input.onCallPrimary,
    hasSecondary: input.onCallSecondary !== null,
    severity: session.severity ?? 'sev5',
  });
}

export function captureForensics(
  session: IncidentSession,
  input: ForensicsInput,
): AxisAdvStep<IncidentState> {
  if (session.state !== 'escalated') {
    throw new Error('captureForensics: escalation must complete first');
  }
  if (input.memoryDumpMb < 0 || input.networkPcapMb < 0 || input.diskImageGb < 0) {
    throw new Error('captureForensics: artifact sizes must be non-negative');
  }
  if (input.memoryDumpMb > 0) session.forensicsArtifacts.push('memory-dump');
  if (input.networkPcapMb > 0) session.forensicsArtifacts.push('network-pcap');
  if (input.diskImageGb > 0) session.forensicsArtifacts.push('disk-image');
  session.state = 'forensics-captured';
  return emit(session, 'ir.forensics_captured', {
    memoryDumpMb: input.memoryDumpMb,
    networkPcapMb: input.networkPcapMb,
    diskImageGb: input.diskImageGb,
    artifactCount: session.forensicsArtifacts.length,
  });
}

export function recordPostMortem(
  session: IncidentSession,
  input: PostMortemInput,
): AxisAdvStep<IncidentState> {
  if (session.state !== 'forensics-captured') {
    throw new Error('recordPostMortem: forensics must be captured first');
  }
  if (input.rootCause.length < 10) {
    throw new Error('recordPostMortem: rootCause must be >= 10 chars');
  }
  if (input.actionItems.length === 0) {
    throw new Error('recordPostMortem: must have >= 1 action item');
  }
  session.state = 'post-mortem-recorded';
  return emit(session, 'ir.post_mortem_recorded', {
    rootCause: input.rootCause,
    contributingFactorCount: input.contributingFactors.length,
    actionItemCount: input.actionItems.length,
    severity: session.severity ?? 'sev5',
  });
}

function emit(
  session: IncidentSession,
  neutral: NeutralAdvEventName,
  metadata: Record<string, string | number | boolean>,
): AxisAdvStep<IncidentState> {
  const step: AxisAdvStep<IncidentState> = {
    neutralEvent: neutral,
    providerEvent: providerAdvEventName(session.target, neutral),
    state: session.state,
    timestampMs: session.history.length + 1,
    metadata,
  };
  session.history.push(step);
  return step;
}
