# 独自ツールを登録する

独自の MCP tool を test するときは、server に schema と handler を登録し、初期化済み client から呼び出します。この一組を同じ test で作ると、入力 schema、handler の戻り値、JSON-RPC error を network なしで確認できます。

## 実行可能な tool test を書く

`tests/notes-tool.test.ts` に次を保存します。最初の test は有効な input が handler に届くことを、二つ目の test は schema rejection で handler が実行されないことを検証します。

```ts
import { expect, test, vi } from 'vitest';
import {
  connectClientToServer,
  McpServer,
  textContent,
} from '@kiwa-lab/mcp';

function createNotesServer() {
  const server = new McpServer({ name: 'notes', version: '1.0.0' });
  const handler = vi.fn(async (input: Record<string, unknown>) => [
    textContent(String(input.text)),
  ]);

  server.register(
    {
      name: 'echo',
      description: 'Returns the supplied text',
      inputSchema: {
        type: 'object',
        properties: { text: { type: 'string' } },
        required: ['text'],
      },
    },
    handler,
  );
  return { server, handler };
}

test('valid input returns the handler content', async () => {
  const { server } = createNotesServer();
  const { client } = await connectClientToServer(server);

  const result = await client.callTool('echo', { text: 'hello' });

  expect(result.content).toEqual([{ type: 'text', text: 'hello' }]);
});

test('invalid input is rejected before the handler runs', async () => {
  const { server, handler } = createNotesServer();
  const { client } = await connectClientToServer(server);

  await expect(client.callTool('echo', { text: 123 })).rejects.toMatchObject({
    code: -32001,
  });
  expect(handler).not.toHaveBeenCalled();
});
```

`connectClientToServer` は client と in-memory transport を接続し、MCP handshake を完了させます。そのため、この例では `client.initialize` を別に呼びません。tool の input が schema を満たすと handler の `textContent` が JSON-RPC result の `content` に入ります。

## 実行して確認する

```bash
pnpm exec vitest run tests/notes-tool.test.ts
```

二件が pass すれば、文字列 input は handler に到達し、数値 input は `-32001` の schema error で止まっています。tool 名がない場合は別の JSON-RPC error になり、handler が throw した場合は `isError` を持つ tool execution result になります。入力不正、tool 不在、handler failure を同じ error として握りつぶさないでください。

## 接続と実 service の境界

この library の transport は process 内だけで動きます。実際の stdio、HTTP、SSE transport、LLM client、外部 database の接続は開きません。production server の compatibility を確認する場合は、この test で schema と response contract を固定したうえで、実 transport を使う integration test を別に置きます。

server と client は test ごとに新しく作ります。registry や transport state を共有すると、前の test が登録した tool や request ID が次の test に残り、失敗原因を追いにくくなります。[MCP を始める](./quickstart) では fixture tool を使った最小例、[API リファレンス](./reference) では handshake と error の public surface を確認できます。
