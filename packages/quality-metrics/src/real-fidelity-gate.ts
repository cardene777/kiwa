/**
 * Real fidelity env-gate primitive。
 *
 * 各 lib の `tests/fidelity/*.real.fidelity.test.ts` で使う経路。 KIWA_MODE=real
 * env + 必須 env keys の存在を確認し、 real driver 経路を有効化するか mock fallback
 * するかを判定する。 既存 `assertFidelity` (mock ↔ Map reference の static 比較) と
 * 補完関係にあり、 本 gate 経路で「real backend (testcontainers Redis / real Stripe
 * API / real Auth0 tenant 等) ↔ mock adapter の動的 fidelity 検証」 を実現する。
 *
 * 前提思想 = mock adapter が real 挙動を再現しているかは、 static 比較のみでは保証
 * 不十分、 real driver 相手の動的比較で初めて 「release して user に使ってもらえる
 * レベル」 の fidelity 保証が成立する (docs/concepts/test-taxonomy.md § fidelity)。
 *
 * env-gate 経路は既存 realtime lib の `resolveRealtimeDriver` pattern を汎用化し、
 * 全 lib で共通利用可能な shape に一般化した。
 */

/** env 参照 source (test 経路で override 可能)。 default = process.env。 */
export interface EnvSource {
  [key: string]: string | undefined;
}

/** 1 real fidelity gate 判定 input。 */
export interface RealFidelityGateInput {
  /**
   * lib 名 (エラー message / log 用の識別子)。 例 = 'cache' / 'auth' / 'payment'。
   */
  readonly lib: string;
  /**
   * real driver 経路が要求する env keys (SSOT)。 例 = ['REDIS_URL'] / ['STRIPE_SECRET_KEY']。
   * 全 key が set されている時のみ enabled。 1 件でも missing なら mock fallback。
   */
  readonly requiredEnvKeys: readonly string[];
  /**
   * env 参照 source override。 test 経路で `envSource: { KIWA_MODE: 'real', ... }` を
   * 明示注入する用途。 default = process.env。
   */
  readonly envSource?: EnvSource;
}

/** gate 判定結果。 */
export interface RealFidelityGateResult {
  /** true = real driver 有効、 false = mock fallback。 */
  readonly enabled: boolean;
  /**
   * skip 理由 (enabled=false 時のみ)。 pattern。
   *   - `kiwa-mode-not-real:<mode>` = KIWA_MODE が "real" 以外
   *   - `env-missing:<key1>,<key2>` = 必須 env keys 不足
   */
  readonly skipReason?: string;
  /** enabled=false 時、 何の key が missing か (debug 用)。 */
  readonly missingKeys: readonly string[];
}

/**
 * KIWA_MODE=real env + 必須 env keys 存在の 2 条件を確認、 real driver 経路の
 * 有効化判定を返す。 test file 冒頭で `resolveRealFidelityMode(...).enabled` を
 * `describe.skipIf` / `it.skipIf` に渡して条件付き skip する用途。
 *
 * default (KIWA_MODE 未設定 or "mock") = disabled + skipReason='kiwa-mode-not-real:mock'。
 * KIWA_MODE=real + 必須 env 全 set = enabled=true。
 * KIWA_MODE=real + 必須 env 1 件以上 missing = disabled + skipReason='env-missing:...'。
 */
export function resolveRealFidelityMode(
  input: RealFidelityGateInput,
): RealFidelityGateResult {
  const envSource = input.envSource ?? (globalThis as { process?: { env?: EnvSource } }).process?.env ?? {};
  const mode = envSource.KIWA_MODE ?? 'mock';
  if (mode !== 'real') {
    return {
      enabled: false,
      skipReason: `kiwa-mode-not-real:${mode}`,
      missingKeys: [],
    };
  }
  const missing: string[] = [];
  for (const key of input.requiredEnvKeys) {
    const value = envSource[key];
    if (value === undefined || value === '') {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    return {
      enabled: false,
      skipReason: `env-missing:${missing.join(',')}`,
      missingKeys: missing,
    };
  }
  return {
    enabled: true,
    missingKeys: [],
  };
}
