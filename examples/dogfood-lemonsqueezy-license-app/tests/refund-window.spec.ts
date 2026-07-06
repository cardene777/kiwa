/**
 * 30-day refund window enforcement — inside window full + partial paths,
 * outside window rejection, chargeback prevention override, min / max
 * amount caps, and downstream license revocation on full refund.
 */

import { describe, expect, it } from 'vitest';
import {
  createStore,
  evaluateRefund,
  issueLicenseKey,
  issueRefund,
  makeMockAdapter,
  makeRefundRoute,
  totalRefundedForOrder,
  THIRTY_DAY_MS,
} from '../src/index.js';

function seedOrder(
  store: ReturnType<typeof createStore>,
  id: string,
  paidAt: number,
  amount = 9900,
) {
  store.orders.set(id, {
    id,
    customerId: `cust_${id}`,
    variantId: `var_${id}`,
    amountCents: amount,
    currency: 'USD',
    paidAt,
    productKind: 'license',
    state: 'paid',
  });
}

const PAID = 1_700_000_000_000;

describe('refund window — evaluate', () => {
  it('full refund inside window is allowed', () => {
    const store = createStore();
    seedOrder(store, 'ord_e1', PAID);
    const result = evaluateRefund(store.orders.get('ord_e1')!, {
      amountCents: 9900,
      now: PAID + THIRTY_DAY_MS - 1,
    });
    expect(result.allowed).toBe(true);
    if (result.allowed === true) expect(result.kind).toBe('full');
  });

  it('partial refund inside window is allowed', () => {
    const store = createStore();
    seedOrder(store, 'ord_e2', PAID);
    const result = evaluateRefund(store.orders.get('ord_e2')!, {
      amountCents: 3000,
      now: PAID + THIRTY_DAY_MS - 1,
    });
    expect(result.allowed).toBe(true);
    if (result.allowed === true) expect(result.kind).toBe('partial');
  });

  it('refund at exactly the window boundary is allowed', () => {
    const store = createStore();
    seedOrder(store, 'ord_e3', PAID);
    const result = evaluateRefund(store.orders.get('ord_e3')!, {
      amountCents: 100,
      now: PAID + THIRTY_DAY_MS,
    });
    expect(result.allowed).toBe(true);
  });

  it('refund 1 ms outside window is rejected as window_expired', () => {
    const store = createStore();
    seedOrder(store, 'ord_e4', PAID);
    const result = evaluateRefund(store.orders.get('ord_e4')!, {
      amountCents: 100,
      now: PAID + THIRTY_DAY_MS + 1,
    });
    expect(result.allowed).toBe(false);
    if (result.allowed === false) expect(result.reason).toBe('window_expired');
  });

  it('chargebackPrevention bypasses the window guard', () => {
    const store = createStore();
    seedOrder(store, 'ord_e5', PAID);
    const result = evaluateRefund(store.orders.get('ord_e5')!, {
      amountCents: 100,
      now: PAID + THIRTY_DAY_MS + 60_000,
      policy: { windowMs: THIRTY_DAY_MS, chargebackPrevention: true },
    });
    expect(result.allowed).toBe(true);
  });

  it('amount exceeding original is rejected as amount_exceeds_original', () => {
    const store = createStore();
    seedOrder(store, 'ord_e6', PAID, 5000);
    const result = evaluateRefund(store.orders.get('ord_e6')!, {
      amountCents: 6000,
      now: PAID + 60_000,
    });
    expect(result.allowed).toBe(false);
    if (result.allowed === false) expect(result.reason).toBe('amount_exceeds_original');
  });

  it('non-positive amount is rejected', () => {
    const store = createStore();
    seedOrder(store, 'ord_e7', PAID);
    const result = evaluateRefund(store.orders.get('ord_e7')!, {
      amountCents: 0,
      now: PAID + 1000,
    });
    expect(result.allowed).toBe(false);
    if (result.allowed === false) expect(result.reason).toBe('non_positive_amount');
  });

  it('amount below policy min is rejected', () => {
    const store = createStore();
    seedOrder(store, 'ord_e8', PAID);
    const result = evaluateRefund(store.orders.get('ord_e8')!, {
      amountCents: 50,
      now: PAID + 1000,
      policy: { windowMs: THIRTY_DAY_MS, minAmountCents: 100 },
    });
    expect(result.allowed).toBe(false);
    if (result.allowed === false) expect(result.reason).toBe('amount_below_min');
  });

  it('amount above policy max is rejected', () => {
    const store = createStore();
    seedOrder(store, 'ord_e9', PAID, 20_000);
    const result = evaluateRefund(store.orders.get('ord_e9')!, {
      amountCents: 15_000,
      now: PAID + 1000,
      policy: { windowMs: THIRTY_DAY_MS, maxAmountCents: 10_000 },
    });
    expect(result.allowed).toBe(false);
    if (result.allowed === false) expect(result.reason).toBe('amount_above_max');
  });
});

