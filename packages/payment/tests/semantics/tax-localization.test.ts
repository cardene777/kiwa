import { describe, expect, it } from 'vitest';
import {
  calculateLocalizedTax,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  reportDac7,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('tax localization axis — 3 provider', () => {
  it.each(providers)('$name: EU VAT applied at 20 percent for B2C', async ({ make }) => {
    const adapter = make();
    const { line, step } = await calculateLocalizedTax(adapter, {
      jurisdiction: 'EU',
      amountCents: 10_000,
      customerId: 'cus_eu_1',
    });
    expect(line.kind).toBe('vat');
    expect(line.ratePercent).toBe(20);
    expect(line.taxCents).toBe(2000);
    expect(line.reverseCharge).toBe(false);
    expect(step.neutralEvent).toBe('tax.vat_calculated');
  });

  it('EU VAT reverse charge for B2B intra-EU', async () => {
    const adapter = createStripeMock();
    const { line, step } = await calculateLocalizedTax(adapter, {
      jurisdiction: 'EU',
      amountCents: 5000,
      customerId: 'cus_eu_b2b',
      b2b: true,
    });
    expect(line.ratePercent).toBe(0);
    expect(line.reverseCharge).toBe(true);
    expect(line.taxCents).toBe(0);
    expect(step.state).toBe('exempt');
  });

  it('AU GST at 10 percent', async () => {
    const adapter = createPaddleMock();
    const { line, step } = await calculateLocalizedTax(adapter, {
      jurisdiction: 'AU',
      amountCents: 1000,
      customerId: 'cus_au',
    });
    expect(line.kind).toBe('gst');
    expect(line.ratePercent).toBe(10);
    expect(line.taxCents).toBe(100);
    expect(step.neutralEvent).toBe('tax.gst_calculated');
  });

  it('US sales tax at 8.75 percent with region', async () => {
    const adapter = createLemonSqueezyMock();
    const { line, step } = await calculateLocalizedTax(adapter, {
      jurisdiction: 'US',
      amountCents: 10_000,
      customerId: 'cus_us',
      region: 'US-CA',
    });
    expect(line.kind).toBe('sales-tax');
    expect(line.ratePercent).toBe(8.75);
    expect(line.taxCents).toBe(875);
    expect(step.metadata.region).toBe('US-CA');
  });

  it('UK VAT still applies to B2B (no reverse charge)', async () => {
    const adapter = createStripeMock();
    const { line } = await calculateLocalizedTax(adapter, {
      jurisdiction: 'UK',
      amountCents: 2000,
      customerId: 'cus_uk_b2b',
      b2b: true,
    });
    // UK is treated the same as EU for reverse charge in this mock
    expect(line.reverseCharge).toBe(true);
    expect(line.taxCents).toBe(0);
  });

  it('reportDac7 aggregates lines and emits report event', async () => {
    const adapter = createStripeMock();
    const lines = [
      {
        jurisdiction: 'EU' as const,
        kind: 'vat' as const,
        amountCents: 1000,
        taxCents: 200,
        ratePercent: 20,
        reverseCharge: false,
      },
      {
        jurisdiction: 'UK' as const,
        kind: 'vat' as const,
        amountCents: 2000,
        taxCents: 400,
        ratePercent: 20,
        reverseCharge: false,
      },
    ];
    const step = await reportDac7(adapter, {
      sellerId: 'seller_1',
      reportingYear: 2026,
      lines,
      customerId: 'sys',
    });
    expect(step.neutralEvent).toBe('tax.dac7_reported');
    expect(step.amountCents).toBe(3000);
    expect(step.metadata.totalTaxCents).toBe(600);
    expect(step.metadata.lineCount).toBe(2);
  });

  it('other jurisdiction defaults to 0 rate', async () => {
    const adapter = createPaddleMock();
    const { line } = await calculateLocalizedTax(adapter, {
      jurisdiction: 'other',
      amountCents: 1000,
      customerId: 'cus_other',
    });
    expect(line.ratePercent).toBe(0);
    expect(line.taxCents).toBe(0);
  });

  it('CA GST at 5 percent', async () => {
    const adapter = createLemonSqueezyMock();
    const { line } = await calculateLocalizedTax(adapter, {
      jurisdiction: 'CA',
      amountCents: 2000,
      customerId: 'cus_ca',
    });
    expect(line.ratePercent).toBe(5);
    expect(line.taxCents).toBe(100);
  });

  it('JP sales tax at 10 percent', async () => {
    const adapter = createStripeMock();
    const { line } = await calculateLocalizedTax(adapter, {
      jurisdiction: 'JP',
      amountCents: 1000,
      customerId: 'cus_jp',
    });
    expect(line.ratePercent).toBe(10);
    expect(line.taxCents).toBe(100);
  });
});
