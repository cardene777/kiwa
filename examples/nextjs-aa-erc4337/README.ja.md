# examples/nextjs-aa-erc4337

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

ERC-4337 v0.7 の Account Abstraction (EntryPoint + SimpleAccountFactory + UserOperation + MockTarget) を Next.js + Playwright で end-to-end 検証する example。 4337 全経路 (UserOp 構築 → bundler 風送信 → EntryPoint 経由 execute) を Smart Account 越しに走らせる。

## 何が試せるか

- ERC-4337 v0.7 の UserOperation v0.7 形式の構築と署名
- SimpleAccountFactory.createAccount による Smart Account の初回 deploy
- EntryPoint.handleOps 経由の execute (MockTarget の counter 増加)
- Account Abstraction 上での gas estimation 経路
- Smart Account からの ERC-1271 signature 検証

## 動かす

repo root で `pnpm install` + `pnpm exec playwright install chromium` 済 + Foundry の `anvil` / `forge` が PATH 上。

```bash
pnpm -F examples-nextjs-aa-erc4337 test
```

中で起こること — `pnpm -F @kiwa/core build` で fixture dist 更新 → `playwright test` (Next.js dev server を port 3042 で起動 + anvil 起動 + EntryPoint / Factory / Smart Account deploy)。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/aa-erc4337.spec.ts` | UserOp 構築 → EntryPoint 経由 execute → MockTarget の state 反映 7 ケース |

## 関連 cookbook

- [Smart wallet / AA](../../docs/ja/cookbook/smart-wallet-aa.md)
- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)

## 次に試す

- 簡易版 Smart Account → [examples/nextjs-aa-smart-account](../nextjs-aa-smart-account/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
