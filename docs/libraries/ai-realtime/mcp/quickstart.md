# MCP を始める

`@kiwa-lab/mcp` はインメモリ転送で MCP サーバーとクライアントを接続します。ハンドシェイクとツール呼び出しを同じプロセス内で確認できます。

## インストール

```sh
pnpm add -D @kiwa-lab/mcp vitest
```

Node.js 20 以降が必要です。

## fixture ツールを呼び出す

```ts
import { expect, test } from 'vitest';
import { connectClientToServer, McpServer, registerAllFixtureTools } from '@kiwa-lab/mcp';

test('calc fixture が JSON-RPC response を返す', async () => {
  const server = new McpServer({ name: 'test-server', version: '1.0.0' });
  registerAllFixtureTools(server);
  const { client } = await connectClientToServer(server);
  const result = await client.callTool('calc', { op: 'add', a: 2, b: 3 });

  expect(result.content[0]).toEqual({ type: 'text', text: '5' });
  await expect(client.callTool('echo', { message: 123 })).rejects.toMatchObject({ code: -32001 });
});
```

この例を `tests/mcp.test.ts` に保存して `pnpm exec vitest run tests/mcp.test.ts` を実行します。

connectClientToServer は初期化まで完了した McpClient と InMemoryTransport を返します。client IDはこのclient内で1から増え、isInitialized と serverProtocolVersion でhandshake後の状態を確認できます。

calc は4演算だけのfixtureです。weather、search、db-query も外部APIやdatabaseを呼ばない固定fixtureで、実providerの互換性を保証しません。

独自の schema と handler を登録する場合は、続けて [独自ツールを登録する](./how-to) を読みます。handshake、JSON-RPC error、公開型を確認したい場合は [API リファレンス](./reference) を参照してください。
<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、入力から結果までの境界を直接確認してください。仕様から test の土台を作る場合は、初回だけ kiwa plugin を導入して対象に合う skill を選びます。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

MCP tool の契約を仕様から test に落とす場合は、まず入力 schema、成功 response、拒否すべき入力を `kiwa-design` で整理します。次に `kiwa-vitest` で test file を作り、生成結果に `McpServer`、`connectClientToServer`、成功と schema rejection の二経路が含まれることを確認します。

```text
/kiwa:kiwa-design --layer unit --module notes-tool
/kiwa:kiwa-vitest --module notes-tool
```

既定の出力先を使った場合は、次で生成された file だけを実行します。

```bash
pnpm exec vitest run test/unit/notes-tool.test.ts
```

この test が保証するのは in-memory transport 上の schema と response contract です。stdio、SSE、WebSocket、認証、外部 service との接続は提供しないため、production では実 transport を使う integration test を別に実行します。
