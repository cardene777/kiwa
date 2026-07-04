/**
 * Tax auto-compute + reverse charge + registration full-flow vitest spec.
 *
 * Sub-Issue #902 (v1.23-3) AC — VAT / GST / sales-tax auto-calculation +
 * reverse charge + tax registration is exercised end-to-end. Real Paddle
 * Merchant-of-Record handles tax internally at transaction time; the mock
 * reproduces the observable envelope so the fidelity harness can diff line
 * items, tax rates, and terminal state without booting Paddle sandbox.
 *
 * Fidelity axes covered here —
 *  1. `POST /api/tax/calculate` emits `tax.calculated` / `tax.reverse_charged`
 *     / `tax.exempted` neutral events depending on the input.
 *  2. VAT rate table matches semantics/tax.ts (GB 20%, DE 19%, FR 20%, ...).
 *  3. Reverse charge branch fires for B2B intra-EU cross-border digital.
 *  4. Exempt branch fires for countries outside the coverage table.
 *  5. Tax record persists to `GET /api/tax` and is retrievable in order.
 *  6. Route-handler validation (missing_fields / invalid_amount).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { providerEventName } from '@kiwa-test/payment';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { createTaxCalculateHandler } from '../src/server/api/tax-calculate.post.js';
import { createTaxListHandler } from '../src/server/api/tax.get.js';

describe('tax auto-compute — mock adapter', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: calculateTax for GB buyer emits tax.calculated event', async () => {
    const line = await adapter.calculateTax({
      customerId: 'cus_gb',
      netAmountCents: 10000,
      buyerCountry: 'GB',
      merchantCountry: 'GB',
    });
    expect(line.kind).toBe('vat');
    expect(line.country).toBe('GB');
    expect(line.reverseCharged).toBe(false);
    expect(line.exempt).toBe(false);
    const events = adapter.eventsEmitted();
    const evt = events.find(
      (e) => e.type === providerEventName('paddle', 'tax.calculated'),
    );
    expect(evt).toBeDefined();
  });

  it('axis 2: DE VAT rate is 19% (1900 bps) matching semantics/tax.ts SSOT', async () => {
    const line = await adapter.calculateTax({
      customerId: 'cus_de',
      netAmountCents: 20000,
      buyerCountry: 'DE',
      merchantCountry: 'GB',
    });
    expect(line.rateBps).toBe(1900);
    // 20000 * 0.19 = 3800 cents.
    expect(line.taxCents).toBe(3800);
  });

  it('axis 2: JP GST rate is 10% (1000 bps)', async () => {
    const line = await adapter.calculateTax({
      customerId: 'cus_jp',
      netAmountCents: 10000,
      buyerCountry: 'JP',
      merchantCountry: 'GB',
    });
    expect(line.kind).toBe('gst');
    expect(line.rateBps).toBe(1000);
    expect(line.taxCents).toBe(1000);
  });

  it('axis 2: US sales-tax rate is 8% (800 bps)', async () => {
    const line = await adapter.calculateTax({
      customerId: 'cus_us',
      netAmountCents: 5000,
      buyerCountry: 'US',
      merchantCountry: 'GB',
    });
    expect(line.kind).toBe('sales-tax');
    expect(line.rateBps).toBe(800);
    expect(line.taxCents).toBe(400);
  });

  it('axis 3: reverse charge fires for B2B intra-EU cross-border digital', async () => {
    const line = await adapter.calculateTax({
      customerId: 'cus_b2b',
      netAmountCents: 100000,
      buyerCountry: 'DE',
      buyerVatId: 'DE987654321',
      merchantCountry: 'GB',
      productKind: 'digital',
    });
    expect(line.reverseCharged).toBe(true);
    expect(line.taxCents).toBe(0);
    // Rate is still recorded (audit trail) but the merchant charges nothing.
    expect(line.rateBps).toBe(1900);
    const events = adapter.eventsEmitted();
    const evt = events.find(
      (e) => e.type === providerEventName('paddle', 'tax.reverse_charged'),
    );
    expect(evt).toBeDefined();
  });

  it('axis 3: reverse charge does NOT fire when buyer country equals merchant country', async () => {
    const line = await adapter.calculateTax({
      customerId: 'cus_gb_b2b',
      netAmountCents: 100000,
      buyerCountry: 'GB',
      buyerVatId: 'GB123456789',
      merchantCountry: 'GB',
      productKind: 'digital',
    });
    // Domestic B2B is not reverse-charged; VAT still applies.
    expect(line.reverseCharged).toBe(false);
    expect(line.taxCents).toBe(20000);
  });

  it('axis 3: reverse charge does NOT fire for GST / sales-tax jurisdictions', async () => {
    // JP GST — reverse charge is EU-VAT specific.
    const line = await adapter.calculateTax({
      customerId: 'cus_jp_b2b',
      netAmountCents: 10000,
      buyerCountry: 'JP',
      buyerVatId: 'JP1234',
      merchantCountry: 'GB',
      productKind: 'digital',
    });
    expect(line.reverseCharged).toBe(false);
    expect(line.taxCents).toBe(1000);
  });

  it('axis 4: exempt fires for buyer country outside the coverage table', async () => {
    const line = await adapter.calculateTax({
      customerId: 'cus_zz',
      netAmountCents: 10000,
      buyerCountry: 'ZZ',
      merchantCountry: 'GB',
    });
    expect(line.exempt).toBe(true);
    expect(line.taxCents).toBe(0);
    expect(line.rateBps).toBe(0);
    const events = adapter.eventsEmitted();
    const evt = events.find(
      (e) => e.type === providerEventName('paddle', 'tax.exempted'),
    );
    expect(evt).toBeDefined();
  });

  it('axis 5: tax records persist + list handler returns them in order', async () => {
    await adapter.calculateTax({
      customerId: 'cus_r1',
      netAmountCents: 1000,
      buyerCountry: 'GB',
      merchantCountry: 'GB',
    });
    await adapter.calculateTax({
      customerId: 'cus_r2',
      netAmountCents: 2000,
      buyerCountry: 'DE',
      merchantCountry: 'GB',
    });
    await adapter.calculateTax({
      customerId: 'cus_r3',
      netAmountCents: 3000,
      buyerCountry: 'US',
      merchantCountry: 'GB',
    });
    const listHandler = createTaxListHandler(adapter);
    const response = await listHandler(new Request('http://localhost/api/tax'));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      records: { customerId: string; line: { kind: string; taxCents: number } }[];
    };
    expect(body.records).toHaveLength(3);
    expect(body.records[0]?.customerId).toBe('cus_r1');
    expect(body.records[1]?.customerId).toBe('cus_r2');
    expect(body.records[2]?.customerId).toBe('cus_r3');
    expect(body.records[0]?.line.kind).toBe('vat');
    expect(body.records[1]?.line.kind).toBe('vat');
    expect(body.records[2]?.line.kind).toBe('sales-tax');
  });

  it('tax record from checkout is also picked up by the list handler', async () => {
    // Checkout emits a tax record inline; the tax UI should see it.
    await adapter.checkout({
      customerId: 'cus_checkout_tax',
      priceId: 'pri_pro',
      planId: 'pro',
      amountCents: 2999,
      buyerCountry: 'FR',
      merchantCountry: 'GB',
    });
    const listHandler = createTaxListHandler(adapter);
    const response = await listHandler(new Request('http://localhost/api/tax'));
    const body = (await response.json()) as {
      records: { customerId: string; line: { country: string; rateBps: number } }[];
    };
    expect(body.records).toHaveLength(1);
    expect(body.records[0]?.customerId).toBe('cus_checkout_tax');
    expect(body.records[0]?.line.country).toBe('FR');
    // FR VAT rate 20% (2000 bps).
    expect(body.records[0]?.line.rateBps).toBe(2000);
  });

  it('axis 6: calculate route rejects missing_fields with 400', async () => {
    const handler = createTaxCalculateHandler(adapter);
    const response = await handler(
      new Request('http://localhost/api/tax/calculate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ customerId: 'cus_x', netAmountCents: 100 }),
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('missing_fields');
  });

  it('calculate route rejects invalid_amount with 400', async () => {
    const handler = createTaxCalculateHandler(adapter);
    const response = await handler(
      new Request('http://localhost/api/tax/calculate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerId: 'cus_x',
          netAmountCents: 0,
          buyerCountry: 'GB',
          merchantCountry: 'GB',
        }),
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('invalid_amount');
  });

  it('calculate route rejects invalid_json with 400', async () => {
    const handler = createTaxCalculateHandler(adapter);
    const response = await handler(
      new Request('http://localhost/api/tax/calculate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{not-json',
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('invalid_json');
  });

  it('calculate route returns tax line for valid B2C GB → GB request', async () => {
    const handler = createTaxCalculateHandler(adapter);
    const response = await handler(
      new Request('http://localhost/api/tax/calculate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerId: 'cus_route',
          netAmountCents: 5000,
          buyerCountry: 'GB',
          merchantCountry: 'GB',
        }),
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      tax: { kind: string; country: string; rateBps: number; taxCents: number };
    };
    expect(body.tax.kind).toBe('vat');
    expect(body.tax.country).toBe('GB');
    expect(body.tax.rateBps).toBe(2000);
    expect(body.tax.taxCents).toBe(1000);
  });

  it('trace records taxKind + reverseCharged for auditability', async () => {
    await adapter.calculateTax({
      customerId: 'cus_audit',
      netAmountCents: 10000,
      buyerCountry: 'DE',
      buyerVatId: 'DE111',
      merchantCountry: 'GB',
      productKind: 'digital',
    });
    const trace = adapter.traces();
    const taxTrace = trace.find((t) => t.op === 'calculateTax');
    expect(taxTrace?.ok).toBe(true);
    expect(taxTrace?.detail?.['taxKind']).toBe('vat');
    expect(taxTrace?.detail?.['reverseCharged']).toBe(true);
  });

  it('multiple tax calculations for the same customer append to the record list', async () => {
    await adapter.calculateTax({
      customerId: 'cus_multi',
      netAmountCents: 1000,
      buyerCountry: 'GB',
      merchantCountry: 'GB',
    });
    await adapter.calculateTax({
      customerId: 'cus_multi',
      netAmountCents: 2000,
      buyerCountry: 'FR',
      merchantCountry: 'GB',
    });
    const records = adapter.listTaxRecords();
    const forCustomer = records.filter((r) => r.customerId === 'cus_multi');
    expect(forCustomer).toHaveLength(2);
    // Second entry (FR) has a higher rateBps (2000 vs 2000) but different
    // country label.
    expect(forCustomer[0]?.line.country).toBe('GB');
    expect(forCustomer[1]?.line.country).toBe('FR');
  });

  it('reset clears tax records', async () => {
    await adapter.calculateTax({
      customerId: 'cus_reset',
      netAmountCents: 1000,
      buyerCountry: 'GB',
      merchantCountry: 'GB',
    });
    expect(adapter.listTaxRecords()).toHaveLength(1);
    await adapter.reset();
    expect(adapter.listTaxRecords()).toHaveLength(0);
  });
});
