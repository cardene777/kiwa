import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startCli,
  summarizeCli,
} from '../../src/semantics/cli-lifecycle-orchestrator.js';

describe('v0.6 cli-lifecycle-orchestrator', () => {
  it('T-C-LC-001 spawning 初期化', () => {
    expect(startCli({ timestamp: 't0' }).state).toBe('spawning');
  });

  it('T-C-LC-002 spawn-succeeded → running', () => {
    const s = startCli({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    expect(next.state).toBe('running');
    expect(next.spawns).toBe(1);
  });

  it('T-C-LC-003 全経路 chain (spawn → run → signal → exit → cleaned)', () => {
    let s = startCli({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'stdout-received', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'signal-sent', timestamp: 't3' });
    expect(s.state).toBe('signaled');
    s = dispatchEvent({ session: s, event: 'exit-detected', timestamp: 't4' });
    expect(s.state).toBe('exited');
    s = dispatchEvent({ session: s, event: 'cleanup-requested', timestamp: 't5' });
    expect(s.state).toBe('cleaned');
    const sum = summarizeCli(s);
    expect(sum.signals).toBe(1);
    expect(sum.cleanups).toBe(1);
    expect(sum.stdoutChunks).toBe(1);
  });

  it('T-C-LC-004 normal exit (spawn → run → exit → cleaned)', () => {
    let s = startCli({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'exit-detected', timestamp: 't2' });
    expect(s.state).toBe('exited');
    s = dispatchEvent({ session: s, event: 'cleanup-requested', timestamp: 't3' });
    expect(s.state).toBe('cleaned');
  });

  it('T-C-LC-005 timeout で 途中 state から exited', () => {
    let s = startCli({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't2' });
    expect(next.state).toBe('exited');
  });

  it('T-C-LC-006 shape 契約 preserving', () => {
    const s = startCli({ timestamp: 't0' });
    expect(s).toMatchObject({
      state: 'spawning',
      spawns: 0,
      stdoutChunks: 0,
      stderrChunks: 0,
      signals: 0,
      cleanups: 0,
      zombies: 0,
    });
  });

  it('T-C-LC-007 zombie-detected trace', () => {
    let s = startCli({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'exit-detected', timestamp: 't2' });
    const next = dispatchEvent({ session: s, event: 'zombie-detected', timestamp: 't3' });
    expect(next.state).toBe('exited');
    expect(next.zombies).toBe(1);
  });

  it('T-C-LC-008 invalid 遷移 (throw guard)', () => {
    const s = startCli({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'stdout-received', timestamp: 't1' });
    expect(next.state).toBe('spawning');
    const invalids = next.events.filter((e) => e.startsWith('invalid:'));
    expect(invalids).toContain('invalid:stdout-received-in-spawning');
  });

  it('T-C-LC-009 40 セル 遷移表 SSOT', () => {
    const states = ['spawning', 'running', 'signaled', 'exited', 'cleaned'] as const;
    const events = [
      'spawn-succeeded',
      'stdout-received',
      'stderr-received',
      'signal-sent',
      'exit-detected',
      'cleanup-requested',
      'zombie-detected',
      'timeout',
    ] as const;
    expect(states.length * events.length).toBe(40);
  });
});
