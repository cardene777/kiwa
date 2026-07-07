/**
 * Mock adapter — drives `@kiwa-test/payment` v0.5 crypto-payment +
 * fx-cross-border semantics (createCryptoInvoice / confirmTx / abstractGas /
 * linkWallet / startFxTransfer / lockRate / initiateSettlement /
 * completeSettlement / expireRate) so the same app code exercises a
 * deterministic crypto + FX ceremony without a real Coinbase / Wise /
 * paymaster endpoint. Both mock and real adapters satisfy
 * {@link PaymentAdapter}, so the fidelity harness can diff them
 * side-by-side.
 *
 * State model — one session per (sessionId) tuple across each surface;
 * each session is isolated so per-surface metrics stay separated. The
 * invoice surface owns crypto invoice creation + on-chain confirmation +
 * gas abstraction + wallet linking + status snapshots; the fx surface
 * owns rate lock + settlement initiation + settlement completion + rate
 * expiration + status snapshots.
 *
 * The mock intentionally piggy-backs on the v0.5 crypto-payment +
 * fx-cross-border semantics — every op appends the matching neutral event
 * into the trace so the fidelity harness can assert the mock and real
 * adapters produce identical event orderings.
 */

import {
  createStripeMock,
  createCryptoInvoice as createCryptoInvoiceSem,
  confirmTx as confirmTxSem,
  abstractGas as abstractGasSem,
  linkWallet as linkWalletSem,
  startFxTransfer as startFxTransferSem,
  lockRate as lockRateSem,
  initiateSettlement as initiateSettlementSem,
  completeSettlement as completeSettlementSem,
  expireRate as expireRateSem,
  type CryptoPaymentSession,
  type FxSession,
  type PaymentAdapter as PaymentWebhookAdapter,
} from '@kiwa-test/payment';
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

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms, default 1). */
  latencyMs?: number;
  /**
   * Initial webhook adapter used to drive the v0.5 semantics helpers.
   * Defaults to a stripe mock so the neutral event names emit under the
   * `stripe.*` provider vocabulary. Tests that want a paddle / lemonsqueezy
   * flavour can inject one here.
   */
  webhookAdapter?: PaymentWebhookAdapter;
}

interface InvoiceSessionState {
  sessionId: string;
  provider: 'coinbase-commerce' | 'bitpay' | 'moonpay';
  /** invoiceId → CryptoPaymentSession from v0.5 semantics. */
  invoices: Map<string, CryptoPaymentSession>;
  closed: boolean;
}

