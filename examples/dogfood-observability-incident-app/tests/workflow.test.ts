import { describe, expect, it } from 'vitest';
import {
  bootIncident,
  extractFalsePositiveRate,
  pipeIncidentEvents,
  renderIncidentDashboard,
} from '../src/workflow.js';

describe('dogfood-observability-incident-app (v2.7-2)', () => {
  it('Pattern 1: bootIncident', () => {
    expect(bootIncident({ timestamp: 't0' }).state).toBe('detecting');
  });

  it('Pattern 2: pipeIncidentEvents 全経路', () => {
    let s = bootIncident({ timestamp: 't0' });
    s = pipeIncidentEvents({
      session: s,
      events: [
        { event: 'anomaly-detected', timestamp: 't1' },
        { event: 'triage-completed', timestamp: 't2' },
        { event: 'escalation-succeeded', timestamp: 't3' },
        { event: 'mitigation-applied', timestamp: 't4' },
        { event: 'incident-resolved', timestamp: 't5' },
      ],
    });
    expect(s.state).toBe('resolved');
  });

  it('Pattern 3: renderIncidentDashboard', () => {
    const s = bootIncident({ timestamp: 't0' });
    expect(renderIncidentDashboard(s).currentState).toBe('detecting');
  });

  it('Pattern 4: extractFalsePositiveRate', () => {
    let s = bootIncident({ timestamp: 't0' });
    s = pipeIncidentEvents({ session: s, events: [{ event: 'false-positive', timestamp: 't1' }] });
    expect(extractFalsePositiveRate(s).rate).toBe(1);
  });

  it('4 pattern 統合', () => {
    let s = bootIncident({ timestamp: 't0' });
    s = pipeIncidentEvents({
      session: s,
      events: [
        { event: 'anomaly-detected', timestamp: 't1' },
        { event: 'false-positive', timestamp: 't2' },
      ],
    });
    expect(s.state).toBe('resolved');
    expect(s.falsePositives).toBe(1);
  });
});
