import type { CliRunResult } from './types.js';

export function expectExitCode(
  result: CliRunResult,
  expected: number,
  expect: { (actual: unknown): { toBe: (expected: unknown) => void } },
): void {
  expect(result.exitCode).toBe(expected);
}

export function expectStdoutContains(
  result: CliRunResult,
  needle: string,
  expect: { (actual: unknown): { toContain: (expected: string) => void } },
): void {
  expect(result.stdout).toContain(needle);
}

export function expectStderrContains(
  result: CliRunResult,
  needle: string,
  expect: { (actual: unknown): { toContain: (expected: string) => void } },
): void {
  expect(result.stderr).toContain(needle);
}
