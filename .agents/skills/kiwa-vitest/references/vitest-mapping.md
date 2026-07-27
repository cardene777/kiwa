# 11 + 2 観点 → Vitest helper マッピング

`docs/SKILL-DESIGN.md` § Step 3 の 11 観点 + (PR #301 で追加) 12 UI feature 網羅 / 13 wallet 接続 flow を Vitest 文法に変換するときの code snippet 集。 `kiwa-design/references/viewpoints-catalog.md` § 観点 × Layer 2 ランナー の Vitest 列を実装手順で展開した詳細版。

## 観点 1: 正常系

```ts
import { describe, it, expect } from 'vitest';
import { calculateFee } from '@/lib/fee';

describe('observation 1 — happy path', () => {
  it('TC-001 — returns 0.01 ETH for the standard mint flow', () => {
    expect(calculateFee({ tokenId: 1n, base: 0.01 })).toBe(0.01);
  });
});
```

## 観点 2: 異常系

```ts
import { it, expect } from 'vitest';
import { fetchMetadata } from '@/lib/metadata';

it('TC-NN — surfaces RPC 503 as MetadataFetchError', async () => {
  await expect(fetchMetadata({ url: 'http://127.0.0.1:1' })).rejects.toThrow('MetadataFetchError');
});
```

`expect(() => fn()).toThrow(MyError)` (sync) と `expect(promise).rejects.toThrow()` (async) を使い分ける。 custom error class なら instance match で `rejects.toBeInstanceOf(MetadataFetchError)`。

## 観点 3: 境界値

```ts
import { it, expect } from 'vitest';
import { mint } from '@/lib/mint';

it.each([
  { tokenId: 100n, label: 'max supply' },
  { tokenId: 101n, label: 'over max supply' },
  { tokenId: 0n, label: 'zero edge' },
])('TC-NN — boundary $label rejects appropriately', ({ tokenId }) => {
  if (tokenId > 100n || tokenId === 0n) {
    expect(() => mint({ tokenId })).toThrow();
  } else {
    expect(mint({ tokenId })).toBeDefined();
  }
});
```

`it.each` で table-driven、 1 観点 = N 件をまとめて見通し良く。

## 観点 4: 状態遷移

```ts
import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { proposeAndExecute } from '@/lib/governance';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('TC-NN — proposed → voted → executed transitions cleanly', async () => {
  const state = await proposeAndExecute.propose();
  expect(state.status).toBe('proposed');

  await proposeAndExecute.vote(state.id);
  expect(state.status).toBe('voted');

  vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000); // 7 day timelock
  await proposeAndExecute.execute(state.id);
  expect(state.status).toBe('executed');
});
```

## 観点 5: 権限

```ts
import { it, expect, vi } from 'vitest';
import { canMint } from '@/lib/auth';

it.each([
  { role: 'admin', expected: true },
  { role: 'user', expected: false },
])('TC-NN — role $role can mint == $expected', ({ role, expected }) => {
  expect(canMint({ role })).toBe(expected);
});
```

`vi.mock('@/lib/auth-context', () => ({ useRole: vi.fn().mockReturnValue(role) }))` で role context を mock するのが TSX hook 時の定型。

## 観点 6: 入力バリデーション

```ts
import { it, expect } from 'vitest';
import { z } from 'zod';
import { profileSchema } from '@/lib/profile-schema';

it.each([
  { input: { name: "'; DROP TABLE--" }, label: 'SQL injection' },
  { input: { bio: '<script>alert(1)</script>' }, label: 'XSS payload' },
])('TC-NN — rejects $label', ({ input }) => {
  expect(() => profileSchema.parse(input)).toThrow(z.ZodError);
});
```

## 観点 7: 冪等性

```ts
import { it, expect } from 'vitest';
import { handleWebhook } from '@/lib/webhook';

it('TC-NN — same event_id processed twice has 1 side effect', async () => {
  const event = { id: 'evt-1', payload: {} };
  const r1 = await handleWebhook(event);
  const r2 = await handleWebhook(event);
  expect(r1.applied).toBe(true);
  expect(r2.applied).toBe(false);
});
```

## 観点 8: 並行処理

```ts
import { it, expect } from 'vitest';
import { mintRace } from '@/lib/mint-race';

it('TC-NN — 2 parallel mints of the same tokenId — 1 success + 1 reject', async () => {
  const results = await Promise.allSettled([mintRace(1n), mintRace(1n)]);
  const successes = results.filter((r) => r.status === 'fulfilled').length;
  expect(successes).toBe(1);
});
```

## 観点 9: 性能

```ts
import { it, expect } from 'vitest';
import { batchTransfer } from '@/lib/batch';

it('TC-NN — 1000-element batch transfer stays under 100ms p95', async () => {
  const samples: number[] = [];
  for (let i = 0; i < 20; i += 1) {
    const start = performance.now();
    await batchTransfer(Array.from({ length: 1000 }, (_, j) => BigInt(j)));
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.floor(samples.length * 0.95)];
  expect(p95).toBeLessThan(100);
});
```

## 観点 10: セキュリティ

```ts
import { it, expect } from 'vitest';
import { recoverSigner } from '@/lib/sig';

it('TC-NN — rejects signature replay (used nonce)', () => {
  const usedNonces = new Set([1n]);
  expect(() => recoverSigner({ nonce: 1n, sig: '0x...', usedNonces })).toThrow('REPLAY');
});
```

## 観点 11: 回帰

```ts
import { it, expect } from 'vitest';
import { grantTimedAccess } from '@/lib/gated';

// PR #567 で fix した 0 秒 grant の即時 expire しないバグの再発防御
it('TC-NN — Issue #1234 — grantTimedAccess(addr, 0) does not immediately expire', () => {
  expect(grantTimedAccess('0x...', 0).expiresAt).toBeGreaterThan(0);
});
```

## 観点 12: UI feature 網羅 (TSX hook 時のみ)

```tsx
import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MintButton } from '@/components/mint-button';

it('TC-NN — disabled state while pending', () => {
  render(<MintButton isPending />);
  expect(screen.getByTestId('mint-button')).toBeDisabled();
});

it('TC-NN — error display via onError handler', () => {
  render(<MintButton onError={() => {}} />);
  fireEvent.click(screen.getByTestId('mint-button'));
  expect(screen.getByTestId('error-message')).toBeVisible();
});
```

## 観点 13: wallet 接続 flow (non-applicable on unit、 基本 skip)

unit layer では wallet 接続は mock connector で `vi.mock('wagmi', () => ({ useAccount: () => ({ isConnected: false, address: undefined }) }))` するのが現実的。 本格的 connect flow は e2e (`/kiwa-play`) で test するため unit では基本 skip、 適用時のみ minimal mock を上記 pattern で書く。

## 関連

- SSOT: `docs/SKILL-DESIGN.md` § Step 3 (11 観点)
- 観点 × Layer 2 ランナー早見: `kiwa-design/references/viewpoints-catalog.md` (Vitest 列)
- Vitest 公式 docs: https://vitest.dev/api/
- `@testing-library/react` 公式: https://testing-library.com/docs/react-testing-library/intro/
