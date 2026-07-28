---
title: "@kiwa-lab/component storybook の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/component</code> <code v-pre>storybook</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createStoryRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L75) <code v-pre>packages/component/src/storybook.ts</code>

Registry を新規作成する。 内部は `Map&lt;storyId, StoryEntry&gt;`、 story id は `title--storyName` (Storybook 8 の SB URL param 互換 lowercase / kebab-case)。

```ts
export declare function createStoryRegistry(): StoryRegistry;
```

### 型

#### <code v-pre>StoryMeta</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L39) <code v-pre>packages/component/src/storybook.ts</code>

Storybook 8 の CSF3 と互換な最小 mock。 real Storybook (SB8) は Meta + StoryObj 単位で `.stories.tsx` を書き、 storybook が collect して registry を作る。 mock はその registry 相当を in-memory Map で表現する。 使い方 ... ```ts const registry = createStoryRegistry(); registry.register({ title: 'Button', render: (args) =&gt; createNode('button', { text: args.label }), stories: { Primary: { args: { label: 'Click me' } }, Disabled: { args: { label: 'nope', disabled: true } }, }, }); const canvas = await registry.mount('Button', 'Primary'); await registry.play('Button', 'Primary', canvas); ``` SB8 の実 API 互換で意識するのは (1) StoryObj.args の merge (2) play の step wrapper (3) parameters.chromatic / parameters.a11y の透過保持 の 3 点。 実 SB8 の docs mode / decorators / loaders / addons は mock 対象外 (テストが吸収する semantic は絞る)。

```ts
export interface StoryMeta<TArgs = Record<string, unknown>> {
    /** Storybook の title (e.g. 'Components/Button')。 */
    title: string;
    /** args → MockNode の render 関数、 framework agnostic。 */
    render: ComponentRender<TArgs>;
    /** meta 単位の default args (story 単位で override 可)。 */
    args?: Partial<TArgs>;
    /** meta 単位の default parameters (story 単位で shallow merge)。 */
    parameters?: StoryParameters;
    /** 登録する story 群、 key が story 名になる。 */
    stories: Record<string, StoryObj<TArgs>>;
}
```

#### <code v-pre>StoryMountResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L52) <code v-pre>packages/component/src/storybook.ts</code>

```ts
export interface StoryMountResult {
    canvas: CanvasElement;
    entry: StoryEntry<Record<string, unknown>>;
}
```

#### <code v-pre>StoryPlayResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L57) <code v-pre>packages/component/src/storybook.ts</code>

```ts
export interface StoryPlayResult {
    steps: Array<{
        label: string;
        ok: boolean;
        error?: string;
    }>;
    ok: boolean;
}
```

#### <code v-pre>StoryRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L62) <code v-pre>packages/component/src/storybook.ts</code>

```ts
export interface StoryRegistry {
    register<TArgs>(meta: StoryMeta<TArgs>): void;
    list(): StoryEntry[];
    get(title: string, storyName: string): StoryEntry;
    mount(title: string, storyName: string, overrideArgs?: Record<string, unknown>): StoryMountResult;
    play(title: string, storyName: string, canvas: CanvasElement, args?: Record<string, unknown>): Promise<StoryPlayResult>;
    runA11y(title: string, storyName: string, canvas: CanvasElement): {
        violations: A11yViolation[];
    };
}
```
