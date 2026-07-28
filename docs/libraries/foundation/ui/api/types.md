---
title: "@kiwa-lab/ui types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ui</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>InteractionTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L25) <code v-pre>packages/ui/src/types.ts</code>

```ts
export interface InteractionTestEnvUi extends TestEnvBase<'live'> {
    kind: 'interaction';
    result: RenderResult;
    screen: typeof ScreenApi;
    user: UserEvent;
}
```

#### <code v-pre>RenderTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L19) <code v-pre>packages/ui/src/types.ts</code>

```ts
export interface RenderTestEnvUi extends TestEnvBase<'mock'> {
    kind: 'render';
    result: RenderResult;
    screen: typeof ScreenApi;
}
```

#### <code v-pre>SetupComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L8) <code v-pre>packages/ui/src/types.ts</code>

```ts
export interface SetupComponentEnvOptions<TMode extends UiTestMode = UiTestMode> {
    mode: TMode;
    ui: ReactElement;
    /** Options forwarded to @testing-library/react render() */
    renderOptions?: RenderOptions;
    /** Initial userEvent setup (interaction mode only) */
    userEventOptions?: Parameters<UserEvent['setup']> extends [infer Opts] ? Opts : Record<string, unknown>;
}
```

#### <code v-pre>SnapshotTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L32) <code v-pre>packages/ui/src/types.ts</code>

```ts
export interface SnapshotTestEnvUi extends TestEnvBase<'mock'> {
    kind: 'snapshot';
    result: RenderResult;
    /** Serialized DOM markup of the rendered tree, ready for inline / file snapshot */
    markup: string;
}
```

#### <code v-pre>UiTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L39) <code v-pre>packages/ui/src/types.ts</code>

```ts
export type UiTestEnv = RenderTestEnvUi | InteractionTestEnvUi | SnapshotTestEnvUi;
```

#### <code v-pre>UiTestMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L6) <code v-pre>packages/ui/src/types.ts</code>

```ts
export type UiTestMode = 'render' | 'interaction' | 'snapshot' | 'browser';
```
