# Mobile advanced II — navigation + reanimated + storage in 12 min

## What you'll build

`@kiwa-lab/mobile` v0.2 で追加された advanced II 4 axis (navigation + reanimated + async-storage + secure-storage) を、 3 target (ios + android + web) 横断的に扱う vitest suite。 v1.50 base 3 axis と合わせて 7 axis を production layer で使う pattern。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-mobile-advanced && cd kiwa-mobile-advanced
pnpm init
pnpm add -D @kiwa-lab/mobile@^0.2 vitest typescript @types/node
```

### 2. Navigation axis (React Navigation / Expo Router)

```ts
import { describe, expect, it } from 'vitest';
import {
  initNavigation,
  navigateDeepLink,
  openNavigationModal,
  pushNavigationStack,
  switchNavigationTab,
} from '@kiwa-lab/mobile';

describe('Navigation stack + tab + modal + deep-link', () => {
  it('composes navigation flow', () => {
    const s = initNavigation({ target: 'ios', navigatorId: 'root' });
    pushNavigationStack(s, 'HomeScreen');
    switchNavigationTab(s, 'Search');
    openNavigationModal(s, 'FilterModal');
    navigateDeepLink(s, 'myapp://user/1');
    expect(s.state).toBe('deep-linked');
  });
});
```

### 3. Reanimated axis (shared value + worklet + animation)

```ts
import { describe, expect, it } from 'vitest';
import {
  completeReanimatedAnimation,
  executeWorklet,
  initReanimated,
  startReanimatedAnimation,
  updateSharedValue,
} from '@kiwa-lab/mobile';

describe('Reanimated 3 animation lifecycle', () => {
  it('shared value + worklet + animate', () => {
    const s = initReanimated({ target: 'android', animationId: 'fade' });
    updateSharedValue(s, { name: 'opacity', value: 0 });
    executeWorklet(s, 'interpolate');
    startReanimatedAnimation(s, { durationMs: 300, easing: 'ease' });
    completeReanimatedAnimation(s);
    expect(s.state).toBe('completed');
  });
});
```

### 4. Async / Secure storage axis (MMKV / Keychain / Keystore / WebAuthn)

```ts
import { describe, expect, it } from 'vitest';
import {
  challengeBiometric,
  initAsyncStorage,
  initSecureStorage,
  removeCredential,
  setAsyncStorageItem,
  storeCredential,
} from '@kiwa-lab/mobile';

describe('Storage 2 axis', () => {
  it('AsyncStorage set + Secure store + biometric', () => {
    const as = initAsyncStorage({ target: 'ios', storeId: 'app' });
    setAsyncStorageItem(as, { key: 'theme', value: 'dark' });
    const ss = initSecureStorage({ target: 'ios', vaultId: 'vault' });
    storeCredential(ss, { key: 'token', encryptedValue: 'enc:xxx', requireBiometric: true });
    challengeBiometric(ss, { method: 'face-id', success: true });
    removeCredential(ss, 'token');
    expect(ss.state).toBe('removed');
    expect(as.items.get('theme')).toBe('dark');
  });
});
```

### 5. Real driver env-gate (opt-in)

```ts
import { readMobileRealDriverEnv, assertMobileRealDriverAvailable } from '@kiwa-lab/mobile';

process.env.KIWA_MOBILE_MODE = 'real';
process.env.KIWA_NAVIGATION_URL = 'http://navigator';
const env = readMobileRealDriverEnv();
assertMobileRealDriverAvailable('navigation', env); // pass

delete process.env.KIWA_NAVIGATION_URL;
const env2 = readMobileRealDriverEnv();
assertMobileRealDriverAvailable('navigation', env2); // throws
```

### 6. 実行

```bash
pnpm exec vitest run
# ✓ 3 tests pass
```

## 7 axis grid の位置付け

- **v1.50 base 3 axis** = React Native + Expo + Metro (5 state each、 12 event)
- **v1.51 advanced II 4 axis** = navigation + reanimated + async-storage + secure-storage (5 state each、 16 event)
- 3 target × 7 axis = 21 row fidelity grid、 48 dialect mapping (3 target × 16 event)
- backward compat 絶対維持 = v0.1 API 変更 0
