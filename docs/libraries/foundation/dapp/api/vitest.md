---
title: "@kiwa-lab/dapp vitest の API 契約"
---

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>vitest</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L51) <code v-pre>packages/dapp/src/vitest.ts</code>

```ts
export declare function setupTestEnv(opts?: SetupTestEnvOptions): Promise<TestEnv>;
```

#### <code v-pre>withAnvil</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L94) <code v-pre>packages/dapp/src/vitest.ts</code>

```ts
export declare function withAnvil(opts?: SetupTestEnvOptions): WithAnvilLifecycle;
```

### 型

#### <code v-pre>AnvilModeOption</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L5) <code v-pre>packages/dapp/src/vitest.ts</code>

```ts
export type AnvilModeOption = boolean | (StartAnvilOptions & {
    enabled?: boolean;
});
```

#### <code v-pre>AnvilTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L32) <code v-pre>packages/dapp/src/vitest.ts</code>

```ts
export interface AnvilTestEnv {
    mode: 'anvil';
    rpcUrl: string;
    port: number;
    anvil: AnvilHandle;
    privateKeys: readonly string[];
    stop: () => Promise<void>;
}
```

#### <code v-pre>MockTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L23) <code v-pre>packages/dapp/src/vitest.ts</code>

```ts
export interface MockTestEnv {
    mode: 'mock';
    rpcUrl: null;
    port: null;
    anvil: null;
    privateKeys: readonly string[];
    stop: () => Promise<void>;
}
```

#### <code v-pre>SetupTestEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L7) <code v-pre>packages/dapp/src/vitest.ts</code>

```ts
export interface SetupTestEnvOptions {
    /**
     * anvil 起動方針。
     * - 未指定 / false ... anvil を起動しない (mock 経路)
     * - true ... clean chain で anvil を起動
     * - object ... StartAnvilOptions を全て透過 (loadState / dumpState / chainId / port 等)
     */
    anvil?: AnvilModeOption;
    /**
     * Anvil pool を指定すると spawn ではなく pool.borrow() で取得し、
     * stop() で pool.release() (anvil_reset) を呼んで再利用する。
     * anvil option と排他、 pool 指定時は pool が anvil 起動を担う。
     */
    pool?: AnvilPool;
}
```

#### <code v-pre>TestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L41) <code v-pre>packages/dapp/src/vitest.ts</code>

```ts
export type TestEnv = MockTestEnv | AnvilTestEnv;
```

#### <code v-pre>WithAnvilLifecycle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L90) <code v-pre>packages/dapp/src/vitest.ts</code>

```ts
export interface WithAnvilLifecycle {
    env: () => TestEnv;
}
```
