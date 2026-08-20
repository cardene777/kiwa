# test-spec-items (nextjs-parallel-route layer)

`app/items/_kiwa/items-parallel.ts` の layout と slot を対象にした Layer 1 spec。
`invokeParallelRoutes` で layout / children / slot を直接渡し、 `@slot` dir や `default.tsx` の
file 規約を再現せずに描画と失敗の隔離を見る。

- module: items
- layer: nextjs-parallel-route

## テストケース一覧

| ID | Observation | Layout | Slots | Children | Then | Priority | Automation | Variant |
|---|---|---|---|---|---|---|---|---|
| T-PAR-001 | 全 slot が並ぶ | `ItemsParallelLayout` | `detail=ItemDetail({id:1}), activity=ItemActivity()` | `ItemsList()` | `article` と `aside` が 1 件ずつ、 `layoutError` なし | P0 | yes | none |
| T-PAR-002 | children は slot と別 | `ItemsParallelLayout` | `detail=ItemDetail({id:1}), activity=ItemActivity()` | `ItemsList()` | `ul` は children 側から来る | P0 | yes | none |
| T-PAR-003 | slot の失敗は波及しない | `ItemsParallelLayout` | `detail=ItemDetail({id:1}), activity=ItemActivity({fail:true})` | `ItemsList()` | activity は `error` + `tree === null`、 detail は描かれ、空の `section` も残らない | P0 | yes | none |
| T-PAR-004 | 失敗を default で埋めない | `ItemsParallelLayout` | `detail=ItemDetail(), default=ItemDetailDefault(), activity=ItemActivity()` | `ItemsList()` | `usedDefault === false`、 fallback の markup は出ない | P0 | yes | none |
| T-PAR-005 | slot 無しは default に落ちる | `ItemsParallelLayout` | `detail=null, default=ItemDetailDefault(), activity=ItemActivity()` | `ItemsList()` | `usedDefault === true`、 `error` なし | P0 | yes | none |
| T-PAR-006 | 割り込みを記録する | `ItemsParallelLayout` | `detail=ItemDetailModal({id:2}), activity=ItemActivity()` | `ItemsList()` | `interception` に variant / url、 modal が出る | P1 | yes | intercepted |
| T-PAR-007 | 直接遷移は default を描く | `ItemsParallelLayout` | `detail=ItemDetailModal({id:1}), default=ItemDetailDefault(), activity=ItemActivity()` | `ItemsList()` | `usedDefault === true`、 modal は出ない | P1 | yes | default |
| T-PAR-008 | layoutProps が届く | `ItemsParallelLayout({heading:'custom heading'})` | `detail=ItemDetail({id:1}), activity=ItemActivity()` | `ItemsList()` | `h1` が渡した文言になる | P2 | yes | none |
| T-PAR-009 | 省略時は既定の見出し | `ItemsParallelLayout({})` | `detail=ItemDetail({id:1}), activity=ItemActivity()` | `ItemsList()` | `h1` が `items` になる | P2 | yes | none |

## 自動化方針

T-PAR-004 が本 spec の中心。 **`default.tsx` は「slot が無い」 ための仕組みで、
「slot が壊れた」 ための仕組みではない** (`renderSlot` の `useDefault` は `component === null` か
`variant: 'default'` の時だけ真)。 埋めてしまうと壊れた slot が正常な既定値に見える。

T-PAR-003 は隔離の主張。 slot は `Promise.all` で並列に描かれるため、 1 つの失敗が他を
止めない。 **空の枠が残らないことも併せて見る** = 中身だけを数えると、 layout が `null` の
slot に空の `section` を出しても気付けない。

T-PAR-008 / 009 は対で置く。 渡した値だけを見ると既定が一度も走らず、 既定を変えても
気付けない。

## 不足している仕様

- slot ごとの loading 表示 (`loading.tsx`) は `invokeParallelRoutes` の対象外で、
  streaming layer 側で見る。
