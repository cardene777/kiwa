import { describe, expect, it } from 'vitest';
import {
  captureForensics,
  classifySeverity,
  escalate,
  recordPostMortem,
  startIncidentSession,
  triggerPlaybook,
} from '../../src/semantics/index.js';

describe('startIncidentSession', () => {
  it('creates idle session', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    expect(s.state).toBe('idle');
    expect(s.playbookId).toBeNull();
    expect(s.severity).toBeNull();
    expect(s.forensicsArtifacts).toEqual([]);
  });

  it('throws when sessionId is empty', () => {
    expect(() =>
      startIncidentSession({ target: 'istio', sessionId: '' }),
    ).toThrow('sessionId must not be empty');
  });
});

describe('triggerPlaybook', () => {
  it('transitions idle -> playbook-triggered', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    triggerPlaybook(s, {
      playbookId: 'pb-1',
      detectionSource: 'siem',
      initialAlert: 'malware in prod',
    });
    expect(s.state).toBe('playbook-triggered');
    expect(s.playbookId).toBe('pb-1');
  });

  it('throws on empty playbookId', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    expect(() =>
      triggerPlaybook(s, { playbookId: '', detectionSource: 'x', initialAlert: 'y' }),
    ).toThrow('playbookId must not be empty');
  });

  it('throws when not idle', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    triggerPlaybook(s, {
      playbookId: 'pb-1',
      detectionSource: 'siem',
      initialAlert: 'x',
    });
    expect(() =>
      triggerPlaybook(s, { playbookId: 'pb-2', detectionSource: 'siem', initialAlert: 'x' }),
    ).toThrow('must be idle');
  });
});

describe('classifySeverity', () => {
  const trigger = (s: ReturnType<typeof startIncidentSession>) =>
    triggerPlaybook(s, {
      playbookId: 'pb-1',
      detectionSource: 'siem',
      initialAlert: 'x',
    });

  it('classifies sev1 for restricted + service down', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    trigger(s);
    classifySeverity(s, {
      affectedUsers: 100,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    expect(s.severity).toBe('sev1');
  });

  it('classifies sev1 for high user count + service down', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    trigger(s);
    classifySeverity(s, {
      affectedUsers: 5000,
      dataClassification: 'public',
      serviceDown: true,
    });
    expect(s.severity).toBe('sev1');
  });

  it('classifies sev2 for restricted only', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    trigger(s);
    classifySeverity(s, {
      affectedUsers: 10,
      dataClassification: 'restricted',
      serviceDown: false,
    });
    expect(s.severity).toBe('sev2');
  });

  it('classifies sev3 for confidential', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    trigger(s);
    classifySeverity(s, {
      affectedUsers: 5,
      dataClassification: 'confidential',
      serviceDown: false,
    });
    expect(s.severity).toBe('sev3');
  });

  it('classifies sev4 for medium user impact', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    trigger(s);
    classifySeverity(s, {
      affectedUsers: 50,
      dataClassification: 'internal',
      serviceDown: false,
    });
    expect(s.severity).toBe('sev4');
  });

  it('classifies sev5 baseline', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    trigger(s);
    classifySeverity(s, {
      affectedUsers: 2,
      dataClassification: 'public',
      serviceDown: false,
    });
    expect(s.severity).toBe('sev5');
  });

  it('rejects negative affected users', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    trigger(s);
    expect(() =>
      classifySeverity(s, {
        affectedUsers: -1,
        dataClassification: 'public',
        serviceDown: false,
      }),
    ).toThrow('non-negative');
  });
});

describe('escalate', () => {
  const setup = (s: ReturnType<typeof startIncidentSession>) => {
    triggerPlaybook(s, { playbookId: 'pb-1', detectionSource: 'x', initialAlert: 'y' });
    classifySeverity(s, {
      affectedUsers: 100,
      dataClassification: 'restricted',
      serviceDown: true,
    });
  };

  it('emits escalation with all fields', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    setup(s);
    const step = escalate(s, {
      channels: ['pagerduty', 'slack'],
      onCallPrimary: 'alice',
      onCallSecondary: 'bob',
    });
    expect(step.metadata['channelCount']).toBe(2);
    expect(step.metadata['hasSecondary']).toBe(true);
    expect(s.state).toBe('escalated');
  });

  it('supports null secondary on-call', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    setup(s);
    const step = escalate(s, {
      channels: ['pagerduty'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    expect(step.metadata['hasSecondary']).toBe(false);
  });

  it('throws on empty channels', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    setup(s);
    expect(() =>
      escalate(s, { channels: [], onCallPrimary: 'a', onCallSecondary: null }),
    ).toThrow('one channel required');
  });

  it('throws on empty primary on-call', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    setup(s);
    expect(() =>
      escalate(s, { channels: ['pd'], onCallPrimary: '', onCallSecondary: null }),
    ).toThrow('primary on-call');
  });
});

describe('captureForensics', () => {
  const setup = (s: ReturnType<typeof startIncidentSession>) => {
    triggerPlaybook(s, { playbookId: 'pb-1', detectionSource: 'x', initialAlert: 'y' });
    classifySeverity(s, {
      affectedUsers: 100,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    escalate(s, { channels: ['pd'], onCallPrimary: 'a', onCallSecondary: null });
  };

  it('captures all 3 artifact types', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    setup(s);
    const step = captureForensics(s, {
      memoryDumpMb: 512,
      networkPcapMb: 100,
      diskImageGb: 50,
    });
    expect(s.forensicsArtifacts).toEqual(['memory-dump', 'network-pcap', 'disk-image']);
    expect(step.metadata['artifactCount']).toBe(3);
  });

  it('skips zero-sized artifacts', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    setup(s);
    captureForensics(s, {
      memoryDumpMb: 0,
      networkPcapMb: 100,
      diskImageGb: 0,
    });
    expect(s.forensicsArtifacts).toEqual(['network-pcap']);
  });

  it('rejects negative sizes', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    setup(s);
    expect(() =>
      captureForensics(s, { memoryDumpMb: -1, networkPcapMb: 0, diskImageGb: 0 }),
    ).toThrow('non-negative');
  });
});

describe('recordPostMortem', () => {
  const fullSetup = (s: ReturnType<typeof startIncidentSession>) => {
    triggerPlaybook(s, { playbookId: 'pb-1', detectionSource: 'x', initialAlert: 'y' });
    classifySeverity(s, {
      affectedUsers: 100,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    escalate(s, { channels: ['pd'], onCallPrimary: 'a', onCallSecondary: null });
    captureForensics(s, { memoryDumpMb: 512, networkPcapMb: 100, diskImageGb: 50 });
  };

  it('records post-mortem successfully', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    fullSetup(s);
    const step = recordPostMortem(s, {
      rootCause: 'expired credential rotation',
      contributingFactors: ['staleness', 'alert fatigue'],
      actionItems: ['auto-rotation', 'runbook update'],
    });
    expect(s.state).toBe('post-mortem-recorded');
    expect(step.metadata['actionItemCount']).toBe(2);
  });

  it('throws on short root cause', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    fullSetup(s);
    expect(() =>
      recordPostMortem(s, {
        rootCause: 'short',
        contributingFactors: [],
        actionItems: ['x'],
      }),
    ).toThrow('>= 10 chars');
  });

  it('throws on no action items', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    fullSetup(s);
    expect(() =>
      recordPostMortem(s, {
        rootCause: 'long enough root cause',
        contributingFactors: [],
        actionItems: [],
      }),
    ).toThrow('>= 1 action item');
  });
});
