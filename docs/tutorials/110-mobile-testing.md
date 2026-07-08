# Mobile testing baseline — React Native + Expo + Metro in 10 min

## What you'll build

A vitest suite wired to `@kiwa-test/mobile` v0.1 (new-base pair 第 13、 41 package 到達)、 3 axis (React Native + Expo + Metro) × 3 target (ios + android + web) の workflow を deterministic に扱う pattern。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-mobile && cd kiwa-mobile
pnpm init
pnpm add -D @kiwa-test/mobile@^0.1 vitest typescript @types/node
```

### 2. React Native axis (component + native module + gesture)

```ts
import { describe, expect, it } from 'vitest';
import {
  invokeNativeModule,
  mountReactNativeComponent,
  recognizeGesture,
  unmountReactNativeComponent,
} from '@kiwa-test/mobile';

describe('React Native lifecycle', () => {
  it('mount → invoke → gesture → unmount', () => {
    const s = mountReactNativeComponent({ target: 'ios', componentId: 'Home' });
    invokeNativeModule(s, 'CameraModule');
    recognizeGesture(s, 'tap');
    unmountReactNativeComponent(s);
    expect(s.state).toBe('unmounted');
    expect(s.nativeModuleInvocations).toBe(1);
  });
});
```

### 3. Expo axis (build config + linking + push)

```ts
import { describe, expect, it } from 'vitest';
import {
  completeExpoBuild,
  loadExpoBuildConfig,
  receivePushNotification,
  resolveDeepLink,
} from '@kiwa-test/mobile';

describe('Expo build flow', () => {
  it('load config → deep link → push → complete build', () => {
    const s = loadExpoBuildConfig({ target: 'android', appSlug: 'myapp', configHash: 'abc' });
    resolveDeepLink(s, { scheme: 'myapp', path: 'user/42' });
    receivePushNotification(s, { notificationId: 'n1', category: 'chat' });
    completeExpoBuild(s);
    expect(s.state).toBe('build-completed');
  });
});
```

### 4. Metro axis (bundler + HMR + resolver)

```ts
import { describe, expect, it } from 'vitest';
import {
  applyMetroHmr,
  completeMetroBundle,
  resolveMetroModule,
  startMetroBundle,
} from '@kiwa-test/mobile';

describe('Metro bundle flow', () => {
  it('start → resolve → hmr → complete', () => {
    const s = startMetroBundle({ target: 'ios', bundleId: 'main' });
    resolveMetroModule(s, 'App.tsx');
    applyMetroHmr(s, 'App.tsx');
    completeMetroBundle(s);
    expect(s.state).toBe('completed');
  });
});
```

### 5. 実行

```bash
pnpm exec vitest run
# ✓ 3 tests pass
```

## Provider dialect

ios / android / web の 3 target で 12 neutral event × 3 target = 36 mapping を持つ、 target-neutral な test の裏に platform-specific な dialect を残す設計。

## 次の Step

- v1.50-2 dogfood app (`examples/dogfood-mobile-rn-app`) で 3 axis × 3 target = 9 grid workflow
- `docs/concepts/mobile-testing-baseline.md` で 3 axis SSOT + fidelity harness
- v1.51+ で real driver (Expo EAS + Metro real bundle + RN new architecture) 統合予定
