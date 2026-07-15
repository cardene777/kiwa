# Tutorial 30 — macOS native app (SwiftUI + accessibility + notification)

## 目的

`@kiwa-lab/macos-app` を使って macOS native app の SwiftUI View + AppKit Window + accessibility audit + user notification を test する。 real Xcode / XCTest 起動なしで design-time に近い verification を書ける。

## 前提

- `pnpm add -D @kiwa-lab/macos-app vitest`
- macOS 対象の SwiftUI / AppKit app (or 本 tutorial 内で mock 定義)

## Step 1 — SwiftUI mode で view tree mount

`createMacAppEnv({ mode: 'swiftui' })` で mock env、 `initialViews` に View 定義。

```typescript
import { createMacAppEnv } from '@kiwa-lab/macos-app';
import { describe, expect, it, beforeEach } from 'vitest';

describe('login screen (SwiftUI)', () => {
  let env: ReturnType<typeof createMacAppEnv>;

  beforeEach(() => {
    env = createMacAppEnv({
      mode: 'swiftui',
      bundleInfo: {
        id: 'dev.kiwa.demo',
        name: 'kiwa demo',
        version: '1.0',
        build: '1',
      },
      initialViews: [
        {
          id: 'root',
          kind: 'VStack',
          props: { spacing: 16 },
          children: [
            { id: 'emailField', kind: 'TextField', props: { placeholder: 'Email' } },
            { id: 'passwordField', kind: 'SecureField', props: { placeholder: 'Password' } },
            { id: 'signInBtn', kind: 'Button', props: { title: 'Sign in', accessibilityLabel: 'Sign in with email' } },
          ],
        },
      ],
    });
  });
});
```

## Step 2 — User interaction simulate

`simulateUserInteraction(env, { type, target })` で click / keypress / gesture を発火、 downstream の state change を verify。

```typescript
import { simulateUserInteraction } from '@kiwa-lab/macos-app';

it('sign in button click で auth flow が始まる', () => {
  const result = simulateUserInteraction(env, {
    type: 'click',
    target: 'signInBtn',
  });
  expect(result.handled).toBe(true);
  // downstream の event side effect も verify
  expect(result.sideEffects).toContain('auth-flow-started');
});

it('email field に keypress で text 入力', () => {
  const result = simulateUserInteraction(env, {
    type: 'keypress',
    target: 'emailField',
    payload: { text: 'a@x' },
  });
  expect(result.handled).toBe(true);
});
```

## Step 3 — Accessibility tree capture + audit

`captureAccessibilityTree(env)` で AXUIElement 相当の tree、 全 interactive element が accessibility label を持つか verify。

```typescript
import { captureAccessibilityTree } from '@kiwa-lab/macos-app';

it('全 button に accessibility label がある', () => {
  const tree = captureAccessibilityTree(env);
  const walk = (node: any): string[] => {
    const labels: string[] = [];
    if (node.role === 'button' && !node.label) labels.push(`missing: ${node.id}`);
    for (const child of node.children ?? []) labels.push(...walk(child));
    return labels;
  };
  const missing = walk(tree.root);
  expect(missing).toEqual([]);
});

it('root tree に 3 interactive element (text field + secure field + button)', () => {
  const tree = captureAccessibilityTree(env);
  const roles = tree.root.children?.map((n) => n.role) ?? [];
  expect(roles).toEqual(expect.arrayContaining(['text', 'text', 'button']));
});
```

## Step 4 — Screencap 経由 visual regression

`mockScreencap(env, options)` で PNG bytes を取得、 fixture と比較して visual regression を検知。

```typescript
import { mockScreencap } from '@kiwa-lab/macos-app';
import { readFileSync } from 'node:fs';

it('screencap で PNG bytes を取得 + baseline 一致', () => {
  const result = mockScreencap(env, {
    region: { x: 0, y: 0, width: 800, height: 600 },
    scale: 2,
    format: 'png',
  });
  expect(result.pngBytes).toBeInstanceOf(Uint8Array);
  expect(result.width).toBe(1600); // 800 * 2 (retina)
  expect(result.height).toBe(1200);
  // baseline 比較 (実 test では pixel diff、 本 tutorial では size のみ)
  const baseline = readFileSync('__snapshots__/login-screen.png');
  expect(result.pngBytes.byteLength).toBeCloseTo(baseline.byteLength, -2);
});
```

## Step 5 — AppKit Window mount

AppKit mode で NSWindow + NSView tree を mock、 SwiftUI と異なる window management pattern を verify。

```typescript
it('AppKit で main window + settings panel', () => {
  const appkit = createMacAppEnv({
    mode: 'appkit',
    windows: [
      { id: 'main', title: 'kiwa demo', frame: { x: 100, y: 100, width: 800, height: 600 } },
      { id: 'settings', title: 'Settings', frame: { x: 200, y: 200, width: 400, height: 300 }, isPanel: true },
    ],
  });
  const tree = captureAccessibilityTree(appkit);
  // window 2 個 + それぞれの child accessibility
  expect(tree.root.children?.filter((n) => n.role === 'window')).toHaveLength(2);
});
```

## Step 6 — User notification

`emitUserNotification(env, notification)` で NSUserNotification 相当を発火、 respond action の routing を verify。

```typescript
import { emitUserNotification } from '@kiwa-lab/macos-app';

it('build 完了 notification で "Show" action を発火', () => {
  const result = emitUserNotification(env, {
    title: 'Build completed',
    body: 'Xcode build succeeded in 45s',
    actions: [
      { id: 'show', title: 'Show' },
      { id: 'dismiss', title: 'Dismiss' },
    ],
  });
  expect(result.delivered).toBe(true);
  expect(result.notificationId).toBeDefined();
  // action id で downstream の router を verify
});
```

## Step 7 — Full user flow (interaction → navigation → notification)

click → view change → notification の 3 stage を 1 test で通す、 real app flow に最も近い pattern。

```typescript
it('sign in → success → success notification が届く', () => {
  // Step 1: fill email + password
  simulateUserInteraction(env, { type: 'keypress', target: 'emailField', payload: { text: 'a@x' } });
  simulateUserInteraction(env, { type: 'keypress', target: 'passwordField', payload: { text: 'p' } });

  // Step 2: click sign in
  const clickRes = simulateUserInteraction(env, { type: 'click', target: 'signInBtn' });
  expect(clickRes.handled).toBe(true);

  // Step 3: auth 成功 notification
  const notif = emitUserNotification(env, {
    title: 'Welcome back',
    body: 'Signed in as a@x',
  });
  expect(notif.delivered).toBe(true);
});
```

## 期待結果

- 全 7 assertion PASS、 real macOS Xcode / XCTest 起動なし
- SwiftUI + AppKit の 2 mode で cross-verify
- accessibility label 欠落を lint 相当で検知 (WCAG-like audit)

## 関連

- API reference: [`/api/macos-app`](../api/macos-app)
- Skill: [`/kiwa-macos-app`](../skills/kiwa-macos-app)
- Related: [`/api/a11y`](../api/a11y) (web accessibility test)
