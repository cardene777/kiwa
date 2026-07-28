---
title: "@kiwa-lab/email template の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/email</code> <code v-pre>template</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/email/src/template.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>renderTemplate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/template.ts#L13) <code v-pre>packages/email/src/template.ts</code>

`&#123;&#123;name&#125;&#125;` placeholder を data で置換する mustache-lite template。 実 provider の template engine (Handlebars / MJML) を差し替えても同じ signature で呼べる想定。

```ts
export declare function renderTemplate(template: string, data: EmailTemplateContext): TemplateRenderResult;
```

### 型

#### <code v-pre>TemplateRenderResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/template.ts#L3) <code v-pre>packages/email/src/template.ts</code>

```ts
export interface TemplateRenderResult {
    html: string;
    variables: string[];
    missing: string[];
}
```
