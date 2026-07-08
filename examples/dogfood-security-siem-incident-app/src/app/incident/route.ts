/**
 * `/incident` HTTP handler — playbook trigger + severity classify +
 * escalation + forensics capture + post-mortem record ops the runtime
 * exposes to the incident-response surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and
 * asserts on plain objects out, so the same test can exercise mock
 * and real without spinning up a PagerDuty SOAR platform.
 *
 * The incident surface pairs the parent v1.39-1 `incident-response`
 * axis (startIncidentSession + triggerPlaybook + classifySeverity +
 * escalate + captureForensics + recordPostMortem) with
 * `@kiwa/security` v0.2 — every op has a neutral event
 * counterpart the fidelity harness can compare across mock vs real.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type IncidentOpKind =
  | 'playbook'
  | 'severity'
  | 'escalate'
  | 'forensics'
  | 'post-mortem';

export interface IncidentRequest {
  kind: IncidentOpKind;
  sessionId: string;
  // playbook
  playbookId?: string;
  detectionSource?: string;
  initialAlert?: string;
  // severity
  affectedUsers?: number;
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
  serviceDown?: boolean;
  // escalate
  channels?: string[];
  onCallPrimary?: string;
  onCallSecondary?: string | null;
  // forensics
  memoryDumpMb?: number;
  networkPcapMb?: number;
  diskImageGb?: number;
  // post-mortem
  rootCause?: string;
  contributingFactors?: string[];
  actionItems?: string[];
}

export interface IncidentResponse {
  ok: boolean;
  kind: IncidentOpKind;
  sessionId: string;
  playbookId?: string;
  severity?: 'sev1' | 'sev2' | 'sev3' | 'sev4' | 'sev5';
  channelCount?: number;
  hasSecondary?: boolean;
  artifactCount?: number;
  rootCause?: string;
  actionItemCount?: number;
  errorKind?: string;
}

export function validateIncidentRequest(
  body: unknown,
):
  | { ok: true; value: IncidentRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (
    kind !== 'playbook' &&
    kind !== 'severity' &&
    kind !== 'escalate' &&
    kind !== 'forensics' &&
    kind !== 'post-mortem'
  ) {
    return {
      ok: false,
      errorKind: 'kind_must_be_playbook_severity_escalate_forensics_or_post_mortem',
    };
  }
  const value: IncidentRequest = { kind, sessionId: b['sessionId'] };
  if (kind === 'playbook') {
    if (typeof b['playbookId'] !== 'string' || !b['playbookId']) {
      return { ok: false, errorKind: 'playbookId_required' };
    }
    if (typeof b['detectionSource'] !== 'string' || !b['detectionSource']) {
      return { ok: false, errorKind: 'detectionSource_required' };
    }
    if (typeof b['initialAlert'] !== 'string' || !b['initialAlert']) {
      return { ok: false, errorKind: 'initialAlert_required' };
    }
    value.playbookId = b['playbookId'];
    value.detectionSource = b['detectionSource'];
    value.initialAlert = b['initialAlert'];
    return { ok: true, value };
  }
  if (kind === 'severity') {
    if (typeof b['affectedUsers'] !== 'number' || (b['affectedUsers'] as number) < 0) {
      return { ok: false, errorKind: 'affectedUsers_required_non_negative_number' };
    }
    const dc = b['dataClassification'];
    if (
      dc !== 'public' &&
      dc !== 'internal' &&
      dc !== 'confidential' &&
      dc !== 'restricted'
    ) {
      return {
        ok: false,
        errorKind: 'dataClassification_must_be_public_internal_confidential_or_restricted',
      };
    }
    if (typeof b['serviceDown'] !== 'boolean') {
      return { ok: false, errorKind: 'serviceDown_required_boolean' };
    }
    value.affectedUsers = b['affectedUsers'] as number;
    value.dataClassification = dc;
    value.serviceDown = b['serviceDown'];
    return { ok: true, value };
  }
  if (kind === 'escalate') {
    if (!Array.isArray(b['channels']) || (b['channels'] as unknown[]).length === 0) {
      return { ok: false, errorKind: 'channels_required_non_empty_array' };
    }
    if (typeof b['onCallPrimary'] !== 'string' || !b['onCallPrimary']) {
      return { ok: false, errorKind: 'onCallPrimary_required' };
    }
    if (b['onCallSecondary'] !== null && typeof b['onCallSecondary'] !== 'string') {
      return { ok: false, errorKind: 'onCallSecondary_must_be_string_or_null' };
    }
    value.channels = (b['channels'] as unknown[]).filter(
      (c): c is string => typeof c === 'string',
    );
    value.onCallPrimary = b['onCallPrimary'];
    value.onCallSecondary = b['onCallSecondary'] as string | null;
    return { ok: true, value };
  }
  if (kind === 'forensics') {
    for (const key of ['memoryDumpMb', 'networkPcapMb', 'diskImageGb']) {
      if (typeof b[key] !== 'number' || (b[key] as number) < 0) {
        return { ok: false, errorKind: `${key}_required_non_negative_number` };
      }
    }
    value.memoryDumpMb = b['memoryDumpMb'] as number;
    value.networkPcapMb = b['networkPcapMb'] as number;
    value.diskImageGb = b['diskImageGb'] as number;
    return { ok: true, value };
  }
  // kind === 'post-mortem'
  if (typeof b['rootCause'] !== 'string' || (b['rootCause'] as string).length < 10) {
    return { ok: false, errorKind: 'rootCause_must_be_at_least_10_chars' };
  }
  if (!Array.isArray(b['contributingFactors'])) {
    return { ok: false, errorKind: 'contributingFactors_required_array' };
  }
  if (
    !Array.isArray(b['actionItems']) ||
    (b['actionItems'] as unknown[]).length === 0
  ) {
    return { ok: false, errorKind: 'actionItems_required_non_empty_array' };
  }
  value.rootCause = b['rootCause'];
  value.contributingFactors = (b['contributingFactors'] as unknown[]).filter(
    (c): c is string => typeof c === 'string',
  );
  value.actionItems = (b['actionItems'] as unknown[]).filter(
    (c): c is string => typeof c === 'string',
  );
  return { ok: true, value };
}

export async function handleIncidentRequest(
  adapter: SecurityAdapter,
  req: IncidentRequest,
): Promise<IncidentResponse> {
  try {
    if (req.kind === 'playbook') {
      const result = await adapter.triggerPlaybook({
        sessionId: req.sessionId,
        playbookId: req.playbookId!,
        detectionSource: req.detectionSource!,
        initialAlert: req.initialAlert!,
      });
      return {
        ok: true,
        kind: 'playbook',
        sessionId: result.sessionId,
        playbookId: result.playbookId,
      };
    }
    if (req.kind === 'severity') {
      const result = await adapter.classifySeverity({
        sessionId: req.sessionId,
        affectedUsers: req.affectedUsers!,
        dataClassification: req.dataClassification!,
        serviceDown: req.serviceDown!,
      });
      return {
        ok: true,
        kind: 'severity',
        sessionId: result.sessionId,
        severity: result.severity,
      };
    }
    if (req.kind === 'escalate') {
      const result = await adapter.escalate({
        sessionId: req.sessionId,
        channels: req.channels!,
        onCallPrimary: req.onCallPrimary!,
        onCallSecondary: req.onCallSecondary ?? null,
      });
      return {
        ok: true,
        kind: 'escalate',
        sessionId: result.sessionId,
        channelCount: result.channelCount,
        hasSecondary: result.hasSecondary,
      };
    }
    if (req.kind === 'forensics') {
      const result = await adapter.captureForensics({
        sessionId: req.sessionId,
        memoryDumpMb: req.memoryDumpMb!,
        networkPcapMb: req.networkPcapMb!,
        diskImageGb: req.diskImageGb!,
      });
      return {
        ok: true,
        kind: 'forensics',
        sessionId: result.sessionId,
        artifactCount: result.artifactCount,
      };
    }
    const result = await adapter.recordPostMortem({
      sessionId: req.sessionId,
      rootCause: req.rootCause!,
      contributingFactors: req.contributingFactors!,
      actionItems: req.actionItems!,
    });
    return {
      ok: true,
      kind: 'post-mortem',
      sessionId: result.sessionId,
      rootCause: result.rootCause,
      actionItemCount: result.actionItemCount,
    };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      sessionId: req.sessionId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
