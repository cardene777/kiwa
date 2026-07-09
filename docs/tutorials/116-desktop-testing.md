# Desktop testing baseline — Electron + Tauri + Webview in 10 min

## What you'll build

A vitest suite wired to `@kiwa-lab/desktop` v0.1 (new-base pair 第 14、 **42 package 到達**、 v2.0 milestone desktop adapter goal 達成)、 3 axis (Electron + Tauri + Webview) × 3 target (macos + windows + linux) の workflow を deterministic に扱う pattern。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-desktop && cd kiwa-desktop
pnpm init
pnpm add -D @kiwa-lab/desktop@^0.1 vitest typescript @types/node
```

### 2. Electron axis (main + BrowserWindow + IPC + quit)

```ts
import { describe, expect, it } from 'vitest';
import {
  createBrowserWindow,
  dispatchIpcMessage,
  quitElectronApp,
  startElectronApp,
} from '@kiwa-lab/desktop';

describe('Electron lifecycle', () => {
  it('start → window → ipc → quit', () => {
    const s = startElectronApp({ target: 'macos', appId: 'com.example.app' });
    createBrowserWindow(s, 'main');
    dispatchIpcMessage(s, { channel: 'ping', payload: 'hello' });
    quitElectronApp(s);
    expect(s.state).toBe('quit');
    expect(s.ipcMessages).toBe(1);
  });
});
```

### 3. Tauri axis (invoke command + event listen + window mgmt)

```ts
import { describe, expect, it } from 'vitest';
import {
  closeTauriWindow,
  emitTauriEvent,
  invokeTauriCommand,
  registerTauriCommand,
  startTauriApp,
} from '@kiwa-lab/desktop';

describe('Tauri invoke flow', () => {
  it('register → invoke → emit → close', () => {
    const s = startTauriApp({ target: 'windows', appName: 'myapp' });
    registerTauriCommand(s, 'get_user');
    invokeTauriCommand(s, { commandName: 'get_user', payload: '{"id":1}' });
    emitTauriEvent(s, { eventName: 'user_updated', payload: '{"id":1}' });
    closeTauriWindow(s, 'main');
    expect(s.state).toBe('window-closed');
  });
});
```

### 4. Webview axis (preload + bridge + postMessage + isolation)

```ts
import { describe, expect, it } from 'vitest';
import {
  assertContextIsolation,
  bindContextBridge,
  loadPreloadScript,
  postWebviewMessage,
} from '@kiwa-lab/desktop';

describe('Webview bridge flow', () => {
  it('preload → bind → post → isolation asserted', () => {
    const s = loadPreloadScript({ target: 'linux', webviewId: 'main' });
    bindContextBridge(s, 'appAPI');
    postWebviewMessage(s, { channel: 'ping', payload: 'hi' });
    assertContextIsolation(s, true);
    expect(s.state).toBe('isolation-asserted');
    expect(s.contextIsolated).toBe(true);
  });
});
```

### 5. 実行

```bash
pnpm exec vitest run
# ✓ 3 tests pass
```

## Provider dialect

macos / windows / linux の 3 target で 12 neutral event × 3 target = 36 mapping。 target-neutral test の裏に platform-specific dialect (macos Electron / windows webview2 / linux webkit) を残す設計。

## 次の Step

- v1.56-2 dogfood app (`examples/dogfood-desktop-electron-app`) で 3 axis × 3 target = 9 grid workflow
- `docs/concepts/desktop-testing-baseline.md` で 3 axis SSOT + fidelity harness
- v1.57+ で advanced axis (Auto-updater / IPC advanced / File system permissions / Notification / Menu bar 等) 追加検討
