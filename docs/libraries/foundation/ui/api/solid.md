---
title: "@kiwa-lab/ui solid の API 契約"
---

# <code v-pre>@kiwa-lab/ui</code> <code v-pre>solid</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupSolidComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L45) <code v-pre>packages/ui/src/solid.ts</code>

```ts
export declare function setupSolidComponentEnv(opts: SetupSolidComponentEnvOptions): Promise<SolidTestEnvUi>;
```

### 型

#### <code v-pre>SetupSolidComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L9) <code v-pre>packages/ui/src/solid.ts</code>

```ts
export interface SetupSolidComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    component: () => unknown;
    props?: Record<string, unknown>;
}
```

#### <code v-pre>SolidContainerLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L15) <code v-pre>packages/ui/src/solid.ts</code>

```ts
export interface SolidContainerLike {
    container: HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    getByText: (text: string | RegExp) => HTMLElement;
}
```

#### <code v-pre>SolidTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L21) <code v-pre>packages/ui/src/solid.ts</code>

```ts
export interface SolidTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'solid';
    result: SolidContainerLike;
    markup: string;
}
```
