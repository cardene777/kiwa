import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startIncident,
  summarizeIncident,
} from '../../src/semantics/incident-orchestrator.js';

describe('v2.1 incident-orchestrator', () => {
  it('T-O-IO-001 detecting 初期化', () => {
    expect(startIncident({ timestamp: 't0' }).state).toBe('detecting');
  });

  it('T-O-IO-002 anomaly-detected → triaging', () => {
    const s = startIncident({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'anomaly-detected', timestamp: 't1' });
    expect(next.state).toBe('triaging');
    expect(next.anomaliesDetected).toBe(1);
  });

  it('T-O-IO-003 false-positive で 即 resolved', () => {
    const s = startIncident({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'false-positive', timestamp: 't1' });
    expect(next.state).toBe('resolved');
    expect(next.falsePositives).toBe(1);
  });

  it('T-O-IO-004 全経路 chain', () => {
    let s = startIncident({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'anomaly-detected', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'triage-completed', timestamp: 't2' });
    expect(s.state).toBe('escalating');
    s = dispatchEvent({ session: s, event: 'escalation-succeeded', timestamp: 't3' });
    expect(s.state).toBe('mitigating');
    s = dispatchEvent({ session: s, event: 'mitigation-applied', timestamp: 't4' });
    s = dispatchEvent({ session: s, event: 'incident-resolved', timestamp: 't5' });
    expect(s.state).toBe('resolved');
    const sum = summarizeIncident(s);
    expect(sum.anomaliesDetected).toBe(1);
    expect(sum.escalationsExecuted).toBe(1);
    expect(sum.mitigationsApplied).toBe(1);
  });

  it('T-O-IO-005 timeout で 途中 state から resolved', () => {
    let s = startIncident({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'anomaly-detected', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't2' });
    expect(next.state).toBe('resolved');
  });

  it('T-O-IO-006 shape 契約 preserving', async () => {
    const mod = await import('../../src/semantics/index.js');
    expect(typeof mod.startIncident).toBe('function');
    expect(typeof mod.dispatchIncidentEvent).toBe('function');
  });
});
