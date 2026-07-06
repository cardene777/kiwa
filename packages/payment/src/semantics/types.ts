import type { PaymentProvider } from '../types.js';

/**
 * Advanced billing semantics — provider-neutral axis SSOT.
 *
 * v0.2 mocks only carried the webhook signature + dispatch primitive. v0.3
 * adds 9 production semantics that every real biller cares about — dunning,
 * retry, 3DS, SCA, PSD2, subscription lifecycle, invoice, tax, chargeback.
 * Each axis is expressed as a small state-machine helper that emits already
 * signed webhook events through the existing PaymentAdapter, so downstream
 * tests can drive the axis without knowing the provider's payload dialect.
 */
export type BillingAxis =
  // v0.3 — 9 axis
  | 'dunning'
  | 'retry'
  | '3ds'
  | 'sca'
  | 'psd2'
  | 'subscription-lifecycle'
  | 'invoice'
  | 'tax'
  | 'chargeback'
  // v0.4 — advanced billing II 8 axis
  | 'orchestration'
  | 'revenue-recovery'
  | 'refund-advanced'
  | 'dispute'
  | 'webhook-idempotency-advanced'
  | 'tax-localization'
  | 'subscription-state-machine'
  | 'payment-method-vault';

/**
 * Provider-neutral event names used inside the axis helpers. Real providers
 * emit different string ids (Stripe `invoice.payment_failed`, Paddle
 * `transaction.payment_failed`, Lemon Squeezy `subscription_payment_failed`)
 * — the {@link providerEventName} map handles the translation. Tests can
 * assert on the neutral name via `event.type.endsWith(':<neutral>')` or on
 * the provider-specific one via the raw type field.
 */
export type NeutralEventName =
  // dunning
  | 'dunning.attempt'
  | 'dunning.exhausted'
  | 'dunning.recovered'
  // retry (webhook delivery)
  | 'retry.scheduled'
  | 'retry.delivered'
  | 'retry.abandoned'
  // 3D Secure
  | '3ds.challenge_required'
  | '3ds.challenge_completed'
  | '3ds.frictionless'
  // SCA
  | 'sca.required'
  | 'sca.exempt'
  | 'sca.authenticated'
  // PSD2 open banking / mandate
  | 'psd2.mandate_created'
  | 'psd2.mandate_revoked'
  | 'psd2.consent_granted'
  // subscription lifecycle
  | 'subscription.created'
  | 'subscription.upgraded'
  | 'subscription.downgraded'
  | 'subscription.paused'
  | 'subscription.resumed'
  | 'subscription.canceled'
  | 'subscription.reactivated'
  // invoice
  | 'invoice.drafted'
  | 'invoice.opened'
  | 'invoice.paid'
  | 'invoice.voided'
  | 'invoice.uncollectible'
  | 'invoice.credit_noted'
  // tax
  | 'tax.calculated'
  | 'tax.reverse_charged'
  | 'tax.exempted'
  // chargeback
  | 'chargeback.opened'
  | 'chargeback.evidence_submitted'
  | 'chargeback.won'
  | 'chargeback.lost'
  // v0.4 — orchestration (multi-provider routing)
  | 'orchestration.routed'
  | 'orchestration.failed_over'
  | 'orchestration.circuit_opened'
  | 'orchestration.circuit_closed'
  // v0.4 — revenue recovery
  | 'recovery.smart_retry_scheduled'
  | 'recovery.dunning_cascade_step'
  | 'recovery.card_updated'
  | 'recovery.network_tokenized'
  // v0.4 — refund advanced
  | 'refund.partial'
  | 'refund.full'
  | 'refund.window_expired'
  | 'refund.policy_denied'
  // v0.4 — dispute lifecycle
  | 'dispute.evidence_submitted'
  | 'dispute.represented'
  | 'dispute.arbitration_opened'
  | 'dispute.liability_shifted'
  // v0.4 — webhook idempotency advanced
  | 'webhook.dedup_hit'
  | 'webhook.replay_blocked'
  | 'webhook.signature_rotated'
  | 'webhook.poison_queued'
  // v0.4 — tax localization
  | 'tax.vat_calculated'
  | 'tax.gst_calculated'
  | 'tax.sales_tax_calculated'
  | 'tax.dac7_reported'
  // v0.4 — subscription state machine
  | 'subscription.grace_period_entered'
  | 'subscription.grace_period_exited'
  | 'subscription.proration_applied'
  | 'subscription.coupon_stacked'
  // v0.4 — payment method vault
  | 'vault.token_created'
  | 'vault.token_revoked'
  | 'vault.migrated'
  | 'vault.pci_scope_verified';

