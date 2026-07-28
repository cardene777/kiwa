# MCP

`@kiwa-lab/mcp` は Model Context Protocol のサーバーとクライアントの往復を再現します。

## 検証する流れ

<img src="/images/kiwa-docs/ai-realtime/mcp-overview.webp" alt="MCP clientがserverを初期化しschemaを通してtoolを呼び出す流れ" width="1672" height="941" loading="lazy" decoding="async">

in-memory transport で client と server をつなぎ、initialize、tools list、tools call を同じプロセスで進めます。schema を通った input だけが handler へ届きます。不正な input では handler が呼ばれず、JSON-RPC error が client に返るため、validation と実行を分けて確認できます。

## 使う場面

MCPのtool呼び出しを実serverなしで統合テストするときに使います。stdio、SSE、WebSocket、認証、process lifecycleは実装しません。InMemoryTransport はrequestを同一process内のserverへ直接渡します。

## schemaの範囲

入力schemaはobject、string、number、integer、boolean、required、enumを扱う最小subsetです。完全なJSON Schemaのcomposition、reference、format、additional property policyを検証する用途には使わないでください。

## 最初の一歩

```sh
pnpm add -D @kiwa-lab/mcp
```

```ts
import { connectClientToServer, McpServer, registerAllFixtureTools } from '@kiwa-lab/mcp';

const server = new McpServer({ name: 'test-server', version: '1.0.0' });
registerAllFixtureTools(server);
const { client } = await connectClientToServer(server);
const result = await client.callTool('calc', { op: 'add', a: 2, b: 3 });
```

## ツール呼び出しを作る

[Quickstart](./quickstart) で fixture tool を呼び出し、[使い方](./how-to) でアプリケーション固有の schema を登録します。agent の状態遷移は [Agent](/libraries/ai-realtime/agent/)、LLM SDK との往復は [AI LLM](/libraries/ai-realtime/ai-llm/) を参照してください。JSON-RPC の型と error は [リファレンス](./reference) にあります。
