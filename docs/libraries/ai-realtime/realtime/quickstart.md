# Realtime を始める

この Quickstart では、Supabase Realtime の channel を購読し、scenario に記録した broadcast が画面側の handler へ届くことを確認します。実 Supabase project には接続しません。UI が受け取った event と payload を test したい場合に使います。

## インストールする

```bash
pnpm add -D @kiwa-lab/realtime vitest
```

Node.js 20 以降が必要です。

## 最初の購読テストを書く

`tests/realtime.test.ts` を作り、次の内容を保存します。

```ts
import { createSupabaseRealtimeMock } from "@kiwa-lab/realtime";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
});

it("scenario の broadcast を購読した channel が受け取る", async () => {
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
```

## 実行する

```bash
pnpm exec vitest run tests/realtime.test.ts
```

成功すると、`room:1` の購読後に `chat` event が一回だけ届きます。`vi.runAllTimersAsync()` は connection、subscription、scenario の timer を明示的に進めます。実時間の待機を置くと CI の負荷や速度で test が不安定になるため、このように mock が作った timer を進めてください。

event が届かないときは、channel 名、`on` に渡した event filter、`subscribe` が完了する前に scenario を消費していないかを確認します。別の event を受け取ってはいけない case も、同じ handler に filter と異なる event を渡して `received` が増えないことを test します。

## 次に進む

[使い方](./how-to) では、Socket.IO の room、Ably の message name、Pusher の event binding を含む一つの test file を示します。実 socket handshake、Supabase の RLS、provider authentication、delivery acknowledgement は mock の外側です。実 project または staging environment を使う integration と browser E2E test で確認してください。

<!-- skill-guide -->
## skill を使う場合

この library に専用の companion skill はありません。まずこの Quickstart のように、画面が受け取る event と期待する結果を直接 test に書きます。仕様から test の下書きを作る場合は、初回だけ plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

画面の event contract を整理してから Vitest の下書きを作る場合は、次を実行します。

```text
/kiwa:kiwa-design --layer unit --module room-events
/kiwa:kiwa-vitest --module room-events
```

生成物は realtime provider の接続確認ではありません。channel 名、event filter、payload、画面の期待結果を Quickstart の例と照合し、対象 file を実行してください。

```bash
pnpm exec vitest run tests/realtime.test.ts
```
