---
title: "@kiwa-lab/security-devsecops adapters__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>adapters&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>AdapterInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L21) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface AdapterInvocation {
    scanId: string;
    target: string;
    mode: AdapterMode;
    metadata?: Record<string, string | number | boolean>;
}
```

#### <code v-pre>AdapterMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L19) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export type AdapterMode = 'mock' | 'real';
```

#### <code v-pre>AdapterResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L28) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface AdapterResult<TState> {
    axis: DevSecOpsAxis;
    mode: AdapterMode;
    history: AxisStep<TState>[];
    completed: boolean;
    durationMs: number;
}
```

#### <code v-pre>AnyAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L66) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export type AnyAdapter = SastAdapter | ScaAdapter | SecretAdapter | IacAdapter | DastAdapter | ContainerAdapter;
```

#### <code v-pre>ContainerAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L61) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface ContainerAdapter {
    axis: 'container-security';
    scan(input: AdapterInvocation): Promise<AdapterResult<ContainerSecState>>;
}
```

#### <code v-pre>DastAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L56) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface DastAdapter {
    axis: 'dast';
    scan(input: AdapterInvocation): Promise<AdapterResult<DastState>>;
}
```

#### <code v-pre>IacAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L51) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface IacAdapter {
    axis: 'iac-scan';
    scan(input: AdapterInvocation): Promise<AdapterResult<IacScanState>>;
}
```

#### <code v-pre>SastAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L36) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface SastAdapter {
    axis: 'sast';
    scan(input: AdapterInvocation): Promise<AdapterResult<SastState>>;
}
```

#### <code v-pre>ScaAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L41) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface ScaAdapter {
    axis: 'sca';
    scan(input: AdapterInvocation): Promise<AdapterResult<ScaState>>;
}
```

#### <code v-pre>SecretAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L46) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface SecretAdapter {
    axis: 'secret-scan';
    scan(input: AdapterInvocation): Promise<AdapterResult<SecretScanState>>;
}
```
