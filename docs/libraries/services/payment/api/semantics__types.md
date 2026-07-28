---
title: "@kiwa-lab/payment semantics__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>providerEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/types.ts#L494) <code v-pre>packages/payment/src/semantics/types.ts</code>

Translate a neutral event name to the provider dialect. Falls back to the neutral name if the provider has no specific dialect entry — this makes the map partial-safe without silent typos.

```ts
export declare function providerEventName(provider: PaymentProvider, neutral: NeutralEventName): string;
```

### 型

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/types.ts#L507) <code v-pre>packages/payment/src/semantics/types.ts</code>

Axis result envelope returned by every state-machine step. The event is already emitted through the adapter; the envelope surfaces the next state transition metadata so tests can drive the next call without re-reading the raw webhook body.

```ts
export interface AxisStep<TState> {
    neutralEvent: NeutralEventName;
    providerEvent: string;
    state: TState;
    amountCents: number;
    metadata: Record<string, string | number | boolean>;
}
```

#### <code v-pre>BillingAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/types.ts#L13) <code v-pre>packages/payment/src/semantics/types.ts</code>

Advanced billing semantics — provider-neutral axis SSOT. v0.2 mocks only carried the webhook signature + dispatch primitive. v0.3 adds 9 production semantics that every real biller cares about — dunning, retry, 3DS, SCA, PSD2, subscription lifecycle, invoice, tax, chargeback. Each axis is expressed as a small state-machine helper that emits already signed webhook events through the existing PaymentAdapter, so downstream tests can drive the axis without knowing the provider's payload dialect.

```ts
export type BillingAxis = 'dunning' | 'retry' | '3ds' | 'sca' | 'psd2' | 'subscription-lifecycle' | 'invoice' | 'tax' | 'chargeback' | 'orchestration' | 'revenue-recovery' | 'refund-advanced' | 'dispute' | 'webhook-idempotency-advanced' | 'tax-localization' | 'subscription-state-machine' | 'payment-method-vault' | 'embedded-finance' | 'bnpl' | 'crypto-payment' | 'fx-cross-border' | 'recurring-revenue-advanced' | 'payment-orchestration-ii' | 'fraud-detection-advanced' | 'regulatory-reporting';
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/types.ts#L54) <code v-pre>packages/payment/src/semantics/types.ts</code>

Provider-neutral event names used inside the axis helpers. Real providers emit different string ids (Stripe `invoice.payment_failed`, Paddle `transaction.payment_failed`, Lemon Squeezy `subscription_payment_failed`) — the {@link providerEventName} map handles the translation. Tests can assert on the neutral name via `event.type.endsWith(':&lt;neutral&gt;')` or on the provider-specific one via the raw type field.

```ts
export type NeutralEventName = 'dunning.attempt' | 'dunning.exhausted' | 'dunning.recovered' | 'retry.scheduled' | 'retry.delivered' | 'retry.abandoned' | '3ds.challenge_required' | '3ds.challenge_completed' | '3ds.frictionless' | 'sca.required' | 'sca.exempt' | 'sca.authenticated' | 'psd2.mandate_created' | 'psd2.mandate_revoked' | 'psd2.consent_granted' | 'subscription.created' | 'subscription.upgraded' | 'subscription.downgraded' | 'subscription.paused' | 'subscription.resumed' | 'subscription.canceled' | 'subscription.reactivated' | 'invoice.drafted' | 'invoice.opened' | 'invoice.paid' | 'invoice.voided' | 'invoice.uncollectible' | 'invoice.credit_noted' | 'tax.calculated' | 'tax.reverse_charged' | 'tax.exempted' | 'chargeback.opened' | 'chargeback.evidence_submitted' | 'chargeback.won' | 'chargeback.lost' | 'orchestration.routed' | 'orchestration.failed_over' | 'orchestration.circuit_opened' | 'orchestration.circuit_closed' | 'recovery.smart_retry_scheduled' | 'recovery.dunning_cascade_step' | 'recovery.card_updated' | 'recovery.network_tokenized' | 'refund.partial' | 'refund.full' | 'refund.window_expired' | 'refund.policy_denied' | 'dispute.evidence_submitted' | 'dispute.represented' | 'dispute.arbitration_opened' | 'dispute.liability_shifted' | 'webhook.dedup_hit' | 'webhook.replay_blocked' | 'webhook.signature_rotated' | 'webhook.poison_queued' | 'tax.vat_calculated' | 'tax.gst_calculated' | 'tax.sales_tax_calculated' | 'tax.dac7_reported' | 'subscription.grace_period_entered' | 'subscription.grace_period_exited' | 'subscription.proration_applied' | 'subscription.coupon_stacked' | 'vault.token_created' | 'vault.token_revoked' | 'vault.migrated' | 'vault.pci_scope_verified' | 'embedded.account_opened' | 'embedded.card_issued' | 'embedded.kyc_verified' | 'embedded.kyb_verified' | 'bnpl.plan_created' | 'bnpl.installment_scheduled' | 'bnpl.risk_scored' | 'bnpl.late_fee_charged' | 'crypto.invoice_created' | 'crypto.tx_confirmed' | 'crypto.gas_abstracted' | 'crypto.wallet_linked' | 'fx.rate_locked' | 'fx.settlement_initiated' | 'fx.settlement_completed' | 'fx.rate_expired' | 'rr.mrr_computed' | 'rr.churn_recorded' | 'rr.expansion_recorded' | 'rr.nrr_computed' | 'po2.smart_routed' | 'po2.ml_scored' | 'po2.fallback_triggered' | 'po2.cascade_exhausted' | 'fraud.device_scored' | 'fraud.biometric_verified' | 'fraud.velocity_flagged' | 'fraud.ml_blocked' | 'reg.pci_reported' | 'reg.psd2_reported' | 'reg.dora_reported' | 'reg.sar_filed';
```
