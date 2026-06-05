import { expect } from '@playwright/test';

interface WalkableError {
  walk?: (predicate: (cause: unknown) => boolean) => unknown;
}

interface RevertedLike {
  data?: {
    errorName?: unknown;
    args?: unknown;
  };
  cause?: unknown;
}

function isWalkableError(error: unknown): error is WalkableError {
  return !!error && typeof error === 'object' && typeof (error as WalkableError).walk === 'function';
}

function isContractFunctionRevertedLike(error: unknown): error is RevertedLike {
  return (
    !!error &&
    typeof error === 'object' &&
    typeof (error as RevertedLike).data === 'object' &&
    (error as RevertedLike).data !== null &&
    ('errorName' in ((error as RevertedLike).data ?? {}) ||
      'args' in ((error as RevertedLike).data ?? {}))
  );
}

function findCustomError(error: unknown): RevertedLike | null {
  if (isWalkableError(error)) {
    const walk = error.walk as (predicate: (cause: unknown) => boolean) => unknown;
    const walked = walk((cause) => isContractFunctionRevertedLike(cause));
    if (isContractFunctionRevertedLike(walked)) {
      return walked;
    }
  }

  const seen = new Set<object>();
  let current = error;
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    if (isContractFunctionRevertedLike(current)) {
      return current;
    }
    current = (current as RevertedLike).cause;
  }

  return null;
}

export function expectCustomError(
  error: unknown,
  errorName: string,
  expectedArgs?: readonly unknown[],
): void {
  const reverted = findCustomError(error);
  if (!isContractFunctionRevertedLike(reverted)) throw error;
  expect(reverted.data?.errorName).toBe(errorName);
  if (expectedArgs) {
    expect(reverted.data?.args).toEqual(expectedArgs);
  }
}
