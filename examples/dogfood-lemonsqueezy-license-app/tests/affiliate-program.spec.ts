/**
 * Affiliate program — tier evaluation, commission math, tier promotion
 * across conversions, referral clawback on order full refund, and the
 * HTTP surface for register / convert / claw-back actions.
 */

import { describe, expect, it } from 'vitest';
import {
  TIER_COMMISSION_BPS,
  TIER_PROMOTION_THRESHOLD,
  applyConversion,
  computeCommissionCents,
  createStore,
  evaluateTier,
  makeAffiliateRoute,
  makeMockAdapter,
  reverseConversion,
} from '../src/index.js';

describe('affiliate tier — evaluate + math', () => {
  it('bronze applies to 0-4 conversions', () => {
    expect(evaluateTier(0)).toBe('bronze');
    expect(evaluateTier(4)).toBe('bronze');
  });

  it('silver applies at exactly 5 conversions', () => {
    expect(evaluateTier(5)).toBe('silver');
    expect(evaluateTier(19)).toBe('silver');
  });

  it('gold applies at exactly 20 conversions', () => {
    expect(evaluateTier(20)).toBe('gold');
    expect(evaluateTier(200)).toBe('gold');
  });

  it('commission cents rounds down on odd amounts', () => {
    // 9999 * 500 / 10000 = 499.95 → floor 499
    expect(computeCommissionCents(9999, 'bronze')).toBe(499);
  });

  it('commission is 0 for non-positive amounts', () => {
    expect(computeCommissionCents(0, 'gold')).toBe(0);
    expect(computeCommissionCents(-100, 'gold')).toBe(0);
  });

  it('tier promotion tables match published bps', () => {
    expect(TIER_COMMISSION_BPS.bronze).toBe(500);
    expect(TIER_COMMISSION_BPS.silver).toBe(1000);
    expect(TIER_COMMISSION_BPS.gold).toBe(2000);
    expect(TIER_PROMOTION_THRESHOLD.silver).toBe(5);
    expect(TIER_PROMOTION_THRESHOLD.gold).toBe(20);
  });

  it('applyConversion promotes bronze -> silver on the 5th conversion', () => {
    const profile = {
      id: 'aff_1',
      referralCode: 'code_1',
      tier: 'bronze' as const,
      lifetimeConversions: 4,
      lifetimeCommissionCents: 4 * 500,
    };
    const result = applyConversion(profile, 10_000);
    expect(result.tier).toBe('silver');
    expect(result.promoted).toBe(true);
    expect(result.commissionCents).toBe((10_000 * 1000) / 10000);
    expect(profile.lifetimeCommissionCents).toBe(4 * 500 + 1000);
  });

  it('reverseConversion demotes silver -> bronze on final refund below threshold', () => {
    const profile = {
      id: 'aff_2',
      referralCode: 'code_2',
      tier: 'silver' as const,
      lifetimeConversions: 5,
      lifetimeCommissionCents: 5000,
    };
    const result = reverseConversion(profile, 1000);
    expect(result.tier).toBe('bronze');
    expect(result.demoted).toBe(true);
    expect(profile.lifetimeCommissionCents).toBe(4000);
    expect(profile.lifetimeConversions).toBe(4);
  });

  it('reverseConversion clamps counters at 0', () => {
    const profile = {
      id: 'aff_3',
      referralCode: 'code_3',
      tier: 'bronze' as const,
      lifetimeConversions: 0,
      lifetimeCommissionCents: 0,
    };
    reverseConversion(profile, 500);
    expect(profile.lifetimeConversions).toBe(0);
    expect(profile.lifetimeCommissionCents).toBe(0);
  });
});

