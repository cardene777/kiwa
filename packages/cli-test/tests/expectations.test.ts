import { describe, expect, it } from 'vitest';
import { expectExitCode, expectStdoutContains, expectStderrContains } from '../src/index.js';
import type { CliRunResult } from '../src/index.js';

function fakeResult(overrides: Partial<CliRunResult> = {}): CliRunResult {
  return {
    exitCode: 0,
    signal: null,
    stdout: 'hello stdout',
    stderr: 'hello stderr',
    durationMs: 1,
    ...overrides,
  };
}

describe('expectExitCode', () => {
  it('passes when the exit code matches', () => {
    expectExitCode(fakeResult({ exitCode: 0 }), 0, expect as unknown as Parameters<typeof expectExitCode>[2]);
  });

  it('throws when the exit code differs', () => {
    expect(() =>
      expectExitCode(fakeResult({ exitCode: 1 }), 0, expect as unknown as Parameters<typeof expectExitCode>[2]),
    ).toThrow();
  });
});

describe('expectStdoutContains', () => {
  it('passes when stdout includes the needle', () => {
    expectStdoutContains(
      fakeResult({ stdout: 'walk the dog' }),
      'dog',
      expect as unknown as Parameters<typeof expectStdoutContains>[2],
    );
  });

  it('throws when stdout omits the needle', () => {
    expect(() =>
      expectStdoutContains(
        fakeResult({ stdout: 'walk the dog' }),
        'cat',
        expect as unknown as Parameters<typeof expectStdoutContains>[2],
      ),
    ).toThrow();
  });
});

describe('expectStderrContains', () => {
  it('passes when stderr includes the needle', () => {
    expectStderrContains(
      fakeResult({ stderr: 'oops' }),
      'oops',
      expect as unknown as Parameters<typeof expectStderrContains>[2],
    );
  });

  it('throws when stderr omits the needle', () => {
    expect(() =>
      expectStderrContains(
        fakeResult({ stderr: 'fine' }),
        'oops',
        expect as unknown as Parameters<typeof expectStderrContains>[2],
      ),
    ).toThrow();
  });
});
