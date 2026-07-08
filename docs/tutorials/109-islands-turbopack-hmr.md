# Islands + Turbopack HMR + Progressive Enhancement in 10 min

## What you'll build

`@kiwa-test/component` v0.4 の islands-architecture axis と `@kiwa-test/nextjs` v1.3 の turbopack-hmr axis + progressive-enhancement axis を組合せて Islands + HMR workflow を deterministic に扱う pattern。

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-islands-hmr && cd kiwa-islands-hmr
pnpm init
pnpm add -D @kiwa-test/component@^0.4 @kiwa-test/nextjs@^1.3 vitest typescript @types/node
```

### 2. Islands architecture axis

```ts
import { describe, expect, it } from 'vitest';
import {
  assertStaticBoundary,
  beginIslandHydration,
  bootstrapIslandsRoute,
  markIslandInteractive,
  registerIsland,
} from '@kiwa-test/component';

describe('Islands architecture', () => {
  it('bootstraps + hydrates + verifies static', () => {
    const s = bootstrapIslandsRoute({ target: 'storybook8', routeId: '/home' });
    registerIsland(s, { islandId: 'nav', loadStrategy: 'load', interactiveBoundary: true });
    beginIslandHydration(s, 'nav');
    markIslandInteractive(s, 'nav');
    assertStaticBoundary(s, 'footer');
    expect(s.state).toBe('static-verified');
  });
});
```

### 3. Turbopack HMR axis

```ts
import { describe, expect, it } from 'vitest';
import {
  applyHmrPatch,
  completeFastRefresh,
  findHmrBoundary,
  markModuleUpdated,
  startTurbopackHmr,
} from '@kiwa-test/nextjs';

describe('Turbopack HMR', () => {
  it('completes full HMR chain', () => {
    const s = startTurbopackHmr({ target: 'app-router', sessionId: 'hmr-1' });
    markModuleUpdated(s, 'src/page.tsx');
    findHmrBoundary(s, 'src/layout.tsx');
    applyHmrPatch(s);
    completeFastRefresh(s);
    expect(s.state).toBe('refresh-completed');
  });
});
```

### 4. 実行

```bash
pnpm exec vitest run
# ✓ 2 tests pass
```
