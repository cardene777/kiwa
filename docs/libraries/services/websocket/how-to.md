# @kiwa-lab/websocket 使い方

この harness は message routing と接続 state を process 内で確認します。実 socket は開きません。server からの broadcast と client からの `send` は別の経路であり、`client.close()` と `server.disconnect()` も異なる状態を作ります。

次の file を `tests/chat.websocket.test.ts` として保存してください。private message、room の presence、server 主導の disconnect を一緒に確認します。

```ts
import { describe, expect, it } from "vitest";
import {
  connectClient,
  createRoomRegistry,
  createWSServer,
  sendMessage,
} from "@kiwa-lab/websocket";

describe("chat routing", () => {
  it("sends a private message only to its target", () => {
    const server = createWSServer();
    const alice = connectClient(server, { id: "alice" });
    const bob = connectClient(server, { id: "bob" });

    sendMessage(server, "bob", { type: "private", data: "secret" });

    expect(alice.received()).toEqual([]);
    expect(bob.received()).toEqual([{ type: "private", data: "secret" }]);
    expect(server.listSent()).toEqual([]);
  });

  it("keeps room membership separate from the server client list", () => {
    const server = createWSServer();
    const alice = connectClient(server, { id: "alice" });
    const bob = connectClient(server, { id: "bob" });
    const rooms = createRoomRegistry(() => 100);
    rooms.join("team-a", alice);
    rooms.join("team-a", bob);

    expect(rooms.broadcastToRoom("team-a", "update")).toBe(2);
    expect(rooms.presenceOf("team-a")).toEqual([
      { clientId: "alice", joinedAt: 100 },
      { clientId: "bob", joinedAt: 100 },
    ]);

    rooms.leave("team-a", "bob");
    expect(rooms.broadcastToRoom("team-a", "follow-up")).toBe(1);
    expect(alice.received()).toEqual(["update", "follow-up"]);
    expect(bob.received()).toEqual(["update"]);
  });

  it("disconnects a client from the server and prevents later sends", () => {
    const server = createWSServer();
    const alice = connectClient(server, { id: "alice" });
    const closed: Array<[number, string]> = [];
    alice.onClose((code, reason) => closed.push([code, reason]));

    server.disconnect("alice");

    expect(alice.isOpen).toBe(false);
    expect(server.clients().map((client) => client.id)).not.toContain("alice");
    expect(closed).toEqual([[1006, "server disconnected"]]);
    expect(() => alice.send("late")).toThrow(/closed/);
  });
});
```

```bash
pnpm exec vitest run tests/chat.websocket.test.ts
```

direct `sendMessage` は server の broadcast record を追加しません。全 client への broadcast を record とともに検証したい場合は `broadcastMessage` または `server.broadcast` を使います。存在しない target は `client not found` error になります。

`client.close()` は client を closed にしても server の client list から外しません。`server.disconnect(id)` が list から外して close handler を呼びます。room registry も server から独立しているため、disconnect 後に member を残すかを application が決め、必要なら `leave` を明示してください。

WebSocket handshake、TLS、fragmentation、network backpressure、browser reconnect、Socket.IO acknowledgement は対象外です。実 runtime と browser を起動する integration test で確認してください。
