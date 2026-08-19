# test-spec-auth (nextjs-middleware layer)

`lib/_kiwa/auth-middleware.ts` を対象にした Layer 1 spec。
`invokeMiddleware` で simulated request を通し、 `next()` / `redirect()` / JSON 応答の
3 系統を捕捉する。

- module: auth
- layer: nextjs-middleware

## テストケース

| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-NF-101 | 停止中は 403 を返す | session=banned | invokeMiddleware | 403 の JSON action | P0 | yes | middleware |
| T-NF-102 | 未 login は login へ送る | cookie 無し + `/items` | invokeMiddleware | `/login` へ 307、 `from` query 付き | P0 | yes | middleware |
| T-NF-103 | matcher 外は素通しする | cookie 無し + `/api/items` | invokeMiddleware | `next()` (redirect しない) | P0 | yes | middleware |
| T-NF-104 | 通す時は request id を付ける | session=admin | invokeMiddleware | `next()` + `x-kiwa-request-id` (既定値) | P1 | yes | middleware |
| T-NF-105 | 与えられた request id を尊重する | `x-request-id` header あり | invokeMiddleware | `x-kiwa-request-id` にそのまま反映 | P1 | yes | middleware |

## 自動化方針

matcher の判定は middleware 自身が持つ。 T-NF-103 は **matcher 外の path で redirect が
起きないこと** を見る = 認証の穴ではなく、 対象範囲の主張。

## 不足している仕様

(なし)
