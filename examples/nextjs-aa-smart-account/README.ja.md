# examples/nextjs-aa-smart-account

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

簡易版 Smart Account (AccountFactory + Counter + MockToken + Paymaster + SmartAccount + TokenSpender) で AA 周りの典型 use case (Paymaster による gas 代替 / TokenSpender 経由の自動承認 / guardian recovery / ERC-1271) を試せる example。

## 何が試せるか

- AccountFactory での Smart Account 1 つ目 deploy
- Paymaster による gas 補助 (ETH 経由)
- TokenSpender による token approve 自動化
- guardian recovery (Smart Account owner 切替)
- ERC-1271 isValidSignature による Smart Account 署名検証

## 動かす

```bash
pnpm -F examples-nextjs-aa-smart-account test
```

Next.js dev server は port 3041。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/aa.spec.ts` | Smart Account の deploy → Counter.increment → Paymaster gas 補助 → TokenSpender 経由 ERC20 transfer → guardian recovery → ERC-1271 verify、10 ケース |

## 関連 cookbook

- [Smart wallet / AA](../../docs/ja/cookbook/smart-wallet-aa.md)
- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)

## 次に試す

- フル ERC-4337 v0.7 → [examples/nextjs-aa-erc4337](../nextjs-aa-erc4337/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
