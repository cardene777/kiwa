# @kiwa-lab/websocket をはじめる

このチュートリアルでは、server に二つの client を接続し、broadcast と client から server への message を同じ test file で確認します。作る server は network socket を listen しません。アプリケーションの message routing と接続状態を process 内で固定する test fixture です。

## インストール

```bash
pnpm add -D @kiwa-lab/websocket vitest
```

## broadcast と client message を確認する

`tests/kiwa/websocket.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import {
  broadcastMessage,
  connectClient,
  createWSServer,
} from "@kiwa-lab/websocket";

describe("chat server", () => {
  it("broadcasts to connected clients and records the delivery", () => {
    const server = createWSServer({ provider: "socketio", now: () => 42 });
    const alice = connectClient(server, { id: "alice" });
    const bob = connectClient(server, { id: "bob" });

    broadcastMessage(server, { type: "message", data: { text: "hello" } });

    expect(alice.received()).toEqual([{ type: "message", data: { text: "hello" } }]);
    expect(bob.received()).toEqual([{ type: "message", data: { text: "hello" } }]);
    expect(server.listSent()).toEqual([
      expect.objectContaining({ target: "broadcast", sentAt: 42 }),
    ]);
  });

  it("sends a client message to the server handler only", () => {
    const server = createWSServer();
    const alice = connectClient(server, { id: "alice" });
    const bob = connectClient(server, { id: "bob" });
    const incoming: unknown[] = [];
    server.on("onMessage", (_client, payload) => incoming.push(payload));

    alice.send("from alice");

    expect(incoming).toEqual(["from alice"]);
    expect(bob.received()).toEqual([]);
    expect(server.listSent()).toEqual([
      expect.objectContaining({ target: "client", clientId: "alice", payload: "from alice" }),
    ]);
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/kiwa/websocket.test.ts
```

`received()` と `listSent()` は copy を返します。戻り値を変更しても client inbox や server record は変わりません。client の `send` は server の `onMessage` handler を呼び、server の送信記録には client-originated record を追加します。ただし他の client の inbox へ自動で配送しません。

WebSocket handshake、browser event、network 遅延、provider 固有 protocol はこの command では検証しません。private message、room、切断、binary frame は [使い方](./how-to) を確認してください。

## skill で test を作る

この library には `/kiwa:kiwa-websocket` という companion skill があります。初回だけ kiwa plugin を導入してから使います。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

skill は library の挙動を実行時に置き換えるものではなく、ここで確認したい message routing の境界を test の形にする入口です。

```text
/kiwa:kiwa-websocket --module chat --output tests/integration/chat.ws.test.ts
```

生成後は `tests/integration/chat.ws.test.ts` を読み、Quickstart と同じ成功条件・失敗条件が期待値になっていることを確認してから、その file だけを実行します。

```bash
pnpm exec vitest run tests/integration/chat.ws.test.ts
```

provider や対象の種類、出力先を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-websocket/SKILL.md) を参照してください。
