# test-spec-items (nextjs-rsc layer)

`app/items/_kiwa/items-rsc.ts` の async Server Component を対象にした Layer 1 spec。
`renderServerComponent` で await し、 element tree を `findAll` / `textContent` で検証する。

- module: items
- layer: nextjs-rsc

## テストケース

| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-NF-201 | 認証済は一覧を描く | session=admin | renderServerComponent | `h1` + `li` 3 件 | P0 | yes | rsc |
| T-NF-202 | 未 login は案内を描く | cookie 無し | renderServerComponent | Sign in required の文言 | P0 | yes | rsc |
| T-NF-203 | 停止中は拒否を描く | session=banned | renderServerComponent | Forbidden + `data-testid=banned` | P0 | yes | rsc |
| T-NF-204 | tag で絞り込む | `searchParams.tag=framework` | renderServerComponent | 2 件に絞られる | P1 | yes | rsc |
| T-NF-205 | 別 tag でも絞れる | tag=react | renderServerComponent | 2 件 hit | P1 | yes | rsc |

## 自動化方針

`next/headers` の `cookies()` は使わず、 `sessionGetter` を props で注入する。 実 Next.js の
dep を持ち込まずに分岐だけを見るため。

## 不足している仕様

(なし)
