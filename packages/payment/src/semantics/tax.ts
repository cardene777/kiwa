import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Tax semantics — VAT / GST / sales tax + reverse charge + tax registration.
 * Real providers surface tax through per-line calculation (Stripe Tax,
 * Paddle Merchant of Record includes VAT/GST inclusive, Lemon Squeezy MOR).
 * This module reproduces the observable envelope: a pure `calculateTax`
 * helper for local decisions plus 3 emit helpers for the neutral events
 * downstream harnesses filter on.
 */
export type TaxKind = 'vat' | 'gst' | 'sales-tax';

export interface TaxLine {
  kind: TaxKind;
  country: string;
  rateBps: number;
  amountCents: number;
  taxCents: number;
  reverseCharged: boolean;
  exempt: boolean;
}

export interface TaxCalcInput {
  netAmountCents: number;
  buyerCountry: string;
  buyerVatId?: string;
  merchantCountry: string;
  productKind?: 'digital' | 'physical' | 'service';
}

/**
 * Deterministic tax rate table used by the mock. Values are illustrative
 * (real rates change frequently); the goal is stable output for tests.
 * Rates in bps (100bps = 1%).
 */
const RATES: Record<string, { kind: TaxKind; bps: number }> = {
  GB: { kind: 'vat', bps: 2000 },
  DE: { kind: 'vat', bps: 1900 },
  FR: { kind: 'vat', bps: 2000 },
  IT: { kind: 'vat', bps: 2200 },
  ES: { kind: 'vat', bps: 2100 },
  NL: { kind: 'vat', bps: 2100 },
  JP: { kind: 'gst', bps: 1000 },
  AU: { kind: 'gst', bps: 1000 },
  NZ: { kind: 'gst', bps: 1500 },
  US: { kind: 'sales-tax', bps: 800 },
  CA: { kind: 'sales-tax', bps: 500 },
};

/**
 * Pure tax calculation — no adapter side effect. Returns a fully populated
 * {@link TaxLine} so callers can decide whether to emit `tax.calculated`,
 * `tax.reverse_charged` or `tax.exempted`.
 *
 * Rules:
 * - buyer B2B (has VAT id) + cross-border EU + digital / service → reverse charge
 * - buyer country not in table → exempt (out of coverage)
 * - otherwise → standard calc netCents * rateBps / 10000
 */
export function calculateTax(input: TaxCalcInput): TaxLine {
  const entry = RATES[input.buyerCountry];
  if (!entry) {
    return {
      kind: 'vat',
      country: input.buyerCountry,
      rateBps: 0,
      amountCents: input.netAmountCents,
      taxCents: 0,
      reverseCharged: false,
      exempt: true,
    };
  }
  const isCrossBorder = input.buyerCountry !== input.merchantCountry;
  const isDigitalOrService =
    input.productKind === 'digital' || input.productKind === 'service' || input.productKind === undefined;
  const isB2b = input.buyerVatId !== undefined && input.buyerVatId.length > 0;
  if (isB2b && isCrossBorder && entry.kind === 'vat' && isDigitalOrService) {
    return {
      kind: entry.kind,
      country: input.buyerCountry,
      rateBps: entry.bps,
      amountCents: input.netAmountCents,
      taxCents: 0,
      reverseCharged: true,
      exempt: false,
    };
  }
  const taxCents = Math.round((input.netAmountCents * entry.bps) / 10000);
  return {
    kind: entry.kind,
    country: input.buyerCountry,
    rateBps: entry.bps,
    amountCents: input.netAmountCents,
    taxCents,
    reverseCharged: false,
    exempt: false,
  };
}

/**
 * Emit the tax outcome. Neutral event = `tax.calculated` (standard),
 * `tax.reverse_charged` (B2B intra-EU) or `tax.exempted` (out of coverage).
 */
export async function emitTaxLine(
  adapter: PaymentAdapter,
  input: { customerId: string; line: TaxLine; currency?: string },
): Promise<AxisStep<'calculated' | 'reverse-charged' | 'exempted'>> {
  let neutral: 'tax.calculated' | 'tax.reverse_charged' | 'tax.exempted';
  let state: 'calculated' | 'reverse-charged' | 'exempted';
  if (input.line.exempt) {
    neutral = 'tax.exempted';
    state = 'exempted';
  } else if (input.line.reverseCharged) {
    neutral = 'tax.reverse_charged';
    state = 'reverse-charged';
  } else {
    neutral = 'tax.calculated';
    state = 'calculated';
  }
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: input.line.taxCents,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    customerId: input.customerId,
  });
  await adapter.emit(event);
  return {
    neutralEvent: neutral,
    providerEvent,
    state,
    amountCents: input.line.taxCents,
    metadata: {
      kind: input.line.kind,
      country: input.line.country,
      rateBps: input.line.rateBps,
      netAmountCents: input.line.amountCents,
      taxCents: input.line.taxCents,
      reverseCharged: input.line.reverseCharged,
      exempt: input.line.exempt,
    },
  };
}