/**
 * Provider-specific event name lookup. When a real provider uses a distinct
 * string for the same semantic (e.g. Paddle's `subscription.paused` vs Lemon
 * Squeezy's `subscription_paused`) the mock emits the provider dialect so
 * tests wired to real SDKs still see recognisable event names.
 */
const dialect: Record<PaymentProvider, Partial<Record<NeutralEventName, string>>> = {
  stripe: {
    'dunning.attempt': 'invoice.payment_failed',
    'dunning.exhausted': 'invoice.marked_uncollectible',
    'dunning.recovered': 'invoice.payment_succeeded',
    '3ds.challenge_required': 'payment_intent.requires_action',
    '3ds.challenge_completed': 'payment_intent.succeeded',
    '3ds.frictionless': 'payment_intent.succeeded',
    'sca.required': 'payment_intent.requires_action',
    'sca.exempt': 'payment_intent.succeeded',
    'sca.authenticated': 'payment_intent.succeeded',
    'psd2.mandate_created': 'mandate.updated',
    'psd2.mandate_revoked': 'mandate.updated',
    'psd2.consent_granted': 'payment_method.attached',
    'subscription.created': 'customer.subscription.created',
    'subscription.upgraded': 'customer.subscription.updated',
    'subscription.downgraded': 'customer.subscription.updated',
    'subscription.paused': 'customer.subscription.paused',
    'subscription.resumed': 'customer.subscription.resumed',
    'subscription.canceled': 'customer.subscription.deleted',
    'subscription.reactivated': 'customer.subscription.updated',
    'invoice.drafted': 'invoice.created',
    'invoice.opened': 'invoice.finalized',
    'invoice.paid': 'invoice.paid',
    'invoice.voided': 'invoice.voided',
    'invoice.uncollectible': 'invoice.marked_uncollectible',
    'invoice.credit_noted': 'credit_note.created',
    'tax.calculated': 'invoice.upcoming',
    'tax.reverse_charged': 'invoice.upcoming',
    'tax.exempted': 'invoice.upcoming',
    'chargeback.opened': 'charge.dispute.created',
    'chargeback.evidence_submitted': 'charge.dispute.updated',
    'chargeback.won': 'charge.dispute.closed',
    'chargeback.lost': 'charge.dispute.closed',
    // v0.4
    'orchestration.routed': 'payment_intent.created',
    'orchestration.failed_over': 'payment_intent.processing',
    'orchestration.circuit_opened': 'radar.early_fraud_warning.created',
    'orchestration.circuit_closed': 'radar.early_fraud_warning.updated',
    'recovery.smart_retry_scheduled': 'invoice.payment_action_required',
    'recovery.dunning_cascade_step': 'invoice.payment_failed',
    'recovery.card_updated': 'payment_method.card_automatically_updated',
    'recovery.network_tokenized': 'setup_intent.succeeded',
    'refund.partial': 'charge.refunded',
    'refund.full': 'charge.refunded',
    'refund.window_expired': 'refund.updated',
    'refund.policy_denied': 'refund.failed',
    'dispute.evidence_submitted': 'charge.dispute.updated',
    'dispute.represented': 'charge.dispute.updated',
    'dispute.arbitration_opened': 'charge.dispute.updated',
    'dispute.liability_shifted': 'charge.dispute.funds_reinstated',
    'webhook.dedup_hit': 'invoice.upcoming',
    'webhook.replay_blocked': 'invoice.upcoming',
    'webhook.signature_rotated': 'webhook_endpoint.updated',
    'webhook.poison_queued': 'invoice.upcoming',
    'tax.vat_calculated': 'tax.calculation_created',
    'tax.gst_calculated': 'tax.calculation_created',
    'tax.sales_tax_calculated': 'tax.calculation_created',
    'tax.dac7_reported': 'tax.settings.updated',
    'subscription.grace_period_entered': 'customer.subscription.updated',
    'subscription.grace_period_exited': 'customer.subscription.updated',
    'subscription.proration_applied': 'invoice.upcoming',
    'subscription.coupon_stacked': 'coupon.updated',
    'vault.token_created': 'payment_method.attached',
    'vault.token_revoked': 'payment_method.detached',
    'vault.migrated': 'payment_method.updated',
    'vault.pci_scope_verified': 'setup_intent.succeeded',
  },
  paddle: {
    'dunning.attempt': 'transaction.payment_failed',
    'dunning.exhausted': 'transaction.canceled',
    'dunning.recovered': 'transaction.completed',
    '3ds.challenge_required': 'transaction.updated',
    '3ds.challenge_completed': 'transaction.completed',
    '3ds.frictionless': 'transaction.completed',
    'sca.required': 'transaction.updated',
    'sca.exempt': 'transaction.completed',
    'sca.authenticated': 'transaction.completed',
    'psd2.mandate_created': 'payment_method.saved',
    'psd2.mandate_revoked': 'payment_method.deleted',
    'psd2.consent_granted': 'payment_method.saved',
    'subscription.created': 'subscription.created',
    'subscription.upgraded': 'subscription.updated',
    'subscription.downgraded': 'subscription.updated',
    'subscription.paused': 'subscription.paused',
    'subscription.resumed': 'subscription.resumed',
    'subscription.canceled': 'subscription.canceled',
    'subscription.reactivated': 'subscription.updated',
    'invoice.drafted': 'transaction.created',
    'invoice.opened': 'transaction.billed',
    'invoice.paid': 'transaction.completed',
    'invoice.voided': 'transaction.canceled',
    'invoice.uncollectible': 'transaction.past_due',
    'invoice.credit_noted': 'adjustment.created',
    'tax.calculated': 'transaction.updated',
    'tax.reverse_charged': 'transaction.updated',
    'tax.exempted': 'transaction.updated',
    'chargeback.opened': 'transaction.chargeback_created',
    'chargeback.evidence_submitted': 'transaction.chargeback_updated',
    'chargeback.won': 'transaction.chargeback_won',
    'chargeback.lost': 'transaction.chargeback_lost',
    // v0.4
    'orchestration.routed': 'transaction.created',
    'orchestration.failed_over': 'transaction.updated',
    'orchestration.circuit_opened': 'transaction.updated',
    'orchestration.circuit_closed': 'transaction.updated',
    'recovery.smart_retry_scheduled': 'transaction.updated',
    'recovery.dunning_cascade_step': 'transaction.payment_failed',
    'recovery.card_updated': 'payment_method.saved',
    'recovery.network_tokenized': 'payment_method.saved',
    'refund.partial': 'adjustment.created',
    'refund.full': 'adjustment.created',
    'refund.window_expired': 'adjustment.updated',
    'refund.policy_denied': 'adjustment.updated',
    'dispute.evidence_submitted': 'transaction.chargeback_updated',
    'dispute.represented': 'transaction.chargeback_updated',
    'dispute.arbitration_opened': 'transaction.chargeback_updated',
    'dispute.liability_shifted': 'transaction.chargeback_won',
    'webhook.dedup_hit': 'transaction.updated',
    'webhook.replay_blocked': 'transaction.updated',
    'webhook.signature_rotated': 'notification.updated',
    'webhook.poison_queued': 'transaction.updated',
    'tax.vat_calculated': 'transaction.updated',
    'tax.gst_calculated': 'transaction.updated',
    'tax.sales_tax_calculated': 'transaction.updated',
    'tax.dac7_reported': 'transaction.updated',
    'subscription.grace_period_entered': 'subscription.past_due',
    'subscription.grace_period_exited': 'subscription.updated',
    'subscription.proration_applied': 'transaction.updated',
    'subscription.coupon_stacked': 'discount.updated',
    'vault.token_created': 'payment_method.saved',
    'vault.token_revoked': 'payment_method.deleted',
    'vault.migrated': 'payment_method.updated',
    'vault.pci_scope_verified': 'payment_method.saved',
  },
  lemonsqueezy: {
    'dunning.attempt': 'subscription_payment_failed',
    'dunning.exhausted': 'subscription_expired',
    'dunning.recovered': 'subscription_payment_success',
    '3ds.challenge_required': 'order_created',
    '3ds.challenge_completed': 'order_created',
    '3ds.frictionless': 'order_created',
    'sca.required': 'order_created',
    'sca.exempt': 'order_created',
    'sca.authenticated': 'order_created',
    'psd2.mandate_created': 'subscription_created',
    'psd2.mandate_revoked': 'subscription_cancelled',
    'psd2.consent_granted': 'subscription_created',
    'subscription.created': 'subscription_created',
    'subscription.upgraded': 'subscription_updated',
    'subscription.downgraded': 'subscription_updated',
    'subscription.paused': 'subscription_paused',
    'subscription.resumed': 'subscription_unpaused',
    'subscription.canceled': 'subscription_cancelled',
    'subscription.reactivated': 'subscription_resumed',
    'invoice.drafted': 'order_created',
    'invoice.opened': 'order_created',
    'invoice.paid': 'order_created',
    'invoice.voided': 'order_refunded',
    'invoice.uncollectible': 'subscription_expired',
    'invoice.credit_noted': 'order_refunded',
    'tax.calculated': 'order_created',
    'tax.reverse_charged': 'order_created',
    'tax.exempted': 'order_created',
    'chargeback.opened': 'order_refunded',
    'chargeback.evidence_submitted': 'order_refunded',
    'chargeback.won': 'order_refunded',
    'chargeback.lost': 'order_refunded',
    // v0.4
    'orchestration.routed': 'order_created',
    'orchestration.failed_over': 'order_created',
    'orchestration.circuit_opened': 'order_refunded',
    'orchestration.circuit_closed': 'order_created',
    'recovery.smart_retry_scheduled': 'subscription_payment_failed',
    'recovery.dunning_cascade_step': 'subscription_payment_failed',
    'recovery.card_updated': 'subscription_updated',
    'recovery.network_tokenized': 'subscription_updated',
    'refund.partial': 'order_refunded',
    'refund.full': 'order_refunded',
    'refund.window_expired': 'order_refunded',
    'refund.policy_denied': 'order_refunded',
    'dispute.evidence_submitted': 'order_refunded',
    'dispute.represented': 'order_refunded',
    'dispute.arbitration_opened': 'order_refunded',
    'dispute.liability_shifted': 'order_refunded',
    'webhook.dedup_hit': 'order_created',
    'webhook.replay_blocked': 'order_created',
    'webhook.signature_rotated': 'order_created',
    'webhook.poison_queued': 'order_created',
    'tax.vat_calculated': 'order_created',
    'tax.gst_calculated': 'order_created',
    'tax.sales_tax_calculated': 'order_created',
    'tax.dac7_reported': 'order_created',
    'subscription.grace_period_entered': 'subscription_paused',
    'subscription.grace_period_exited': 'subscription_resumed',
    'subscription.proration_applied': 'subscription_updated',
    'subscription.coupon_stacked': 'subscription_updated',
    'vault.token_created': 'subscription_created',
    'vault.token_revoked': 'subscription_cancelled',
    'vault.migrated': 'subscription_updated',
    'vault.pci_scope_verified': 'subscription_created',
  },
};

/**
 * Translate a neutral event name to the provider dialect. Falls back to the
 * neutral name if the provider has no specific dialect entry — this makes
 * the map partial-safe without silent typos.
 */
export function providerEventName(
  provider: PaymentProvider,
  neutral: NeutralEventName,
): string {
  return dialect[provider][neutral] ?? neutral;
}

/**
 * Axis result envelope returned by every state-machine step. The event is
 * already emitted through the adapter; the envelope surfaces the next state
 * transition metadata so tests can drive the next call without re-reading
 * the raw webhook body.
 */
export interface AxisStep<TState> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  amountCents: number;
  metadata: Record<string, string | number | boolean>;
}
