# @kiwa-lab/dapp を始める

この手順では、Vite または Next.js など、すでにブラウザで表示できる dApp に wallet E2E test を一つ追加します。成功すると Playwright がアプリを起動し、fixture が注入した `window.ethereum` から Anvil の chain ID を読み取り、test が成功します。

## 前提をそろえる

Node.js 20 以降、Playwright の browser、`anvil` command が必要です。Anvil は Foundry に含まれます。まだ Playwright を初期化していないプロジェクトでは `pnpm exec playwright install chromium` を一度実行してください。

```bash
pnpm add -D @kiwa-lab/dapp @playwright/test viem
pnpm exec playwright install chromium
```

アプリを自動で起動するため、プロジェクト直下の `playwright.config.ts` に base URL と web server を置きます。下の `pnpm dev -- --port 4173` は Vite の例です。Next.js などでは、ここだけ自分の framework の起動 command に置き換えます。

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://127.0.0.1:4173", headless: true },
  webServer: {
    command: "pnpm dev -- --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

## 最初の test を書く

`tests/wallet.spec.ts` を作成します。重要なのは `@playwright/test` の `test` ではなく `@kiwa-lab/dapp` の `dappE2eTest` を使う点です。この fixture が page 作成前に provider を注入するため、アプリが最初に provider を読む場合も同じ経路を検証できます。

```ts
import { expect } from "@playwright/test";
import { dappE2eTest as test } from "@kiwa-lab/dapp";

test("injected provider returns the Anvil chain", async ({ page, dappE2e }) => {
  await page.goto("/");

  const chainId = await page.evaluate(async () => {
    const provider = (window as typeof window & {
      ethereum: { request(request: { method: string }): Promise<unknown> };
    }).ethereum;
    return provider.request({ method: "eth_chainId" });
  });

  await dappE2e.waitForRpcIdle();
  expect(chainId).toBe("0x7a69");
});
```

次の command で file を実行します。

```bash
pnpm exec playwright test tests/wallet.spec.ts
```

成功時は Playwright が `1 passed` と表示します。失敗して `page.goto` が接続できない場合は、`webServer.command` がアプリを起動できているか、URL と port が一致しているかを確認します。`anvil failed to listen` の場合は `anvil --version` が通るかと、既に使われている port がないかを確認します。

## この test が保証する範囲

この assertion は、fixture の provider が page に入り、アプリが EIP-1193 request を送れることを保証します。実 MetaMask の popup、実 network の RPC、ユーザーの wallet extension 設定までは保証しません。次はアプリ固有の接続完了表示を assertion に加え、provider が返した値が UI に反映されることを確認します。

## skill から test の下書きを作る

Claude Code を使う場合は、[skills guide](/guides/skills) の plugin 導入後に `kiwa-play` が Playwright test の下書きを生成できます。仕様から設計して生成する場合は、対象画面の期待結果を先に渡します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins

/kiwa:kiwa-design --layer e2e --module wallet-connect --input app/
/kiwa:kiwa-play --mode new
```

生成物はそのまま正しさの証明にはなりません。生成された locator と期待結果をアプリの画面に合わせて見直し、このページの `pnpm exec playwright test tests/wallet.spec.ts` と同じ形で実行して確認します。skill が扱う設計入力と生成範囲は [kiwa-play の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-play/SKILL.md) を参照してください。
