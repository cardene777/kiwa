# RSC + Server Actions v2 in 10 min

## What you'll build

A vitest suite wired to `@kiwa-lab/component` v0.4 (RSC harness + React 19 Actions) と `@kiwa-lab/nextjs` v1.3 (Server Actions v2)、 3 axis × 3 target = 9 grid の workflow を deterministic に扱う pattern。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-rsc-v2 && cd kiwa-rsc-v2
pnpm init
pnpm add -D @kiwa-lab/component@^0.4 @kiwa-lab/nextjs@^1.3 vitest typescript @types/node
```

### 2. React 19 Actions axis

`tests/react-19-actions.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  applyReactActionOptimistic,
  beginActionTransition,
  initializeReactActions,
  resolveAction,
} from '@kiwa-lab/component';

describe('React 19 Actions state machine', () => {
  it('optimistic → resolved', () => {
    const s = initializeReactActions({ target: 'playwright-ct', actionId: 'a1' });
    beginActionTransition(s);
    applyReactActionOptimistic(s, 'draft');
    resolveAction(s, 'final');
    expect(s.state).toBe('resolved');
    expect(s.resolvedValue).toBe('final');
  });
});
```

### 3. Server Actions v2 axis

```ts
import { describe, expect, it } from 'vitest';
import {
  redirectAction,
  revalidateActionPath,
  startServerActionAdvanced,
  submitFormAction,
} from '@kiwa-lab/nextjs';

describe('Server Actions advanced', () => {
  it('submit → revalidate → redirect', () => {
    const s = startServerActionAdvanced({ target: 'app-router', actionId: 'x' });
    submitFormAction(s, { name: 'Ada' });
    revalidateActionPath(s, '/dashboard');
    redirectAction(s, '/thanks');
    expect(s.state).toBe('redirected');
  });
});
```

### 4. 実行

```bash
pnpm exec vitest run
# ✓ 2 tests pass
```
