/**
 * Marketplace domain runtime bound to a concrete payment adapter.
 *
 * This is the SSOT for how marketplace operations update the in-memory store
 * and which Stripe-shaped webhook events they emit. Both the mock adapter and
 * the future real driver skeleton build on this runtime so event ordering and
 * arithmetic stay aligned across modes.
 */

import {
  providerEventName,
  type PaymentAdapter,
  type PaymentWebhookEvent,
} from '@kiwa-lab/payment';
import type {
  ChargeResult,
  CheckoutInput,
  CreateExpressAccountInput,
  CreateReferrerTransferInput,
  CreateSellerTransferInput,
  GenerateTaxReport1099KInput,
  GenerateTaxReportDAC7Input,
  MarketplaceAccount,
  MarketplaceWebhookEvent,
  TaxReportResult,
  TransferResult,
} from '../adapters/interface.js';
import {
  createMarketplaceStore,
  type MarketplaceStore,
} from './store.js';

export interface MarketplaceRuntime {
  readonly adapter: PaymentAdapter;
  readonly store: MarketplaceStore;

  createExpressAccount(input: CreateExpressAccountInput): Promise<MarketplaceAccount>;
  getOnboardingLink(accountId: string): Promise<{ accountId: string; url: string }>;
  getAccountStatus(accountId: string): Promise<MarketplaceAccount>;
  listAccounts(): MarketplaceAccount[];

  createDestinationCharge(input: CheckoutInput): Promise<ChargeResult>;
  captureCharge(chargeId: string): Promise<ChargeResult>;
  listCharges(filter?: { accountId?: string }): ChargeResult[];

  createSellerTransfer(input: CreateSellerTransferInput): Promise<TransferResult>;
  createReferrerTransfer(input: CreateReferrerTransferInput): Promise<TransferResult>;
  listTransfers(filter?: { accountId?: string }): TransferResult[];

  generateTaxReport1099K(input: GenerateTaxReport1099KInput): Promise<TaxReportResult | null>;
  generateTaxReportDAC7(input: GenerateTaxReportDAC7Input): Promise<TaxReportResult | null>;
  listTaxReports(filter?: { accountId?: string }): TaxReportResult[];
}

export interface CreateMarketplaceRuntimeOptions {
  now?: () => number;
}

/**
 * Build a marketplace runtime on top of a payment adapter. The runtime owns
 * deterministic ids, derived account status, charge arithmetic, transfer
 * ordering, and tax-report aggregation.
 */
