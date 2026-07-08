/**
 * v2.7-3 docs 補強 — tutorial 134 code snippet 検証。
 * 53 milestone streak = v1.23 → v2.7、 systematic pattern **50 度到達** milestone。
 */
import { describe, expect, it } from 'vitest';
import { dispatchEvent, startIncident } from '../src/semantics/incident-orchestrator.js';

describe('tutorial 134 — 完全 chain', () => {
  it('全経路遷移', () => {
    let s = startIncident({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'anomaly-detected', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'triage-completed', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'escalation-succeeded', timestamp: 't3' });
    s = dispatchEvent({ session: s, event: 'mitigation-applied', timestamp: 't4' });
    s = dispatchEvent({ session: s, event: 'incident-resolved', timestamp: 't5' });
    expect(s.state).toBe('resolved');
  });
});
