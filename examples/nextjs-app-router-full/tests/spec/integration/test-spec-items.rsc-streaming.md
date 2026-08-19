# test-spec-items (nextjs-rsc-streaming layer)

`app/items/_kiwa/items-streaming.ts` の async generator を対象にした Layer 1 spec。
`setupNextRscEnv` に流し、 fallback / chunk 順序 / resolved / errorBoundary / timeout を見る。

- module: items
- layer: nextjs-rsc-streaming

## テストケース

| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-NS-301 | 正常 stream | 4 chunk source | setupNextRscEnv | fallback + 4 chunk + resolved = 最終 list | P0 | yes | rsc-streaming |
| T-NS-302 | fallback を chunk 0 として出す | 同上 | setupNextRscEnv | `env.fallback` と chunk 0 が一致 | P0 | yes | rsc-streaming |
| T-NS-303 | 途中の失敗は boundary が捕まえる | chunk 2 で throw | setupNextRscEnv | `errorBoundary` に捕捉、 `resolved` は null | P0 | yes | rsc-streaming |
| T-NS-304 | 遅い stream を打ち切る | streamingTimeout 超過 | setupNextRscEnv | fail fast する | P1 | yes | rsc-streaming |
| T-NS-305 | chunk が単調に増える | 同上 | setupNextRscEnv | partial の `data-count` が単調増加 | P1 | yes | rsc-streaming |

## 自動化方針

T-NS-305 は **順序** の主張。 件数だけを見ると、 chunk が逆順に届いても最終値が同じなら
通ってしまう。

## 不足している仕様

(なし)
