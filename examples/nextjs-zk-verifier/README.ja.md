# examples/nextjs-zk-verifier

軽量 zk-proof verifier (CommitmentVerifier + RangeProofVerifier) を Playwright で検証する example。 proof 構築 → on-chain verify の典型 flow を kiwa fixture 上で試せる。

## 何が試せるか

- commitment 形式の proof 構築と on-chain verify
- range proof (値が指定範囲内である証明) の検証
- 不正 proof / 範囲外値の revert (custom error)
- verifier address 経由の proof 提出
- proof payload と event の整合性検証

## 動かす

```bash
pnpm -F examples-nextjs-zk-verifier test
```

Next.js dev server は port 3046。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/zk.spec.ts` | commitment 構築 → verify、 range proof 構築 → verify、 不正 proof 検出、 7 ケース |

## 関連 cookbook

- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)

## 次に試す

- multi-wallet 署名 → [examples/basic-connect](../basic-connect/README.ja.md) (EIP-6963 経由)
- Smart Account → [examples/nextjs-aa-smart-account](../nextjs-aa-smart-account/README.ja.md)
