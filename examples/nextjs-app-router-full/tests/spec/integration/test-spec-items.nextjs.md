# test-spec-items (nextjs-server-action layer)

`app/items/_kiwa/items-action.ts` の Server Action を対象にした Layer 1 spec。
`invokeServerAction` で `'use server'` 関数を直接呼び、 redirect / cookie / revalidate の
副作用を捕捉する。

- module: items
- layer: nextjs-server-action

## テストケース

| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-NF-001 | session 不在は login へ送る | cookie 無し | createItemAction | `REDIRECT_SYMBOL` で `/login` | P0 | yes | server-action |
| T-NF-002 | 停止中の利用者は拒む | session=banned | createItemAction | `Error` を throw | P0 | yes | server-action |
| T-NF-003 | 空の name を弾く | name 空 | createItemAction | `{ ok: false, field, message }` | P0 | yes | server-action |
| T-NF-004 | 短すぎる name を弾く | name 1 文字 | createItemAction | `{ ok: false }` に minlength | P1 | yes | server-action |
| T-NF-005 | 禁止語を弾く | name=danger | createItemAction | `Error` を throw | P1 | yes | server-action |
| T-NF-006 | 成功時の副作用 | 正常な name | createItemAction | `{ ok: true, id, name }` + `cookies.set('last-created')` + `revalidatePath` | P0 | yes | server-action |

## 自動化方針

`invokeServerAction` は `redirect()` / `notFound()` の throw を signal として返すため、
try / catch で握らずに返り値の symbol を見る。 cookie と revalidate は env に注入した
記録用の実装で観測する。

## 不足している仕様

(なし)
