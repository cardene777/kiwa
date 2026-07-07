# Crypto payment + FX cross-border — stablecoin invoicing + on-chain confirmation + gas abstraction + FX rate lock + SWIFT/SEPA settlement in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/payment` v0.5 that models the 2 pieces of a real crypto-payment + cross-border-FX product surface that every non-trivial global-first product eventually needs — a crypto-payment `createCryptoInvoice` step that pins an `invoiceId` + `chain` (`ethereum` / `polygon` / `base` / `arbitrum` / `solana`) + `token` (`USDC` / `USDT` / `DAI` / `ETH` / `SOL`) + `config.requiredConfirmations` (default 3, mirroring Coinbase Commerce / BitPay production defaults), a `confirmTx` step that records `txHash` + observed `confirmations` and only flips state to `'confirmed'` once the count reaches the required threshold so a caller cannot mark a 1-confirmation tx as final and eat a chain-reorg loss, an `abstractGas` step that only runs when `config.gasAbstractionEnabled: true` (EIP-4337 paymaster / meta-tx pattern) so a customer paying in USDC does not need to hold ETH for gas, a `linkWallet` step that binds a `walletAddress` to `session.customerId` for repeat billing (requires a non-empty `signature` proof), a `startFxTransfer` step that starts a fresh FX session with `config.settlementRail` (`SWIFT` / `SEPA` / `ACH` / `FASTER` / `RTGS`, default `SWIFT`) + `config.rateLockDurationMs` (default 60s, mirroring Wise / Airwallex quote-lock windows), a `lockRate` step that pins an `FxRateQuote` (`fromCurrency` / `toCurrency` / `rate` / `quoteId` / `lockedAt` / `lockExpiresAt` / `amountToCents`) so a downstream `initiateSettlement` throws if the rate lock has expired, an `initiateSettlement` step that fires on the configured rail with beneficiary IBAN / BIC, a `completeSettlement` step that flips state to `'settlement-completed'` + records `settledAmountCents`, and an `expireRate` step that explicitly marks a rate lock as expired so a stalled retry loop cannot silently ship a stale rate. `createCryptoInvoice()` + `confirmTx()` + `abstractGas()` + `linkWallet()` + `startFxTransfer()` + `lockRate()` + `initiateSettlement()` + `completeSettlement()` + `expireRate()` give you every one of those pieces without booting a real Coinbase Commerce / BitPay / Wise / Airwallex backend. This is the pattern kiwa's `examples/dogfood-payment-crypto-fx-app` exercises against real Coinbase Commerce / BitPay (stablecoin invoicing + on-chain confirmation) + Wise / Airwallex (multi-currency FX + SWIFT/SEPA settlement) backends under `KIWA_MODE=real` + `KIWA_CRYPTO_URL` + `KIWA_FX_URL`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the settlement ran against an expired rate lock because `initiateSettlement` did not check `lockExpiresAt`" gap a reviewer sees in the fx-rate-drift post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-crypto-fx && cd kiwa-crypto-fx
pnpm init
pnpm add -D @kiwa-test/payment@^0.5 vitest typescript @types/node
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

The v0.5 surface exports the crypto-payment axis (`createCryptoInvoice` / `confirmTx` / `abstractGas` / `linkWallet`) and the FX cross-border axis (`startFxTransfer` / `lockRate` / `initiateSettlement` / `completeSettlement` / `expireRate`) directly from the package root. Every v0.5 semantics function takes a `PaymentAdapter` (from `createStripeMock` / `createPaddleMock` / `createLemonSqueezyMock`) as first argument — the mock adapter emits neutral events (`crypto.invoice_created` / `fx.rate_locked` / etc.) that map 1-to-1 to a provider-specific webhook shape via `providerEventName(adapter.provider, neutralEvent)`. This tutorial focuses on the crypto-payment + FX cross-border chain; tutorial 88 covers the embedded-finance + BNPL axis, tutorial 90 covers the recurring-revenue-advanced + payment-orchestration-II + fraud-detection-advanced + regulatory-reporting axis.

### 2. `createCryptoInvoice` — stablecoin invoice on a chain + token

`tests/crypto/invoice.test.ts` — a `CryptoPaymentSession` pins an `invoiceId` + `customerId` + `amountCents` + `chain` + `token` + a `state` that starts at `'initial'` and moves to `'invoice-created'`. The default `config.requiredConfirmations` is `3` (matches Coinbase Commerce production default) and `config.expirationMs` is 15 minutes (typical stablecoin quote window). `createCryptoInvoice` refuses `amountCents <= 0` so a mis-configured caller cannot create a zero-value invoice and land on undefined behavior.

