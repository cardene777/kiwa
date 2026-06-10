# @kiwa-test/core

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

anvil fork 上で動く dApp 向け headless E2E test fixture (Playwright + viem)。

`@kiwa-test/core` は [kiwa](https://github.com/cardene777/kiwa) の Playwright ベース dApp E2E layer が使う runtime fixture。 test page に `window.ethereum` を inject し、 anvil ベースの wallet fixture を起動、 EIP-1193 の主要 flow を直接処理し、 残りの JSON-RPC surface は anvil に転送する。

## インストール

```bash
pnpm add -D @kiwa-test/core @playwright/test viem
```

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
