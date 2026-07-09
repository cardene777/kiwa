# Step-up MFA — AAL escalation + trust cache + auth continuity in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/auth` v0.6 that models the 3 pieces of a real step-up MFA posture — an AAL escalation ladder (NIST SP 800-63B AAL1 → AAL2 → AAL3) with per-factor satisfaction + trust duration cache, an auth continuity axis with seamless re-auth + refresh token rotation + session extension + revocation window, and a fidelity harness diffing browser dialects.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-step-up-mfa && cd kiwa-step-up-mfa
pnpm init
pnpm add -D @kiwa-lab/auth@^0.6 vitest typescript @types/node
```

### 2. AAL escalation

`tests/aal-escalation.test.ts` — AAL1 → AAL2 with sms factor.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-lab/auth';

describe('AAL escalation', () => {
  it('escalates AAL1 → AAL2 with sms factor', () => {
    const s = semantics.startStepUp({
      platform: 'chromium',
      userId: 'u-1',
      currentAal: 'AAL1',
    });
    semantics.requestEscalation(s, { requiredAal: 'AAL2' });
    const step = semantics.satisfyAal2(s, { factor: 'sms', nowMs: 1000 });
    expect(step.state).toBe('aal2-satisfied');
  });

  it('escalates AAL1 → AAL3 with passkey-biometric', () => {
    const s = semantics.startStepUp({
      platform: 'webkit',
      userId: 'u-1',
      currentAal: 'AAL1',
    });
    semantics.requestEscalation(s, { requiredAal: 'AAL3' });
    const step = semantics.satisfyAal3(s, { factor: 'passkey-biometric', nowMs: 1000 });
    expect(step.state).toBe('aal3-satisfied');
  });
});
```

### 3. Trust cache

`tests/trust-cache.test.ts` — checkTrustCache hit/miss.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-lab/auth';

describe('trust cache', () => {
  it('hits within trust duration', () => {
    const s = semantics.startStepUp({
      platform: 'firefox',
      userId: 'u-1',
      currentAal: 'AAL1',
      trustDurationMs: 60_000,
    });
    semantics.requestEscalation(s, { requiredAal: 'AAL2' });
    semantics.satisfyAal2(s, { factor: 'totp', nowMs: 0 });
    const step = semantics.checkTrustCache(s, { nowMs: 30_000 });
    expect(step.metadata.hit).toBe(true);
  });
});
```

### 4. Auth continuity

`tests/continuity.test.ts` — seamlessReauth + rotateRefresh + revocation window.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-lab/auth';

describe('auth continuity', () => {
  it('rotates refresh token safely', () => {
    const s = semantics.startContinuity({
      platform: 'chromium',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 10_000,
    });
    const step = semantics.rotateRefresh(s, { newToken: 'r-2', nowMs: 500 });
    expect(step.state).toBe('refresh-rotated');
    expect(s.refreshToken).toBe('r-2');
  });

  it('revocation window blocks further actions', () => {
    const s = semantics.startContinuity({
      platform: 'webkit',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 10_000,
    });
    semantics.hitRevocationWindow(s, { reason: 'refresh-reuse' });
    expect(() => semantics.rotateRefresh(s, { newToken: 'r-2', nowMs: 0 })).toThrow(
      /revocation window/,
    );
  });
});
```

## Run it

```bash
pnpm test
```

All 3 test files pass. Ready to plug into a real Better Auth / Auth.js / Lucia backend when you graduate to real driver via `KIWA_MODE=real`.
