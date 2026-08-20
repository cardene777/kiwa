# test-spec-items (nextjs-rsc layer)

`app/items/_kiwa/items-rsc.ts` の async Server Component を対象にした Layer 1 spec。
`renderServerComponent` で await し、 element tree を `findAll` / `textContent` で検証する。

- module: items
- layer: nextjs-rsc

## テストケース一覧

| ID | Observation | Component | Props | Then | Priority | Automation | Mode | Signal |
|---|---|---|---|---|---|---|---|---|
| T-NF-201 | 認証済は一覧を描く | `ItemsPageRSC` | `sessionGetter=admin` | `h1` 1 件 + `li` 3 件 | P0 | yes | direct | none |
| T-NF-202 | 未 login は案内を描く | `ItemsPageRSC` | `sessionGetter=null` | Sign in required の文言 | P0 | yes | direct | none |
| T-NF-203 | 停止中は拒否を描く | `ItemsPageRSC` | `sessionGetter=banned` | Forbidden + `data-testid=banned` | P0 | yes | direct | none |
| T-NF-204 | tag で絞り込む | `ItemsPageRSC` | `sessionGetter=admin, searchParams={tag:'framework'}` | `li` 2 件 + 2 items の文言 | P1 | yes | direct | none |
| T-NF-205 | 別 tag でも絞れる | `ItemsPageRSC` | `sessionGetter=admin, searchParams={tag:'react'}` | `li` 2 件 | P1 | yes | direct | none |

## 自動化方針

`next/headers` の `cookies()` は使わず、 `sessionGetter` を props で注入する。 実 Next.js の
dep を持ち込まずに分岐だけを見るため。

## 不足している仕様

(なし)
