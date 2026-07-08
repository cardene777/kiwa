import { describe, expect, it } from 'vitest';
import {
  bootCli,
  extractStderrShare,
  pipeCliEvents,
  renderCliDashboard,
  traceZombieCount,
} from '../src/workflow.js';

describe('dogfood-cli-test-lifecycle-orchestrator-app (v2.12-2)', () => {
  it('Pattern 1: bootCli', () => {
    expect(bootCli({ timestamp: 't0' }).state).toBe('spawning');
  });

  it('Pattern 2: pipeCliEvents 全経路', () => {
    let s = bootCli({ timestamp: 't0' });
    s = pipeCliEvents({
      session: s,
      events: [
        { event: 'spawn-succeeded', timestamp: 't1' },
        { event: 'stdout-received', timestamp: 't2' },
        { event: 'exit-detected', timestamp: 't3' },
        { event: 'cleanup-requested', timestamp: 't4' },
      ],
    });
    expect(s.state).toBe('cleaned');
    expect(s.cleanups).toBe(1);
  });

  it('Pattern 3: renderCliDashboard', () => {
    const s = bootCli({ timestamp: 't0' });
    expect(renderCliDashboard(s).currentState).toBe('spawning');
  });

  it('Pattern 4: extractStderrShare', () => {
    let s = bootCli({ timestamp: 't0' });
    s = pipeCliEvents({
      session: s,
      events: [
        { event: 'spawn-succeeded', timestamp: 't1' },
        { event: 'stdout-received', timestamp: 't2' },
        { event: 'stderr-received', timestamp: 't3' },
      ],
    });
    expect(extractStderrShare(s).share).toBe(0.5);
  });

  it('Pattern 5: traceZombieCount', () => {
    let s = bootCli({ timestamp: 't0' });
    s = pipeCliEvents({
      session: s,
      events: [
        { event: 'spawn-succeeded', timestamp: 't1' },
        { event: 'exit-detected', timestamp: 't2' },
        { event: 'zombie-detected', timestamp: 't3' },
      ],
    });
    expect(traceZombieCount(s).count).toBe(1);
  });

  it('5 pattern 統合 (backend systems layer 第 5 例 = 完全普及)', () => {
    let s = bootCli({ timestamp: 't0' });
    s = pipeCliEvents({
      session: s,
      events: [
        { event: 'spawn-succeeded', timestamp: 't1' },
        { event: 'signal-sent', timestamp: 't2' },
      ],
    });
    expect(s.state).toBe('signaled');
    expect(s.signals).toBe(1);
  });
});
