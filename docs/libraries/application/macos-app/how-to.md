# @kiwa-lab/macos-app の使い方

この手順では、inbox の Start 操作を記録し、view tree から accessibility role を取得し、決定的な PNG mock を作り、未読通知の成功と空通知の拒否を確認します。操作の結果で画面を描画し直すものではありません。native API へ渡す内容がアプリケーションの契約に合うことを速く固定します。

## inbox の native 操作を test にする

次の内容を `tests/inbox.macos-app.test.ts` にそのまま保存してください。`captureAccessibilityTree` は view type から role を推定し、`mockScreencap` は実 screenshot ではなく format magic を持つ決定的な byte 列を返します。通知は OS へ送らず event log に scheduled または rejected を記録します。

```ts
import { expect, it } from "vitest";
import {
  captureAccessibilityTree,
  createMacAppEnv,
  emitUserNotification,
  mockScreencap,
  simulateUserInteraction,
} from "@kiwa-lab/macos-app";

it("inbox の操作、a11y、screencap、通知を確認する", () => {
  const env = createMacAppEnv({
    mode: "swiftui",
    bundleId: "com.example.inbox",
    now: () => 1_000,
  });
  const click = simulateUserInteraction(env, { type: "click", target: "action" });
  const tree = captureAccessibilityTree(env);
  const capture = mockScreencap(env, { format: "png", region: { x: 0, y: 0, width: 100, height: 80 } });
  const scheduled = emitUserNotification(env, {
    title: "New message",
    body: "You have 1 unread",
    actions: [{ id: "reply", title: "Reply" }],
  });
  const rejected = emitUserNotification(env, { title: " ", body: " " });

  expect(click.dispatched).toBe(true);
  expect(tree).toMatchObject({
    totalNodes: 3,
    root: {
      role: "AXGroup",
      children: [
        { id: "title", role: "AXStaticText", label: "Welcome" },
        { id: "action", role: "AXButton", label: "Start" },
      ],
    },
  });
  expect(capture).toMatchObject({ format: "png", bytesLength: capture.bytes.length });
  expect([...capture.bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(scheduled).toMatchObject({ scheduled: true, bundleId: "com.example.inbox" });
  expect(rejected).toMatchObject({
    scheduled: false,
    reason: "title / body must be non-empty",
  });
  expect(env.eventLog.map(event => event.kind)).toEqual([
    "click:action",
    `notification:scheduled:${scheduled.id}`,
    `notification:rejected:${rejected.id}`,
  ]);
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/inbox.macos-app.test.ts
```

成功時には、view tree の `action` が Button として見つかり、PNG mock は PNG signature を持ち、有効な通知だけが scheduled になります。空白だけの title または body は送信せず、理由を返します。

## macOS 上で確認すること

role は view type からの推定であり、実 AXUIElement 属性や VoiceOver の読み上げを証明しません。screencap は GPU の画面出力ではなく、pixel regression には使えません。SwiftUI の state 更新、AppKit responder chain、UserNotifications の permission と callback、実画面の見た目は macOS 上の UI automation または統合 test に分けてください。公開 API は [リファレンス](./reference) を参照してください。
