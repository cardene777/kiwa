import { describe, expect, it } from 'vitest';
import { expectCustomError } from '../src/expect-custom-error.js';

describe('expectCustomError', () => {
  it('T-ECE-001 matches plain reverted-like error with errorName', () => {
    const err = { data: { errorName: 'MyError', args: [] } };
    expect(() => expectCustomError(err, 'MyError')).not.toThrow();
  });

  it('T-ECE-002 throws when errorName mismatches', () => {
    const err = { data: { errorName: 'Other', args: [] } };
    expect(() => expectCustomError(err, 'MyError')).toThrow();
  });

  it('T-ECE-003 matches args when expectedArgs is provided', () => {
    const err = { data: { errorName: 'E', args: [1, 'a'] } };
    expect(() => expectCustomError(err, 'E', [1, 'a'])).not.toThrow();
  });

  it('T-ECE-004 throws on args mismatch', () => {
    const err = { data: { errorName: 'E', args: [1] } };
    expect(() => expectCustomError(err, 'E', [2])).toThrow();
  });

  it('T-ECE-005 walks cause chain to find reverted-like error', () => {
    const inner = { data: { errorName: 'Nested', args: [] } };
    const outer = { cause: inner };
    expect(() => expectCustomError(outer, 'Nested')).not.toThrow();
  });

  it('T-ECE-006 throws original error when no reverted-like in chain', () => {
    const err = new Error('plain');
    expect(() => expectCustomError(err, 'X')).toThrow('plain');
  });

  it('T-ECE-007 uses walk method when available', () => {
    const target = { data: { errorName: 'Walked', args: [] } };
    const err = {
      walk: (predicate: (cause: unknown) => boolean) => (predicate(target) ? target : null),
    };
    expect(() => expectCustomError(err, 'Walked')).not.toThrow();
  });

  it('T-ECE-008 args undefined skips args check', () => {
    const err = { data: { errorName: 'OnlyName' } };
    expect(() => expectCustomError(err, 'OnlyName')).not.toThrow();
  });

  it('T-ECE-009 detects args-only data (no errorName field)', () => {
    const err = { data: { args: [42] } };
    expect(() => expectCustomError(err, 'X', [42])).toThrow();
  });

  it('T-ECE-010 handles cycle in cause chain without infinite loop', () => {
    const a: { cause?: unknown } = {};
    const b: { cause?: unknown } = { cause: a };
    a.cause = b;
    expect(() => expectCustomError(a, 'Anything')).toThrow();
  });
});