```ts
import { describe, expect, it } from 'vitest';
import { createCryptoInvoice, createStripeMock } from '@kiwa-test/payment';

describe('crypto — invoice creation', () => {
  it('creates an invoice on ethereum + USDC', async () => {
    const adapter = createStripeMock();
    const { session, step } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_1',
      customerId: 'cus_1',
      amountCents: 5000,
      currency: 'usd',
      chain: 'ethereum',
      token: 'USDC',
    });
    expect(step.neutralEvent).toBe('crypto.invoice_created');
    expect(session.state).toBe('invoice-created');
    expect(session.chain).toBe('ethereum');
    expect(session.token).toBe('USDC');
  });

  it('rejects amountCents <= 0', async () => {
    const adapter = createStripeMock();
    await expect(
      createCryptoInvoice(adapter, {
        invoiceId: 'inv_bad',
        customerId: 'cus_1',
        amountCents: 0,
        chain: 'polygon',
        token: 'USDT',
      }),
    ).rejects.toThrow(/amountCents must be positive/);
  });
});
```

`session.state` is now the SSOT for downstream `confirmTx` / `abstractGas` / `linkWallet` steps — every step gates on the state and refuses to run on an `'expired'` or `'failed'` invoice.

### 3. `confirmTx` — required-confirmations gate

`tests/crypto/confirm.test.ts` — `confirmTx()` records `txHash` + observed `confirmations` and only flips state to `'confirmed'` once the count reaches `session.config.requiredConfirmations`. Below the threshold, the state stays `'awaiting-confirmation'` so a caller can poll again with a higher confirmation count. If the invoice expiration window has passed, the step throws + moves the state to `'expired'`.

```ts
import { describe, expect, it } from 'vitest';
import {
  confirmTx,
  createCryptoInvoice,
  createStripeMock,
} from '@kiwa-test/payment';

describe('crypto — tx confirmation gate', () => {
  it('stays awaiting until confirmations reach requiredConfirmations', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_2',
      customerId: 'cus_2',
      amountCents: 5000,
      chain: 'base',
      token: 'USDC',
    });
    const step = await confirmTx(adapter, session, {
      txHash: '0xabc',
      confirmations: 1,
    });
    expect(step.metadata.confirmations).toBe(1);
    expect(session.state).toBe('awaiting-confirmation');
  });

  it('moves to confirmed when confirmations >= requiredConfirmations', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_3',
      customerId: 'cus_3',
      amountCents: 5000,
      chain: 'arbitrum',
      token: 'USDC',
    });
    await confirmTx(adapter, session, { txHash: '0xdef', confirmations: 3 });
    expect(session.state).toBe('confirmed');
    expect(session.txHash).toBe('0xdef');
  });
});
```

The `awaiting-confirmation` vs. `confirmed` split is the invariant that lets a downstream fulfillment step trust the tx is final — a 1-confirmation gate on a $50 USDC purchase would eat a chain-reorg loss, and the state-machine invariant is the enforcement mechanism.

### 4. `abstractGas` — paymaster / meta-tx gas subsidy

`tests/crypto/gas.test.ts` — `abstractGas()` only runs when `session.config.gasAbstractionEnabled: true` (default `true`, EIP-4337 paymaster / meta-tx pattern) so a customer paying in USDC does not need to hold ETH for gas. The step records `paymasterAddress` + `gasSubsidyCents` (in cents-equivalent) so downstream accounting can attribute the gas cost to the platform.

```ts
import { describe, expect, it } from 'vitest';
import {
  abstractGas,
  createCryptoInvoice,
  createStripeMock,
} from '@kiwa-test/payment';

describe('crypto — gas abstraction', () => {
  it('records paymaster + gas subsidy', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_4',
      customerId: 'cus_4',
      amountCents: 5000,
      chain: 'ethereum',
      token: 'USDC',
    });
    const step = await abstractGas(adapter, session, {
      paymasterAddress: '0xpaymaster',
      gasSubsidyCents: 30,
    });
    expect(step.metadata.paymasterAddress).toBe('0xpaymaster');
    expect(step.metadata.gasSubsidyCents).toBe(30);
    expect(session.state).toBe('gas-abstracted');
  });

  it('throws when gas abstraction is disabled in config', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_5',
      customerId: 'cus_5',
      amountCents: 5000,
      chain: 'polygon',
      token: 'USDT',
      config: { gasAbstractionEnabled: false },
    });
    await expect(
      abstractGas(adapter, session, {
        paymasterAddress: '0xpm',
        gasSubsidyCents: 20,
      }),
    ).rejects.toThrow(/gas abstraction disabled/);
  });
});
```