describe('refund window — issue via store', () => {
  it('issues a full refund and marks the order refunded', () => {
    const store = createStore();
    seedOrder(store, 'ord_i1', PAID, 9900);
    const refund = issueRefund(store, {
      orderId: 'ord_i1',
      amountCents: 9900,
      now: PAID + 1_000,
    });
    expect(refund.kind).toBe('full');
    expect(store.orders.get('ord_i1')?.state).toBe('refunded');
  });

  it('issues a partial refund and marks the order partial-refunded', () => {
    const store = createStore();
    seedOrder(store, 'ord_i2', PAID, 9900);
    issueRefund(store, {
      orderId: 'ord_i2',
      amountCents: 3000,
      now: PAID + 2_000,
    });
    expect(store.orders.get('ord_i2')?.state).toBe('partial-refunded');
  });

  it('full refund revokes the associated license', () => {
    const store = createStore();
    seedOrder(store, 'ord_i3', PAID, 9900);
    const license = issueLicenseKey(store, {
      orderId: 'ord_i3',
      customerId: 'cust_ord_i3',
      variantId: 'var_ord_i3',
    });
    issueRefund(store, {
      orderId: 'ord_i3',
      amountCents: 9900,
      now: PAID + 5_000,
    });
    expect(store.licenses.get(license.id)?.status).toBe('revoked');
  });

  it('partial refund does NOT revoke the license', () => {
    const store = createStore();
    seedOrder(store, 'ord_i4', PAID, 9900);
    const license = issueLicenseKey(store, {
      orderId: 'ord_i4',
      customerId: 'cust_ord_i4',
      variantId: 'var_ord_i4',
    });
    issueRefund(store, {
      orderId: 'ord_i4',
      amountCents: 2000,
      now: PAID + 5_000,
    });
    expect(store.licenses.get(license.id)?.status).toBe('active');
  });

  it('outside-window refund throws refund_window_expired', () => {
    const store = createStore();
    seedOrder(store, 'ord_i5', PAID, 9900);
    expect(() =>
      issueRefund(store, {
        orderId: 'ord_i5',
        amountCents: 100,
        now: PAID + THIRTY_DAY_MS + 1,
      }),
    ).toThrow('refund_window_expired');
  });

  it('totalRefundedForOrder sums multiple partial refunds', () => {
    const store = createStore();
    seedOrder(store, 'ord_i6', PAID, 10_000);
    issueRefund(store, { orderId: 'ord_i6', amountCents: 2000, now: PAID + 1000 });
    issueRefund(store, { orderId: 'ord_i6', amountCents: 3000, now: PAID + 2000 });
    expect(totalRefundedForOrder(store, 'ord_i6')).toBe(5000);
  });

  it('cumulative partial refunds beyond original amount are rejected', () => {
    const store = createStore();
    seedOrder(store, 'ord_i7', PAID, 10_000);
    issueRefund(store, { orderId: 'ord_i7', amountCents: 6000, now: PAID + 1000 });
    expect(() =>
      issueRefund(store, { orderId: 'ord_i7', amountCents: 5000, now: PAID + 2000 }),
    ).toThrow('refund_amount_exceeds_original');
  });

  it('second partial that hits exactly original transitions order to refunded', () => {
    const store = createStore();
    seedOrder(store, 'ord_i8', PAID, 10_000);
    issueRefund(store, { orderId: 'ord_i8', amountCents: 4000, now: PAID + 1000 });
    const second = issueRefund(store, {
      orderId: 'ord_i8',
      amountCents: 6000,
      now: PAID + 2000,
    });
    expect(second.kind).toBe('full');
    expect(store.orders.get('ord_i8')?.state).toBe('refunded');
  });
});

describe('refund route — HTTP surface', () => {
  it('adapter refund route reports licenseRevoked=true on full refund', async () => {
    const { adapter, store } = makeMockAdapter();
    store.orders.set('ord_route_1', {
      id: 'ord_route_1',
      customerId: 'cust_route_1',
      variantId: 'var_route_1',
      amountCents: 4000,
      currency: 'USD',
      paidAt: PAID,
      productKind: 'license',
      state: 'paid',
    });
    await adapter.issueLicenseKey({
      orderId: 'ord_route_1',
      customerId: 'cust_route_1',
      variantId: 'var_route_1',
    });
    const route = makeRefundRoute(adapter);
    const result = await route({
      orderId: 'ord_route_1',
      amountCents: 4000,
      now: PAID + 60_000,
    });
    expect(result.ok).toBe(true);
    if (result.ok === true) expect(result.body.licenseRevoked).toBe(true);
  });

  it('adapter refund route surfaces 404 on unknown order', async () => {
    const { adapter } = makeMockAdapter();
    const route = makeRefundRoute(adapter);
    const result = await route({
      orderId: 'ord_missing',
      amountCents: 100,
      now: PAID,
    });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.status).toBe(404);
      expect(result.body.kind).toBe('order_not_found');
    }
  });

  it('adapter refund route surfaces 409 window_expired outside 30 day', async () => {
    const { adapter, store } = makeMockAdapter();
    store.orders.set('ord_route_2', {
      id: 'ord_route_2',
      customerId: 'cust_r2',
      variantId: 'var_r2',
      amountCents: 4000,
      currency: 'USD',
      paidAt: PAID,
      productKind: 'license',
      state: 'paid',
    });
    const route = makeRefundRoute(adapter);
    const result = await route({
      orderId: 'ord_route_2',
      amountCents: 4000,
      now: PAID + THIRTY_DAY_MS + 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.status).toBe(409);
      expect(result.body.kind).toBe('window_expired');
    }
  });

  it('adapter refund route with chargebackPrevention=true bypasses window', async () => {
    const { adapter, store } = makeMockAdapter();
    store.orders.set('ord_route_3', {
      id: 'ord_route_3',
      customerId: 'cust_r3',
      variantId: 'var_r3',
      amountCents: 4000,
      currency: 'USD',
      paidAt: PAID,
      productKind: 'license',
      state: 'paid',
    });
    const route = makeRefundRoute(adapter);
    const result = await route({
      orderId: 'ord_route_3',
      amountCents: 4000,
      now: PAID + THIRTY_DAY_MS + 60_000,
      chargebackPrevention: true,
    });
    expect(result.ok).toBe(true);
  });
});
