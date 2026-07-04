import { describe, expect, it } from 'vitest';
import {
  calculateTax,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  emitTaxLine,
  providerEventName,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('tax axis — pure calculation', () => {
  it('UK domestic VAT calculation', () => {
    const line = calculateTax({
      netAmountCents: 10_000,
      buyerCountry: 'GB',
      merchantCountry: 'GB',
    });
    expect(line.kind).toBe('vat');
    expect(line.rateBps).toBe(2000);
    expect(line.taxCents).toBe(2000);
    expect(line.reverseCharged).toBe(false);
    expect(line.exempt).toBe(false);
  });

  it('B2B intra-EU cross-border reverse-charged', () => {
    const line = calculateTax({
      netAmountCents: 10_000,
      buyerCountry: 'DE',
      buyerVatId: 'DE123456789',
      merchantCountry: 'GB',
      productKind: 'digital',
    });
    expect(line.reverseCharged).toBe(true);
    expect(line.taxCents).toBe(0);
  });

  it('unknown country marks exempt', () => {
    const line = calculateTax({
      netAmountCents: 10_000,
      buyerCountry: 'ZZ',
      merchantCountry: 'GB',
    });
    expect(line.exempt).toBe(true);
    expect(line.taxCents).toBe(0);
  });

  it('JP GST 10% at 1JPY resolution rounds correctly', () => {
    const line = calculateTax({
      netAmountCents: 9_999,
      buyerCountry: 'JP',
      merchantCountry: 'JP',
    });
    expect(line.kind).toBe('gst');
    expect(line.taxCents).toBe(1000); // 9999 * 0.10 = 999.9 → 1000
  });

  it('domestic B2B with VAT id still charges (not cross-border)', () => {
    const line = calculateTax({
      netAmountCents: 10_000,
      buyerCountry: 'DE',
      buyerVatId: 'DE123',
      merchantCountry: 'DE',
    });
    expect(line.reverseCharged).toBe(false);
    expect(line.taxCents).toBe(1900);
  });
});

describe('tax axis — emit event — 3 provider', () => {
  it.each(providers)('$name: standard calc emits tax.calculated', async ({ make }) => {
    const adapter = make();
    const line = calculateTax({
      netAmountCents: 10_000,
      buyerCountry: 'GB',
      merchantCountry: 'GB',
    });
    const step = await emitTaxLine(adapter, { customerId: 'c', line, currency: 'gbp' });
    expect(step.neutralEvent).toBe('tax.calculated');
    expect(step.providerEvent).toBe(providerEventName(adapter.provider, 'tax.calculated'));
    expect(step.metadata.taxCents).toBe(2000);
  });

  it.each(providers)('$name: reverse charge emits tax.reverse_charged', async ({ make }) => {
    const adapter = make();
    const line = calculateTax({
      netAmountCents: 5_000,
      buyerCountry: 'DE',
      buyerVatId: 'DE1',
      merchantCountry: 'GB',
      productKind: 'digital',
    });
    const step = await emitTaxLine(adapter, { customerId: 'c', line, currency: 'eur' });
    expect(step.neutralEvent).toBe('tax.reverse_charged');
    expect(step.state).toBe('reverse-charged');
  });

  it('unknown-country line emits tax.exempted', async () => {
    const adapter = createStripeMock();
    const line = calculateTax({
      netAmountCents: 500,
      buyerCountry: 'ZZ',
      merchantCountry: 'GB',
    });
    const step = await emitTaxLine(adapter, { customerId: 'c', line });
    expect(step.neutralEvent).toBe('tax.exempted');
    expect(step.state).toBe('exempted');
  });
});