The `gasAbstractionEnabled` opt-out is the switch between a UX-first product (customer pays only in stablecoin) and a wallet-native product (customer supplies native gas) — the same `CryptoPaymentSession` shape covers both.

### 5. `linkWallet` — repeat-billing wallet binding

`tests/crypto/wallet.test.ts` — `linkWallet()` binds a `walletAddress` to `session.customerId` for repeat billing. Requires a non-empty `signature` proof (typically an EIP-712 typed-data signature) so a mis-configured caller cannot silently link a wallet the customer does not own.

```ts
import { describe, expect, it } from 'vitest';
import {
  createCryptoInvoice,
  createStripeMock,
  linkWallet,
} from '@kiwa-test/payment';

describe('crypto — wallet linking', () => {
  it('binds wallet on non-empty signature', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_6',
      customerId: 'cus_6',
      amountCents: 5000,
      chain: 'base',
      token: 'USDC',
    });
    const step = await linkWallet(adapter, session, {
      walletAddress: '0xwallet',
      signature: '0xsig123',
    });
    expect(step.metadata.walletAddress).toBe('0xwallet');
    expect(session.walletAddress).toBe('0xwallet');
    expect(session.state).toBe('wallet-linked');
  });

  it('refuses empty signature', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_7',
      customerId: 'cus_7',
      amountCents: 5000,
      chain: 'arbitrum',
      token: 'ETH',
    });
    await expect(
      linkWallet(adapter, session, {
        walletAddress: '0xw',
        signature: '',
      }),
    ).rejects.toThrow(/signature required/);
  });
});
```

`session.walletAddress` is now the persistent binding for repeat billing — a follow-up invoice against the same customer can charge the linked wallet without a fresh signature-proof loop.

### 6. `startFxTransfer` + `lockRate` — FX rate lock with expiration window

`tests/fx/rate-lock.test.ts` — an `FxSession` pins a `transferId` + `customerId` + a `config.rateLockDurationMs` (default 60s, mirroring Wise / Airwallex quote-lock windows). `lockRate()` pins an `FxRateQuote` with `fromCurrency` / `toCurrency` / `rate` / `quoteId` / `lockedAt` / `lockExpiresAt` / `amountToCents` (computed as `Math.round(amountFromCents * rate)`). A caller that lets the lock expire cannot silently ship a stale rate — the downstream `initiateSettlement` throws.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  lockRate,
  startFxTransfer,
} from '@kiwa-test/payment';

describe('fx — rate lock', () => {
  it('locks a quote and computes amountToCents', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_1',
      customerId: 'cus_1',
    });
    const step = await lockRate(adapter, session, {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_1',
      amountFromCents: 10000,
    });
    expect(step.metadata.quoteId).toBe('q_1');
    expect(step.metadata.amountToCents).toBe(9200);
    expect(session.state).toBe('rate-locked');
    expect(session.quote?.amountToCents).toBe(9200);
  });

  it('rejects non-positive rate', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_2',
      customerId: 'cus_2',
    });
    await expect(
      lockRate(adapter, session, {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0,
        quoteId: 'q_bad',
        amountFromCents: 10000,
      }),
    ).rejects.toThrow(/rate must be positive/);
  });
});
```

`session.quote.lockExpiresAt` is the expiration guard — a downstream `initiateSettlement` compares `Date.now() > lockExpiresAt` and throws if the lock has aged out, forcing the caller to re-lock at the new rate.

### 7. `initiateSettlement` + `completeSettlement` — SWIFT / SEPA rail settlement

`tests/fx/settlement.test.ts` — `initiateSettlement()` fires on the configured rail (`SWIFT` / `SEPA` / `ACH` / `FASTER` / `RTGS`) with beneficiary IBAN / BIC + emits `fx.settlement_initiated`; a rate-lock-expired path moves the state to `'expired'` and throws. `completeSettlement()` flips state to `'settlement-completed'` + records `session.settledAmountCents` from the locked quote — a caller can call this from a webhook handler that confirms the beneficiary bank credit.

```ts
import { describe, expect, it } from 'vitest';
import {
  completeSettlement,
  createStripeMock,
  initiateSettlement,
  lockRate,
  startFxTransfer,
} from '@kiwa-test/payment';

