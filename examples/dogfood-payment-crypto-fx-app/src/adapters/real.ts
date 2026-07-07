/**
 * Real adapter — drives a Coinbase Commerce + BitPay + Wise + Airwallex
 * style crypto-and-FX platform when all env keys are set
 * (`KIWA_MODE=real` + `CRYPTO_FX_STACK_READY=1` + `KIWA_CHAIN_RPC` +
 * `KIWA_FX_URL` + `KIWA_PAYMASTER_URL` + `KIWA_SETTLEMENT_URL`). On any
 * system without those, the adapter refuses to run and every method
 * reports `KIWA_CRYPTO_FX_ENV_MISSING`. Downstream tests inspect
 * {@link PaymentAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full Coinbase / BitPay / Wise / Airwallex ceremony is deferred to a
 * follow-up milestone once the testcontainers anvil + FX-quote fixture
 * bundles are available in the CI worker image. This milestone (v1.41-4,
 * Issue CAR-980) lands the env-detect skeleton + trace so the fidelity
 * harness can uniformly drive both adapters even when only the mock has
 * an actual body. The pattern follows the v1.41-2 embedded-finance +
 * v1.41-3 bnpl real adapters — env detection reports which key is
 * missing so the downstream release-gate row can distinguish "not
 * configured" from "ran and diverged".
 */

import type {
  FxCompleteSettlementResult,
  FxExpireRateResult,
  FxInitiateSettlementResult,
  FxLockRateResult,
  FxStatusResult,
  InvoiceAbstractGasResult,
  InvoiceConfirmResult,
  InvoiceCreateResult,
  InvoiceLinkWalletResult,
  InvoiceStatusResult,
  PaymentAdapter,
  TraceEvent,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_CRYPTO_FX_ENV_MISSING';

/**
 * Report whether the current process can talk to a real Coinbase / BitPay /
 * Wise / Airwallex crypto-and-FX platform. Returns `null` on capable
 * systems, or a short reason string when the env is missing (used to
 * populate `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — a chain RPC + FX quote URL +
 * paymaster URL + settlement URL are all needed, all of which cost real
 * money to provision. The default answer is "skip real" so unit test
 * workflows stay fast, hermetic, and free.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up the stack.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // CRYPTO_FX_STACK_READY=1 opts in to real ceremonies once the driver is
  // available. Until it is set every ceremony errors out with
  // MISSING_ENV_ERROR — a follow-up milestone ships the driver.
  if (process.env['CRYPTO_FX_STACK_READY'] === '1') {
    if (!process.env['KIWA_CHAIN_RPC']) return 'KIWA_CHAIN_RPC_MISSING';
    if (!process.env['KIWA_FX_URL']) return 'KIWA_FX_URL_MISSING';
    if (!process.env['KIWA_PAYMASTER_URL']) return 'KIWA_PAYMASTER_URL_MISSING';
    if (!process.env['KIWA_SETTLEMENT_URL']) return 'KIWA_SETTLEMENT_URL_MISSING';
    return null;
  }
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): PaymentAdapter {
  const trace: TraceEvent[] = [];

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function refuse(op: TraceEvent['op']): never {
    const missing = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: missing });
    throw new Error(missing);
  }

  return {
    mode: 'real',

    async startInvoice(_input) {
      refuse('startInvoice');
    },
    async createInvoice(_input): Promise<InvoiceCreateResult> {
      refuse('createInvoice');
    },
    async confirmTx(_input): Promise<InvoiceConfirmResult> {
      refuse('confirmTx');
    },
    async abstractGas(_input): Promise<InvoiceAbstractGasResult> {
      refuse('abstractGas');
    },
    async linkWallet(_input): Promise<InvoiceLinkWalletResult> {
      refuse('linkWallet');
    },
    async checkInvoiceStatus(_input): Promise<InvoiceStatusResult> {
      refuse('checkInvoiceStatus');
    },
    async closeInvoice(_input) {
      refuse('closeInvoice');
    },

    async startFx(_input) {
      refuse('startFx');
    },
    async lockRate(_input): Promise<FxLockRateResult> {
      refuse('lockRate');
    },
    async initiateSettlement(_input): Promise<FxInitiateSettlementResult> {
      refuse('initiateSettlement');
    },
    async completeSettlement(_input): Promise<FxCompleteSettlementResult> {
      refuse('completeSettlement');
    },
    async expireRate(_input): Promise<FxExpireRateResult> {
      refuse('expireRate');
    },
    async checkFxStatus(_input): Promise<FxStatusResult> {
      refuse('checkFxStatus');
    },
    async closeFx(_input) {
      refuse('closeFx');
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
    },
  };
}
