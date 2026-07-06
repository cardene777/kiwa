/**
 * Marketplace tax-report fidelity spec.
 *
 * Covers 1099-K threshold behaviour, DAC7 aggregate structure, annual
 * filtering, idempotent report generation, emitted webhook metadata, and
 * env-gated real-mode failures.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { listTaxReportsHandler } from '../src/app/tax/route.js';

const NOW = 1_700_000_000_000;
const YEAR_2025 = Date.UTC(2025, 0, 10);
const YEAR_2026 = Date.UTC(2026, 0, 10);

describe('mock adapter — tax report marketplace flows', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(async () => {
    adapter = makeMockAdapter({ now: () => NOW });
    await adapter.createExpressAccount({ email: 'seller@example.com' });
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: generateTaxReport1099K threshold annual gross >= 600 dollars generates report', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 60_000,
      applicationFeeCents: 6_000,
      createdAtMs: YEAR_2025,
    });
    const report = await adapter.generateTaxReport1099K({ accountId: 'acct_test_1', year: 2025 });
    expect(report?.kind).toBe('1099-K');
    expect(report?.grossCents).toBe(60_000);
  });

  it('axis 2: generateTaxReport1099K under threshold annual gross < 600 dollars returns null', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 59_999,
      applicationFeeCents: 5_999,
      createdAtMs: YEAR_2025,
    });
    const report = await adapter.generateTaxReport1099K({ accountId: 'acct_test_1', year: 2025 });
    expect(report).toBeNull();
  });

  it('axis 3: generateTaxReport1099K includes accountId + year + grossCents + transactionCount', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 60_000,
      applicationFeeCents: 6_000,
      createdAtMs: YEAR_2025,
    });
    const report = await adapter.generateTaxReport1099K({ accountId: 'acct_test_1', year: 2025 });
    expect(report).toMatchObject({
      accountId: 'acct_test_1',
      year: 2025,
      grossCents: 60_000,
      transactionCount: 1,
    });
  });

  it('axis 4: generateTaxReportDAC7 returns 7-field structure', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
      createdAtMs: YEAR_2025,
    });
    const report = await adapter.generateTaxReportDAC7({
      accountId: 'acct_test_1',
      year: 2025,
      sellerName: 'Seller One',
      tin: 'TIN-1',
      address: '1 Main St',
      bankAccount: 'DE001234',
      country: 'DE',
    });
    expect(report).toMatchObject({
      sellerName: 'Seller One',
      tin: 'TIN-1',
      address: '1 Main St',
      bankAccount: 'DE001234',
      totalRevenueCents: 10_000,
      totalFeeCents: 1_000,
      country: 'DE',
    });
  });

  it('axis 5: generateTaxReportDAC7 aggregates multi-charge revenue correctly', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
      createdAtMs: YEAR_2025,
    });
    await adapter.createDestinationCharge({
      customerId: 'cus_2',
      accountId: 'acct_test_1',
      amountCents: 5_000,
      applicationFeeCents: 500,
      createdAtMs: YEAR_2025,
    });
    const report = await adapter.generateTaxReportDAC7({
      accountId: 'acct_test_1',
      year: 2025,
      sellerName: 'Seller One',
      tin: 'TIN-1',
      address: '1 Main St',
      bankAccount: 'DE001234',
      country: 'DE',
    });
    expect(report?.totalRevenueCents).toBe(15_000);
    expect(report?.totalFeeCents).toBe(1_500);
  });

  it('axis 6: tax report year filter counts only 2025 charges for year 2025 report', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 60_000,
      applicationFeeCents: 6_000,
      createdAtMs: YEAR_2025,
    });
    await adapter.createDestinationCharge({
      customerId: 'cus_2',
      accountId: 'acct_test_1',
      amountCents: 80_000,
      applicationFeeCents: 8_000,
      createdAtMs: YEAR_2026,
    });
    const report = await adapter.generateTaxReport1099K({ accountId: 'acct_test_1', year: 2025 });
    expect(report?.grossCents).toBe(60_000);
  });

  it('axis 7: empty account no charges generates no report', async () => {
    const report1099 = await adapter.generateTaxReport1099K({ accountId: 'acct_test_1', year: 2025 });
    const reportDac7 = await adapter.generateTaxReportDAC7({
      accountId: 'acct_test_1',
      year: 2025,
      sellerName: 'Seller One',
      tin: 'TIN-1',
      address: '1 Main St',
      bankAccount: 'DE001234',
      country: 'DE',
    });
    expect(report1099).toBeNull();
    expect(reportDac7).toBeNull();
  });

  it('axis 8: duplicate generateTaxReport1099K for same account + year returns same reportId', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 60_000,
      applicationFeeCents: 6_000,
      createdAtMs: YEAR_2025,
    });
    const first = await adapter.generateTaxReport1099K({ accountId: 'acct_test_1', year: 2025 });
    const second = await adapter.generateTaxReport1099K({ accountId: 'acct_test_1', year: 2025 });
    expect(second?.id).toBe(first?.id);
  });

  it('axis 9: tax report emits tax_report.generated webhook event with detail', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 60_000,
      applicationFeeCents: 6_000,
      createdAtMs: YEAR_2025,
    });
    const report = await adapter.generateTaxReport1099K({ accountId: 'acct_test_1', year: 2025 });
    const event = adapter.eventsEmitted().find((entry) => entry.type === 'tax_report.generated');
    expect(event?.detail).toMatchObject({
      reportId: report?.id,
      kind: '1099-K',
    });
  });

  it('axis 10: listTaxReports sorted by year desc then insertion order', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 60_000,
      applicationFeeCents: 6_000,
      createdAtMs: YEAR_2025,
    });
    await adapter.createDestinationCharge({
      customerId: 'cus_2',
      accountId: 'acct_test_1',
      amountCents: 80_000,
      applicationFeeCents: 8_000,
      createdAtMs: YEAR_2026,
    });
    await adapter.generateTaxReport1099K({ accountId: 'acct_test_1', year: 2025 });
    await adapter.generateTaxReport1099K({ accountId: 'acct_test_1', year: 2026 });
    const response = await listTaxReportsHandler(adapter)(new Request('http://localhost/tax', { method: 'GET' }));
    const body = (await response.json()) as { reports: Array<{ year: number }> };
    expect(body.reports.map((report) => report.year)).toEqual([2026, 2025]);
  });

  it('axis 11: real adapter generateTaxReport1099K throws KIWA_STRIPE_ENV_MISSING', async () => {
    const realAdapter = makeRealAdapter();
    await expect(realAdapter.generateTaxReport1099K({ accountId: 'acct_real', year: 2025 })).rejects.toThrow(
      /KIWA_STRIPE_ENV_MISSING/,
    );
    await realAdapter.reset();
  });

  it('axis 12: trace event ordering after multi-charge + tax report generation', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 30_000,
      applicationFeeCents: 3_000,
      createdAtMs: YEAR_2025,
    });
    await adapter.createDestinationCharge({
      customerId: 'cus_2',
      accountId: 'acct_test_1',
      amountCents: 30_000,
      applicationFeeCents: 3_000,
      createdAtMs: YEAR_2025,
    });
    await adapter.generateTaxReport1099K({ accountId: 'acct_test_1', year: 2025 });
    expect(
      adapter
        .traces()
        .filter((trace) => ['createDestinationCharge', 'generateTaxReport1099K'].includes(trace.op))
        .map((trace) => trace.op),
    ).toEqual(['createDestinationCharge', 'createDestinationCharge', 'generateTaxReport1099K']);
  });
});
