---
title: "@kiwa-lab/realtime real-driver の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>real-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>REAL&#95;DRIVER&#95;REQUIRED&#95;KEYS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L54) <code v-pre>packages/realtime/src/real-driver.ts</code>

provider 別 default 必須 env key (SSOT)。

```ts
export declare const REAL_DRIVER_REQUIRED_KEYS: Record<RealtimeProviderName, string[]>;
```

#### <code v-pre>resolveRealtimeDriver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L61) <code v-pre>packages/realtime/src/real-driver.ts</code>

```ts
export declare function resolveRealtimeDriver<TDriver>(input: RealDriverGateInput<TDriver>): RealDriverGateResult<TDriver>;
```

#### <code v-pre>resolveRealtimeDriverByProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L105) <code v-pre>packages/realtime/src/real-driver.ts</code>

shorthand — provider 名から必須 key を lookup して gate 判定する。 使い分けは自由だが、 4 provider の default key set (SSOT `REAL_DRIVER_REQUIRED_KEYS`) を尊重する場合はこちらを使う。

```ts
export declare function resolveRealtimeDriverByProvider<TDriver>(provider: RealtimeProviderName, createReal: (env: Record<string, string>) => TDriver, createMock: () => TDriver, envSource?: Record<string, string | undefined>): RealDriverGateResult<TDriver>;
```

### 型

#### <code v-pre>RealDriverGateInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L31) <code v-pre>packages/realtime/src/real-driver.ts</code>

```ts
export interface RealDriverGateInput<TDriver> {
    provider: RealtimeProviderName;
    /** real driver に必要な env variable key 一覧 (全 set で real 起動)。 */
    requiredKeys: string[];
    /** real driver factory — 全 env が揃った時のみ呼ばれる。 */
    createReal: (env: Record<string, string>) => TDriver;
    /** mock driver factory — env 不揃い時の fallback。 */
    createMock: () => TDriver;
    /** env source (default `process.env`)。 test で override 可能。 */
    envSource?: Record<string, string | undefined>;
}
```

#### <code v-pre>RealDriverGateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L43) <code v-pre>packages/realtime/src/real-driver.ts</code>

```ts
export interface RealDriverGateResult<TDriver> {
    driver: TDriver;
    /** 実際に real 経路を選んだか。 mock fallback 時 false。 */
    isReal: boolean;
    /** real 選択の判定理由 — log 出力 / provenance に使う。 */
    reason: string;
    /** 不足した env key (isReal=false の時のみ non-empty)。 */
    missingKeys: string[];
}
```

#### <code v-pre>RealtimeProviderName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L29) <code v-pre>packages/realtime/src/real-driver.ts</code>

Real driver env-gate — v0.2 (GH #971) で追加。 v1.13 の 4 provider (Supabase / Ably / Pusher / Socket.io) mock は default で完全に mock 化されており、 test 実行時に外部 network を叩かない。 一方、 dogfood app や real-vs-mock fidelity 計測では、 real provider に対して同じ scenario を回して差分を取りたい局面がある。 本 helper は「real driver を返すべきか」 を env variable で決定する gate。 `KIWA_MODE=real` かつ provider 別の必須 key set (env variable) が全て 揃った時にのみ real driver を作成する。 それ以外の場合は mock driver を 返す (fallback、 常に安全)。 呼出例 (real Supabase client を得たい場合) ... ```ts const driver = resolveRealtimeDriver({ provider: 'supabase', requiredKeys: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'], createReal: (env) =&gt; createRealSupabaseDriver(env), createMock: () =&gt; createMockSupabaseDriver(), }); ``` real driver 実装は kiwa の SSOT には含まれない (外部 SDK 依存を避けるため)、 user (dogfood app 側) が real driver factory を渡す責務を持つ。

```ts
export type RealtimeProviderName = 'supabase' | 'ably' | 'pusher' | 'socketio';
```
