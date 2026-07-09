/**
 * Mock adapter — drives `@kiwa-lab/security` v0.2 siem-audit +
 * incident-response semantics (startSiemAuditSession / structureEvent /
 * sealEvents / applyRetention / correlate / startIncidentSession /
 * triggerPlaybook / classifySeverity / escalate / captureForensics /
 * recordPostMortem) so the same app code exercises a deterministic
 * SIEM + incident-response ceremony without a real Splunk + PagerDuty
 * broker. Both mock and real adapters satisfy {@link SecurityAdapter},
 * so the fidelity harness can diff them side-by-side.
 *
 * State model — one session per (sessionId) tuple across each surface;
 * each session is isolated so per-surface metrics stay separated. The
 * orchestrator surface layers a fused correlation → incident decision
 * on top of the two axis outputs so the caller can drive both an
 * axis-only flow and a fused flow through the same adapter.
 *
 * The mock intentionally piggy-backs on the same neutral event
 * vocabulary that the parent v1.39-1 semantics package emits — every op
 * appends the matching neutral event into the trace so the fidelity
 * harness can assert the mock and real adapters produce identical event
 * orderings.
 */

import {
  applyRetention as retentionSem,
  captureForensics as forensicsSem,
  classifySeverity as severitySem,
  correlate as correlateSem,
  escalate as escalateSem,
  recordPostMortem as postMortemSem,
  sealEvents as sealSem,
  startIncidentSession,
  startSiemAuditSession,
  structureEvent as structureSem,
  triggerPlaybook as playbookSem,
  type IncidentSession,
  type IncidentSeverity,
  type SecurityAdvTarget,
  type SiemAuditSession,
} from '@kiwa-lab/security';
import type {
  IrEscalationResult,
  IrForensicsResult,
  IrPlaybookResult,
  IrPostMortemResult,
  IrSeverityResult,
  OrchestrateResult,
  SecurityAdapter,
  SiemCorrelateResult,
  SiemRetentionResult,
  SiemSealResult,
  SiemStructureResult,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface OrchestratorSession {
  sessionId: string;
  siemTarget: SecurityAdvTarget;
  incidentTarget: SecurityAdvTarget;
  closed: boolean;
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): SecurityAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const trace: TraceEvent[] = [];
  const siem = new Map<string, SiemAuditSession>();
  const incident = new Map<string, IncidentSession>();
  const orchestrator = new Map<string, OrchestratorSession>();

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

  function coerceErrorKind(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'unknown_error';
  }

  return {
    mode: 'mock',

    async startSiem(input) {
      if (siem.has(input.sessionId)) {
        record('startSiem', false, { errorKind: 'siem_session_exists' });
        throw new Error('siem_session_exists');
      }
      const session = startSiemAuditSession({
        target: input.target,
        sessionId: input.sessionId,
      });
      siem.set(input.sessionId, session);
      record('startSiem', true, {
        detail: { sessionId: input.sessionId, target: input.target },
      });
    },

    async structureEvent(input) {
      const session = siem.get(input.sessionId);
      if (!session) {
        record('structureEvent', false, { errorKind: 'siem_session_not_found' });
        throw new Error('siem_session_not_found');
      }
      try {
        const { event } = structureSem(session, {
          actor: input.actor,
          action: input.action,
          target: input.target,
          timestamp: input.timestamp,
          result: input.result,
        });
        const result: SiemStructureResult = {
          sessionId: input.sessionId,
          eventId: event.eventId,
          cimSchemaVersion: event.cimSchemaVersion,
          actor: event.actor,
          action: event.action,
          latencyMs,
        };
        record('structureEvent', true, { detail: result });
        return result;
      } catch (err) {
        record('structureEvent', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async sealEvents(input) {
      const session = siem.get(input.sessionId);
      if (!session) {
        record('sealEvents', false, { errorKind: 'siem_session_not_found' });
        throw new Error('siem_session_not_found');
      }
      try {
        const step = sealSem(session, { previousHash: input.previousHash });
        const sealHash = (step.metadata['sealHash'] as string) ?? '';
        const eventCount = (step.metadata['eventCount'] as number) ?? 0;
        const result: SiemSealResult = {
          sessionId: input.sessionId,
          sealHash,
          previousHash: input.previousHash,
          eventCount,
          latencyMs,
        };
        record('sealEvents', true, { detail: result });
        return result;
      } catch (err) {
        record('sealEvents', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async applyRetention(input) {
      const session = siem.get(input.sessionId);
      if (!session) {
        record('applyRetention', false, { errorKind: 'siem_session_not_found' });
        throw new Error('siem_session_not_found');
      }
      try {
        const step = retentionSem(session, {
          hotDays: input.hotDays,
          warmDays: input.warmDays,
          coldDays: input.coldDays,
          legalHold: input.legalHold,
        });
        const totalDays = (step.metadata['totalDays'] as number) ?? 0;
        const result: SiemRetentionResult = {
          sessionId: input.sessionId,
          totalDays,
          hotDays: input.hotDays,
          warmDays: input.warmDays,
          coldDays: input.coldDays,
          legalHold: input.legalHold,
          latencyMs,
        };
        record('applyRetention', true, { detail: result });
        return result;
      } catch (err) {
        record('applyRetention', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async correlate(input) {
      const session = siem.get(input.sessionId);
      if (!session) {
        record('correlate', false, { errorKind: 'siem_session_not_found' });
        throw new Error('siem_session_not_found');
      }
      try {
        const step = correlateSem(session, {
          ruleId: input.ruleId,
          requiredEventIds: input.requiredEventIds,
          windowMs: input.windowMs,
        });
        const matched = (step.metadata['matched'] as boolean) ?? false;
        const requiredCount =
          (step.metadata['requiredCount'] as number) ?? input.requiredEventIds.length;
        const result: SiemCorrelateResult = {
          sessionId: input.sessionId,
          ruleId: input.ruleId,
          matched,
          requiredCount,
          windowMs: input.windowMs,
          latencyMs,
        };
        record('correlate', true, { detail: result });
        return result;
      } catch (err) {
        record('correlate', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closeSiem(input) {
      if (!siem.has(input.sessionId)) {
        record('closeSiem', false, { errorKind: 'siem_session_not_found' });
        throw new Error('siem_session_not_found');
      }
      siem.delete(input.sessionId);
      record('closeSiem', true, { detail: { sessionId: input.sessionId } });
    },

    async startIncident(input) {
      if (incident.has(input.sessionId)) {
        record('startIncident', false, { errorKind: 'incident_session_exists' });
        throw new Error('incident_session_exists');
      }
      const session = startIncidentSession({
        target: input.target,
        sessionId: input.sessionId,
      });
      incident.set(input.sessionId, session);
      record('startIncident', true, {
        detail: { sessionId: input.sessionId, target: input.target },
      });
    },

    async triggerPlaybook(input) {
      const session = incident.get(input.sessionId);
      if (!session) {
        record('triggerPlaybook', false, { errorKind: 'incident_session_not_found' });
        throw new Error('incident_session_not_found');
      }
      try {
        playbookSem(session, {
          playbookId: input.playbookId,
          detectionSource: input.detectionSource,
          initialAlert: input.initialAlert,
        });
        const result: IrPlaybookResult = {
          sessionId: input.sessionId,
          playbookId: input.playbookId,
          detectionSource: input.detectionSource,
          latencyMs,
        };
        record('triggerPlaybook', true, { detail: result });
        return result;
      } catch (err) {
        record('triggerPlaybook', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async classifySeverity(input) {
      const session = incident.get(input.sessionId);
      if (!session) {
        record('classifySeverity', false, {
          errorKind: 'incident_session_not_found',
        });
        throw new Error('incident_session_not_found');
      }
      try {
        const step = severitySem(session, {
          affectedUsers: input.affectedUsers,
          dataClassification: input.dataClassification,
          serviceDown: input.serviceDown,
        });
        const severity = (step.metadata['severity'] as IncidentSeverity) ?? 'sev5';
        const result: IrSeverityResult = {
          sessionId: input.sessionId,
          severity,
          affectedUsers: input.affectedUsers,
          latencyMs,
        };
        record('classifySeverity', true, { detail: result });
        return result;
      } catch (err) {
        record('classifySeverity', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async escalate(input) {
      const session = incident.get(input.sessionId);
      if (!session) {
        record('escalate', false, { errorKind: 'incident_session_not_found' });
        throw new Error('incident_session_not_found');
      }
      try {
        const step = escalateSem(session, {
          channels: input.channels,
          onCallPrimary: input.onCallPrimary,
          onCallSecondary: input.onCallSecondary,
        });
        const channelCount = (step.metadata['channelCount'] as number) ?? 0;
        const hasSecondary = (step.metadata['hasSecondary'] as boolean) ?? false;
        const result: IrEscalationResult = {
          sessionId: input.sessionId,
          channelCount,
          onCallPrimary: input.onCallPrimary,
          hasSecondary,
          latencyMs,
        };
        record('escalate', true, { detail: result });
        return result;
      } catch (err) {
        record('escalate', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async captureForensics(input) {
      const session = incident.get(input.sessionId);
      if (!session) {
        record('captureForensics', false, {
          errorKind: 'incident_session_not_found',
        });
        throw new Error('incident_session_not_found');
      }
      try {
        const step = forensicsSem(session, {
          memoryDumpMb: input.memoryDumpMb,
          networkPcapMb: input.networkPcapMb,
          diskImageGb: input.diskImageGb,
        });
        const artifactCount = (step.metadata['artifactCount'] as number) ?? 0;
        const result: IrForensicsResult = {
          sessionId: input.sessionId,
          artifactCount,
          memoryDumpMb: input.memoryDumpMb,
          networkPcapMb: input.networkPcapMb,
          diskImageGb: input.diskImageGb,
          latencyMs,
        };
        record('captureForensics', true, { detail: result });
        return result;
      } catch (err) {
        record('captureForensics', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async recordPostMortem(input) {
      const session = incident.get(input.sessionId);
      if (!session) {
        record('recordPostMortem', false, {
          errorKind: 'incident_session_not_found',
        });
        throw new Error('incident_session_not_found');
      }
      try {
        const step = postMortemSem(session, {
          rootCause: input.rootCause,
          contributingFactors: input.contributingFactors,
          actionItems: input.actionItems,
        });
        const actionItemCount = (step.metadata['actionItemCount'] as number) ?? 0;
        const contributingFactorCount =
          (step.metadata['contributingFactorCount'] as number) ?? 0;
        const result: IrPostMortemResult = {
          sessionId: input.sessionId,
          rootCause: input.rootCause,
          actionItemCount,
          contributingFactorCount,
          latencyMs,
        };
        record('recordPostMortem', true, { detail: result });
        return result;
      } catch (err) {
        record('recordPostMortem', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closeIncident(input) {
      if (!incident.has(input.sessionId)) {
        record('closeIncident', false, { errorKind: 'incident_session_not_found' });
        throw new Error('incident_session_not_found');
      }
      incident.delete(input.sessionId);
      record('closeIncident', true, { detail: { sessionId: input.sessionId } });
    },

    async startOrchestrator(input) {
      if (orchestrator.has(input.sessionId)) {
        record('startOrchestrator', false, {
          errorKind: 'orchestrator_session_exists',
        });
        throw new Error('orchestrator_session_exists');
      }
      orchestrator.set(input.sessionId, {
        sessionId: input.sessionId,
        siemTarget: input.siemTarget,
        incidentTarget: input.incidentTarget,
        closed: false,
      });
      record('startOrchestrator', true, {
        detail: {
          sessionId: input.sessionId,
          siemTarget: input.siemTarget,
          incidentTarget: input.incidentTarget,
        },
      });
    },

    async orchestrateDecision(input) {
      const session = orchestrator.get(input.sessionId);
      if (!session) {
        record('orchestrateDecision', false, {
          errorKind: 'orchestrator_session_not_found',
        });
        throw new Error('orchestrator_session_not_found');
      }
      if (session.closed) {
        record('orchestrateDecision', false, {
          errorKind: 'orchestrator_session_closed',
        });
        throw new Error('orchestrator_session_closed');
      }
      const incidentTriggered = input.correlationMatched;
      const severity = classifySeverityFromInputs({
        triggered: incidentTriggered,
        affectedUsers: input.affectedUsers,
        dataClassification: input.dataClassification,
        serviceDown: input.serviceDown,
      });
      const result: OrchestrateResult = {
        sessionId: input.sessionId,
        correlationMatched: input.correlationMatched,
        incidentTriggered,
        severity,
        latencyMs,
      };
      record('orchestrateDecision', true, { detail: result });
      return result;
    },

    async closeOrchestrator(input) {
      const session = orchestrator.get(input.sessionId);
      if (!session) {
        record('closeOrchestrator', false, {
          errorKind: 'orchestrator_session_not_found',
        });
        throw new Error('orchestrator_session_not_found');
      }
      session.closed = true;
      orchestrator.delete(input.sessionId);
      record('closeOrchestrator', true, {
        detail: { sessionId: input.sessionId },
      });
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
      siem.clear();
      incident.clear();
      orchestrator.clear();
    },
  };
}

/**
 * Fused severity classifier — mirrors the sev1-5 ladder used by the
 * v1.39-1 semantics package. When correlation did not match the
 * orchestrator returns sev5 (informational).
 */
function classifySeverityFromInputs(input: {
  triggered: boolean;
  affectedUsers: number;
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  serviceDown: boolean;
}): IncidentSeverity {
  if (!input.triggered) return 'sev5';
  if (input.dataClassification === 'restricted' && input.serviceDown) return 'sev1';
  if (input.dataClassification === 'restricted') return 'sev2';
  if (input.serviceDown && input.affectedUsers > 1000) return 'sev1';
  if (input.serviceDown && input.affectedUsers > 100) return 'sev2';
  if (input.dataClassification === 'confidential') return 'sev3';
  if (input.affectedUsers > 10) return 'sev4';
  return 'sev5';
}
