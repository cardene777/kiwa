# test-spec-items (nextjs-rsc-streaming layer)

`app/items/_kiwa/items-streaming.ts` の async generator を対象にした Layer 1 spec。
`setupNextRscEnv` に流し、 fallback / chunk 順序 / resolved / errorBoundary / timeout を見る。

- module: items
- layer: nextjs-rsc-streaming

## テストケース一覧

| ID | Observation | Source | Fallback | Timeout | ErrorMode | Then | Priority | Automation |
|---|---|---|---|---|---|---|---|---|
| T-NS-301 | 正常 stream | `streamItems()` | `itemsSkeleton()` | 5000 | none | fallback + 4 chunk + resolved = 最終 list | P0 | yes |
| T-NS-302 | fallback を chunk 0 として出す | `streamItems()` | `itemsSkeleton()` | 5000 | none | `env.fallback` と chunk 0 が一致 | P0 | yes |
| T-NS-303 | 途中の失敗は boundary が捕まえる | `streamItems({injectErrorAt:1})` | `itemsSkeleton()` | 5000 | stream-throw | `errorBoundary` に捕捉、 `resolved` は null | P0 | yes |
| T-NS-304 | 遅い stream を打ち切る | `slowSource()` | none | 20 | none | `timedOut === true`、 `resolved` は null | P1 | yes |
| T-NS-305 | chunk が単調に増える | `streamItems()` | none | 5000 | none | partial の `data-count` が `[1, 2, 3, 3]` | P1 | yes |

## 自動化方針

T-NS-305 は **順序** の主張。 件数だけを見ると、 chunk が逆順に届いても最終値が同じなら
通ってしまう。

## 不足している仕様

(なし)
