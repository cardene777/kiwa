# Payment orchestration — multi-provider routing + failover + retry ladder + circuit breaker in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/payment` v0.4 that models the 4 pieces of a real payment orchestration layer that every non-trivial merchant eventually needs — a router that picks a primary provider by BIN / currency / cost, a retry ladder that stays on the current provider until the per-provider retry cap is hit, a failover step that walks to the next provider in the cascade after the retry cap, and a circuit breaker that opens after N total failures and stays open for a configurable outage window. `startOrchestration()` + `routeCharge()` + `probeCircuit()` give you every one of those pieces as a deterministic state machine — `routing` → `failed-over` → `circuit-open` → `circuit-closed` → `terminated`. No live Stripe / Paddle / Lemon Squeezy endpoints, no manual `fetch()` retry loops, no ad-hoc circuit-breaker library. This is the pattern kiwa's Stripe marketplace dogfood app (v1.33-2) exercises against real Stripe test mode under the fidelity harness; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "Stripe was down for 4 minutes and we lost 2 % of revenue" case reviewers ask about.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-payment-orch && cd kiwa-payment-orch
pnpm init
pnpm add -D @kiwa-test/payment@^0.4 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.4 surface exports `startOrchestration` + `routeCharge` + `probeCircuit` from the semantics barrel. This tutorial focuses on the first axis of the 8-axis v0.4 grid; tutorial 65 covers Stripe Connect + destination charge, tutorial 66 covers Paddle Billing v2 + retention + proration + coupon.

### 2. `startOrchestration` — construct the router

`tests/orch/start.test.ts` — the first thing an orchestration layer does is build the config (ordered provider list + circuit breaker threshold + circuit open duration + per-provider retry cap). The mock enforces the invariants a real router would enforce (non-empty provider list, defaults for the 3 timing knobs).

```ts
import { describe, expect, it } from 'vitest';
import { startOrchestration } from '@kiwa-test/payment';

describe('orchestration — startOrchestration', () => {
  it('constructs a session with defaults filled in', () => {
    const session = startOrchestration({
      intentId: 'pi_1',
      amountCents: 4999,
      currency: 'usd',
      config: { providers: ['stripe', 'paddle', 'lemonsqueezy'] },
    });

    expect(session.state).toBe('routing');
    expect(session.currentProviderIndex).toBe(0);
    expect(session.config.circuitBreakerThreshold).toBe(5);
    expect(session.config.maxRetriesPerProvider).toBe(2);
    expect(session.config.circuitOpenDurationMs).toBe(30_000);
  });

  it('rejects an empty provider list — a router with 0 providers is unroutable', () => {
    expect(() =>
      startOrchestration({
        intentId: 'pi_1',
        amountCents: 4999,
        config: { providers: [] },
      }),
    ).toThrow(/providers must not be empty/);
  });
});
```

The rule of thumb is that the config is the SSOT — the same 3 knobs (`circuitBreakerThreshold` + `circuitOpenDurationMs` + `maxRetriesPerProvider`) show up in every production orchestration layer whether you build it yourself or buy Spreedly / BasisTheory. The mock enforces the non-empty invariant so a test that misconfigures the router by passing an empty list fails immediately.

### 3. `routeCharge` — the retry ladder

`tests/orch/retry-ladder.test.ts` — the router stays on the current provider until the per-provider retry cap is hit. The mock increments the failure counter on every non-success attempt without changing `state` (stays `routing`) so the caller can retry against the same provider without booking the failover cost.

