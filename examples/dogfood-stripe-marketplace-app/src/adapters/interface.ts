/**
 * Provider-neutral Stripe Connect marketplace RP surface for the dogfood app.
 *
 * The app talks to Stripe only through this contract so the same route
 * handlers can flip between `createStripeMock()` and the env-gated real
 * driver skeleton. The four operation groups mirror the marketplace
 * concerns this sub-issue verifies end-to-end: seller onboarding, destination
 * charges, downstream transfers, and tax reporting.
 */

import type {
  PaymentWebhookEvent,
  WebhookVerifyResult,
} from '@kiwa/payment';

export type MarketplaceMode = 'mock' | 'real';
export type AccountStatus = 'pending' | 'verified' | 'restricted';
export type AccountCapabilityState = 'inactive' | 'active' | 'revoked';
export type ChargeStatus = 'authorized' | 'captured';
export type TransferKind = 'seller' | 'referrer';
export type TaxReportKind = '1099-K' | 'DAC7';

/**
 * Seller onboarding input. Matches the minimum data a marketplace collects
 * before it sends a user into Stripe Connect Express onboarding.
 */
export interface CreateExpressAccountInput {
  email: string;
  country?: string;
}

/**
 * Stored Stripe Connect account snapshot. The status is derived from the
 * current capability flags so tests can move the account through pending,
 * verified, and restricted states by updating the persisted record.
 */
export interface MarketplaceAccount {
  id: string;
  email: string;
  country: string;
  status: AccountStatus;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  capabilities: {
    cardPayments: AccountCapabilityState;
    transfers: AccountCapabilityState;
  };
  onboardingUrl: string;
  createdAt: number;
}

/**
 * Destination charge input. The name stays `CheckoutInput` to mirror the
 * billing app pattern where the top-level payment operation accepts one
 * canonical input envelope.
 */
export interface CheckoutInput {
  customerId: string;
  accountId: string;
  amountCents: number;
  applicationFeeCents: number;
  currency?: string;
  captureMethod?: 'automatic' | 'manual';
  idempotencyKey?: string;
  createdAtMs?: number;
}

/**
 * Stored destination charge snapshot. Captures both Stripe-visible fields
 * (`transfer_data.destination`) and marketplace arithmetic the payout tests
 * assert on (`sellerNetCents`).
 */
export interface ChargeResult {
  id: string;
  customerId: string;
  accountId: string;
  amountCents: number;
  applicationFeeCents: number;
  sellerNetCents: number;
  currency: string;
  status: ChargeStatus;
  transferData: { destination: string };
  captureMethod: 'automatic' | 'manual';
  idempotencyKey?: string;
  createdAt: number;
  capturedAt?: number;
}

/**
 * Transfer creation input. Seller transfers are explicit so tests can model
 * destination-charge payout timing independently from the charge itself.
 */
export interface CreateSellerTransferInput {
  accountId: string;
  chargeId: string;
  amountCents: number;
  sourceTransaction?: string;
  createdAtMs?: number;
}

/**
 * Referrer transfer input. `rateBps` allows the dogfood tests to express
 * "5% affiliate cut" without hand-calculating the cents every time.
 */
export interface CreateReferrerTransferInput {
  accountId: string;
  chargeId: string;
  amountCents?: number;
  rateBps?: number;
  sourceTransaction?: string;
  createdAtMs?: number;
}

/**
 * Stored transfer snapshot shared by seller + referrer payouts.
 */
export interface TransferResult {
  id: string;
  accountId: string;
  chargeId: string;
  amountCents: number;
  currency: string;
  kind: TransferKind;
  sourceTransaction: string;
  createdAt: number;
}

/**
 * 1099-K input — annual US marketplace gross receipts by seller.
 */
export interface GenerateTaxReport1099KInput {
  accountId: string;
  year: number;
}

/**
 * DAC7 input — seller identity + annual revenue aggregation for EU
 * marketplace reporting.
 */
export interface GenerateTaxReportDAC7Input {
  accountId: string;
  year: number;
  sellerName: string;
  tin: string;
  address: string;
  bankAccount: string;
  country: string;
}

/**
 * Stored tax report snapshot. 1099-K uses `grossCents` + `transactionCount`;
 * DAC7 additionally populates the seller identity fields + fee aggregate.
 */
export interface TaxReportResult {
  id: string;
  kind: TaxReportKind;
  accountId: string;
  year: number;
  grossCents: number;
  transactionCount: number;
  createdAt: number;
  sellerName?: string;
  tin?: string;
  address?: string;
  bankAccount?: string;
  totalRevenueCents?: number;
  totalFeeCents?: number;
  country?: string;
}

/**
 * Webhook receive input. Mirrors what a real Stripe webhook route consumes:
 * untouched raw body bytes plus the `Stripe-Signature` header.
 */
export interface WebhookReceiveInput {
  rawBody: string;
  signature: string;
  toleranceMs?: number;
}

/**
 * Webhook receive result. `dispatched` stays false for unknown event types or
 * signature failures so the route handler can surface the exact rejection.
 */
export interface WebhookReceiveResult {
  verify: WebhookVerifyResult;
  dispatched: boolean;
}

/**
 * Marketplace event log entry. The underlying payment adapter supplies the
 * Stripe-shaped envelope; this app adds `detail` so tests can assert on
 * marketplace-specific payload metadata such as `accountId` or `reportId`.
 */
export interface MarketplaceWebhookEvent extends PaymentWebhookEvent {
  detail?: Record<string, unknown>;
}

/**
 * Trace event emitted by every public adapter operation. Downstream fidelity
 * tests compare the ordered trace across mock and real adapters to detect
 * missing branches or diverging error classifications.
 */
export interface TraceEvent {
  op:
    | 'createExpressAccount'
    | 'getOnboardingLink'
    | 'getAccountStatus'
    | 'listAccounts'
    | 'createDestinationCharge'
    | 'captureCharge'
    | 'listCharges'
    | 'createSellerTransfer'
    | 'createReferrerTransfer'
    | 'listTransfers'
    | 'generateTaxReport1099K'
    | 'generateTaxReportDAC7'
    | 'listTaxReports'
    | 'receiveWebhook'
    | 'reset';
  ok: boolean;
  errorKind?: string;
  detail?: Record<string, unknown>;
}

/**
 * Shared adapter contract implemented by both the mock and real driver
 * skeleton. The route handlers stay framework-neutral because this is the
 * only surface they depend on.
 */
export interface StripeMarketplaceAdapter {
  readonly mode: MarketplaceMode;
  readonly traces: () => TraceEvent[];

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

  eventsEmitted(): MarketplaceWebhookEvent[];
  receiveWebhook(input: WebhookReceiveInput): Promise<WebhookReceiveResult>;
  reset(): Promise<void>;
}
