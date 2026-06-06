# examples/nextjs-permit-swap

EIP-2612 permit を使った gasless approve + swap を検証する example。 PermitToken + PermitSwap の 2 contract で permit 署名 → swap の 1 step フローを試せる。

## 何が試せるか

- EIP-2612 permit (signed approve) の typed data 署名
- `permit + swap` を 1 tx に統合する gasless flow
- permit nonce 管理 / deadline 超過時の InvalidSignature revert
- permit を別 spender が使い回せないことの検証 (signature address check)

## 動かす

```bash
pnpm -F examples-nextjs-permit-swap test
```

Next.js dev server は port 3036。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/permit-swap.spec.ts` | permit 署名 → swap 統合 tx → balance 反映、 deadline / nonce / spender 検証、 7 ケース |

## 関連 cookbook

- [Token approve flow](../../docs/ja/cookbook/token-approve-flow.md)
- [Multi-wallet signature](../../docs/ja/cookbook/multi-wallet-signature.md)
- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)

## 次に試す

- 通常 approve の swap → [examples/defi-swap](../defi-swap/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