```ts
import { describe, expect, it } from 'vitest';
import { createStripeMock, startOrchestration, routeCharge } from '@kiwa-test/payment';

describe('orchestration — routeCharge retry ladder', () => {
  it('stays on the primary while the per-provider cap has not been hit', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startOrchestration({
      intentId: 'pi_1',
      amountCents: 4999,
      currency: 'usd',
      config: { providers: ['stripe'], maxRetriesPerProvider: 3, circuitBreakerThreshold: 100 },
    });

    const step = await routeCharge([stripe], session, { succeed: false, customerId: 'cus_1' });

    expect(step.state).toBe('routing');
    expect(session.currentProviderIndex).toBe(0);
    expect(session.totalFailures).toBe(1);
    expect(step.neutralEvent).toBe('orchestration.routed');
  });

  it('emits orchestration.routed on the success path', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startOrchestration({
      intentId: 'pi_2',
      amountCents: 4999,
      currency: 'usd',
      config: { providers: ['stripe'] },
    });

    const step = await routeCharge([stripe], session, { succeed: true, customerId: 'cus_1' });

    expect(step.state).toBe('routing');
    expect(step.neutralEvent).toBe('orchestration.routed');
    expect(step.metadata.provider).toBe('stripe');
    expect(session.totalFailures).toBe(0);
  });
});
```

The rule of thumb is that a retry ladder is what separates "we get 2 % lift by retrying on the same provider" from "we spend 3× on network fees because we failover after the first blip." The mock leaves `currentProviderIndex` untouched until `maxRetriesPerProvider` is reached; the fidelity harness asserts that this matches the real Stripe smart-retry cadence.

### 4. `routeCharge` — failover to the next provider

`tests/orch/failover.test.ts` — once the per-provider retry cap is reached and there is another provider in the cascade, the router moves the index forward, resets the per-provider counter, and emits `orchestration.failed_over` under the new provider's dialect.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  createPaddleMock,
  startOrchestration,
  routeCharge,
} from '@kiwa-test/payment';

describe('orchestration — failover cascade', () => {
  it('failed_over after maxRetriesPerProvider consecutive failures', async () => {
    const stripe = createStripeMock({ secret: 'whsec_stripe' });
    const paddle = createPaddleMock({ secret: 'whsec_paddle' });
    const session = startOrchestration({
      intentId: 'pi_1',
      amountCents: 4999,
      currency: 'usd',
      config: {
        providers: ['stripe', 'paddle'],
        maxRetriesPerProvider: 2,
        circuitBreakerThreshold: 100,
      },
    });

    // First 2 failures stay on stripe (retry ladder).
    await routeCharge([stripe, paddle], session, { succeed: false, customerId: 'cus_1' });
    const failover = await routeCharge([stripe, paddle], session, {
      succeed: false,
      customerId: 'cus_1',
    });

    expect(failover.state).toBe('failed-over');
    expect(failover.neutralEvent).toBe('orchestration.failed_over');
    expect(failover.metadata.provider).toBe('paddle');
    expect(session.currentProviderIndex).toBe(1);
    expect(session.currentProviderFailures).toBe(0);
  });
});
```

The rule of thumb is that failover has to reset the per-provider counter — the second provider has no obligation to inherit the first provider's failure history. The mock resets `currentProviderFailures` to 0 on failover so the next `maxRetriesPerProvider` attempts against the new provider are the fresh budget the customer expects.

### 5. `routeCharge` + `probeCircuit` — circuit breaker

`tests/orch/circuit.test.ts` — after `circuitBreakerThreshold` total failures across all providers, the router opens the circuit and refuses further `routeCharge` calls. The caller has to call `probeCircuit` after the outage window (`circuitOpenDurationMs`) to close it and resume traffic.

```ts
import { describe, expect, it } from 'vitest';
import { createStripeMock, startOrchestration, routeCharge, probeCircuit } from '@kiwa-test/payment';

