/**
 * Fidelity 実行 assertion primitive。
 *
 * 各 lib の `tests/fidelity/*.fidelity.test.ts` で使う経路。 mock adapter と real adapter に
 * 同じ引数で同じ操作を実行し、 返り値の一致 (structural equality) を検証する。 divergence が
 * 検出された case を列挙して返すので、 caller は vitest から `expect(result.divergences).toEqual([])`
 * 等の assertion を書く。
 *
 * 既存 `fidelityFromMethodCounts` は「mock がカバーしている method の割合」 の静的指標。
 * 本 API は「実際に呼んで結果が real と一致するか」 の動的指標で、 相補関係にある。
 * mock 側 API が真に real 挙動を再現しているかを test で担保するのが本 primitive の目的。
 */
import { deepStrictEqual } from 'node:assert/strict';

/** 1 fidelity case = 1 引数 tuple + 期待される mock ↔ real 一致挙動。 */
export interface FidelityCase<Args extends unknown[] = unknown[], Result = unknown> {
  name: string;
  args: Args;
  /**
   * 独自比較関数。 default = deepStrictEqual。 order-insensitive な set 比較や、
   * 特定 field を無視したい (例 timestamp / uuid) 場合は本 field で override する。
   */
  compare?: (mock: Result, real: Result) => boolean;
}

export interface FidelityDivergence {
  case: string;
  mock: unknown;
  real: unknown;
  reason: string;
}

export interface FidelityAssertResult {
  passed: number;
  failed: number;
  /** passed / (passed + failed) * 100。 0-case でも NaN 回避で 100 を返す。 */
  ratio: number;
  divergences: FidelityDivergence[];
}

export interface FidelityAssertInput<Args extends unknown[] = unknown[], Result = unknown> {
  mockFn: (...args: Args) => Promise<Result> | Result;
  realFn: (...args: Args) => Promise<Result> | Result;
  cases: FidelityCase<Args, Result>[];
}

/**
 * mock と real を全 case で並走させて結果一致を検証する。 caller は vitest の assertion で
 * `expect(result.divergences).toEqual([])` / `expect(result.ratio).toBe(100)` を書く。
 *
 * mock or real が throw した case は failed 扱いにする (両方 throw で「両方 fail」 は
 * fidelity 一致とみなさない、 例外の shape が違う可能性があるため)。
 */
export async function assertFidelity<Args extends unknown[], Result>(
  input: FidelityAssertInput<Args, Result>,
): Promise<FidelityAssertResult> {
  const divergences: FidelityDivergence[] = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of input.cases) {
    const mockOutcome = await captureOutcome(() => input.mockFn(...testCase.args));
    const realOutcome = await captureOutcome(() => input.realFn(...testCase.args));

    const divergence = detectDivergence(testCase, mockOutcome, realOutcome);
    if (divergence === null) {
      passed += 1;
    } else {
      failed += 1;
      divergences.push(divergence);
    }
  }

  const total = passed + failed;
  const ratio = total === 0 ? 100 : (passed / total) * 100;
  return { passed, failed, ratio, divergences };
}

type Outcome<Result> =
  | { kind: 'ok'; value: Result }
  | { kind: 'throw'; error: unknown };

async function captureOutcome<Result>(fn: () => Promise<Result> | Result): Promise<Outcome<Result>> {
  try {
    const value = await fn();
    return { kind: 'ok', value };
  } catch (error) {
    return { kind: 'throw', error };
  }
}

function detectDivergence<Args extends unknown[], Result>(
  testCase: FidelityCase<Args, Result>,
  mockOutcome: Outcome<Result>,
  realOutcome: Outcome<Result>,
): FidelityDivergence | null {
  // 片方だけ throw = divergence 確定 (mock は真の挙動を再現できていない)。
  if (mockOutcome.kind !== realOutcome.kind) {
    return {
      case: testCase.name,
      mock: mockOutcome.kind === 'ok' ? mockOutcome.value : `[threw] ${errorMessage(mockOutcome.error)}`,
      real: realOutcome.kind === 'ok' ? realOutcome.value : `[threw] ${errorMessage(realOutcome.error)}`,
      reason: 'mock and real disagree on throw',
    };
  }

  // 両方 throw の場合、 error message の一致まで見ないと fidelity が緩くなる。 現状は
  // error message 完全一致を要求する保守経路。 将来 error class shape 比較に緩めるかは open。
  if (mockOutcome.kind === 'throw' && realOutcome.kind === 'throw') {
    const mockMsg = errorMessage(mockOutcome.error);
    const realMsg = errorMessage(realOutcome.error);
    if (mockMsg !== realMsg) {
      return {
        case: testCase.name,
        mock: `[threw] ${mockMsg}`,
        real: `[threw] ${realMsg}`,
        reason: 'both threw but with divergent messages',
      };
    }
    return null;
  }

  // 両方 ok = 値比較。
  if (mockOutcome.kind === 'ok' && realOutcome.kind === 'ok') {
    if (testCase.compare) {
      return testCase.compare(mockOutcome.value, realOutcome.value)
        ? null
        : {
            case: testCase.name,
            mock: mockOutcome.value,
            real: realOutcome.value,
            reason: 'custom compare returned false',
          };
    }
    try {
      deepStrictEqual(mockOutcome.value, realOutcome.value);
      return null;
    } catch {
      return {
        case: testCase.name,
        mock: mockOutcome.value,
        real: realOutcome.value,
        reason: 'deepStrictEqual mismatch',
      };
    }
  }

  return null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
