# @kiwa-lab/macos-app API reference

## Overview

`@kiwa-lab/macos-app` は SwiftUI / AppKit ベースの macOS native app 開発 workflow を in-process で mock する test infra。 real Xcode / XCTest 起動なしで bundle info / view tree / accessibility descriptor / screencap / user notification を叩ける。

## Supported patterns

| pattern | function | notes |
|---|---|---|
| SwiftUI mode | `createMacAppEnv({mode:'swiftui'})` | View state tree |
| AppKit mode | `createMacAppEnv({mode:'appkit'})` | NSWindow / NSView |
| Interaction | `simulateUserInteraction` | click / keypress / gesture |
| Accessibility | `captureAccessibilityTree` | AXUIElement 相当 |
| Screencap | `mockScreencap` | CGDisplayCreateImage 相当 |
| Notification | `emitUserNotification` | UNUserNotificationCenter 相当 |

## Main API

### `createMacAppEnv(options: CreateMacAppEnvOptions): MacAppEnv`

`{ mode, bundleInfo?, initialViews?, windows? }` で mock env 生成。 `env.mount(view)` / `env.stop()` を提供。

### `simulateUserInteraction(env, event: InteractionEvent): InteractionResult`

`{ type: 'click'|'keypress'|'gesture', target, payload? }` を dispatch、 `{ handled, propagatedTo, sideEffects }` を返す。

### `captureAccessibilityTree(env): AccessibilityTree`

現 view の accessibility descriptor を tree で取得、 `{ root: AccessibilityNode }`、 各 node = `{ role, label, value?, children?, actions? }`。

### `mockScreencap(env, options: ScreencapOptions): ScreencapResult`

`{ region?, scale?, format? }` で mock PNG bytes を返す、 `{ pngBytes, width, height, capturedAt }`。

### `emitUserNotification(env, notification: UserNotification): NotificationResult`

`{ title, body, actions? }` で NSUserNotification 相当を発火、 `{ delivered, notificationId, respondedAction? }`。

## Types

- `MacAppMode = 'swiftui' | 'appkit'`
- `BundleInfo` = `{ id, name, version, build }`
- `ViewNode` = `{ id, kind, props, children?: ViewNode[] }`
- `AccessibilityRole = 'button' | 'text' | 'image' | 'group' | 'link' | 'menu' | 'checkbox' | ...`
- `InteractionType = 'click' | 'keypress' | 'gesture'`

## Usage examples

### SwiftUI View mount + click

```typescript
import { createMacAppEnv, simulateUserInteraction, captureAccessibilityTree } from '@kiwa-lab/macos-app';
import { describe, expect, it } from 'vitest';

describe('login screen', () => {
  it('sign in button click で auth flow が始まる', () => {
    const env = createMacAppEnv({
      mode: 'swiftui',
      initialViews: [{ id: 'signInBtn', kind: 'Button', props: { title: 'Sign in' } }],
    });
    const result = simulateUserInteraction(env, { type: 'click', target: 'signInBtn' });
    expect(result.handled).toBe(true);
    const a11y = captureAccessibilityTree(env);
    expect(a11y.root.children?.some((n) => n.role === 'button')).toBe(true);
  });
});
```

### User notification

```typescript
import { createMacAppEnv, emitUserNotification } from '@kiwa-lab/macos-app';

const env = createMacAppEnv({ mode: 'appkit' });
const result = emitUserNotification(env, {
  title: 'Build completed',
  body: 'Xcode build succeeded in 45s',
  actions: [{ id: 'show', title: 'Show' }, { id: 'dismiss', title: 'Dismiss' }],
});
expect(result.delivered).toBe(true);
```

## Related skills

- [`/kiwa-macos-app`](../skills/kiwa-macos-app) — macOS native app test 生成 skill
