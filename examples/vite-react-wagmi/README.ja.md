# examples/vite-react-wagmi

Vite 5 + React 18 + wagmi v2 の SPA dApp で kiwa fixture を試す example。 MintNft contract を deploy して connect → mint flow を SPA 構成で確認できる。

## 何が試せるか

- Vite 開発サーバー (port 5180) 経由の SPA + window.ethereum inject
- wagmi v2 の useAccount / useReadContract / useWriteContract
- MintNft の mint flow を SPA 構成で検証
- Next.js を使わない場合の prepare-env / fixture override 構成

## 動かす

```bash
pnpm -F examples-vite-react-wagmi test
```

Vite dev server は port 5180 (127.0.0.1 binding)。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/connect-and-mint.spec.ts` | wagmi 経由の connect → MintNft.mint → useReadContract で balanceOf 確認、 3 ケース |

## 関連 cookbook

- [接続ボタン test](../../docs/ja/cookbook/connect-button.md)
- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)

## 次に試す

- Next.js + wagmi + RainbowKit → [examples/nextjs-wagmi-rainbow](../nextjs-wagmi-rainbow/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
