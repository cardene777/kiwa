---
title: "@kiwa-lab/security-devsecops adapters-real-driver の API 契約"
---

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>adapters-real-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>assertRealDriverAvailable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L40) <code v-pre>packages/security-devsecops/src/adapters/real-driver.ts</code>

```ts
export declare function assertRealDriverAvailable(spec: CliDriverSpec, env: RealDriverEnv | null): void;
```

#### <code v-pre>readRealDriverEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L22) <code v-pre>packages/security-devsecops/src/adapters/real-driver.ts</code>

```ts
export declare function readRealDriverEnv(env?: NodeJS.ProcessEnv): RealDriverEnv | null;
```

### 型

#### <code v-pre>CliDriverSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L34) <code v-pre>packages/security-devsecops/src/adapters/real-driver.ts</code>

```ts
export interface CliDriverSpec {
    cliName: string;
    urlEnvKey: keyof RealDriverEnv;
    requiredEnvValue: string | undefined;
}
```

#### <code v-pre>RealDriverEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L12) <code v-pre>packages/security-devsecops/src/adapters/real-driver.ts</code>

Real driver 共通 helper — 実 CLI 呼出を child_process 経由で隠蔽する契約。 v0.2 では adapter interface を confirm し、 実 CLI 呼出は env-gate + spawnCliDriver に集約する。 env 未設定 or CLI 不在時は explicit throw、 test 側は mock adapter を使う (default 経路)。 production 経路。 `KIWA_SECURITY_MODE=real` + 各 CLI URL env が全部揃った時のみ 実 CLI 呼出、 それ以外は throw。 mock adapter は env に関係なく常時動作。

```ts
export interface RealDriverEnv {
    mode: 'real';
    semgrepUrl?: string;
    trivyUrl?: string;
    gitleaksUrl?: string;
    tfsecUrl?: string;
    zapUrl?: string;
    grypeUrl?: string;
}
```
