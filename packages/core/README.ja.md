<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-logo.png" alt="kiwa ロゴ" width="160" />
</p>

# @kiwa-test/core

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-ja.gif" alt="kiwa 概要 — contract test、dApp e2e test、手書きの 3 経路" width="640" />
  <br />
  <sub><a href="https://github.com/cardene777/kiwa">kiwa</a> 全体の概要動画 — 本パッケージは dApp e2e と手書き経路を担う。<a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-ja.mp4">▶ フル画質 MP4</a>。</sub>
</p>

anvil fork 上で動く dApp 向け headless E2E test fixture (Playwright + viem)。

`@kiwa-test/core` は [kiwa](https://github.com/cardene777/kiwa) の Playwright ベース dApp E2E layer が使う runtime fixture。 test page に `window.ethereum` を inject し、 anvil ベースの wallet fixture を起動、 EIP-1193 の主要 flow を直接処理し、 残りの JSON-RPC surface は anvil に転送する。

使い方は 2 通り。 (a) Claude に `/kiwa-play` で Playwright test を生成させる、 (b) fixture を直接 import (`import { dappE2eTest as test } from "@kiwa-test/core"`) して手書きする。 contract test (`@kiwa-test/forge`) + dApp e2e (`@kiwa-test/core`) + 手書き の 3 経路の全体像は [kiwa README](https://github.com/cardene777/kiwa) を参照。

## インストール

```bash
pnpm add -D @kiwa-test/core @playwright/test viem
```

### Bonus — Claude Code plugin

Claude Code を併用するなら、 kiwa の skill chain を **1 コマンドで導入** できる。 `/kiwa:kiwa-play` (Playwright e2e 生成) / `/kiwa:kiwa-design` / `/kiwa:kiwa-forge` / `/kiwa:kiwa-hardhat` / `/kiwa:kiwa-vitest` / `/kiwa:kiwa-api` / `/kiwa:kiwa-review` が任意の dApp project から呼び出せる。 (`/kiwa:kiwa-test` 一括 orchestrator は `examples/` 依存のため kiwa monorepo 専用、 plugin 経路では起動不可)

```bash
# Claude Code 内で:
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

> plugin 提供 skill は plugin 名で namespace される (`/kiwa:kiwa-design`、 `/kiwa-design` ではない)。 skill 一覧は [kiwa README — Option A](https://github.com/cardene777/kiwa/blob/main/README.ja.md#option-a-claude-code-plugin-claude-利用時の推奨) 参照。

## Quickstart

```ts
import { expect } from "@playwright/test";
import { dappE2eTest as test } from "@kiwa-test/core";

test("window.ethereum が inject される", async ({ page, dappE2e }) => {
  await page.goto("/");

  const chainId = await page.evaluate(() => {
    return (window as any).ethereum.request({ method: "eth_chainId" });
  });

  await dappE2e.waitForRpcIdle();
  expect(chainId).toBe("0x7a69");
});
```

## 機能

- `window.ethereum` を inject する Playwright fixture preset (`dappE2eTest`)
- 隔離 test run のための anvil lifecycle integration
- 9 つの EIP-1193 JSON-RPC method を直接処理、 その他は全部 anvil 転送
- test から triggerable な 4 つの EIP-1193 event
- `eth_sendTransaction` の transaction broadcast helper
- 決定論的 reject-flow test のための approval-mode helper
- EIP-6963 multi-wallet inject + smart account support

## 直接処理する RPC method

`@kiwa-test/core` は以下 method を直接処理する。

- `eth_requestAccounts`
- `eth_accounts`
- `eth_chainId`
- `net_version`
- `personal_sign`
- `eth_signTypedData_v4`
- `wallet_switchEthereumChain`
- `wallet_addEthereumChain`
- `eth_sendTransaction`

`eth_call` / `eth_getBalance` / `eth_blockNumber` / `eth_estimateGas` 等の read method は anvil 転送。

## EIP-1193 event

inject された provider は以下 event をサポート。

- `accountsChanged`
- `chainChanged`
- `connect`
- `disconnect`

test 側から `dappE2e.triggerEvent()` で直接 drive、 もしくは `connect()` / `disconnect()` / `switchChain()` / `waitForRpcIdle()` 等の高 level helper を使う。

## 関連

- [GitHub repository](https://github.com/cardene777/kiwa)
- [Full documentation (ja)](https://github.com/cardene777/kiwa/tree/main/docs/ja)
- [Cookbook (ja)](https://github.com/cardene777/kiwa/tree/main/docs/ja/cookbook)
- [Errors reference (ja)](https://github.com/cardene777/kiwa/blob/main/docs/ERRORS.ja.md)
- [Events reference (ja)](https://github.com/cardene777/kiwa/blob/main/docs/EVENTS.ja.md)
- [RPC reference (ja)](https://github.com/cardene777/kiwa/blob/main/docs/RPC.ja.md)

## 作者

[cardene](https://github.com/cardene777) — [GitHub](https://github.com/cardene777) / [X](https://x.com/cardene777)

## License

MIT
