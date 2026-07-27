# Component の導入

Story registry にコンポーネントを登録し、テスト用 canvas を作成します。ここで扱うのは Storybook や browser を起動しない in-memory canvas です。実 browser の layout、CSS、screen reader の確認は component test または e2e test で別に行います。

## インストール

```bash
pnpm add -D @kiwa-lab/component vitest
```

## 実行

```ts
import { expect, it } from 'vitest';
import { createNode, createStoryRegistry } from '@kiwa-lab/component';

it('story の args から button を描画する', () => {
  const registry = createStoryRegistry();
  registry.register({
    title: 'Button',
    render: (args) => createNode('button', { text: String(args.label) }),
    stories: { Primary: { args: { label: 'Save' } } },
  });

  const { canvas } = registry.mount('Button', 'Primary');
  expect(canvas.getByRole('button').text).toBe('Save');
});
```

`mount` は meta の `args` と story の `args` を merge し、story 側を優先します。登録されていない title または story 名を渡すと throw するため、`registry.list()` を前提確認に使えます。

mount 時の override args は解決済み story args をさらに上書きします。parameters は meta と story を shallow merge し、`chromatic` と `a11y` の設定だけは一段深く merge されます。

この example を `tests/button.story.test.ts` に保存して、次を実行します。

```bash
pnpm exec vitest run tests/button.story.test.ts
```

成功すれば in-memory canvas が story の args を反映して button を返します。title または story 名を間違えると `StoryRegistry — no entry for ...` が throw されます。その場合は `registry.list()` で登録済みの title と story 名を確認してください。これは browser の layout や CSS を確認する command ではありません。

## 次に読む

[使い方](./how-to) と [リファレンス](./reference) で play function と視覚差分を確認します。
<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、入力から結果までの境界を直接確認してください。仕様から component test を組み立てる場合は、[kiwa の skill を使う](../../../guides/skills) の手順で plugin を導入してから、UI layer の skill を使います。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-design --layer ui --module button
/kiwa:kiwa-ui --module button
```

生成物では in-memory canvas の期待結果を確認し、実 browser の描画や provider 固有の挙動は別の component test または e2e test に残します。

出力先を変更していなければ、生成された test file だけを実行します。

```bash
pnpm exec vitest run tests/spec/ui/button.test.ts
```
