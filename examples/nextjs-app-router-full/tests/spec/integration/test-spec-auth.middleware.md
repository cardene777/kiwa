# test-spec-auth (nextjs-middleware layer)

`lib/_kiwa/auth-middleware.ts` を対象にした Layer 1 spec。
`invokeMiddleware` で simulated request を通し、 `next()` / `redirect()` / JSON 応答の
3 系統を捕捉する。

- module: auth
- layer: nextjs-middleware

## テストケース一覧

| ID | Observation | Given | Method | Headers | Then | Priority | Automation | Middleware |
|---|---|---|---|---|---|---|---|---|
| T-NF-101 | 停止中は 403 を返す | `url=http://localhost/items, cookies={session:'banned'}` | GET | none | 403 の JSON action | P0 | yes | `authMiddleware` |
| T-NF-102 | 未 login は login へ送る | `url=http://localhost/items?tag=framework, cookies={}` | GET | none | `/login?from=%2Fitems` へ 307 redirect | P0 | yes | `authMiddleware` |
| T-NF-103 | matcher 外は素通しする | `url=http://localhost/api/items, cookies={}` | GET | none | `next()` + `x-kiwa-request-id=next-default` | P0 | yes | `authMiddleware` |
| T-NF-104 | 通す時は request id を付ける | `url=http://localhost/items, cookies={session:'admin'}` | GET | none | `next()` + `x-kiwa-request-id=next-default` | P1 | yes | `authMiddleware` |
| T-NF-105 | 与えられた request id を尊重する | `url=http://localhost/items, cookies={session:'admin'}` | GET | `x-request-id=abc-123` | `x-kiwa-request-id=abc-123` | P1 | yes | `authMiddleware` |

## 自動化方針

matcher の判定は middleware 自身が持つ。 T-NF-103 は **matcher 外の path で redirect が
起きないこと** を見る = 認証の穴ではなく、 対象範囲の主張。

## 不足している仕様

(なし)
