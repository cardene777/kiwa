---
title: "@kiwa-lab/ui angular の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ui</code> <code v-pre>angular</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setupAngularComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L62) <code v-pre>packages/ui/src/angular.ts</code>

```ts
export declare function setupAngularComponentEnv(opts: SetupAngularComponentEnvOptions): Promise<AngularTestEnvUi>;
```

### 型

#### <code v-pre>AngularContainerLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L27) <code v-pre>packages/ui/src/angular.ts</code>

```ts
export interface AngularContainerLike {
    container: HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    getByText: (text: string | RegExp) => HTMLElement;
}
```

#### <code v-pre>AngularTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L33) <code v-pre>packages/ui/src/angular.ts</code>

```ts
export interface AngularTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'angular';
    result: AngularContainerLike;
    markup: string;
}
```

#### <code v-pre>SetupAngularComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L21) <code v-pre>packages/ui/src/angular.ts</code>

```ts
export interface SetupAngularComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    component: AngularComponentLike;
    inputs?: Record<string, unknown>;
}
```
