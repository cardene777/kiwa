---
title: "@kiwa-lab/quality-metrics real-fidelity-gate の API 契約"
---

# <code v-pre>@kiwa-lab/quality-metrics</code> <code v-pre>real-fidelity-gate</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/real-fidelity-gate.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>resolveRealFidelityMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/real-fidelity-gate.ts#L64) <code v-pre>packages/quality-metrics/src/real-fidelity-gate.ts</code>

KIWA_MODE=real env + 必須 env keys 存在の 2 条件を確認、 real driver 経路の 有効化判定を返す。 test file 冒頭で `resolveRealFidelityMode(...).enabled` を `describe.skipIf` / `it.skipIf` に渡して条件付き skip する用途。 default (KIWA_MODE 未設定 or "mock") = disabled + skipReason='kiwa-mode-not-real:mock'。 KIWA_MODE=real + 必須 env 全 set = enabled=true。 KIWA_MODE=real + 必須 env 1 件以上 missing = disabled + skipReason='env-missing:...'。

```ts
export declare function resolveRealFidelityMode(input: RealFidelityGateInput): RealFidelityGateResult;
```

### 型

#### <code v-pre>EnvSource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/real-fidelity-gate.ts#L19) <code v-pre>packages/quality-metrics/src/real-fidelity-gate.ts</code>

env 参照 source (test 経路で override 可能)。 default = process.env。

```ts
export interface EnvSource {
    [key: string]: string | undefined;
}
```

#### <code v-pre>RealFidelityGateInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/real-fidelity-gate.ts#L24) <code v-pre>packages/quality-metrics/src/real-fidelity-gate.ts</code>

1 real fidelity gate 判定 input。

```ts
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
```

#### <code v-pre>RealFidelityGateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/real-fidelity-gate.ts#L42) <code v-pre>packages/quality-metrics/src/real-fidelity-gate.ts</code>

gate 判定結果。

```ts
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
```
