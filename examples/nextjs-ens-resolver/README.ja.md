# examples/nextjs-ens-resolver

ENS 風 name → address 解決を最小 contract (SimpleResolver) で試す example。 name registration / 解決 / 解除の 3 経路を Playwright で動作確認できる。

## 何が試せるか

- SimpleResolver.register での name 登録
- name → address の forward lookup
- 未登録 name の解決失敗パス (custom error revert)
- name 登録上書き (権限チェック)

## 動かす

```bash
pnpm -F examples-nextjs-ens-resolver test
```

Next.js dev server は port 3042。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/ens.spec.ts` | name 登録 → 解決 → 解除 + 未登録 name の revert、 6 ケース |

## 関連 cookbook

- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)

## 次に試す

- event 検索系 → [examples/nextjs-event-history](../nextjs-event-history/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
