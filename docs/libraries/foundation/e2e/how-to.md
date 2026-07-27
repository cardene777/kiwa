# 実アプリの handler を browser で検証する

`setupE2eEnv` は HTTP server、browser、context、page を同じ environment として起動します。test の責務は、handler が response を返すことだけでなく、その response を browser が表示し、利用者に見える結果になることを確認することです。environment を残さないため、`finally` で `stop()` を必ず呼びます。

次の内容全体を `tests/settings.e2e.test.ts` に保存します。Fetch handler、Node handler、browser engine の選択を一つのファイルで扱います。Firefox を使う test もあるため、先に browser を導入してください。

```bash
pnpm exec playwright install chromium firefox
```

```ts
import { expect, it } from "vitest";
import { setupE2eEnv } from "@kiwa-lab/e2e";

it("renders a settings page from a Fetch handler", async () => {
  const env = await setupE2eEnv({
    app: {
      kind: "fetch",
      handler: async (request) => {
        if (new URL(request.url).pathname === "/settings") {
          return new Response("<h1 data-testid='title'>Settings</h1>", {
            headers: { "content-type": "text/html" },
          });
        }
        return new Response("not found", { status: 404 });
      },
    },
    initialPath: "/settings",
  });

  try {
    expect(await env.page.getByTestId("title").textContent()).toBe("Settings");
  } finally {
    await env.stop();
  }
});

it("renders a health response from a Node handler", async () => {
  const env = await setupE2eEnv({
    app: (request, response) => {
      if (request.url === "/health") {
        response.setHeader("content-type", "text/html");
        response.end("<p data-testid='status'>ok</p>");
        return;
      }
      response.statusCode = 404;
      response.end("not found");
    },
    initialPath: "/health",
  });

  try {
    expect(await env.page.getByTestId("status").textContent()).toBe("ok");
  } finally {
    await env.stop();
  }
});

it("uses Firefox when the browser is selected explicitly", async () => {
  const env = await setupE2eEnv({
    staticHtml: "<button data-testid='save'>save</button>",
    browser: "firefox",
    headless: true,
  });

  try {
    expect(env.browser).toBe("firefox");
    expect(await env.page.getByTestId("save").isVisible()).toBe(true);
  } finally {
    await env.stop();
  }
});
```

## handler と browser の境界を理解する

Fetch handler は `Request` を受けて `Response` を返します。Node handler は `(request, response)` を受け、object で `{ kind: "node", handler }` として渡すことも、例のように直接渡すこともできます。同期例外と非同期 reject は harness により HTTP 500 と `internal error` に変換されますが、アプリ固有の error mapping は handler 自身の責務です。期待する status と画面表示を別の test で固定してください。

`initialPath` に relative path を渡すと local server を開きます。`http` から始まる絶対 URL を渡すと、その URL に直接移動します。SUT を local app に固定する test では relative path を使います。browser は `chromium`、`firefox`、`webkit` から選べます。選んだ engine が Playwright に未導入なら初期化は失敗します。

locator は `getByTestId`、`getByRole`、`getByText` で取得できます。CSS selector が必要な場合は `page.fill` と `page.click` を使います。server と browser の片方だけを閉じる cleanup は不要です。`env.stop()` が page、context、browser、server をまとめて終了します。

## 実行する

```bash
pnpm exec vitest run tests/settings.e2e.test.ts
```

browser binary がない場合は、使用する engine の install command を実行してください。handler が 500 になる場合は app 側の例外と response mapping を確認します。外部 service、実 production deployment、認証 state、fixture data はこの library が用意しないため、呼び出し側で明示的に制御します。
