import { describe, expect, it } from 'vitest';
import {
  detectLeanBinary,
  detectLeanBinaryAsync,
  classifyFailure,
} from '../src/lean-runner.js';

describe('detectLeanBinary defensive branches', () => {
  it('returns null for a non-existent binary', () => {
    const result = detectLeanBinary('/nonexistent/lean-binary-xyz');
    expect(result).toBeNull();
  });

  it('returns null for a binary that is not Lean (uses "echo")', () => {
    // echo exists but does not print "Lean (version" — should return null.
    const result = detectLeanBinary('/bin/echo');
    expect(result).toBeNull();
  });
});

describe('detectLeanBinaryAsync defensive branches', () => {
  it('returns null for a non-existent binary async', async () => {
    const result = await detectLeanBinaryAsync('/nonexistent/lean-binary-xyz');
    expect(result).toBeNull();
  });

  it('returns null for a binary that is not Lean async', async () => {
    const result = await detectLeanBinaryAsync('/bin/echo');
    expect(result).toBeNull();
  });
});

describe('classifyFailure defensive branches', () => {
  it('classifies string code in overflow set as overflow', () => {
    const result = classifyFailure({ code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' } as never);
    expect(result.overflowed).toBe(true);
    expect(result.timedOut).toBe(false);
  });

  it('classifies ETIMEDOUT code as timeout', () => {
    const result = classifyFailure({ code: 'ETIMEDOUT' } as never);
    expect(result.timedOut).toBe(true);
    expect(result.overflowed).toBe(false);
  });

  it('classifies SIGTERM signal as timeout', () => {
    const result = classifyFailure({ signal: 'SIGTERM' } as never);
    expect(result.timedOut).toBe(true);
    expect(result.overflowed).toBe(false);
  });

  it('classifies unknown error as neither timeout nor overflow', () => {
    const result = classifyFailure({ code: 42 } as never);
    expect(result.timedOut).toBe(false);
    expect(result.overflowed).toBe(false);
  });

  it('classifies empty error object as neither', () => {
    const result = classifyFailure({} as never);
    expect(result.timedOut).toBe(false);
    expect(result.overflowed).toBe(false);
  });
});
