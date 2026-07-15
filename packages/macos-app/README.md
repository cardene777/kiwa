# @kiwa-lab/macos-app

macOS native app test harness for kiwa — SwiftUI / AppKit / XCTest / accessibility / screencap / notification を in-process mock で叩く test infra。 real Xcode runtime 不要で design-time に近い test を書く。

## Installation

```bash
pnpm add -D @kiwa-lab/macos-app
# or
npm install -D @kiwa-lab/macos-app
# or
yarn add -D @kiwa-lab/macos-app
```

## Supported modes

| Mode | Framework | Status |
|---|---|---|
| swiftui | SwiftUI View | ✅ |
| appkit | NSWindow / NSView | ✅ |

## Quick start

```ts
import {
  createMacAppEnv,
  simulateUserInteraction,
  captureAccessibilityTree,
  mockScreencap,
  emitUserNotification,
} from '@kiwa-lab/macos-app';

const env = createMacAppEnv({ mode: 'swiftui', bundleId: 'com.example.app' });

env.mountView({
  id: 'root',
  role: 'group',
  children: [
    { id: 'btn', role: 'button', label: 'Save', accessibilityLabel: 'Save button' },
  ],
});

const clickResult = simulateUserInteraction(env, {
  type: 'click', target: 'btn',
});

const a11y = captureAccessibilityTree(env);
const shot = mockScreencap(env, { region: { x: 0, y: 0, width: 800, height: 600 } });
const notif = emitUserNotification(env, {
  title: 'Saved', body: 'Your file is saved', actions: [{ id: 'undo', title: 'Undo' }],
});
```

## API reference

- `createMacAppEnv(options: CreateMacAppEnvOptions): MacAppEnv` — mode 別 native app env 生成
- `MacAppEnv.mountView(node: ViewNode) / mountWindow(info: WindowInfo)` — UI mount (SwiftUI / AppKit)
- `simulateUserInteraction(env, event: InteractionEvent): InteractionResult` — click / keypress / gesture dispatch
- `captureAccessibilityTree(env): AccessibilityTree` — accessibility API snapshot
- `mockScreencap(env, options: ScreencapOptions): ScreencapResult` — CGDisplayCreateImage 相当 mock PNG bytes
- `emitUserNotification(env, notification: UserNotification): NotificationResult` — UserNotifications framework mock

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createMacAppEnv, simulateUserInteraction } from '@kiwa-lab/macos-app';

describe('save button', () => {
  it('click で onPress が発火', () => {
    const env = createMacAppEnv({ mode: 'swiftui' });
    env.mountView({ id: 'btn', role: 'button', label: 'Save' });
    const r = simulateUserInteraction(env, { type: 'click', target: 'btn' });
    expect(r.dispatched).toBe(true);
  });
});
```

`/kiwa-macos-app` skill を起動すると SwiftUI / AppKit / a11y / screencap / notification の test を生成できる。

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
