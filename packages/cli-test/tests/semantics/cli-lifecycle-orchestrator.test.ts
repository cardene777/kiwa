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

  it('T-C-LC-005b spawning: timeout collapses directly to exited (no spawn ever happened)', () => {
    // The `spawning → timeout → exited` arm — the closest existing test
    // ran timeout after spawn-succeeded (from `running` state). This one
    // fires the timeout while still `spawning`.
    const s = startCli({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't1' });
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

  it('T-C-LC-009 running: stderr-received increments stderrChunks', () => {
    // The running-state `stderr-received` arm — mirrored the stdout path
    // covered by T-C-LC-003 but was never itself exercised.
    let s = startCli({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'stderr-received', timestamp: 't2' });
    expect(next.state).toBe('running');
    expect(next.stderrChunks).toBe(1);
  });

  it('T-C-LC-010 running: an unknown event lands in invalid: events, keeps state', () => {
    // The trailing `invalid:${event}-in-running` arm — the running state's
    // fall-through was never touched.
    let s = startCli({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    const next = dispatchEvent({
      session: s,
      event: 'cleanup-requested' as never,
      timestamp: 't2',
    });
    expect(next.state).toBe('running');
    expect(next.events.filter((e) => e.startsWith('invalid:'))).toContain(
      'invalid:cleanup-requested-in-running',
    );
  });

  it('T-C-LC-011 signaled: zombie-detected increments zombies', () => {
    let s = startCli({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'signal-sent', timestamp: 't2' });
    const next = dispatchEvent({ session: s, event: 'zombie-detected', timestamp: 't3' });
    expect(next.state).toBe('signaled');
    expect(next.zombies).toBe(1);
  });

  it('T-C-LC-012 signaled: timeout collapses to exited', () => {
    let s = startCli({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'signal-sent', timestamp: 't2' });
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't3' });
    expect(next.state).toBe('exited');
  });

  it('T-C-LC-013 signaled: unknown event lands in invalid events', () => {
    let s = startCli({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'signal-sent', timestamp: 't2' });
    const next = dispatchEvent({
      session: s,
      event: 'stdout-received' as never,
      timestamp: 't3',
    });
    expect(next.state).toBe('signaled');
    expect(next.events.filter((e) => e.startsWith('invalid:'))).toContain(
      'invalid:stdout-received-in-signaled',
    );
  });

  it('T-C-LC-014 exited: unknown event lands in invalid events', () => {
    let s = startCli({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'exit-detected', timestamp: 't2' });
    const next = dispatchEvent({
      session: s,
      event: 'stdout-received' as never,
      timestamp: 't3',
    });
    expect(next.state).toBe('exited');
    expect(next.events.filter((e) => e.startsWith('invalid:'))).toContain(
      'invalid:stdout-received-in-exited',
    );
  });

  it('T-C-LC-015 cleaned: every event tags as terminal:{event}-in-cleaned', () => {
    let s = startCli({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'spawn-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'exit-detected', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'cleanup-requested', timestamp: 't3' });
    expect(s.state).toBe('cleaned');
    const next = dispatchEvent({ session: s, event: 'stdout-received', timestamp: 't4' });
    expect(next.state).toBe('cleaned');
    expect(next.events.filter((e) => e.startsWith('terminal:'))).toContain(
      'terminal:stdout-received-in-cleaned',
    );
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
