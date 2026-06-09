# tests/fixtures/basic-connect

`examples/basic-connect` の完成形 e2e test を retrofit walkthrough から独立させた reference fixture。
`basic-connect` は contract も Next.js も持たない最小の inline HTML 構成のため、 他 fixture (`mint-nft` / `defi-swap` 等) と異なり **e2e-test のみ** で構成される。

## 出自

- baseline tests は `examples/basic-connect/tests/` の完成形を `git mv` で複製 (history 保存、 `git log --follow` で確認可)
- PR #234 — `/kiwa-test --target dapp` 全 4 round 実走で品質検証 (Playwright 15/15 × 4 round all PASS、 result-review 9.5/10)

## 構成

| ファイル | 役割 |
|---|---|
| `e2e-test/connect.spec.ts` | inline HTML 1 枚 (`window.ethereum` inject) で connect / personal_sign / sign_typed_data_v4 / eth_sendTransaction を試す e2e test |
| `e2e-test/eip6963.spec.ts` | EIP-6963 multi-wallet `announceProvider` イベント経路の e2e test |

## 実走

```bash
pnpm --dir tests/fixtures/basic-connect test:e2e   # Playwright 15/15
```

`anvil --version` と `pnpm exec playwright install chromium` を事前に通しておく。

## 関連

- `examples/basic-connect/` — 同等 spec の retrofit walkthrough 用 starter example (test 空、 fixture は完成形)
- PR #234 — 品質検証
- `tests/docs/run-dapp-e2e-tests.md` — `/kiwa-design --layer e2e` → `/kiwa-play` 経由で同等 spec を生成する手順
