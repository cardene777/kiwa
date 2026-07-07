import { describe, expect, it } from 'vitest';
import {
  applyRetention,
  correlate,
  sealEvents,
  startSiemAuditSession,
  structureEvent,
} from '../../src/semantics/index.js';

describe('startSiemAuditSession', () => {
  it('creates idle session', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    expect(s.state).toBe('idle');
    expect(s.structuredEvents).toEqual([]);
    expect(s.sealHashChain).toEqual([]);
  });

  it('throws when sessionId is empty', () => {
    expect(() =>
      startSiemAuditSession({ target: 'siem-splunk', sessionId: '' }),
    ).toThrow('sessionId must not be empty');
  });
});

describe('structureEvent', () => {
  it('assigns eventId and CIM schema version', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    const { step, event } = structureEvent(s, {
      actor: 'alice',
      action: 'login',
      target: 'auth-svc',
      timestamp: 1000,
      result: 'success',
    });
    expect(event.eventId).toBe('evt-1');
    expect(event.cimSchemaVersion).toBe('1.0');
    expect(s.state).toBe('structured');
    expect(step.neutralEvent).toBe('siem.event_structured');
  });

  it('assigns sequential eventIds', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    structureEvent(s, {
      actor: 'a',
      action: 'l',
      target: 't',
      timestamp: 1,
      result: 'success',
    });
    const { event } = structureEvent(s, {
      actor: 'a',
      action: 'l',
      target: 't',
      timestamp: 2,
      result: 'failure',
    });
    expect(event.eventId).toBe('evt-2');
  });

  it('throws on empty fields', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    expect(() =>
      structureEvent(s, {
        actor: '',
        action: 'l',
        target: 't',
        timestamp: 1,
        result: 'success',
      }),
    ).toThrow('must not be empty');
  });
});

describe('sealEvents', () => {
  const evt = {
    actor: 'a',
    action: 'l',
    target: 't',
    timestamp: 1,
    result: 'success' as const,
  };

  it('produces sealHash and updates state', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    structureEvent(s, evt);
    const step = sealEvents(s, { previousHash: 'root' });
    expect(s.state).toBe('sealed');
    expect(s.sealHashChain).toHaveLength(1);
    expect(step.metadata['eventCount']).toBe(1);
  });

  it('chains seal hashes deterministically', () => {
    const a = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    const b = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    structureEvent(a, evt);
    structureEvent(b, evt);
    sealEvents(a, { previousHash: 'root' });
    sealEvents(b, { previousHash: 'root' });
    expect(a.sealHashChain[0]).toBe(b.sealHashChain[0]);
  });

  it('throws when no structured events', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    expect(() => sealEvents(s, { previousHash: 'root' })).toThrow(
      'no structured events to seal',
    );
  });
});

describe('applyRetention', () => {
  const evt = {
    actor: 'a',
    action: 'l',
    target: 't',
    timestamp: 1,
    result: 'success' as const,
  };

  it('records retention days', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    structureEvent(s, evt);
    sealEvents(s, { previousHash: 'root' });
    const step = applyRetention(s, {
      hotDays: 7,
      warmDays: 30,
      coldDays: 365,
      legalHold: false,
    });
    expect(step.metadata['totalDays']).toBe(402);
    expect(s.state).toBe('retention-tagged');
  });

  it('rejects negative days', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    structureEvent(s, evt);
    sealEvents(s, { previousHash: 'root' });
    expect(() =>
      applyRetention(s, {
        hotDays: -1,
        warmDays: 30,
        coldDays: 365,
        legalHold: false,
      }),
    ).toThrow('must be non-negative');
  });

  it('throws when not sealed', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    expect(() =>
      applyRetention(s, {
        hotDays: 7,
        warmDays: 30,
        coldDays: 365,
        legalHold: false,
      }),
    ).toThrow('sealed first');
  });
});

describe('correlate', () => {
  const evt = {
    actor: 'a',
    action: 'l',
    target: 't',
    timestamp: 1,
    result: 'success' as const,
  };

  it('matches when all required event ids present', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    structureEvent(s, evt);
    structureEvent(s, evt);
    sealEvents(s, { previousHash: 'root' });
    applyRetention(s, {
      hotDays: 7,
      warmDays: 30,
      coldDays: 365,
      legalHold: false,
    });
    const step = correlate(s, {
      ruleId: 'r-1',
      requiredEventIds: ['evt-1', 'evt-2'],
      windowMs: 60_000,
    });
    expect(step.metadata['matched']).toBe(true);
    expect(s.state).toBe('correlated');
  });

  it('does not match when required id missing', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    structureEvent(s, evt);
    sealEvents(s, { previousHash: 'root' });
    applyRetention(s, {
      hotDays: 7,
      warmDays: 30,
      coldDays: 365,
      legalHold: false,
    });
    const step = correlate(s, {
      ruleId: 'r-1',
      requiredEventIds: ['evt-99'],
      windowMs: 60_000,
    });
    expect(step.metadata['matched']).toBe(false);
  });

  it('rejects empty rule', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    structureEvent(s, evt);
    sealEvents(s, { previousHash: 'root' });
    applyRetention(s, {
      hotDays: 7,
      warmDays: 30,
      coldDays: 365,
      legalHold: false,
    });
    expect(() =>
      correlate(s, {
        ruleId: 'r-1',
        requiredEventIds: [],
        windowMs: 60_000,
      }),
    ).toThrow('>= 1 event id');
  });
});
