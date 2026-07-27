# @kiwa-lab/ui はじめる

このチュートリアルでは、React counter を render、interaction、snapshot の三つの目的で test します。`@kiwa-lab/ui` は JSDOM 上の component contract を確認する adapter です。実 browser の layout、hydration、native input の差は browser helper または E2E で確認します。

## インストール

```bash
pnpm add -D @kiwa-lab/ui @testing-library/react @testing-library/user-event jsdom react react-dom vitest
```

Vitest を JSDOM environment で実行します。

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({ test: { environment: "jsdom" } });
```

## counter の表示と操作を test にする

次の内容を `tests/counter.ui.test.tsx` にそのまま保存してください。render mode は初期表示、interaction mode は user-event 後の state、snapshot mode は render 時点の markup を確認します。environment は必ず `stop()` するため、test ごとの cleanup を配列で集約します。

```tsx
import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { setupComponentEnv, type UiTestEnv } from "@kiwa-lab/ui";

const envs: UiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    await envs.pop()?.stop();
  }
});

function Counter({ initial = 0 }: { initial?: number }): JSX.Element {
  const [count, setCount] = useState(initial);
  return (
    <button data-testid="count" onClick={() => setCount(value => value + 1)}>
      {count}
    </button>
  );
}

it("初期表示、操作、初期 markup を確認する", async () => {
  const render = await setupComponentEnv({
    mode: "render",
    ui: <Counter initial={3} />,
  });
  envs.push(render);
  if (render.kind !== "render") throw new Error("render environment が必要です");
  expect(render.result.container.querySelector("[data-testid=count]")?.textContent).toBe("3");

  const interaction = await setupComponentEnv({
    mode: "interaction",
    ui: <Counter />,
  });
  envs.push(interaction);
  if (interaction.kind !== "interaction") {
    throw new Error("interaction environment が必要です");
  }
  const button = interaction.result.container.querySelector("[data-testid=count]");
  if (!(button instanceof HTMLButtonElement)) throw new Error("count button が必要です");
  await interaction.user.click(button);
  expect(button.textContent).toBe("1");

  const snapshot = await setupComponentEnv({
    mode: "snapshot",
    ui: <Counter initial={7} />,
  });
  envs.push(snapshot);
  if (snapshot.kind !== "snapshot") throw new Error("snapshot environment が必要です");
  expect(snapshot.markup).toContain('data-testid="count"');
  expect(snapshot.markup).toContain(">7<");
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/counter.ui.test.tsx
```

成功時には、render mode は初期値、interaction mode は click 後の値、snapshot mode は render 時点の HTML を返します。snapshot の `markup` は後から component を操作しても更新されません。JSDOM の component tree と実 browser の UI を混同しないでください。

## 次に行うこと

静的 browser markup と framework helper は [使い方](./how-to) を参照してください。`@testing-library/react` または `@testing-library/user-event` がない場合は、setup が追加 command を含む error で reject します。

<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。初回だけ plugin を導入し、Quickstart の mode と期待値を理解してから実行してください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-design --layer ui --module signup-form
/kiwa:kiwa-ui --module signup-form
```

生成後は component、mode、操作、期待値を実装と照合し、生成した file だけを実行します。

```bash
pnpm exec vitest run tests/signup-form.test.tsx
```

skill の layer と出力先は [kiwa-ui](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-ui/SKILL.md) を参照してください。
