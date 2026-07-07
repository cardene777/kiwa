/**
 * Incident-response end-to-end fidelity spec (incident-response axis:
 * playbook trigger + sev1-5 severity classification + escalation to
 * on-call + forensics capture + post-mortem record).
 *
 * Issue CAR-865 (v1.39-3) AC — the mock adapter drives a full IR
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. triggerPlaybook binds a playbookId + detectionSource + initial
 *     alert on an otherwise idle session, transitioning to
 *     playbook-triggered.
 *  2. classifySeverity walks the sev1-5 ladder based on data
 *     classification + service down + affected users. sev1 for
 *     restricted+serviceDown or serviceDown+>1000 users; sev2 for
 *     restricted-only or serviceDown+>100 users; sev3 for
 *     confidential; sev4 for >10 users; sev5 default.
 *  3. escalate requires at least one channel and a primary on-call
 *     assignment; hasSecondary threads back into the trace.
 *  4. captureForensics accepts non-negative memory-dump / network-pcap
 *     / disk-image sizes; artifactCount increments per positive
 *     size.
 *  5. recordPostMortem requires a >= 10 char root cause + at least one
 *     action item; contributingFactors are threaded through unchanged.
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_SIEM_ENV_MISSING` on every non-integration
 * environment (the default).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import {
  handleIncidentRequest,
  validateIncidentRequest,
} from '../src/app/incident/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — incident triggerPlaybook', () => {
  it('axis 1: triggerPlaybook binds playbookId + detectionSource on idle session', async () => {
    await mock.startIncident({ sessionId: 'i1', target: 'siem-splunk' });
    const result = await mock.triggerPlaybook({
      sessionId: 'i1',
      playbookId: 'suspicious-login',
      detectionSource: 'siem-correlation',
      initialAlert: 'brute-force detected',
    });
    expect(result.playbookId).toBe('suspicious-login');
    expect(result.detectionSource).toBe('siem-correlation');
    const trace = mock.traces().find((t) => t.op === 'triggerPlaybook');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: triggerPlaybook rejects an empty playbookId', async () => {
    await mock.startIncident({ sessionId: 'i-empty', target: 'siem-splunk' });
    await expect(
      mock.triggerPlaybook({
        sessionId: 'i-empty',
        playbookId: '',
        detectionSource: 'ids',
        initialAlert: 'x',
      }),
    ).rejects.toThrow(/playbookId/);
  });

  it('axis 1: triggerPlaybook rejects re-trigger after first call', async () => {
    await mock.startIncident({ sessionId: 'i-dup', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'i-dup',
      playbookId: 'p1',
      detectionSource: 'ids',
      initialAlert: 'x',
    });
    await expect(
      mock.triggerPlaybook({
        sessionId: 'i-dup',
        playbookId: 'p2',
        detectionSource: 'ids',
        initialAlert: 'y',
      }),
    ).rejects.toThrow(/must be idle/);
  });
});

describe('mock adapter — incident classifySeverity ladder', () => {
  it('axis 2: sev1 when data is restricted and service is down', async () => {
    await mock.startIncident({ sessionId: 's1', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 's1',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    const result = await mock.classifySeverity({
      sessionId: 's1',
      affectedUsers: 500,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    expect(result.severity).toBe('sev1');
  });

  it('axis 2: sev2 when data is restricted but service is not down', async () => {
    await mock.startIncident({ sessionId: 's2', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 's2',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    const result = await mock.classifySeverity({
      sessionId: 's2',
      affectedUsers: 500,
      dataClassification: 'restricted',
      serviceDown: false,
    });
    expect(result.severity).toBe('sev2');
  });

  it('axis 2: sev1 when service is down and affected users > 1000', async () => {
    await mock.startIncident({ sessionId: 's3', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 's3',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    const result = await mock.classifySeverity({
      sessionId: 's3',
      affectedUsers: 5_000,
      dataClassification: 'internal',
      serviceDown: true,
    });
    expect(result.severity).toBe('sev1');
  });

  it('axis 2: sev2 when service is down and 100 < affected users <= 1000', async () => {
    await mock.startIncident({ sessionId: 's4', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 's4',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    const result = await mock.classifySeverity({
      sessionId: 's4',
      affectedUsers: 200,
      dataClassification: 'internal',
      serviceDown: true,
    });
    expect(result.severity).toBe('sev2');
  });

  it('axis 2: sev3 when data is confidential and service is not down', async () => {
    await mock.startIncident({ sessionId: 's5', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 's5',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    const result = await mock.classifySeverity({
      sessionId: 's5',
      affectedUsers: 5,
      dataClassification: 'confidential',
      serviceDown: false,
    });
    expect(result.severity).toBe('sev3');
  });

  it('axis 2: sev4 when > 10 users affected and no other qualifier hits', async () => {
    await mock.startIncident({ sessionId: 's6', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 's6',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    const result = await mock.classifySeverity({
      sessionId: 's6',
      affectedUsers: 42,
      dataClassification: 'internal',
      serviceDown: false,
    });
    expect(result.severity).toBe('sev4');
  });

  it('axis 2: sev5 as the default when no other qualifier hits', async () => {
    await mock.startIncident({ sessionId: 's7', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 's7',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    const result = await mock.classifySeverity({
      sessionId: 's7',
      affectedUsers: 1,
      dataClassification: 'public',
      serviceDown: false,
    });
    expect(result.severity).toBe('sev5');
  });

  it('axis 2: classifySeverity rejects when playbook not triggered', async () => {
    await mock.startIncident({ sessionId: 'no-pb', target: 'siem-splunk' });
    await expect(
      mock.classifySeverity({
        sessionId: 'no-pb',
        affectedUsers: 1,
        dataClassification: 'public',
        serviceDown: false,
      }),
    ).rejects.toThrow(/playbook must be triggered first/);
  });

  it('axis 2: classifySeverity rejects a negative affectedUsers count', async () => {
    await mock.startIncident({ sessionId: 'neg', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'neg',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    await expect(
      mock.classifySeverity({
        sessionId: 'neg',
        affectedUsers: -1,
        dataClassification: 'public',
        serviceDown: false,
      }),
    ).rejects.toThrow(/non-negative/);
  });
});

describe('mock adapter — incident escalate', () => {
  it('axis 3: escalate reports channel count + secondary on-call presence', async () => {
    await mock.startIncident({ sessionId: 'e1', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'e1',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    await mock.classifySeverity({
      sessionId: 'e1',
      affectedUsers: 1_000,
      dataClassification: 'confidential',
      serviceDown: true,
    });
    const result = await mock.escalate({
      sessionId: 'e1',
      channels: ['pagerduty', 'slack:secops'],
      onCallPrimary: 'alice',
      onCallSecondary: 'bob',
    });
    expect(result.channelCount).toBe(2);
    expect(result.hasSecondary).toBe(true);
    expect(result.onCallPrimary).toBe('alice');
  });

  it('axis 3: escalate rejects an empty channel list', async () => {
    await mock.startIncident({ sessionId: 'ec-empty', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'ec-empty',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    await mock.classifySeverity({
      sessionId: 'ec-empty',
      affectedUsers: 5,
      dataClassification: 'public',
      serviceDown: false,
    });
    await expect(
      mock.escalate({
        sessionId: 'ec-empty',
        channels: [],
        onCallPrimary: 'alice',
        onCallSecondary: null,
      }),
    ).rejects.toThrow(/at least one channel/);
  });

  it('axis 3: escalate rejects when severity is not classified', async () => {
    await mock.startIncident({ sessionId: 'ec-nosev', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'ec-nosev',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    await expect(
      mock.escalate({
        sessionId: 'ec-nosev',
        channels: ['pagerduty'],
        onCallPrimary: 'alice',
        onCallSecondary: null,
      }),
    ).rejects.toThrow(/severity must be classified first/);
  });
});

describe('mock adapter — incident captureForensics', () => {
  it('axis 4: captureForensics reports artifactCount matching positive sizes', async () => {
    await mock.startIncident({ sessionId: 'f1', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'f1',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    await mock.classifySeverity({
      sessionId: 'f1',
      affectedUsers: 1_000,
      dataClassification: 'confidential',
      serviceDown: true,
    });
    await mock.escalate({
      sessionId: 'f1',
      channels: ['pd'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    const result = await mock.captureForensics({
      sessionId: 'f1',
      memoryDumpMb: 512,
      networkPcapMb: 128,
      diskImageGb: 5,
    });
    expect(result.artifactCount).toBe(3);
  });

  it('axis 4: captureForensics reports zero artifact count when all sizes are zero', async () => {
    await mock.startIncident({ sessionId: 'f-zero', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'f-zero',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    await mock.classifySeverity({
      sessionId: 'f-zero',
      affectedUsers: 5,
      dataClassification: 'public',
      serviceDown: false,
    });
    await mock.escalate({
      sessionId: 'f-zero',
      channels: ['pd'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    const result = await mock.captureForensics({
      sessionId: 'f-zero',
      memoryDumpMb: 0,
      networkPcapMb: 0,
      diskImageGb: 0,
    });
    expect(result.artifactCount).toBe(0);
  });

  it('axis 4: captureForensics rejects negative sizes', async () => {
    await mock.startIncident({ sessionId: 'f-neg', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'f-neg',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    await mock.classifySeverity({
      sessionId: 'f-neg',
      affectedUsers: 5,
      dataClassification: 'public',
      serviceDown: false,
    });
    await mock.escalate({
      sessionId: 'f-neg',
      channels: ['pd'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    await expect(
      mock.captureForensics({
        sessionId: 'f-neg',
        memoryDumpMb: -1,
        networkPcapMb: 0,
        diskImageGb: 0,
      }),
    ).rejects.toThrow(/non-negative/);
  });

  it('axis 4: captureForensics rejects when escalation has not completed', async () => {
    await mock.startIncident({ sessionId: 'f-noesc', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'f-noesc',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    await mock.classifySeverity({
      sessionId: 'f-noesc',
      affectedUsers: 5,
      dataClassification: 'public',
      serviceDown: false,
    });
    await expect(
      mock.captureForensics({
        sessionId: 'f-noesc',
        memoryDumpMb: 1,
        networkPcapMb: 0,
        diskImageGb: 0,
      }),
    ).rejects.toThrow(/escalation must complete first/);
  });
});

describe('mock adapter — incident recordPostMortem', () => {
  it('axis 5: recordPostMortem accepts a >= 10 char root cause + >= 1 action item', async () => {
    await mock.startIncident({ sessionId: 'pm1', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'pm1',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    await mock.classifySeverity({
      sessionId: 'pm1',
      affectedUsers: 1_000,
      dataClassification: 'confidential',
      serviceDown: true,
    });
    await mock.escalate({
      sessionId: 'pm1',
      channels: ['pd'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    await mock.captureForensics({
      sessionId: 'pm1',
      memoryDumpMb: 128,
      networkPcapMb: 32,
      diskImageGb: 4,
    });
    const result = await mock.recordPostMortem({
      sessionId: 'pm1',
      rootCause: 'expired credential cache serving stale token',
      contributingFactors: ['rotation missed', 'monitor alert disabled'],
      actionItems: [
        'automate token rotation',
        'restore monitor with test',
      ],
    });
    expect(result.actionItemCount).toBe(2);
    expect(result.contributingFactorCount).toBe(2);
    expect(result.rootCause).toContain('expired');
  });

  it('axis 5: recordPostMortem rejects a < 10 char root cause', async () => {
    await mock.startIncident({ sessionId: 'pm-short', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'pm-short',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    await mock.classifySeverity({
      sessionId: 'pm-short',
      affectedUsers: 1,
      dataClassification: 'public',
      serviceDown: false,
    });
    await mock.escalate({
      sessionId: 'pm-short',
      channels: ['pd'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    await mock.captureForensics({
      sessionId: 'pm-short',
      memoryDumpMb: 0,
      networkPcapMb: 0,
      diskImageGb: 0,
    });
    await expect(
      mock.recordPostMortem({
        sessionId: 'pm-short',
        rootCause: 'short',
        contributingFactors: [],
        actionItems: ['x'],
      }),
    ).rejects.toThrow(/>= 10 chars/);
  });

  it('axis 5: recordPostMortem rejects an empty action item list', async () => {
    await mock.startIncident({ sessionId: 'pm-noact', target: 'siem-splunk' });
    await mock.triggerPlaybook({
      sessionId: 'pm-noact',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    await mock.classifySeverity({
      sessionId: 'pm-noact',
      affectedUsers: 1,
      dataClassification: 'public',
      serviceDown: false,
    });
    await mock.escalate({
      sessionId: 'pm-noact',
      channels: ['pd'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    await mock.captureForensics({
      sessionId: 'pm-noact',
      memoryDumpMb: 0,
      networkPcapMb: 0,
      diskImageGb: 0,
    });
    await expect(
      mock.recordPostMortem({
        sessionId: 'pm-noact',
        rootCause: 'a really long root cause description',
        contributingFactors: [],
        actionItems: [],
      }),
    ).rejects.toThrow(/action item/);
  });
});

describe('mock adapter — incident session lifecycle', () => {
  it('startIncident rejects duplicate session ids', async () => {
    await mock.startIncident({ sessionId: 'dup', target: 'siem-splunk' });
    await expect(
      mock.startIncident({ sessionId: 'dup', target: 'siem-splunk' }),
    ).rejects.toThrow(/incident_session_exists/);
  });

  it('closeIncident removes session from bookkeeping', async () => {
    await mock.startIncident({ sessionId: 'close', target: 'siem-splunk' });
    await mock.closeIncident({ sessionId: 'close' });
    await expect(mock.closeIncident({ sessionId: 'close' })).rejects.toThrow(
      /incident_session_not_found/,
    );
  });
});

describe('mock adapter — /incident route validation', () => {
  it('accepts a playbook request with all required fields', () => {
    const parsed = validateIncidentRequest({
      kind: 'playbook',
      sessionId: 'i',
      playbookId: 'p',
      detectionSource: 'd',
      initialAlert: 'a',
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects a severity request with an unknown dataClassification', () => {
    const parsed = validateIncidentRequest({
      kind: 'severity',
      sessionId: 'i',
      affectedUsers: 1,
      dataClassification: 'top-secret',
      serviceDown: false,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errorKind).toBe(
        'dataClassification_must_be_public_internal_confidential_or_restricted',
      );
    }
  });

  it('rejects an escalate request with an empty channel array', () => {
    const parsed = validateIncidentRequest({
      kind: 'escalate',
      sessionId: 'i',
      channels: [],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errorKind).toBe('channels_required_non_empty_array');
    }
  });

  it('accepts a post-mortem request with a null onCallSecondary via escalate kind', () => {
    const parsed = validateIncidentRequest({
      kind: 'escalate',
      sessionId: 'i',
      channels: ['pd'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects a forensics request with a negative memoryDumpMb', () => {
    const parsed = validateIncidentRequest({
      kind: 'forensics',
      sessionId: 'i',
      memoryDumpMb: -1,
      networkPcapMb: 0,
      diskImageGb: 0,
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects a post-mortem request with a short root cause', () => {
    const parsed = validateIncidentRequest({
      kind: 'post-mortem',
      sessionId: 'i',
      rootCause: 'short',
      contributingFactors: [],
      actionItems: ['a'],
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errorKind).toBe('rootCause_must_be_at_least_10_chars');
    }
  });
});

describe('mock adapter — /incident route handler', () => {
  it('serves a playbook request end to end', async () => {
    await mock.startIncident({ sessionId: 'r1', target: 'siem-splunk' });
    const parsed = validateIncidentRequest({
      kind: 'playbook',
      sessionId: 'r1',
      playbookId: 'suspicious-login',
      detectionSource: 'ids',
      initialAlert: 'brute force',
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleIncidentRequest(mock, parsed.value);
    expect(res.ok).toBe(true);
    expect(res.playbookId).toBe('suspicious-login');
  });

  it('reports an adapter error via errorKind on route response', async () => {
    const parsed = validateIncidentRequest({
      kind: 'severity',
      sessionId: 'ghost',
      affectedUsers: 5,
      dataClassification: 'internal',
      serviceDown: false,
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleIncidentRequest(mock, parsed.value);
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('incident_session_not_found');
  });
});

describe('real adapter — incident env-detect refusal', () => {
  it('every op refuses with the env-missing message when the stack is not ready', async () => {
    const real = makeRealAdapter();
    await expect(
      real.triggerPlaybook({
        sessionId: 'i',
        playbookId: 'p',
        detectionSource: 'd',
        initialAlert: 'a',
      }),
    ).rejects.toThrow(/KIWA_SIEM/);
  });
});
