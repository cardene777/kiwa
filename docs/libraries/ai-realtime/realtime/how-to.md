# Realtime を使う

provider ごとに event を届ける入口が異なります。Supabase は channel と event filter、Socket.IO は namespace と room、Ably は channel と message name、Pusher は channel と binding を使います。このページの file は、同じ chat event をそれぞれの adapter で受け取る例です。利用している provider の `it` を残し、アプリケーションの channel 名、room 名、payload、認可条件に置き換えてください。

## provider ごとの配信を確認する

`tests/realtime-providers.test.ts` を作り、次の内容を保存します。fake timer の後始末を含むため、個別の断片を結合する必要はありません。

```ts
import {
  createAblyMock,
  createPusherMock,
  createSocketioMock,
  createSupabaseRealtimeMock,
} from "@kiwa-lab/realtime";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
});

describe("realtime provider recipes", () => {
  it("delivers a Supabase broadcast scheduled by a scenario", async () => {
    vi.useFakeTimers();
    const supabase = createSupabaseRealtimeMock({
      artificialLatencyMs: 0,
      scenarios: {
        "room:1": [
          { kind: "broadcast", event: "chat", payload: { text: "hello" }, delay: 0 },
        ],
      },
    });
    const received: unknown[] = [];
    const subscribing = supabase
      .channel("room:1")
      .on("broadcast", { event: "chat" }, (event) => received.push(event))
      .subscribe();

    await vi.runAllTimersAsync();
    await subscribing;

    expect(received).toEqual([
      { type: "broadcast", event: "chat", payload: { text: "hello" } },
    ]);
  });

  it("delivers a Socket.IO broadcast only to the joined room", async () => {
    vi.useFakeTimers();
    const io = createSocketioMock({ artificialLatencyMs: 0 });
    const socket = io.io("/chat");
    const received: unknown[] = [];
    socket.on("broadcast", (data) => received.push(data));

    await vi.runAllTimersAsync();
    await socket.join("room-1");
    io.of("/chat").to("room-1").emit("broadcast", { text: "server push" });
    await vi.runAllTimersAsync();

    expect(received).toEqual([{ text: "server push" }]);
  });

  it("delivers an Ably message with its event name", async () => {
    vi.useFakeTimers();
    const client = createAblyMock({ artificialLatencyMs: 0 });
    const channel = client.channels.get("room-1");
    const received: unknown[] = [];
    const subscribing = channel.subscribe("chat", (message) => received.push(message));

    await vi.runAllTimersAsync();
    await subscribing;
    const publishing = channel.publish("chat", { text: "hello" });
    await vi.runAllTimersAsync();
    await publishing;

    expect(received).toMatchObject([{ name: "chat", data: { text: "hello" } }]);
  });

  it("delivers a Pusher event after a handler is bound", async () => {
    vi.useFakeTimers();
    const client = createPusherMock({ artificialLatencyMs: 0 });
    const channel = client.subscribeChannel("room-1");
    const received: unknown[] = [];
    channel.bind("chat", (data) => received.push(data));

    await vi.runAllTimersAsync();
    channel.trigger("chat", { text: "hello" });
    await vi.runAllTimersAsync();

    expect(received).toEqual([{ text: "hello" }]);
  });
});
```

## 実行する

```bash
pnpm exec vitest run tests/realtime-providers.test.ts
```

Supabase の test は scenario が作る event 列を確認します。Socket.IO の test は room に参加した socket だけが server push を受けることを確認します。room へ参加していない利用者が値を受けない assertion も、同じ namespace にもう一つ socket を作って追加できます。

Ably は `subscribe` に指定した message name と、受信した message の `name` と `data` を確認します。Pusher は `bind` を呼んでから `trigger` します。presence は通常の channel event と状態が異なるため、member の参加や離脱を test するときは presence channel を分け、membership event を assertion にします。

## 実環境へ渡す確認

この mock が保証するのは、テスト内で作った event の順序、channel または room の分離、payload の変換です。実 socket connection、provider の認証、RLS、reconnect 中の delivery guarantee、server 側 acknowledgement、複数 process 間の ordering は証明しません。実 provider の credential と test project を使う integration test を追加し、ブラウザが実際に再接続する動きは E2E test で確認してください。

handler が呼ばれない場合は、まず adapter の入口を確認します。Supabase は channel 名と event filter、Socket.IO は namespace と room 参加、Ably は message name、Pusher は `bind` の event 名が一致している必要があります。timer を使う test で待ち続ける場合は、任意の sleep を増やさず `vi.runAllTimersAsync()` を subscription と publish の後に置いてください。