interface FxSessionState {
  sessionId: string;
  provider: 'wise' | 'airwallex' | 'currencycloud';
  /** transferId → FxSession from v0.5 semantics. */
  transfers: Map<string, FxSession>;
  closed: boolean;
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): PaymentAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const webhookAdapter =
    opts.webhookAdapter ??
    createStripeMock({ secret: 'whsec_dogfood_crypto_fx' });
  const trace: TraceEvent[] = [];
  const invoices = new Map<string, InvoiceSessionState>();
  const fxs = new Map<string, FxSessionState>();

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

  function coerceErrorKind(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'unknown_error';
  }

  return {
    mode: 'mock',

    async startInvoice(input) {
      if (invoices.has(input.sessionId)) {
        record('startInvoice', false, {
          errorKind: 'invoice_session_exists',
        });
        throw new Error('invoice_session_exists');
      }
      invoices.set(input.sessionId, {
        sessionId: input.sessionId,
        provider: input.provider,
        invoices: new Map(),
        closed: false,
      });
      record('startInvoice', true, {
        detail: { sessionId: input.sessionId, provider: input.provider },
      });
    },

    async createInvoice(input) {
      const session = invoices.get(input.sessionId);
      if (!session) {
        record('createInvoice', false, {
          errorKind: 'invoice_session_not_found',
        });
        throw new Error('invoice_session_not_found');
      }
      if (session.closed) {
        record('createInvoice', false, {
          errorKind: 'invoice_session_closed',
        });
        throw new Error('invoice_session_closed');
      }
      if (session.invoices.has(input.invoiceId)) {
        record('createInvoice', false, {
          errorKind: 'invoice_already_created',
        });
        throw new Error('invoice_already_created');
      }
      try {
        const config: {
          requiredConfirmations?: number;
          expirationMs?: number;
          gasAbstractionEnabled?: boolean;
        } = {};
        if (input.requiredConfirmations !== undefined) {
          config.requiredConfirmations = input.requiredConfirmations;
        }
        if (input.expirationMs !== undefined) {
          config.expirationMs = input.expirationMs;
        }
        if (input.gasAbstractionEnabled !== undefined) {
          config.gasAbstractionEnabled = input.gasAbstractionEnabled;
        }
        const createInput: Parameters<typeof createCryptoInvoiceSem>[1] = {
          invoiceId: input.invoiceId,
          customerId: input.customerId,
          amountCents: input.amountCents,
          chain: input.chain,
          token: input.token,
          config,
        };
        if (input.currency !== undefined) createInput.currency = input.currency;
        const { session: cryptoSession } = await createCryptoInvoiceSem(
          webhookAdapter,
          createInput,
        );
        session.invoices.set(input.invoiceId, cryptoSession);
        const result: InvoiceCreateResult = {
          sessionId: input.sessionId,
          invoiceId: input.invoiceId,
          customerId: input.customerId,
          amountCents: input.amountCents,
          chain: input.chain,
          token: input.token,
          state: cryptoSession.state,
          latencyMs,
        };
        if (input.currency !== undefined) result.currency = input.currency;
        record('createInvoice', true, { detail: result });
        return result;
      } catch (err) {
        record('createInvoice', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async confirmTx(input) {
      const session = invoices.get(input.sessionId);
      if (!session) {
        record('confirmTx', false, {
          errorKind: 'invoice_session_not_found',
        });
        throw new Error('invoice_session_not_found');
      }
      const invoice = session.invoices.get(input.invoiceId);
      if (!invoice) {
        record('confirmTx', false, { errorKind: 'invoice_not_found' });
        throw new Error('invoice_not_found');
      }
      if (input.confirmations < 0) {
        record('confirmTx', false, {
          errorKind: 'confirmations_out_of_range',
        });
        throw new Error('confirmations_out_of_range');
      }
      if (input.txHash.length === 0) {
        record('confirmTx', false, { errorKind: 'txHash_required' });
        throw new Error('txHash_required');
      }
      try {
        await confirmTxSem(webhookAdapter, invoice, {
          txHash: input.txHash,
          confirmations: input.confirmations,
        });
        const result: InvoiceConfirmResult = {
          sessionId: input.sessionId,
          invoiceId: input.invoiceId,
          txHash: input.txHash,
          confirmations: input.confirmations,
          requiredConfirmations: invoice.config.requiredConfirmations,
          state: invoice.state,
          latencyMs,
        };
        record('confirmTx', true, { detail: result });
        return result;
      } catch (err) {
        record('confirmTx', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async abstractGas(input) {
      const session = invoices.get(input.sessionId);
      if (!session) {
        record('abstractGas', false, {
          errorKind: 'invoice_session_not_found',
        });
        throw new Error('invoice_session_not_found');
      }
      const invoice = session.invoices.get(input.invoiceId);
      if (!invoice) {
        record('abstractGas', false, { errorKind: 'invoice_not_found' });
        throw new Error('invoice_not_found');
      }
      if (input.paymasterAddress.length === 0) {
        record('abstractGas', false, {
          errorKind: 'paymasterAddress_required',
        });
        throw new Error('paymasterAddress_required');
      }
      try {
        await abstractGasSem(webhookAdapter, invoice, {
          paymasterAddress: input.paymasterAddress,
          gasSubsidyCents: input.gasSubsidyCents,
        });
        const result: InvoiceAbstractGasResult = {
          sessionId: input.sessionId,
          invoiceId: input.invoiceId,
          paymasterAddress: input.paymasterAddress,
          gasSubsidyCents: input.gasSubsidyCents,
          state: invoice.state,
          latencyMs,
        };
        record('abstractGas', true, { detail: result });
        return result;
      } catch (err) {
        record('abstractGas', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async linkWallet(input) {
      const session = invoices.get(input.sessionId);
      if (!session) {
        record('linkWallet', false, {
          errorKind: 'invoice_session_not_found',
        });
        throw new Error('invoice_session_not_found');
      }
      const invoice = session.invoices.get(input.invoiceId);
      if (!invoice) {
        record('linkWallet', false, { errorKind: 'invoice_not_found' });
        throw new Error('invoice_not_found');
      }
      try {
        await linkWalletSem(webhookAdapter, invoice, {
          walletAddress: input.walletAddress,
          signature: input.signature,
        });
        const result: InvoiceLinkWalletResult = {
          sessionId: input.sessionId,
          invoiceId: input.invoiceId,
          walletAddress: input.walletAddress,
          signatureLength: input.signature.length,
          state: invoice.state,
          latencyMs,
        };
        record('linkWallet', true, { detail: result });
        return result;
      } catch (err) {
        record('linkWallet', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async checkInvoiceStatus(input) {
      const session = invoices.get(input.sessionId);
      if (!session) {
        record('checkInvoiceStatus', false, {
          errorKind: 'invoice_session_not_found',
        });
        throw new Error('invoice_session_not_found');
      }
      const invoice = session.invoices.get(input.invoiceId);
      if (!invoice) {
        record('checkInvoiceStatus', false, {
          errorKind: 'invoice_not_found',
        });
        throw new Error('invoice_not_found');
      }
      const result: InvoiceStatusResult = {
        sessionId: input.sessionId,
        invoiceId: input.invoiceId,
        amountCents: invoice.amountCents,
        chain: invoice.chain,
        token: invoice.token,
        walletAddress: invoice.walletAddress,
        txHash: invoice.txHash,
        confirmations: invoice.confirmations,
        requiredConfirmations: invoice.config.requiredConfirmations,
        state: invoice.state,
        latencyMs,
      };
      record('checkInvoiceStatus', true, { detail: result });
      return result;
    },

    async closeInvoice(input) {
      const session = invoices.get(input.sessionId);
      if (!session) {
        record('closeInvoice', false, {
          errorKind: 'invoice_session_not_found',
        });
        throw new Error('invoice_session_not_found');
      }
      session.closed = true;
      invoices.delete(input.sessionId);
      record('closeInvoice', true, {
        detail: { sessionId: input.sessionId },
      });
    },

    async startFx(input) {
      if (fxs.has(input.sessionId)) {
        record('startFx', false, { errorKind: 'fx_session_exists' });
        throw new Error('fx_session_exists');
      }
      fxs.set(input.sessionId, {
        sessionId: input.sessionId,
        provider: input.provider,
        transfers: new Map(),
        closed: false,
      });
      record('startFx', true, {
        detail: { sessionId: input.sessionId, provider: input.provider },
      });
    },

    async lockRate(input) {
      const session = fxs.get(input.sessionId);
      if (!session) {
        record('lockRate', false, { errorKind: 'fx_session_not_found' });
        throw new Error('fx_session_not_found');
      }
      if (session.closed) {
        record('lockRate', false, { errorKind: 'fx_session_closed' });
        throw new Error('fx_session_closed');
      }
      try {
        let transfer = session.transfers.get(input.transferId);
        if (!transfer) {
          const startInput: Parameters<typeof startFxTransferSem>[0] = {
            transferId: input.transferId,
            customerId: input.customerId,
          };
          if (
            input.rateLockDurationMs !== undefined ||
            input.settlementRail !== undefined
          ) {
            const config: NonNullable<
              Parameters<typeof startFxTransferSem>[0]['config']
            > = {};
            if (input.rateLockDurationMs !== undefined) {
              config.rateLockDurationMs = input.rateLockDurationMs;
            }
            if (input.settlementRail !== undefined) {
              config.settlementRail = input.settlementRail;
            }
            startInput.config = config;
          }
          transfer = startFxTransferSem(startInput);
          session.transfers.set(input.transferId, transfer);
        }
        await lockRateSem(webhookAdapter, transfer, {
          fromCurrency: input.fromCurrency,
          toCurrency: input.toCurrency,
          rate: input.rate,
          quoteId: input.quoteId,
          amountFromCents: input.amountFromCents,
        });
        // transfer.quote is now populated.
        const quote = transfer.quote!;
        const result: FxLockRateResult = {
          sessionId: input.sessionId,
          transferId: input.transferId,
          quoteId: quote.quoteId,
          fromCurrency: quote.fromCurrency,
          toCurrency: quote.toCurrency,
          rate: quote.rate,
          amountFromCents: quote.amountFromCents,
          amountToCents: quote.amountToCents,
          lockExpiresAt: quote.lockExpiresAt,
          state: transfer.state,
          latencyMs,
        };
        record('lockRate', true, { detail: result });
        return result;
      } catch (err) {
        record('lockRate', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async initiateSettlement(input) {
      const session = fxs.get(input.sessionId);
      if (!session) {
        record('initiateSettlement', false, {
          errorKind: 'fx_session_not_found',
        });
        throw new Error('fx_session_not_found');
      }
      const transfer = session.transfers.get(input.transferId);
      if (!transfer) {
        record('initiateSettlement', false, {
          errorKind: 'fx_transfer_not_found',
        });
        throw new Error('fx_transfer_not_found');
      }
      try {
        const beneficiary: {
          beneficiaryIban?: string;
          beneficiaryBic?: string;
        } = {};
        if (input.beneficiaryIban !== undefined) {
          beneficiary.beneficiaryIban = input.beneficiaryIban;
        }
        if (input.beneficiaryBic !== undefined) {
          beneficiary.beneficiaryBic = input.beneficiaryBic;
        }
        await initiateSettlementSem(webhookAdapter, transfer, beneficiary);
        const result: FxInitiateSettlementResult = {
          sessionId: input.sessionId,
          transferId: input.transferId,
          rail: transfer.config.settlementRail,
          quoteId: transfer.quote!.quoteId,
          state: transfer.state,
          latencyMs,
        };
        if (input.beneficiaryIban !== undefined) {
          result.beneficiaryIban = input.beneficiaryIban;
        }
        if (input.beneficiaryBic !== undefined) {
          result.beneficiaryBic = input.beneficiaryBic;
        }
        record('initiateSettlement', true, { detail: result });
        return result;
      } catch (err) {
        record('initiateSettlement', false, {
          errorKind: coerceErrorKind(err),
        });
        throw err;
      }
    },

    async completeSettlement(input) {
      const session = fxs.get(input.sessionId);
      if (!session) {
        record('completeSettlement', false, {
          errorKind: 'fx_session_not_found',
        });
        throw new Error('fx_session_not_found');
      }
      const transfer = session.transfers.get(input.transferId);
      if (!transfer) {
        record('completeSettlement', false, {
          errorKind: 'fx_transfer_not_found',
        });
        throw new Error('fx_transfer_not_found');
      }
      if (input.settlementRef.length === 0) {
        record('completeSettlement', false, {
          errorKind: 'settlementRef_required',
        });
        throw new Error('settlementRef_required');
      }
      try {
        await completeSettlementSem(webhookAdapter, transfer, {
          settlementRef: input.settlementRef,
        });
        const result: FxCompleteSettlementResult = {
          sessionId: input.sessionId,
          transferId: input.transferId,
          settlementRef: input.settlementRef,
          settledAmountCents: transfer.settledAmountCents,
          rail: transfer.config.settlementRail,
          state: transfer.state,
          latencyMs,
        };
        record('completeSettlement', true, { detail: result });
        return result;
      } catch (err) {
        record('completeSettlement', false, {
          errorKind: coerceErrorKind(err),
        });
        throw err;
      }
    },

    async expireRate(input) {
      const session = fxs.get(input.sessionId);
      if (!session) {
        record('expireRate', false, { errorKind: 'fx_session_not_found' });
        throw new Error('fx_session_not_found');
      }
      const transfer = session.transfers.get(input.transferId);
      if (!transfer) {
        record('expireRate', false, { errorKind: 'fx_transfer_not_found' });
        throw new Error('fx_transfer_not_found');
      }
      try {
        await expireRateSem(webhookAdapter, transfer);
        const result: FxExpireRateResult = {
          sessionId: input.sessionId,
          transferId: input.transferId,
          quoteId: transfer.quote!.quoteId,
          expiredAt: Date.now(),
          state: transfer.state,
          latencyMs,
        };
        record('expireRate', true, { detail: result });
        return result;
      } catch (err) {
        record('expireRate', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async checkFxStatus(input) {
      const session = fxs.get(input.sessionId);
      if (!session) {
        record('checkFxStatus', false, {
          errorKind: 'fx_session_not_found',
        });
        throw new Error('fx_session_not_found');
      }
      const transfer = session.transfers.get(input.transferId);
      if (!transfer) {
        record('checkFxStatus', false, {
          errorKind: 'fx_transfer_not_found',
        });
        throw new Error('fx_transfer_not_found');
      }
      const quote = transfer.quote;
      const result: FxStatusResult = {
        sessionId: input.sessionId,
        transferId: input.transferId,
        quoteId: quote?.quoteId ?? null,
        rate: quote?.rate ?? null,
        amountFromCents: quote?.amountFromCents ?? null,
        amountToCents: quote?.amountToCents ?? null,
        settledAmountCents: transfer.settledAmountCents,
        rail: transfer.config.settlementRail,
        state: transfer.state,
        latencyMs,
      };
      record('checkFxStatus', true, { detail: result });
      return result;
    },

    async closeFx(input) {
      const session = fxs.get(input.sessionId);
      if (!session) {
        record('closeFx', false, { errorKind: 'fx_session_not_found' });
        throw new Error('fx_session_not_found');
      }
      session.closed = true;
      fxs.delete(input.sessionId);
      record('closeFx', true, { detail: { sessionId: input.sessionId } });
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
      invoices.clear();
      fxs.clear();
    },
  };
}
