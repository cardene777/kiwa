# Story の操作と変更を検証する

ここでは一つの story を登録し、play function、簡易 a11y 検査、visual baseline を同じ test file で確認します。canvas は in-memory の `MockNode` です。Storybook、Playwright Component Testing、Chromatic の process や cloud service は起動しないため、この example は story の contract を速く固定するために使います。

## 操作の成功を test する

次の内容を `tests/button.story.test.ts` に保存します。play function の `step` は例外を投げた場所で止まり、結果には失敗した label と error が残ります。button を click して実際に network request を送る、browser で focus を移動する、といった確認はこの canvas の責務ではありません。

```ts
import { expect, it } from "vitest";
import {
  createChromaticVisualMock,
  createNode,
  createStoryRegistry,
} from "@kiwa-lab/component";

function registerButtonStory() {
  const registry = createStoryRegistry();
  registry.register({
    title: "Button",
    render: args => createNode("button", { text: String(args.label) }),
    stories: {
      Primary: {
        args: { label: "Save" },
        play: async ({ canvasElement, step }) => {
          await step("save", () => {
            expect(canvasElement.getByRole("button").text).toBe("Save");
          });
        },
      },
    },
  });
  return registry;
}

it("story の操作、a11y、visual review を分けて確認する", async () => {
  const registry = registerButtonStory();
  const chromatic = createChromaticVisualMock();
  const { canvas, entry } = registry.mount("Button", "Primary");

  const play = await registry.play("Button", "Primary", canvas);
  expect(play).toEqual({ steps: [{ label: "save", ok: true }], ok: true });
  expect(registry.runA11y("Button", "Primary", canvas).violations).toEqual([]);

  expect(chromatic.captureAll({ entry, canvas }).map(item => item.status)).toEqual(["new"]);
  expect(chromatic.captureAll({ entry, canvas }).map(item => item.status)).toEqual(["passed"]);

  const changed = registry.mount("Button", "Primary", { label: "Store" });
  const diff = chromatic.capture({ entry: changed.entry, canvas: changed.canvas });
  expect(diff).toMatchObject({ changed: true, status: "failed" });

  chromatic.review({ storyId: diff.storyId, viewport: diff.viewport, action: "accept" });
  expect(chromatic.capture({ entry: changed.entry, canvas: changed.canvas }).status).toBe("passed");
});
```

最初の capture が `new` になるのは baseline がまだないためです。同じ markup をもう一度 capture すると `passed` になります。label を変えた三回目は markup hash が変わるため `failed` になります。変更が意図どおりと確認できたときだけ `accept` してください。capture 前に `accept` すると current capture がないため throw します。baseline を無条件で更新すると、意図しない変更を test で見落とします。

## a11y の結果を解釈する

`runA11y` が検出するのは、名前のない button、alt のない image、label のない input だけです。空の結果はこの三つに問題がないことを示しますが、WCAG 準拠や axe-core の検査を意味しません。実 browser の semantic tree、keyboard 操作、color contrast を確認する test は `@kiwa-lab/a11y` または browser test に置きます。

## 実行する

```bash
pnpm exec vitest run tests/button.story.test.ts
```

成功すると、play の step は成功、簡易 a11y 結果は空、同一 markup は passed、変更した markup は failed になり、review 後に passed へ戻ります。実 browser の screenshot 比較や Storybook decorator、loader、addon の挙動を追加したい場合は、この test を置き換えず、その integration 用 test を別に作成してください。

## skill で test を作る

この library には package 固有の companion skill はありません。仕様から component test の骨組みを作る場合は、[kiwa の skill を使う](../../../guides/skills) の手順で plugin を導入してから、UI layer の skill を使います。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-design --layer ui --module button
/kiwa:kiwa-ui --module button
```

生成後は、in-memory canvas に対する期待結果と、browser で検証すべき内容が混ざっていないことを確認します。出力先を変更していなければ、生成した file を次で実行してください。

```bash
pnpm exec vitest run tests/spec/ui/button.test.ts
```