export function createMarketplaceRuntime(
  adapter: PaymentAdapter,
  opts: CreateMarketplaceRuntimeOptions = {},
): MarketplaceRuntime {
  const store = createMarketplaceStore();
  const now = opts.now ?? Date.now;

  adapter.onWebhook((event: PaymentWebhookEvent) => {
    store.recordEvent(event as MarketplaceWebhookEvent);
  });

  let accountSeq = 0;
  let chargeSeq = 0;
  let transferSeq = 0;
  let taxSeq = 0;

  return {
    adapter,
    store,

    async createExpressAccount(input) {
      if (!input.email || !input.email.includes('@')) {
        throw marketError('invalid_input', 'createExpressAccount: email is required');
      }
      const duplicate = store.listAccounts().find((account) => account.email === input.email);
      if (duplicate) {
        throw marketError('duplicate_email', `createExpressAccount: duplicate email ${input.email}`);
      }

      accountSeq += 1;
      const account: MarketplaceAccount = {
        id: `acct_test_${accountSeq}`,
        email: input.email,
        country: input.country ?? 'US',
        status: 'pending',
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        capabilities: {
          cardPayments: 'inactive',
          transfers: 'inactive',
        },
        onboardingUrl: `https://connect.stripe.com/express/onboarding/acct_test_${accountSeq}`,
        createdAt: now(),
      };
      store.persistAccount(account);
      await emitMarketplaceEvent(adapter, {
        neutralType: 'account.updated',
        amountCents: 0,
        customerId: input.email,
        detail: { accountId: account.id, status: account.status },
      });
      return account;
    },

    async getOnboardingLink(accountId) {
      const account = requireAccount(store, accountId, 'getOnboardingLink');
      return { accountId: account.id, url: account.onboardingUrl };
    },

    async getAccountStatus(accountId) {
      const account = requireAccount(store, accountId, 'getAccountStatus');
      const refreshed = withDerivedStatus(account);
      store.persistAccount(refreshed);
      return refreshed;
    },

    listAccounts() {
      return store.listAccounts().map(withDerivedStatus);
    },

    async createDestinationCharge(input) {
      if (input.amountCents <= 0) {
        throw marketError(
          'invalid_amount',
          `createDestinationCharge: amountCents must be > 0 (got ${input.amountCents})`,
        );
      }
      if (input.applicationFeeCents > input.amountCents) {
        throw marketError(
          'application_fee_exceeds_amount',
          'createDestinationCharge: applicationFeeCents cannot exceed amountCents',
        );
      }
      requireAccount(store, input.accountId, 'createDestinationCharge');

      if (input.idempotencyKey) {
        const existing = store
          .listCharges()
          .find((charge) => charge.idempotencyKey === input.idempotencyKey);
        if (existing) return existing;
      }

      chargeSeq += 1;
      const createdAt = input.createdAtMs ?? now();
      const charge: ChargeResult = {
        id: `ch_test_${chargeSeq}`,
        customerId: input.customerId,
        accountId: input.accountId,
        amountCents: input.amountCents,
        applicationFeeCents: input.applicationFeeCents,
        sellerNetCents: input.amountCents - input.applicationFeeCents,
        currency: input.currency ?? 'usd',
        status: input.captureMethod === 'manual' ? 'authorized' : 'captured',
        transferData: { destination: input.accountId },
        captureMethod: input.captureMethod ?? 'automatic',
        ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
        createdAt,
        ...(input.captureMethod !== 'manual' ? { capturedAt: createdAt } : {}),
      };
      store.persistCharge(charge);

      await emitMarketplaceEvent(adapter, {
        neutralType: 'charge.succeeded',
        amountCents: charge.amountCents,
        currency: charge.currency,
        customerId: charge.customerId,
        detail: { chargeId: charge.id, accountId: charge.accountId },
      });
      await emitMarketplaceEvent(adapter, {
        neutralType: 'application_fee.created',
        amountCents: charge.applicationFeeCents,
        currency: charge.currency,
        customerId: charge.customerId,
        detail: { chargeId: charge.id, applicationFeeCents: charge.applicationFeeCents },
      });

      return charge;
    },

    async captureCharge(chargeId) {
      const charge = requireCharge(store, chargeId, 'captureCharge');
      if (charge.status === 'captured') {
        throw marketError('already_captured', `captureCharge: charge ${chargeId} already captured`);
      }
      const captured: ChargeResult = {
        ...charge,
        status: 'captured',
        capturedAt: now(),
      };
      store.persistCharge(captured);
      return captured;
    },

    listCharges(filter) {
      return store
        .listCharges()
        .filter((charge) => filter?.accountId === undefined || charge.accountId === filter.accountId);
    },

    async createSellerTransfer(input) {
      requireAccount(store, input.accountId, 'createSellerTransfer');
      const charge = requireCharge(store, input.chargeId, 'createSellerTransfer');

      transferSeq += 1;
      const transfer: TransferResult = {
        id: `tr_test_${transferSeq}`,
        accountId: input.accountId,
        chargeId: input.chargeId,
        amountCents: input.amountCents,
        currency: charge.currency,
        kind: 'seller',
        sourceTransaction: input.sourceTransaction ?? charge.id,
        createdAt: input.createdAtMs ?? now(),
      };
      store.persistTransfer(transfer);
      await emitMarketplaceEvent(adapter, {
        neutralType: 'transfer.created',
        amountCents: transfer.amountCents,
        currency: transfer.currency,
        customerId: charge.customerId,
        detail: { transferId: transfer.id, kind: transfer.kind, chargeId: transfer.chargeId },
      });
      return transfer;
    },

    async createReferrerTransfer(input) {
      requireAccount(store, input.accountId, 'createReferrerTransfer');
      const charge = requireCharge(store, input.chargeId, 'createReferrerTransfer');
      const amountCents =
        input.amountCents ?? Math.round((charge.amountCents * (input.rateBps ?? 500)) / 10_000);

      transferSeq += 1;
      const transfer: TransferResult = {
        id: `tr_test_${transferSeq}`,
        accountId: input.accountId,
        chargeId: input.chargeId,
        amountCents,
        currency: charge.currency,
        kind: 'referrer',
        sourceTransaction: input.sourceTransaction ?? charge.id,
        createdAt: input.createdAtMs ?? now(),
      };
      store.persistTransfer(transfer);
      await emitMarketplaceEvent(adapter, {
        neutralType: 'transfer.created',
        amountCents: transfer.amountCents,
        currency: transfer.currency,
        customerId: charge.customerId,
        detail: { transferId: transfer.id, kind: transfer.kind, chargeId: transfer.chargeId },
      });
      return transfer;
    },

    listTransfers(filter) {
      return store
        .listTransfers()
        .filter((transfer) => filter?.accountId === undefined || transfer.accountId === filter.accountId)
        .sort((left, right) => right.createdAt - left.createdAt);
    },

    async generateTaxReport1099K(input) {
      requireAccount(store, input.accountId, 'generateTaxReport1099K');
      const existing = store
        .listTaxReports()
        .find((report) => report.kind === '1099-K' && report.accountId === input.accountId && report.year === input.year);
      if (existing) return existing;

      const charges = store
        .listCharges()
        .filter((charge) => charge.accountId === input.accountId && yearOf(charge.createdAt) === input.year);
      if (charges.length === 0) return null;
      const grossCents = sum(charges.map((charge) => charge.amountCents));
      if (grossCents < 60_000) return null;

      taxSeq += 1;
      const report: TaxReportResult = {
        id: `tax_test_${taxSeq}`,
        kind: '1099-K',
        accountId: input.accountId,
        year: input.year,
        grossCents,
        transactionCount: charges.length,
        createdAt: now(),
      };
      store.persistTaxReport(report);
      await emitMarketplaceEvent(adapter, {
        neutralType: 'tax_report.generated',
        amountCents: report.grossCents,
        customerId: input.accountId,
        detail: { reportId: report.id, kind: report.kind, accountId: report.accountId },
      });
      return report;
    },

    async generateTaxReportDAC7(input) {
      requireAccount(store, input.accountId, 'generateTaxReportDAC7');
      const existing = store
        .listTaxReports()
        .find((report) => report.kind === 'DAC7' && report.accountId === input.accountId && report.year === input.year);
      if (existing) return existing;

      const charges = store
        .listCharges()
        .filter((charge) => charge.accountId === input.accountId && yearOf(charge.createdAt) === input.year);
      if (charges.length === 0) return null;

      taxSeq += 1;
      const totalRevenueCents = sum(charges.map((charge) => charge.amountCents));
      const totalFeeCents = sum(charges.map((charge) => charge.applicationFeeCents));
      const report: TaxReportResult = {
        id: `tax_test_${taxSeq}`,
        kind: 'DAC7',
        accountId: input.accountId,
        year: input.year,
        grossCents: totalRevenueCents,
        transactionCount: charges.length,
        createdAt: now(),
        sellerName: input.sellerName,
        tin: input.tin,
        address: input.address,
        bankAccount: input.bankAccount,
        totalRevenueCents,
        totalFeeCents,
        country: input.country,
      };
      store.persistTaxReport(report);
      await emitMarketplaceEvent(adapter, {
        neutralType: 'tax_report.generated',
        amountCents: report.grossCents,
        customerId: input.accountId,
        detail: { reportId: report.id, kind: report.kind, accountId: report.accountId },
      });
      return report;
    },

    listTaxReports(filter) {
      return store
        .listTaxReports()
        .filter((report) => filter?.accountId === undefined || report.accountId === filter.accountId)
        .sort((left, right) => {
          if (left.year !== right.year) return right.year - left.year;
          return left.createdAt - right.createdAt;
        });
    },
  };
}

