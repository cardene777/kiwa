---
title: "@kiwa-lab/python template の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/python</code> <code v-pre>template</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/python/src/template.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>renderTemplate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/template.ts#L15) <code v-pre>packages/python/src/template.ts</code>

Jinja2 相当の `&#123;&#123; var &#125;&#125;` interpolation。 template を env に register してから name 指定で render。 real Jinja2 の filter / for loop は含まない minimal 実装。

```ts
export declare function renderTemplate(env: PythonAppEnv, name: string, context: TemplateContext): TemplateRenderResult;
```

### 型

#### <code v-pre>TemplateContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/template.ts#L3) <code v-pre>packages/python/src/template.ts</code>

```ts
export type TemplateContext = Record<string, string | number | boolean>;
```

#### <code v-pre>TemplateRenderResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/template.ts#L5) <code v-pre>packages/python/src/template.ts</code>

```ts
export interface TemplateRenderResult {
    html: string;
    variables: string[];
    missing: string[];
}
```
