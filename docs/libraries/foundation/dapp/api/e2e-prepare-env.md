---
title: "@kiwa-lab/dapp e2e-prepare-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>e2e-prepare-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>killAnvilFromPidFile</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L157) <code v-pre>packages/dapp/src/e2e-prepare-env.ts</code>

Kill anvil whose pid was recorded by previous prepare-env run. Used by `tests/global-teardown.ts` (and idempotently by prepare-env itself before respawn).

```ts
export declare function killAnvilFromPidFile(pidFilePath: string): void;
```

#### <code v-pre>runE2EPrepareEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L79) <code v-pre>packages/dapp/src/e2e-prepare-env.ts</code>

Prepare anvil + contracts + .env.local before Next.js build. Designed to be invoked from `playwright.config.ts` webServer.command as `tsx tests/prepare-env.ts && pnpm build && pnpm start`. After deploy finishes the anvil child is detached so the prepare-env Node process can exit (event loop empty), letting `pnpm build` start next.

```ts
export declare function runE2EPrepareEnv(opts: PrepareEnvOptions): Promise<void>;
```

#### <code v-pre>writePidEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L165) <code v-pre>packages/dapp/src/e2e-prepare-env.ts</code>

```ts
export declare function writePidEntry(pidFilePath: string, entry: PidEntry): void;
```

### 型

#### <code v-pre>PidEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L65) <code v-pre>packages/dapp/src/e2e-prepare-env.ts</code>

```ts
export interface PidEntry {
    pid: number;
    port?: number;
    startedAt?: string;
    command?: string;
}
```

#### <code v-pre>PrepareEnvDeployContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L38) <code v-pre>packages/dapp/src/e2e-prepare-env.ts</code>

```ts
export interface PrepareEnvDeployContext {
    account: PrivateKeyAccount;
    wallet: PrepareEnvWalletClient;
    publicClient: PrepareEnvPublicClient;
    chain: Chain;
    port: number;
    exampleRoot: string;
}
```

#### <code v-pre>PrepareEnvDeployFn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L47) <code v-pre>packages/dapp/src/e2e-prepare-env.ts</code>

```ts
export type PrepareEnvDeployFn = (ctx: PrepareEnvDeployContext) => Promise<Record<string, string>>;
```

#### <code v-pre>PrepareEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L51) <code v-pre>packages/dapp/src/e2e-prepare-env.ts</code>

```ts
export interface PrepareEnvOptions {
    exampleRoot: string;
    port?: number;
    chainId?: number;
    privateKey?: Hex;
    /** path to write `.env.local`, relative to exampleRoot (default: '.env.local') */
    envLocalPath?: string;
    /** path to .next directory to clean before build, relative to exampleRoot (default: '.next') */
    nextCacheDir?: string;
    /** path to store anvil pid, relative to exampleRoot (default: '.context/anvil.pid') */
    pidFilePath?: string;
    deploy: PrepareEnvDeployFn;
}
```

#### <code v-pre>PrepareEnvPublicClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L36) <code v-pre>packages/dapp/src/e2e-prepare-env.ts</code>

```ts
export type PrepareEnvPublicClient = PublicClient<HttpTransport, Chain>;
```

#### <code v-pre>PrepareEnvWalletClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L35) <code v-pre>packages/dapp/src/e2e-prepare-env.ts</code>

```ts
export type PrepareEnvWalletClient = WalletClient<HttpTransport, Chain, PrivateKeyAccount>;
```
