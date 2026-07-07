# Risk-based auth — score aggregation + policy + telemetry + hijack detection in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/auth` v0.6 that models the 3 pieces of a real risk-based auth posture — a risk-based auth axis with signal aggregation + adaptive challenge + policy chain, an auth telemetry axis with attempt log + success rate + latency histogram + abuse detection, and a session hijack detect axis with fingerprint drift + geo anomaly + concurrent session + logout cascade.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-risk-based-auth && cd kiwa-risk-based-auth
pnpm init
pnpm add -D @kiwa-test/auth@^0.6 vitest typescript @types/node
```

### 2. Risk-based auth

`tests/risk.test.ts` — evaluate → challenge or allow or block.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-test/auth';

describe('risk-based auth', () => {
  it('low signals → allowed', () => {
    const s = semantics.startRiskEval({
      platform: 'chromium',
      userId: 'u-1',
      allowThreshold: 30,
      blockThreshold: 70,
    });
    semantics.evaluateScore(s, {
      signals: {
        deviceScore: 5,
        ipReputation: 5,
        geoAnomaly: 5,
        velocityScore: 5,
        behavioralScore: 5,
      },
    });
    const step = semantics.applyPolicy(s);
    expect(step.state).toBe('allowed');
  });

  it('high signals → blocked', () => {
    const s = semantics.startRiskEval({
      platform: 'webkit',
      userId: 'u-1',
    });
    semantics.evaluateScore(s, {
      signals: {
        deviceScore: 20,
        ipReputation: 20,
        geoAnomaly: 20,
        velocityScore: 15,
        behavioralScore: 15,
      },
    });
    const step = semantics.applyPolicy(s);
    expect(step.state).toBe('blocked');
  });
});
```

### 3. Auth telemetry

`tests/telemetry.test.ts` — recordAttempt → success rate → abuse detect.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-test/auth';

describe('auth telemetry', () => {
  it('detects abuse when failure rate exceeds threshold', () => {
    const s = semantics.startAuthTelemetry({ platform: 'firefox', endpointId: '/login' });
    semantics.recordAttempt(s, { success: false, latencyMs: 100 });
    semantics.recordAttempt(s, { success: false, latencyMs: 200 });
    semantics.recordAttempt(s, { success: true, latencyMs: 150 });
    const step = semantics.detectAbuse(s, {
      failureRateThreshold: 0.5,
      ipAddress: '1.2.3.4',
    });
    expect(step.metadata.isAbuse).toBe(true);
  });
});
```

### 4. Session hijack detect

`tests/hijack.test.ts` — fingerprint drift + concurrent + geo → cascade.

```ts
import { describe, expect, it } from 'vitest';
import { semantics } from '@kiwa-test/auth';

describe('session hijack detect', () => {
  it('reports geo anomaly + concurrent + triggers cascade', () => {
    const s = semantics.startHijackWatch({
      platform: 'chromium',
      sessionId: 'sess-1',
      baselineFingerprint: 'fp-A',
      baselineRegion: 'JP',
    });
    semantics.reportGeoAnomaly(s, { observedRegion: 'BR', km: 18_000, withinMinutes: 5 });
    semantics.reportConcurrentSession(s, { concurrentSessionCount: 4 });
    const step = semantics.triggerLogoutCascade(s, {
      revokedSessionIds: ['sess-a', 'sess-b'],
    });
    expect(step.state).toBe('logout-cascade');
    expect(step.metadata.revokedCount).toBe(2);
  });
});
```

## Run it

```bash
pnpm test
```

All 3 test files pass. Combine with tutorial 97 (device-bound + conditional UI) and tutorial 98 (step-up MFA + continuity) for a complete passwordless-first auth stack observability suite.