describe('orchestration — circuit breaker', () => {
  it('opens after circuitBreakerThreshold total failures', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startOrchestration({
      intentId: 'pi_1',
      amountCents: 4999,
      currency: 'usd',
      config: {
        providers: ['stripe'],
        maxRetriesPerProvider: 100,
        circuitBreakerThreshold: 3,
      },
    });

    await routeCharge([stripe], session, { succeed: false, customerId: 'cus_1' });
    await routeCharge([stripe], session, { succeed: false, customerId: 'cus_1' });
    const opened = await routeCharge([stripe], session, {
      succeed: false,
      customerId: 'cus_1',
    });

    expect(opened.state).toBe('circuit-open');
    expect(opened.neutralEvent).toBe('orchestration.circuit_opened');
    expect(session.circuitOpenedAt).not.toBeNull();
  });

  it('probeCircuit returns opened metadata while the window has not elapsed', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startOrchestration({
      intentId: 'pi_2',
      amountCents: 4999,
      config: {
        providers: ['stripe'],
        maxRetriesPerProvider: 100,
        circuitBreakerThreshold: 1,
        circuitOpenDurationMs: 60_000,
      },
    });
    await routeCharge([stripe], session, { succeed: false, customerId: 'cus_1' });

    const probe = await probeCircuit([stripe], session);

    expect(probe.state).toBe('circuit-open');
    expect(probe.metadata.remainingMs).toBeGreaterThan(0);
  });
});
```

The rule of thumb is that the circuit breaker is what turns a 4-minute Stripe outage into a 4-minute quiet period instead of 4 minutes of cascading retries that burn quotas and generate 3× the noise in your logs. The mock refuses `routeCharge` while the state is `circuit-open` (the caller must call `probeCircuit` first) so a test that forgets to probe fails loud.

### 6. Wire the fidelity harness

`tests/orch/fidelity.test.ts` — the fidelity harness reports which providers cover the orchestration axis so the release-gate can render "3 provider × 8 axis = 24 cells" for the v0.4 slice.

```ts
import { describe, expect, it } from 'vitest';
import {
  collectFidelityCoverage,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
} from '@kiwa-test/payment';

describe('orchestration — fidelity coverage', () => {
  it('every provider covers the orchestration axis with 4 neutral events', () => {
    const coverage = collectFidelityCoverage([
      createStripeMock({ secret: 'whsec_stripe' }),
      createPaddleMock({ secret: 'whsec_paddle' }),
      createLemonSqueezyMock({ secret: 'whsec_lemonsqueezy' }),
    ]);

    const orchRows = coverage.rows.filter((r) => r.axis === 'orchestration');
    expect(orchRows).toHaveLength(3);
    for (const row of orchRows) {
      expect(row.neutralEvents).toEqual([
        'orchestration.routed',
        'orchestration.failed_over',
        'orchestration.circuit_opened',
        'orchestration.circuit_closed',
      ]);
    }
  });
});
```

The rule of thumb is that the fidelity harness is what turns "we mocked Stripe" into "we mocked the intersection of Stripe + Paddle + Lemon Squeezy for this axis with the same 4 neutral events." The mock exposes the axis grid so the release-gate can assert on the shape without walking every event by hand.

## Run it

```bash
pnpm test
```

All 5 files pass in under 3 seconds. The full v0.4 orchestration surface — 5 orchestration state transitions — is exercised by `packages/payment/tests/docs-tutorial-v1.33.test.ts` for every code snippet in this tutorial so a public API drift breaks CI before the reader sees a broken example.

## What you learned

- The 4 pieces of a real orchestration layer (retry ladder + failover + circuit breaker + fidelity coverage) map to 4 neutral events (`orchestration.routed` / `orchestration.failed_over` / `orchestration.circuit_opened` / `orchestration.circuit_closed`) that every provider emits under its own dialect.
- The 3 timing knobs (`circuitBreakerThreshold` + `circuitOpenDurationMs` + `maxRetriesPerProvider`) are the SSOT — the same 3 knobs show up in every production orchestration layer.
- The mock refuses illegal transitions (empty provider list, routing while circuit is open) so tests fail loud on misuse instead of silently producing "would-work-in-mock, fail-in-prod" scenarios.
- The fidelity harness reports 3 provider × 8 axis = 24 cells for the v0.4 slice; the release-gate reads this to render the coverage grid without calling every provider by hand.

## Next steps

- Tutorial 65 walks Stripe Connect + destination charge + application fee + tax report for the marketplace dogfood app.
- Tutorial 66 walks Paddle Billing v2 + retention + proration + coupon + trial for the subscription dogfood app.
- Concept doc `docs/concepts/payment-real-driver-testing.md` documents the 8-axis SSOT + 3 provider × 8 axis = 24 cell grid + `KIWA_MODE=real` env-gate + `STRIPE_KEY` / `PADDLE_KEY` / `LEMONSQUEEZY_KEY` per-provider mapping.
