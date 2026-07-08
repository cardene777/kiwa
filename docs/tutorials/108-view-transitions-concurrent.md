# View Transitions + Concurrent React in 10 min

## What you'll build

`@kiwa-test/component` v0.4 の view-transitions axis と `@kiwa-test/nextjs` v1.3 の concurrent-transitions axis を組合せて deterministic に扱う workflow。 interrupt-and-restart pattern も含む。

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-view-concurrent && cd kiwa-view-concurrent
pnpm init
pnpm add -D @kiwa-test/component@^0.4 @kiwa-test/nextjs@^1.3 vitest typescript @types/node
```

### 2. View Transitions axis

```ts
import { describe, expect, it } from 'vitest';
import {
  assertAnimation,
  finishElementTransition,
  startElementTransition,
  startViewTransitionSession,
} from '@kiwa-test/component';

describe('View Transitions', () => {
  it('animates element transition', () => {
    const s = startViewTransitionSession({ target: 'storybook8', transitionId: 'vt-1' });
    startElementTransition(s, { elementId: 'card', from: 'list', to: 'detail' });
    finishElementTransition(s, 'card');
    assertAnimation(s, { assertionId: 'a-1', durationMs: 300, easing: 'ease-in-out' });
    expect(s.history.length).toBeGreaterThan(0);
  });
});
```

### 3. Concurrent Transitions with interrupt

```ts
import { describe, expect, it } from 'vitest';
import {
  commitTransition,
  interruptTransition,
  markTransitionPending,
  startConcurrentTransition,
} from '@kiwa-test/nextjs';

describe('Concurrent React transitions', () => {
  it('interrupt then restart pattern', () => {
    const s = startConcurrentTransition({ target: 'app-router', transitionId: 't1' });
    markTransitionPending(s);
    interruptTransition(s);
    markTransitionPending(s);
    commitTransition(s, 'final');
    expect(s.state).toBe('committed');
    expect(s.interruptions).toBe(1);
  });
});
```

### 4. 実行

```bash
pnpm exec vitest run
# ✓ 2 tests pass
```