describe('fx — settlement flow', () => {
  it('initiates + completes settlement on the SEPA rail', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_3',
      customerId: 'cus_3',
      config: { settlementRail: 'SEPA' },
    });
    await lockRate(adapter, session, {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.9,
      quoteId: 'q_2',
      amountFromCents: 20000,
    });
    const init = await initiateSettlement(adapter, session, {
      beneficiaryIban: 'DE89370400440532013000',
      beneficiaryBic: 'DEUTDEFF',
    });
    expect(init.metadata.rail).toBe('SEPA');
    expect(session.state).toBe('settlement-initiated');
    const done = await completeSettlement(adapter, session, {
      settlementRef: 'stl_1',
    });
    expect(done.metadata.settlementRef).toBe('stl_1');
    expect(session.state).toBe('settlement-completed');
    expect(session.settledAmountCents).toBe(18000);
  });

  it('throws initiateSettlement when no rate locked', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_4',
      customerId: 'cus_4',
    });
    await expect(
      initiateSettlement(adapter, session, {
        beneficiaryIban: 'GB29NWBK60161331926819',
      }),
    ).rejects.toThrow(/no rate locked/);
  });
});
```

The `settlement-initiated` → `settlement-completed` chain is the deterministic closing loop — a follow-up ledger reconciliation walks `session.settledAmountCents` for the exact amount credited to the beneficiary, and the `settlementRef` metadata links back to the underlying SWIFT MT103 / SEPA SCT payment reference.

### 8. `expireRate` — explicit rate-lock expiration

`tests/fx/expire.test.ts` — `expireRate()` explicitly marks the current rate lock as expired so a stalled retry loop cannot silently ship a stale rate. The step is idempotent when the lock has already expired via the natural `lockExpiresAt` window — a caller can safely call it defensively.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  expireRate,
  lockRate,
  startFxTransfer,
} from '@kiwa-test/payment';

describe('fx — explicit rate expiration', () => {
  it('marks the rate lock expired', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_5',
      customerId: 'cus_5',
    });
    await lockRate(adapter, session, {
      fromCurrency: 'GBP',
      toCurrency: 'USD',
      rate: 1.25,
      quoteId: 'q_3',
      amountFromCents: 8000,
    });
    const step = await expireRate(adapter, session);
    expect(step.neutralEvent).toBe('fx.rate_expired');
    expect(session.state).toBe('expired');
  });

  it('throws when no rate is locked', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_6',
      customerId: 'cus_6',
    });
    await expect(expireRate(adapter, session)).rejects.toThrow(
      /no rate locked/,
    );
  });
});
```

The explicit `expireRate` step is the escape hatch for a caller that detects rate drift out-of-band (e.g. an FX API pushed a new rate mid-window) — the state machine forbids silent stale-rate settlement, and the explicit expiration is the recovery path.

## Wrap-up

You now have a crypto-payment + FX cross-border pipeline that (a) creates stablecoin invoices on 5 chains + 5 tokens, (b) gates finalization on a required-confirmations count, (c) abstracts gas via paymaster / meta-tx, (d) links wallets for repeat billing with signature-proof, (e) locks FX rates with expiration window, (f) initiates settlement on 5 rails with beneficiary IBAN / BIC, (g) completes settlement with reference tracking, and (h) explicitly expires rate locks — all without booting a real Coinbase Commerce or Wise backend, all in a millisecond-scale inner loop, and all on the same neutral event names (`crypto.invoice_created` / `crypto.tx_confirmed` / `fx.rate_locked` / `fx.settlement_completed` / etc.) that the 3 provider dialects (`stripe` / `paddle` / `lemonsqueezy`) emit under real routing. The v1.41 dogfood app (`examples/dogfood-payment-crypto-fx-app`) runs the same assertions against real Coinbase Commerce / BitPay + Wise / Airwallex backends under `KIWA_MODE=real` + `KIWA_CRYPTO_URL` + `KIWA_FX_URL`; the fidelity harness (`collectFidelityCoverage()`) reports the mock-vs-real coverage on a per-axis basis.
