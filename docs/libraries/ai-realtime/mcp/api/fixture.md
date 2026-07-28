---
title: "@kiwa-lab/mcp fixture の API 契約"
---

# <code v-pre>@kiwa-lab/mcp</code> <code v-pre>fixture</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildCalcTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L53) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const buildCalcTool: () => McpTool;
```

#### <code v-pre>buildDbQueryTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L204) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const buildDbQueryTool: () => McpTool;
```

#### <code v-pre>buildEchoTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L26) <code v-pre>packages/mcp/src/fixture.ts</code>

5 tool builder — kiwa test で頻出する MCP tool の shape を SSOT 化。 各 builder は `(server) =&gt; tool + handler` を返す形ではなく `(server) =&gt; void` で直接 register する。 test は `registerEcho(server)` 1 行で使い始められる。 ### 5 tool の役割分担 | tool | 想定シナリオ | |---|---| | echo | JSON-RPC handshake + tools/call chain の smoke test | | calc | 数値 arg + validation error path | | weather | enum arg + mock data 分岐 | | search | array return + relevance ranking (word overlap 近似) | | db-query | multi-arg + isError=true path (SQL parse error mock) | 各 builder は tool definition だけを取り出す helper (`buildXTool`) も提供し、 schema 検証 test 用に直接 return する。

```ts
export declare const buildEchoTool: () => McpTool;
```

#### <code v-pre>buildSearchTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L153) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const buildSearchTool: () => McpTool;
```

#### <code v-pre>buildWeatherTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L110) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const buildWeatherTool: () => McpTool;
```

#### <code v-pre>calcHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L67) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const calcHandler: ToolHandler;
```

#### <code v-pre>dbQueryHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L217) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const dbQueryHandler: ToolHandler;
```

#### <code v-pre>echoHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L38) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const echoHandler: ToolHandler;
```

#### <code v-pre>registerAllFixtureTools</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L234) <code v-pre>packages/mcp/src/fixture.ts</code>

5 tool を一括 register。 tutorial / dogfood 起動用の 1 行 setup。

```ts
export declare function registerAllFixtureTools(server: McpServer): void;
```

#### <code v-pre>registerCalc</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L93) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare function registerCalc(server: McpServer): void;
```

#### <code v-pre>registerDbQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L227) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare function registerDbQuery(server: McpServer): void;
```

#### <code v-pre>registerEcho</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L44) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare function registerEcho(server: McpServer): void;
```

#### <code v-pre>registerSearch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L187) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare function registerSearch(server: McpServer): void;
```

#### <code v-pre>registerWeather</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L135) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare function registerWeather(server: McpServer): void;
```

#### <code v-pre>searchHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L166) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const searchHandler: ToolHandler;
```

#### <code v-pre>weatherHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L123) <code v-pre>packages/mcp/src/fixture.ts</code>

```ts
export declare const weatherHandler: ToolHandler;
```


