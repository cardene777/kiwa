# test-spec-items (nextjs-server-action layer)

`app/items/_kiwa/items-action.ts` の Server Action を対象にした Layer 1 spec。
`invokeServerAction` で `'use server'` 関数を直接呼び、 redirect / cookie / revalidate の
副作用を捕捉する。

- module: items
- layer: nextjs-server-action

## テストケース一覧

| ID | Observation | Given | FormData | Args | Then | Priority | Automation | Action |
|---|---|---|---|---|---|---|---|---|
| T-NF-001 | session 不在は login へ送る | cookie 無し | `name=nextjs` | none | `REDIRECT_SYMBOL` で `/login` | P0 | yes | `createItemAction` |
| T-NF-002 | 停止中の利用者は拒む | `session=banned` | `name=nextjs` | none | `Error('banned')` を throw | P0 | yes | `createItemAction` |
| T-NF-003 | 空の name を弾く | `session=admin` | `name=` | none | `{ ok: false, field: 'name', message: 'name is required' }` | P0 | yes | `createItemAction` |
| T-NF-004 | 短すぎる name を弾く | `session=admin` | `name=a` | none | `{ ok: false }` かつ minlength message | P1 | yes | `createItemAction` |
| T-NF-005 | 禁止語を弾く | `session=admin` | `name=danger` | none | `Error('danger forbidden')` を throw | P1 | yes | `createItemAction` |
| T-NF-006 | 成功時の副作用 | `session=admin` | `name=nextjs, seed=200` | none | `{ ok: true, id: 206, name: 'nextjs' }` + `cookies.set('last-created', '206')` + `revalidatePath('/items')` | P0 | yes | `createItemAction` |

## 自動化方針

`invokeServerAction` は `redirect()` / `notFound()` の throw を signal として返すため、
try / catch で握らずに返り値の symbol を見る。 cookie と revalidate は env に注入した
記録用の実装で観測する。

## 不足している仕様

(なし)
