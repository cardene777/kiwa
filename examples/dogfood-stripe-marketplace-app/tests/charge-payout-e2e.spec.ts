/**
 * Destination charge + payout fidelity spec.
 *
 * Covers deterministic charge ids, fee arithmetic, idempotent retries,
 * capture semantics, payout ordering, emitted provider events, and env-gated
 * real-mode failures.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { providerEventName } from '@kiwa-test/payment';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { listChargesHandler } from '../src/app/charge/route.js';
import { listTransfersHandler } from '../src/app/payout/route.js';

const NOW = 1_700_000_000_000;

describe('mock adapter — charge + payout marketplace flows', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(async () => {
    adapter = makeMockAdapter({ now: () => NOW });
    await adapter.createExpressAccount({ email: 'seller@example.com' });
    await adapter.createExpressAccount({ email: 'seller-2@example.com' });
    await adapter.createExpressAccount({ email: 'referrer@example.com' });
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: createDestinationCharge returns stable ch_test_1 + transfer_data.destination', async () => {
    const charge = await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
    });
    expect(charge.id).toBe('ch_test_1');
    expect(charge.transferData.destination).toBe('acct_test_1');
  });

  it('axis 2: application_fee_amount arithmetic yields seller net 9000', async () => {
    const charge = await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
    });
    expect(charge.sellerNetCents).toBe(9_000);
  });

  it('axis 3: 3-way split arithmetic sums to 100 dollars', async () => {
    const charge = await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
    });
    const sellerTransfer = await adapter.createSellerTransfer({
      accountId: 'acct_test_1',
      chargeId: charge.id,
      amountCents: 8_500,
    });
    const referrerTransfer = await adapter.createReferrerTransfer({
      accountId: 'acct_test_3',
      chargeId: charge.id,
      amountCents: 500,
    });
    expect(sellerTransfer.amountCents + referrerTransfer.amountCents + charge.applicationFeeCents).toBe(10_000);
  });

  it('axis 4: destination charge idempotency key returns same charge id on retry', async () => {
    const first = await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
      idempotencyKey: 'idem-1',
    });
    const second = await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
      idempotencyKey: 'idem-1',
    });
    expect(second.id).toBe(first.id);
  });

  it('axis 5: captureCharge on authorized charge returns status captured', async () => {
    const charge = await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
      captureMethod: 'manual',
    });
    const captured = await adapter.captureCharge(charge.id);
    expect(captured.status).toBe('captured');
  });

  it('axis 6: captureCharge on already captured throws already_captured', async () => {
    const charge = await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
    });
    await expect(adapter.captureCharge(charge.id)).rejects.toMatchObject({ reason: 'already_captured' });
  });

  it('axis 7: listCharges filter by accountId returns only that sellers charges', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
    });
    await adapter.createDestinationCharge({
      customerId: 'cus_2',
      accountId: 'acct_test_2',
      amountCents: 5_000,
      applicationFeeCents: 500,
    });
    const handler = listChargesHandler(adapter);
    const response = await handler(new Request('http://localhost/charge?accountId=acct_test_1', { method: 'GET' }));
    const body = (await response.json()) as { charges: Array<{ accountId: string }> };
    expect(body.charges).toHaveLength(1);
    expect(body.charges[0]?.accountId).toBe('acct_test_1');
  });

  it('axis 8: createSellerTransfer with source_transaction links to charge id', async () => {
    const charge = await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
    });
    const transfer = await adapter.createSellerTransfer({
      accountId: 'acct_test_1',
      chargeId: charge.id,
      amountCents: 9_000,
      sourceTransaction: charge.id,
    });
    expect(transfer.sourceTransaction).toBe(charge.id);
  });

  it('axis 9: createReferrerTransfer 5 percent affiliate cut arithmetic yields 500', async () => {
    const charge = await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
    });
    const transfer = await adapter.createReferrerTransfer({
      accountId: 'acct_test_3',
      chargeId: charge.id,
      rateBps: 500,
    });
    expect(transfer.amountCents).toBe(500);
  });

  it('axis 10: listTransfers ordering by createdAt desc', async () => {
    const charge = await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
    });
    await adapter.createSellerTransfer({
      accountId: 'acct_test_1',
      chargeId: charge.id,
      amountCents: 9_000,
      createdAtMs: NOW,
    });
    await adapter.createReferrerTransfer({
      accountId: 'acct_test_3',
      chargeId: charge.id,
      amountCents: 500,
      createdAtMs: NOW + 1,
    });
    const handler = listTransfersHandler(adapter);
    const response = await handler(new Request('http://localhost/payout', { method: 'GET' }));
    const body = (await response.json()) as { transfers: Array<{ id: string }> };
    expect(body.transfers.map((transfer) => transfer.id)).toEqual(['tr_test_2', 'tr_test_1']);
  });

  it('axis 11: destination charge with amountCents <= 0 throws invalid_amount', async () => {
    await expect(
      adapter.createDestinationCharge({
        customerId: 'cus_1',
        accountId: 'acct_test_1',
        amountCents: 0,
        applicationFeeCents: 0,
      }),
    ).rejects.toMatchObject({ reason: 'invalid_amount' });
  });

  it('axis 12: destination charge with applicationFeeCents > amountCents throws application_fee_exceeds_amount', async () => {
    await expect(
      adapter.createDestinationCharge({
        customerId: 'cus_1',
        accountId: 'acct_test_1',
        amountCents: 1_000,
        applicationFeeCents: 1_001,
      }),
    ).rejects.toMatchObject({ reason: 'application_fee_exceeds_amount' });
  });

  it('axis 13: trace event ordering is createDestinationCharge then createSellerTransfer then createReferrerTransfer', async () => {
    const charge = await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
    });
    await adapter.createSellerTransfer({
      accountId: 'acct_test_1',
      chargeId: charge.id,
      amountCents: 8_500,
    });
    await adapter.createReferrerTransfer({
      accountId: 'acct_test_3',
      chargeId: charge.id,
      amountCents: 500,
    });
    expect(
      adapter
        .traces()
        .filter((trace) =>
          ['createDestinationCharge', 'createSellerTransfer', 'createReferrerTransfer'].includes(trace.op),
        )
        .map((trace) => trace.op),
    ).toEqual(['createDestinationCharge', 'createSellerTransfer', 'createReferrerTransfer']);
  });

  it('axis 14: application_fee.created webhook event emitted after destination charge', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
    });
    const eventTypes = adapter.eventsEmitted().map((event) => event.type);
    expect(eventTypes.slice(-2)).toEqual(['charge.succeeded', 'application_fee.created']);
  });

  it('axis 15: real adapter createDestinationCharge throws KIWA_STRIPE_ENV_MISSING', async () => {
    const realAdapter = makeRealAdapter();
    await expect(
      realAdapter.createDestinationCharge({
        customerId: 'cus_real',
        accountId: 'acct_real',
        amountCents: 100,
        applicationFeeCents: 10,
      }),
    ).rejects.toThrow(/KIWA_STRIPE_ENV_MISSING/);
    await realAdapter.reset();
  });

  it('axis 16: multiple destination charges emit correct provider event names', async () => {
    await adapter.createDestinationCharge({
      customerId: 'cus_1',
      accountId: 'acct_test_1',
      amountCents: 10_000,
      applicationFeeCents: 1_000,
    });
    await adapter.createDestinationCharge({
      customerId: 'cus_2',
      accountId: 'acct_test_2',
      amountCents: 5_000,
      applicationFeeCents: 500,
    });
    const expected = providerEventName('stripe', 'charge.succeeded' as never);
    expect(adapter.eventsEmitted().filter((event) => event.type === expected)).toHaveLength(2);
  });
});
