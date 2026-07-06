import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Tax localization axis — VAT + GST + sales tax + EU DAC7 reporting.
 * Real merchants selling cross-border have to compute the correct
 * indirect tax by jurisdiction (EU VAT MOSS / OSS, UK VAT, AU GST,
 * US destination sales tax) and file periodic marketplace reporting
 * under EU DAC7 for digital platforms.
 */
export type TaxLocalizationState =
  | 'calculating'
  | 'calculated'
  | 'reported'
  | 'exempt';

export type TaxJurisdiction =
  | 'EU'
  | 'UK'
  | 'US'
  | 'AU'
  | 'CA'
  | 'JP'
  | 'other';

export type TaxKindLocalized =
  | 'vat'
  | 'gst'
  | 'sales-tax'
  | 'dac7-report';

export interface TaxLocalizationInput {
  jurisdiction: TaxJurisdiction;
  amountCents: number;
  customerId: string;
  currency?: string;
  /** ISO-3166-2 subdivision for US destination sourcing */
  region?: string;
  /** whether the customer is B2B (reverse charge applies) */
  b2b?: boolean;
}

export interface TaxLocalizationLine {
  jurisdiction: TaxJurisdiction;
  kind: TaxKindLocalized;
  amountCents: number;
  taxCents: number;
  ratePercent: number;
  reverseCharge: boolean;
}

const RATE_TABLE: Record<TaxJurisdiction, { kind: TaxKindLocalized; ratePercent: number }> = {
  EU: { kind: 'vat', ratePercent: 20 },
  UK: { kind: 'vat', ratePercent: 20 },
  US: { kind: 'sales-tax', ratePercent: 8.75 },
  AU: { kind: 'gst', ratePercent: 10 },
  CA: { kind: 'gst', ratePercent: 5 },
  JP: { kind: 'sales-tax', ratePercent: 10 },
  other: { kind: 'sales-tax', ratePercent: 0 },
};

/**
 * Compute the tax line for a given jurisdiction + amount + B2B flag.
 * Handles EU reverse charge (B2B intra-EU → tax borne by buyer) and
 * emits the correct provider dialect for VAT vs GST vs sales-tax.
 */
export async function calculateLocalizedTax(
  adapter: PaymentAdapter,
  input: TaxLocalizationInput,
): Promise<{ line: TaxLocalizationLine; step: AxisStep<TaxLocalizationState> }> {
  const table = RATE_TABLE[input.jurisdiction];
  const reverseCharge = (input.jurisdiction === 'EU' || input.jurisdiction === 'UK') && Boolean(input.b2b);
  const effectiveRate = reverseCharge ? 0 : table.ratePercent;
  const taxCents = Math.round((input.amountCents * effectiveRate) / 100);
  const line: TaxLocalizationLine = {
    jurisdiction: input.jurisdiction,
    kind: table.kind,
    amountCents: input.amountCents,
    taxCents,
    ratePercent: effectiveRate,
    reverseCharge,
  };
  const neutral =
    table.kind === 'vat'
      ? 'tax.vat_calculated'
      : table.kind === 'gst'
        ? 'tax.gst_calculated'
        : 'tax.sales_tax_calculated';
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: input.amountCents,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    customerId: input.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<TaxLocalizationState> = {
    neutralEvent: neutral,
    providerEvent,
    state: reverseCharge ? 'exempt' : 'calculated',
    amountCents: input.amountCents,
    metadata: {
      jurisdiction: input.jurisdiction,
      kind: table.kind,
      taxCents,
      ratePercent: effectiveRate,
      reverseCharge,
      region: input.region ?? '',
    },
  };
  return { line, step };
}

/**
 * Emit a DAC7 marketplace report entry. Real digital platforms must
 * submit annual DAC7 reports to the EU tax authorities listing seller
 * revenue by jurisdiction.
 */
export async function reportDac7(
  adapter: PaymentAdapter,
  input: {
    sellerId: string;
    reportingYear: number;
    lines: TaxLocalizationLine[];
    customerId: string;
    currency?: string;
  },
): Promise<AxisStep<TaxLocalizationState>> {
  const totalCents = input.lines.reduce((acc, l) => acc + l.amountCents, 0);
  const totalTaxCents = input.lines.reduce((acc, l) => acc + l.taxCents, 0);
  const neutral = 'tax.dac7_reported' as const;
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: totalCents,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    customerId: input.customerId,
  });
  await adapter.emit(event);
  return {
    neutralEvent: neutral,
    providerEvent,
    state: 'reported',
    amountCents: totalCents,
    metadata: {
      sellerId: input.sellerId,
      reportingYear: input.reportingYear,
      lineCount: input.lines.length,
      totalTaxCents,
    },
  };
}
