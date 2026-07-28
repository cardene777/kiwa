---
title: "@kiwa-lab/mcp tools の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mcp</code> <code v-pre>tools</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>textContent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L128) <code v-pre>packages/mcp/src/tools.ts</code>

shortcut — text content 1 block だけの result を組み立てる。 handler 実装補助。

```ts
export declare function textContent(text: string): ToolCallContent;
```

#### <code v-pre>ToolRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L21) <code v-pre>packages/mcp/src/tools.ts</code>

Tool registry — MCP server が保持する tool 一覧の SSOT。 register / unregister / list / get / validateInput の 5 op を提供する。 順序保持は Map の insertion order で担保、 real MCP と同じく tools/list の順序は register 順。

```ts
/**
 * Tool registry — MCP server が保持する tool 一覧の SSOT。 register / unregister /
 * list / get / validateInput の 5 op を提供する。 順序保持は Map の insertion
 * order で担保、 real MCP と同じく tools/list の順序は register 順。
 */
export declare class ToolRegistry {
    /**
     * register a tool。 同 name の既存 tool は上書きする (real MCP でも
     * tools/list_changed notification 後の再登録は上書き相当)。
     */
    register(tool: McpTool, handler: ToolHandler): void;
    /** unregister a tool by name。 存在しない場合は false を返す。 */
    unregister(name: string): boolean;
    /** register 順で全 tool の definition を返す。 */
    list(): McpTool[];
    /** 1 tool を name で lookup、 存在しない場合は undefined。 */
    get(name: string): RegisteredTool | undefined;
    /** 登録 tool 数。 */
    get size(): number;
}
```

#### <code v-pre>validateSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L64) <code v-pre>packages/mcp/src/tools.ts</code>

ToolInputSchema に対して input value を validate する。 real MCP は Draft 7 の full JSONSchema を許容するが、 kiwa mock は type + properties + required + items + enum + description の 5 種のみ検証する (types.ts のコメント SSOT)。 それ以外の schema keyword は「always valid」 扱い。 返り値 = validation error list。 empty なら valid。

```ts
export declare function validateSchema(schema: ToolInputSchema, value: unknown, path?: string): string[];
```

### 型

#### <code v-pre>RegisteredTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L11) <code v-pre>packages/mcp/src/tools.ts</code>

Registered tool = definition + handler。 server 内で name をキーに保持する。

```ts
export interface RegisteredTool {
    tool: McpTool;
    handler: ToolHandler;
}
```
