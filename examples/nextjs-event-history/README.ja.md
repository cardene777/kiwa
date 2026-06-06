# examples/nextjs-event-history

EventEmitter contract の event を Playwright で検索 / 履歴表示する example。 `expectEvent` helper の使い方と viem `getLogs` の典型経路を試せる。

## 何が試せるか

- contract event の emit と viem `getLogs` での後追い取得
- `expectEvent` で args を含めて event 発火を assertion
- block range / topics filter での絞り込み
- 履歴表示 UI と event payload の整合性検証

## 動かす

```bash
pnpm -F examples-nextjs-event-history test
```

Next.js dev server は port 3043。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/event.spec.ts` | emit → `getLogs` 取得 → `expectEvent` で args 検証 → UI 表示確認、 6 ケース |

## 関連 cookbook

- [Time manipulation (block 進行)](../../docs/ja/cookbook/time-manipulation.md)

## 次に試す

- ENS resolver → [examples/nextjs-ens-resolver](../nextjs-ens-resolver/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
