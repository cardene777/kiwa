/**
 * Affiliate tier policy — evaluates the tier + commission percent that
 * apply to an affiliate at the moment of a conversion.
 *
 * Real merchant-of-record affiliate programs (Lemon Squeezy, Paddle,
 * Rewardful, Impact.com) use tier-based commission. This module encodes
 * a 3-tier policy — bronze (0-4 conversions), silver (5-19), gold (20+).
 * Commission percent is applied against the order amount; the resulting
 * commission cents are stored on the referral record.
 */

import type { AffiliateProfile, AffiliateTierName } from './store.js';

/**
 * Commission percent per tier expressed in basis points (bps) — 500 bps
 * = 5 percent. bps avoids float rounding in commission cents math.
 */
export const TIER_COMMISSION_BPS: Record<AffiliateTierName, number> = {
  bronze: 500,
  silver: 1000,
  gold: 2000,
};

/**
 * Lifetime conversion thresholds that promote an affiliate to the next
 * tier. Evaluated inclusively — an affiliate with exactly 5 conversions
 * is silver, with exactly 20 is gold.
 */
export const TIER_PROMOTION_THRESHOLD: Record<AffiliateTierName, number> = {
  bronze: 0,
  silver: 5,
  gold: 20,
};

/**
 * Evaluate the tier an affiliate belongs to given its lifetime
 * conversion count. Called on every referral conversion so tier
 * promotions apply immediately to the next commission calculation.
 */
export function evaluateTier(lifetimeConversions: number): AffiliateTierName {
  if (lifetimeConversions >= TIER_PROMOTION_THRESHOLD.gold) return 'gold';
  if (lifetimeConversions >= TIER_PROMOTION_THRESHOLD.silver) return 'silver';
  return 'bronze';
}

/**
 * Compute commission cents for an order given the affiliate's current
 * tier. Rounds down to avoid over-crediting the affiliate on odd cent
 * amounts.
 */
export function computeCommissionCents(
  orderAmountCents: number,
  tier: AffiliateTierName,
): number {
  if (orderAmountCents <= 0) return 0;
  const bps = TIER_COMMISSION_BPS[tier];
  return Math.floor((orderAmountCents * bps) / 10000);
}

/**
 * Apply a conversion to an affiliate profile — increments lifetime
 * counters + updates the tier when the new count crosses a threshold.
 * Returns the *new* tier for immediate use in commission math.
 */
export function applyConversion(
  profile: AffiliateProfile,
  orderAmountCents: number,
): {
  tier: AffiliateTierName;
  commissionCents: number;
  promoted: boolean;
} {
  const priorTier = profile.tier;
  profile.lifetimeConversions += 1;
  const tier = evaluateTier(profile.lifetimeConversions);
  const commissionCents = computeCommissionCents(orderAmountCents, tier);
  profile.tier = tier;
  profile.lifetimeCommissionCents += commissionCents;
  return { tier, commissionCents, promoted: tier !== priorTier };
}

/**
 * Reverse a conversion (used when the order is refunded — the affiliate
 * loses the commission and lifetime counters decrement). If the reversal
 * causes a demotion, the tier drops to the appropriate lower band on
 * subsequent conversions; existing referrals retain the tier they were
 * booked at (no retroactive re-tiering).
 */
export function reverseConversion(
  profile: AffiliateProfile,
  commissionCents: number,
): { tier: AffiliateTierName; demoted: boolean } {
  const priorTier = profile.tier;
  profile.lifetimeConversions = Math.max(0, profile.lifetimeConversions - 1);
  profile.lifetimeCommissionCents = Math.max(
    0,
    profile.lifetimeCommissionCents - commissionCents,
  );
  const tier = evaluateTier(profile.lifetimeConversions);
  profile.tier = tier;
  return { tier, demoted: tier !== priorTier };
}