describe('affiliate program — end-to-end through adapter', () => {
  it('records a conversion with the tier at time of sale', async () => {
    const { adapter, store } = makeMockAdapter({ now: () => 1_700_000_000_000 });
    await adapter.registerAffiliate({ affiliateId: 'aff_e2e_1', referralCode: 'CODE-E2E-1' });
    const referral = await adapter.recordAffiliateConversion({
      referralCode: 'CODE-E2E-1',
      orderId: 'ord_a1',
      customerId: 'cust_a1',
      orderAmountCents: 10_000,
    });
    expect(referral.tier).toBe('bronze');
    expect(referral.commissionCents).toBe(500);
    const profile = store.affiliates.get('aff_e2e_1');
    expect(profile?.lifetimeConversions).toBe(1);
  });

  it('surfaces affiliate_not_found for an unknown referral code', async () => {
    const { adapter } = makeMockAdapter();
    await expect(
      adapter.recordAffiliateConversion({
        referralCode: 'CODE-MISSING',
        orderId: 'ord_a2',
        customerId: 'cust_a2',
        orderAmountCents: 10_000,
      }),
    ).rejects.toThrow('affiliate_not_found');
  });

  it('promotes bronze -> silver across successive conversions', async () => {
    const { adapter, store } = makeMockAdapter();
    await adapter.registerAffiliate({ affiliateId: 'aff_promo', referralCode: 'CODE-PROMO' });
    for (let i = 0; i < 5; i += 1) {
      await adapter.recordAffiliateConversion({
        referralCode: 'CODE-PROMO',
        orderId: `ord_promo_${i}`,
        customerId: `cust_promo_${i}`,
        orderAmountCents: 10_000,
      });
    }
    expect(store.affiliates.get('aff_promo')?.tier).toBe('silver');
  });

  it('claws back commission on order full refund', async () => {
    const { adapter, store } = makeMockAdapter();
    store.orders.set('ord_c1', {
      id: 'ord_c1',
      customerId: 'cust_c1',
      variantId: 'var_c1',
      amountCents: 4000,
      currency: 'USD',
      paidAt: 1_700_000_000_000,
      productKind: 'license',
      state: 'paid',
    });
    await adapter.registerAffiliate({ affiliateId: 'aff_c1', referralCode: 'CODE-C1' });
    const referral = await adapter.recordAffiliateConversion({
      referralCode: 'CODE-C1',
      orderId: 'ord_c1',
      customerId: 'cust_c1',
      orderAmountCents: 4000,
    });
    expect(referral.commissionCents).toBe(200); // bronze 5%
    const refund = await adapter.refund({
      orderId: 'ord_c1',
      amountCents: 4000,
      now: 1_700_000_000_000 + 60_000,
    });
    expect(refund.refund.kind).toBe('full');
    const clawed = Array.from(store.referrals.values())[0]!;
    expect(clawed.state).toBe('clawed-back');
    expect(store.affiliates.get('aff_c1')?.lifetimeCommissionCents).toBe(0);
  });

  it('partial refund does NOT claw back affiliate commission', async () => {
    const { adapter, store } = makeMockAdapter();
    store.orders.set('ord_c2', {
      id: 'ord_c2',
      customerId: 'cust_c2',
      variantId: 'var_c2',
      amountCents: 8000,
      currency: 'USD',
      paidAt: 1_700_000_000_000,
      productKind: 'license',
      state: 'paid',
    });
    await adapter.registerAffiliate({ affiliateId: 'aff_c2', referralCode: 'CODE-C2' });
    await adapter.recordAffiliateConversion({
      referralCode: 'CODE-C2',
      orderId: 'ord_c2',
      customerId: 'cust_c2',
      orderAmountCents: 8000,
    });
    await adapter.refund({
      orderId: 'ord_c2',
      amountCents: 2000,
      now: 1_700_000_000_000 + 60_000,
    });
    const referral = Array.from(store.referrals.values())[0]!;
    expect(referral.state).toBe('converted');
  });
});

describe('affiliate route — HTTP surface', () => {
  it('register + convert returns 200', async () => {
    const { adapter, store } = makeMockAdapter();
    const route = makeAffiliateRoute(adapter);
    await route('register', { affiliateId: 'aff_r1', referralCode: 'CODE-R1' });
    const result = await route('convert', {
      referralCode: 'CODE-R1',
      orderId: 'ord_r1',
      customerId: 'cust_r1',
      orderAmountCents: 5000,
    });
    expect(result.ok).toBe(true);
    expect(store.referrals.size).toBe(1);
  });

  it('claw-back on order without referral returns 404', async () => {
    const { adapter } = makeMockAdapter();
    const route = makeAffiliateRoute(adapter);
    const result = await route('claw-back', { orderId: 'ord_missing' });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.status).toBe(404);
      expect(result.body.kind).toBe('referral_not_found');
    }
  });

  it('refund on destructured adapter method still claws back commission', async () => {
    const { adapter, store } = makeMockAdapter();
    store.orders.set('ord_d1', {
      id: 'ord_d1',
      customerId: 'cust_d1',
      variantId: 'var_d1',
      amountCents: 4000,
      currency: 'USD',
      paidAt: 1_700_000_000_000,
      productKind: 'license',
      state: 'paid',
    });
    await adapter.registerAffiliate({ affiliateId: 'aff_d1', referralCode: 'CODE-D1' });
    await adapter.recordAffiliateConversion({
      referralCode: 'CODE-D1',
      orderId: 'ord_d1',
      customerId: 'cust_d1',
      orderAmountCents: 4000,
    });
    // destructure the refund method to prove it does not rely on `this` binding
    const { refund } = adapter;
    await refund({
      orderId: 'ord_d1',
      amountCents: 4000,
      now: 1_700_000_000_000 + 60_000,
    });
    const referral = Array.from(store.referrals.values())[0]!;
    expect(referral.state).toBe('clawed-back');
  });
});
