# クイックスタート

このチュートリアルでは、HTML の TODO フォームをローカルサーバーで配信し、Chromium で入力・送信して、画面に項目が追加されることを確認します。

## 前提条件

Node.js 20 以降と、Vitest を使う TypeScript プロジェクト、Playwright の Chromium browser が必要です。初回に依存関係と Chromium を入れます。

```bash
pnpm add -D @kiwa-lab/e2e @playwright/test vitest
pnpm exec playwright install chromium
```

`@kiwa-lab/e2e` は Playwright の読み込み時に、まず `@playwright/test` を探します。見つからない場合は `playwright` を試します。どちらも利用できないときは、依存関係を追加するよう案内するエラーになります。

## テストを書く

たとえば `todo.e2e.test.ts` を作成します。`afterEach` で、各テストが作った環境を必ず停止します。

```ts
import { afterEach, expect, it } from "vitest";
import { setupE2eEnv, type E2eTestEnv } from "@kiwa-lab/e2e";

const envs: E2eTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

it("項目を追加できる", async () => {
  const env = await setupE2eEnv({
    staticHtml: `<!doctype html>
      <h1 data-testid="title">Todo</h1>
      <ul id="list"></ul>
      <form id="form">
        <input id="input" name="title" />
        <button type="submit">追加</button>
      </form>
      <script>
        const list = document.getElementById("list");
        const form = document.getElementById("form");
        const input = document.getElementById("input");
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const value = input.value.trim();
          if (!value) return;
          const item = document.createElement("li");
          item.setAttribute("data-testid", "item");
          item.textContent = value;
          list.appendChild(item);
          input.value = "";
        });
      </script>`,
  });
  envs.push(env);

  await env.page.fill("#input", "犬の散歩");
  await env.page.click('button[type="submit"]');

  expect(await env.page.getByTestId("item").textContent()).toBe("犬の散歩");
});
```

## 実行する

プロジェクトの Vitest コマンドで、このテストファイルを実行します。

```bash
pnpm vitest run todo.e2e.test.ts
```

テストが始まると、`setupE2eEnv` は空いているローカル port で HTTP server を起動し、既定の headless Chromium で `/` を開きます。`env.page` はそのページを操作するための制限された Playwright handle です。

`staticHtml` は `undefined` でなければ空文字列も有効です。一方、`app` と `staticHtml` の両方を省略すると初期化は失敗します。static HTML は最小の画面操作を試す用途に限り、実アプリのルーティングや middleware を確認するときは `app` を使います。

## 次に進む

実際のアプリをテストするときは、HTML 文字列を `app` に置き換えます。Fetch handler は `{ kind: "fetch", handler }`、Node handler は `{ kind: "node", handler }` または直接の関数で渡せます。利用できる option と page 操作は [リファレンス](./reference) にあります。
<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。[kiwa の skill を使う](../../../guides/skills) の手順で plugin を導入し、Quickstart の最小 test で API と期待結果を理解してから実行してください。

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins

/kiwa:kiwa-design --layer e2e --module checkout
/kiwa:kiwa-e2e --module checkout
```

生成した test は、そのまま正しさの証明にはなりません。Quickstart にある入力、期待結果、対象外の境界と照合し、プロジェクトの runner で実行してください。layer の選択肢と出力先は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-e2e/SKILL.md) を参照してください。