function withDerivedStatus(account: MarketplaceAccount): MarketplaceAccount {
  const restricted =
    account.capabilities.cardPayments === 'revoked' || account.capabilities.transfers === 'revoked';
  const verified =
    account.detailsSubmitted &&
    account.chargesEnabled &&
    account.payoutsEnabled &&
    account.capabilities.cardPayments === 'active' &&
    account.capabilities.transfers === 'active';

  return {
    ...account,
    capabilities: { ...account.capabilities },
    status: restricted ? 'restricted' : verified ? 'verified' : 'pending',
  };
}

function requireAccount(
  store: MarketplaceStore,
  accountId: string,
  op: string,
): MarketplaceAccount {
  const account = store.getAccount(accountId);
  if (!account) {
    throw marketError('entity_not_found', `${op}: account ${accountId} not found`);
  }
  return withDerivedStatus(account);
}

function requireCharge(store: MarketplaceStore, chargeId: string, op: string): ChargeResult {
  const charge = store.getCharge(chargeId);
  if (!charge) {
    throw marketError('entity_not_found', `${op}: charge ${chargeId} not found`);
  }
  return charge;
}

function marketError(reason: string, message: string): Error & { reason: string } {
  const err = new Error(message) as Error & { reason: string };
  err.reason = reason;
  return err;
}

async function emitMarketplaceEvent(
  adapter: PaymentAdapter,
  input: {
    neutralType: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  const signed = adapter.signWebhook({
    type: marketplaceEventName(input.neutralType),
    amountCents: input.amountCents,
    customerId: input.customerId,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
  });
  const event: MarketplaceWebhookEvent = {
    ...signed.event,
    ...(input.detail !== undefined ? { detail: input.detail } : {}),
  };
  await adapter.emit(event);
}

function marketplaceEventName(neutralType: string): string {
  return providerEventName('stripe', neutralType as never);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function yearOf(timestamp: number): number {
  return new Date(timestamp).getUTCFullYear();
}
