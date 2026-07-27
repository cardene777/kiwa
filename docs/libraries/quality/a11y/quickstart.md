# A11y を導入する

この Quickstart は Vitest の jsdom environment で、ラベルのない button が `button-name` 違反として検出されることを確認します。

## 依存を追加する

```bash
pnpm add -D @kiwa-lab/a11y axe-core jsdom vitest
```

`axe-core`、`jsdom`、`vitest` は peer dependency です。`@kiwa-lab/a11y` だけを追加しても `runAxe` は実行できません。

## jsdom を有効にする

`vitest.config.ts` に jsdom environment を指定します。

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'jsdom' },
});
```

## DOM を検査する

```ts
import { afterEach, expect, it } from 'vitest';
import { expectNoViolations, runAxe } from '@kiwa-lab/a11y';

const originalBody = document.body.innerHTML;

afterEach(() => {
  document.body.innerHTML = originalBody;
});

it('labels the increment button', async () => {
  document.body.innerHTML = '<div id="root"><button type="button" aria-label="increment">+</button></div>';

  const root = document.getElementById('root');
  const results = await runAxe({ context: root as Element });
  expectNoViolations(results, expect, { maxImpact: 'serious' });
});
```

`context` を渡すと component の root だけを検査できます。省略した場合は global `document` を使います。jsdom でも context でもない環境では `runAxe` は失敗します。

`expectNoViolations` は `blocking` があるとVitest matcherではなくErrorをthrowし、impact、rule id、help、node数を含むmessageを返します。CIで個々のnodeを調べるにはこのmessageを保存してください。

この例を `tests/a11y-button.test.ts` に保存した後、次の command を実行してください。

```bash
pnpm exec vitest run tests/a11y-button.test.ts
```

成功時は `button-name` を含む serious または critical の violation がありません。意図的に `aria-label` を外して失敗を一度確認すると、CI log に rule ID と対象 node が表示されることも確認できます。

## 次に読む

CI の gate と browser 結果の集約は [使い方](./how-to) を参照してください。
<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。[kiwa の skill を使う](../../../guides/skills) の手順で plugin を導入し、Quickstart の最小 test で API と期待結果を理解してから実行してください。

初回は plugin を導入して再読込します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/kiwa:kiwa-design --layer a11y --module checkout
/kiwa:kiwa-a11y --module checkout
```

生成した test は、そのまま正しさの証明にはなりません。Quickstart にある入力、期待結果、対象外の境界と照合し、プロジェクトの runner で実行してください。jsdom を選び既定の出力先を使った場合は、次で実行します。

```bash
pnpm exec vitest run tests/a11y/checkout.test.tsx
```

Playwright を選んだ場合は、`pnpm exec playwright test tests/a11y/checkout.spec.ts` を実行します。layer の選択肢と出力先は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-a11y/SKILL.md) を参照してください。
