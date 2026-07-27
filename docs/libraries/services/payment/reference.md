# @kiwa-lab/payment リファレンス

この page は公開 API の契約を確認するための辞書です。最初の webhook test では provider mock から `PaymentAdapter` を作り、`signWebhook`、`verifyWebhook`、`onWebhook`、`emit` を使います。fixture helper はこの流れを短くするだけで、検証を省略しません。

`verifyWebhook` は成功時だけ event を返します。`ok: false` なら event は `null` なので、`bad-signature`、`stale-timestamp`、`malformed-body` を受信拒否として扱います。semantic API は状態遷移と provider event を test するためのものです。job の予約、実際の課金、PCI 要件、provider API 呼び出しは行いません。

## 共通 adapter

`PaymentAdapter` はすべての provider mock が実装する contract です。

| 操作 | 内容 |
| --- | --- |
| `signWebhook` | event の入力から `rawBody`、`signature`、正規化 event を作る |
| `verifyWebhook` | raw body、signature、任意の `toleranceMs` を検証する |
| `onWebhook` | 非同期または同期 handler を登録し、解除関数を得る |
| `emit` | 登録された handler を順に await して event を配送する |

`WebhookVerifyResult` の `ok` が false のとき `event` は null です。`reason` は `ok`、`bad-signature`、`stale-timestamp`、`malformed-body` のいずれかです。

## mock と fixture

`createStripeMock`、`createPaddleMock`、`createLemonSqueezyMock` は `PaymentAdapter` を返します。各 adapter は HMAC SHA256 で `<timestamp>.<rawBody>` に署名します。`PaymentWebhookEvent` には provider、id、type、amountCents、currency、customerId、timestamp、raw が含まれます。

fixture の `checkoutCompleted`、`subscriptionCreated`、`paymentFailed` は指定した金額を使います。`refunded` は `amountCents` を負数にします。頻出でない provider event は `signWebhook` を直接使ってください。

## 請求 semantics

advanced semantics は、同じ `PaymentAdapter` を通じて provider 方言の Webhook event を発行します。主要な軸は次のとおりです。

| 軸 | 主な helper | 検証する状態 |
| --- | --- | --- |
| dunning | `startDunning` `dunningAttempt` `finalizeDunning` | 回収の試行、猶予、回収不能 |
| retry | `startRetry` `retryDeliver` `retryBackoffMs` | scheduled、delivered、abandoned |
| 3DS | `startThreeDs` と challenge helper | challenge と frictionless |
| SCA | `startSca` `scaEvaluate` `scaAuthenticate` | required、exempt、authenticated |
| subscription | lifecycle helper | 作成、変更、pause、resume、cancel |
| invoice | invoice helper | draft、open、paid、void、credit note |
| tax | `calculateTax` `emitTaxLine` | 税額、reverse charge、exemption |
| chargeback | chargeback helper | open、evidence、won、lost |

`collectFidelityCoverage` は三 provider と主要な請求軸の coverage row を返します。リリース判定のための集計には使えますが、個別の業務ルールの代わりにはなりません。

## 実行モード

`resolveMode(provider, env)` は `KIWA_MODE` と provider key を読みます。`KIWA_MODE=real` かつ `STRIPE_KEY`、`PADDLE_KEY`、`LEMONSQUEEZY_KEY` の該当 key があると `real` を返し、その他は `mock` になります。`resolveAllModes` は全 provider を返し、`assertMode` は期待と異なる場合に例外を投げます。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `expected ${provider} in ${expected} mode but resolved ${resolved.mode} (${resolved.reason})` | [packages/payment/src/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L81) |
| 'scheduleInstallment: all installments already scheduled' | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L111) |
| 'scoreRisk: score must be between 0 and 100' | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L133) |
| `chargeLateFee: session is ${session.state}` | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L157) |
| 'chargeLateFee: installmentIndex out of range' | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L160) |
| 'createBnplPlan: totalCents must be positive' | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L69) |
| 'createBnplPlan: installments must be between 2 and 12' | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L76) |
| `submitEvidence: chargeback ${chargeback.id} is ${chargeback.state}` | [packages/payment/src/semantics/chargeback.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L100) |
| `resolveChargeback: chargeback is ${chargeback.state}, submit evidence first` | [packages/payment/src/semantics/chargeback.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L139) |
| `confirmTx: session is ${session.state}` | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L111) |
| 'confirmTx: invoice expired' | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L116) |
| 'abstractGas: gas abstraction disabled in config' | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L142) |
| 'abstractGas: gasSubsidyCents must be non-negative' | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L145) |
| 'linkWallet: walletAddress must not be empty' | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L163) |
| 'linkWallet: signature required for wallet linkage' | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L166) |
| 'createCryptoInvoice: amountCents must be positive' | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L72) |
| 'escalateArbitration: dispute must be represented first' | [packages/payment/src/semantics/dispute.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L110) |
| 'shiftLiability: liability already shifted' | [packages/payment/src/semantics/dispute.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L130) |
| `submitDisputeEvidence: session is ${session.state}, cannot add evidence` | [packages/payment/src/semantics/dispute.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L72) |
| 'representDispute: evidence must be submitted first' | [packages/payment/src/semantics/dispute.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L90) |
| 'representDispute: cannot represent without evidence' | [packages/payment/src/semantics/dispute.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L93) |
| `finalizeDunning: session already ${session.state}` | [packages/payment/src/semantics/dunning.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L123) |
| `dunningAttempt: session is ${session.state}, cannot attempt` | [packages/payment/src/semantics/dunning.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L83) |
| 'verifyKyb: KYB not required for this session' | [packages/payment/src/semantics/embedded-finance.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L124) |
| 'issueCard: KYC must be verified before issuing a card' | [packages/payment/src/semantics/embedded-finance.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L144) |
| 'issueCard: KYB must be verified before issuing a card' | [packages/payment/src/semantics/embedded-finance.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L147) |
| `verifyKyc: session is ${session.state}` | [packages/payment/src/semantics/embedded-finance.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L95) |
| 'verifyKyc: score must be between 0 and 100' | [packages/payment/src/semantics/embedded-finance.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L98) |
| 'scoreDevice: score must be between 0 and 100' | [packages/payment/src/semantics/fraud-detection-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L100) |
| 'verifyBiometric: confidence must be between 0 and 1' | [packages/payment/src/semantics/fraud-detection-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L123) |
| 'flagVelocity: attemptsInWindow must be non-negative' | [packages/payment/src/semantics/fraud-detection-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L144) |
| 'scoreMlBlock: score must be between 0 and 1' | [packages/payment/src/semantics/fraud-detection-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L168) |
| 'initiateSettlement: no rate locked' | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L133) |
| 'initiateSettlement: rate lock expired' | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L137) |
| `completeSettlement: session is ${session.state}, must be settlement-initiated` | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L157) |
| 'completeSettlement: no rate locked' | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L163) |
| 'expireRate: no rate locked' | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L183) |
| 'lockRate: rate must be positive' | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L95) |
| 'lockRate: amountFromCents must be positive' | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L98) |
| `payInvoice: invoice ${invoice.id} is ${invoice.state}` | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L107) |
| `voidInvoice: invoice ${invoice.id} is ${invoice.state}, cannot void` | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L142) |
| `markUncollectible: invoice ${invoice.id} is ${invoice.state}` | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L176) |
| `creditNoteInvoice: invoice ${invoice.id} is ${invoice.state}, must be paid` | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L212) |
| 'creditNoteInvoice: creditAmountCents must be > 0' | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L215) |
| `creditNoteInvoice: credit ${input.creditAmountCents} exceeds invoice ${invoice.amountCents}` | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L218) |
| `openInvoice: invoice ${invoice.id} is ${invoice.state}` | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L74) |
| `routeCharge: no adapter registered for ${provider}` | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L101) |
| `routeCharge: no adapter for failover ${session.config.providers[session.currentProviderIndex]}` | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L126) |
| `probeCircuit: session is ${session.state}, not circuit-open` | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L147) |
| 'probeCircuit: currentProviderIndex out of range' | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L153) |
| `probeCircuit: no adapter for ${provider}` | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L172) |
| 'startOrchestration: providers must not be empty' | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L64) |
| 'routeCharge: session already terminated' | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L93) |
| 'routeCharge: circuit is open, call probeCircuit first' | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L96) |
| `migrateToken: source token ${input.tokenId} not found` | [packages/payment/src/semantics/payment-method-vault.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L115) |
| `migrateToken: source token belongs to ${source.provider}, not ${fromAdapter.provider}` | [packages/payment/src/semantics/payment-method-vault.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L118) |
| 'verifyPciScope: raw PAN/CVV detected in vault' | [packages/payment/src/semantics/payment-method-vault.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L172) |
| `tokenizeCard: token ${input.tokenId} already exists` | [packages/payment/src/semantics/payment-method-vault.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L66) |
| `revokeToken: token ${input.tokenId} not found` | [packages/payment/src/semantics/payment-method-vault.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L92) |
| 'scoreMl: ML scoring disabled in config' | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L118) |
| 'scoreMl: score must be between 0 and 1' | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L121) |
| `scoreMl: no adapter for ${providerName}` | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L128) |
| 'triggerFallback: cascade already exhausted' | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L146) |
| `triggerFallback: no adapter for ${lastProvider}` | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L159) |
| 'triggerFallback: currentIndex out of range' | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L169) |
| `triggerFallback: no adapter for ${providerName}` | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L173) |
| 'startOrchestrationII: providers must not be empty' | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L64) |
| `smartRoute: session is ${session.state}` | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L90) |
| 'smartRoute: currentIndex out of range' | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L94) |
| `smartRoute: no adapter for ${providerName}` | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L98) |
| `revokeMandate: mandate ${mandate.id} is ${mandate.state}` | [packages/payment/src/semantics/psd2.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L81) |
| 'recordChurn: churnCents must be non-negative' | [packages/payment/src/semantics/recurring-revenue-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L101) |
| 'recordExpansion: expansionCents must be non-negative' | [packages/payment/src/semantics/recurring-revenue-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L122) |
| 'recordContraction: contractionCents must be non-negative' | [packages/payment/src/semantics/recurring-revenue-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L170) |
| 'startRecurringRevenue: mrrStartCents must be non-negative' | [packages/payment/src/semantics/recurring-revenue-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L51) |
| 'preventChargeback: chargebackPrevention disabled in policy' | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L138) |
| 'refund window has expired' | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L145) |
| 'amount below minAmountCents' | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L151) |
| 'amount above maxAmountCents' | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L154) |
| 'partialRefund: refund exceeds original charge' | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L81) |
| 'fullRefund: no remaining amount to refund' | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L98) |
| 'reportPsd2: challengeRate must be between 0 and 1' | [packages/payment/src/semantics/regulatory-reporting.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L103) |
| 'reportDora: ictRiskScore must be between 0 and 100' | [packages/payment/src/semantics/regulatory-reporting.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L139) |
| 'fileSar: SAR already filed for this session' | [packages/payment/src/semantics/regulatory-reporting.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L175) |
| 'fileSar: reason must not be empty' | [packages/payment/src/semantics/regulatory-reporting.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L178) |
| `retryDeliver: session is ${session.state}` | [packages/payment/src/semantics/retry.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L78) |
| `advanceCascade: session already ${session.state}` | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L106) |
| 'advanceCascade: cascade exhausted' | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L110) |
| 'advanceCascade: cascade step index out of range' | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L115) |
| 'applyCardUpdate: cardUpdater disabled in config' | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L136) |
| 'applyNetworkToken: networkTokenization disabled in config' | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L156) |
| `scheduleSmartRetry: session already ${session.state}` | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L88) |
| `scaAuthenticate: session is ${session.state}` | [packages/payment/src/semantics/sca.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L119) |
| `scaEvaluate: session is ${session.state}` | [packages/payment/src/semantics/sca.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L61) |
| `pauseSubscription: subscription is ${subscription.state}` | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L132) |
| `resumeSubscription: subscription is ${subscription.state}` | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L166) |
| `cancelSubscription: subscription is already canceled` | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L200) |
| `reactivateSubscription: subscription is ${subscription.state}` | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L234) |
| `changePlan: subscription ${subscription.id} is canceled` | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L82) |
| `changePlan: subscription ${subscription.id} is paused, resume first` | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L85) |
| 'changePlan: newAmountCents equals current amountCents (no-op)' | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L88) |
| `exitGracePeriod: session is ${session.state}` | [packages/payment/src/semantics/subscription-state-machine.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L101) |
| 'applyProration: daysInCycle must be positive' | [packages/payment/src/semantics/subscription-state-machine.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L125) |
| `enterGracePeriod: session is ${session.state}, must be active` | [packages/payment/src/semantics/subscription-state-machine.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L82) |
| `threeDsFrictionless: session is ${session.state}` | [packages/payment/src/semantics/three-ds.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L136) |
| `threeDsRequestChallenge: session is ${session.state}` | [packages/payment/src/semantics/three-ds.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L60) |
| `threeDsSubmitChallenge: session is ${session.state}` | [packages/payment/src/semantics/three-ds.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L99) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `abstractGas`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L136) `packages/payment/src/semantics/crypto-payment.ts`

Abstract gas via paymaster (EIP-4337 or similar meta-tx). Customer pays in the invoice token; the paymaster covers the native gas token.

```ts
export async function abstractGas(
  adapter: PaymentAdapter,
  session: CryptoPaymentSession,
  input: { paymasterAddress: string; gasSubsidyCents: number },
): Promise<AxisStep<CryptoPaymentState>>;
```

#### `advanceCascade`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L101) `packages/payment/src/semantics/revenue-recovery.ts`

Advance the dunning cascade one step. Emits `recovery.dunning_cascade_step` with the channel (email / in-app / sms / push) and step index.

```ts
export async function advanceCascade(
  adapter: PaymentAdapter,
  session: RecoverySession,
): Promise<AxisStep<RecoveryState>>;
```

#### `applyCardUpdate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L130) `packages/payment/src/semantics/revenue-recovery.ts`

Card updater ran — customer's expiring card was refreshed via the network. Emits `recovery.card_updated` with the new PAN suffix hint.

```ts
export async function applyCardUpdate(
  adapter: PaymentAdapter,
  session: RecoverySession,
  input: { last4: string; expMonth: number; expYear: number },
): Promise<AxisStep<RecoveryState>>;
```

#### `applyNetworkToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L150) `packages/payment/src/semantics/revenue-recovery.ts`

Network tokenization applied — customer card issued a network token that survives PAN re-issue.

```ts
export async function applyNetworkToken(
  adapter: PaymentAdapter,
  session: RecoverySession,
  input: { networkTokenId: string },
): Promise<AxisStep<RecoveryState>>;
```

#### `applyProration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L115) `packages/payment/src/semantics/subscription-state-machine.ts`

Apply proration for a mid-cycle plan change. `daysElapsed` is the number of days into the current billing cycle; `newPlanPriceCents` is the target plan's monthly price.

```ts
export async function applyProration(
  adapter: PaymentAdapter,
  session: SubscriptionMachineSession,
  input: {
    daysElapsed: number;
    daysInCycle: number;
    newPlanPriceCents: number;
  },
): Promise<AxisStep<SubscriptionMachineState>>;
```

#### `assertMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L74) `packages/payment/src/real-driver.ts`

Assert that a provider is in a specific mode. Used by dogfood apps that expect real driver mode in CI + fail loudly if the env is not configured.

```ts
export function assertMode(
  provider: PaymentProvider,
  expected: PaymentMode,
  env: Record<string, string | undefined> = process.env,
): void;
```

#### `calculateLocalizedTax`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L67) `packages/payment/src/semantics/tax-localization.ts`

Compute the tax line for a given jurisdiction + amount + B2B flag. Handles EU reverse charge (B2B intra-EU → tax borne by buyer) and emits the correct provider dialect for VAT vs GST vs sales-tax.

```ts
export async function calculateLocalizedTax(
  adapter: PaymentAdapter,
  input: TaxLocalizationInput,
): Promise<{ line: TaxLocalizationLine; step: AxisStep<TaxLocalizationState> }>;
```

#### `calculateTax`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L61) `packages/payment/src/semantics/tax.ts`

Pure tax calculation — no adapter side effect. Returns a fully populated {@link TaxLine} so callers can decide whether to emit `tax.calculated`, `tax.reverse_charged` or `tax.exempted`. Rules: - buyer B2B (has VAT id) + cross-border EU + digital / service → reverse charge - buyer country not in table → exempt (out of coverage) - otherwise → standard calc netCents * rateBps / 10000

```ts
export function calculateTax(input: TaxCalcInput): TaxLine;
```

#### `cancelSubscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L195) `packages/payment/src/semantics/subscription-lifecycle.ts`

Cancel the subscription. Emits `subscription.canceled`. Idempotent guard: cancelling an already-canceled subscription throws.

```ts
export async function cancelSubscription(
  adapter: PaymentAdapter,
  subscription: Subscription,
): Promise<AxisStep<SubscriptionState>>;
```

#### `changePlan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L76) `packages/payment/src/semantics/subscription-lifecycle.ts`

Change plan (upgrade or downgrade). The amount change relative to the current plan determines the neutral event: strictly greater = `upgraded`, strictly less = `downgraded`. Equal-amount change is rejected so tests exercise no-op guards explicitly.

```ts
export async function changePlan(
  adapter: PaymentAdapter,
  subscription: Subscription,
  input: { newPlanId: string; newAmountCents: number },
): Promise<AxisStep<SubscriptionState>>;
```

#### `chargeLateFee`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L151) `packages/payment/src/semantics/bnpl.ts`

Charge a late fee for a missed installment.

```ts
export async function chargeLateFee(
  adapter: PaymentAdapter,
  session: BnplSession,
  input: { installmentIndex: number },
): Promise<AxisStep<BnplState>>;
```

#### `checkoutCompleted`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L12) `packages/payment/src/fixture.ts`

Common fixture builders for the 3 provider mocks. Each fixture returns an already-signed webhook (rawBody + signature + parsed event) so tests can either pass the rawBody + signature into `verifyWebhook` or hand the event directly to `emit`. Only high-frequency event types are covered here — for provider-specific event types, call `signWebhook({ type: '...', ... })` directly.

```ts
export declare const checkoutCompleted: (adapter: PaymentAdapter, input: { amountCents: number; currency?: string; customerId: string; }) => { rawBody: string; signature: string; event: PaymentWebhookEvent; };
```

#### `closeAccount`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L162) `packages/payment/src/semantics/embedded-finance.ts`

Close the account — terminal state, no further ops accepted.

```ts
export function closeAccount(session: EmbeddedFinanceSession): EmbeddedFinanceSession;
```

#### `collectFidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fidelity.ts#L166) `packages/payment/src/semantics/fidelity.ts`

Collect the provider × axis coverage grid. `adapters` is the list of adapters to inspect — usually all 3 (`createStripeMock()`, `createPaddleMock()`, `createLemonSqueezyMock()`). The output is a flat row list `adapters.length * 25 = 75` for the default setup (9 v0.3 axis + 8 v0.4 axis + 8 v0.5 axis = 25 axis × 3 provider), plus `providers` + `axes` roll-up lists so callers can assert on the grid dimensions.

```ts
export function collectFidelityCoverage(adapters: PaymentAdapter[]): FidelityCoverage;
```

#### `completeSettlement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L151) `packages/payment/src/semantics/fx-cross-border.ts`

Complete settlement — funds arrived at the beneficiary bank.

```ts
export async function completeSettlement(
  adapter: PaymentAdapter,
  session: FxSession,
  input: { settlementRef: string },
): Promise<AxisStep<FxState>>;
```

#### `computeMrr`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L79) `packages/payment/src/semantics/recurring-revenue-advanced.ts`

Compute MRR / ARR from the current snapshot. MRR = mrrEnd, ARR = MRR × 12.

```ts
export async function computeMrr(
  adapter: PaymentAdapter,
  session: RecurringRevenueSession,
): Promise<AxisStep<RecurringRevenueState>>;
```

#### `computeNrr`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L140) `packages/payment/src/semantics/recurring-revenue-advanced.ts`

Compute NRR (Net Revenue Retention) — the industry-standard growth quality metric. NRR = (MRR_start - churn - contraction + expansion) / MRR_start × 100. NRR &gt; 100% means the cohort grew despite churn.

```ts
export async function computeNrr(
  adapter: PaymentAdapter,
  session: RecurringRevenueSession,
): Promise<AxisStep<RecurringRevenueState>>;
```

#### `confirmTx`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L105) `packages/payment/src/semantics/crypto-payment.ts`

Record an on-chain confirmation. Emits `crypto.tx_confirmed` once the required confirmation count is reached.

```ts
export async function confirmTx(
  adapter: PaymentAdapter,
  session: CryptoPaymentSession,
  input: { txHash: string; confirmations: number },
): Promise<AxisStep<CryptoPaymentState>>;
```

#### `createBnplPlan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L58) `packages/payment/src/semantics/bnpl.ts`

Create a BNPL plan. Splits `totalCents` into equal installments (rounded to integer cents; the last installment absorbs any rounding remainder).

```ts
export async function createBnplPlan(
  adapter: PaymentAdapter,
  input: {
    planId: string;
    customerId: string;
    totalCents: number;
    currency?: string;
    config: BnplConfig;
  },
): Promise<{ session: BnplSession; step: AxisStep<BnplState> }>;
```

#### `createCryptoInvoice`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L59) `packages/payment/src/semantics/crypto-payment.ts`

Create a crypto invoice for the given amount + chain + token.

```ts
export async function createCryptoInvoice(
  adapter: PaymentAdapter,
  input: {
    invoiceId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    chain: Chain;
    token: Stablecoin;
    config?: CryptoInvoiceConfig;
  },
): Promise<{ session: CryptoPaymentSession; step: AxisStep<CryptoPaymentState> }>;
```

#### `createLemonSqueezyMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/lemonsqueezy.ts#L10) `packages/payment/src/lemonsqueezy.ts`

Lemon Squeezy webhook mock. Real Lemon Squeezy: `X-Signature: hmac_sha256({body})` (no timestamp mixed in — LS signs the raw body only, verified against a webhook secret). The mock still adds a timestamp for freshness checks so tests can exercise stale rejection.

```ts
export function createLemonSqueezyMock(config?: {
  secret?: string;
  toleranceMs?: number;
  now?: () => number;
}): PaymentAdapter;
```

#### `createMandate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L29) `packages/payment/src/semantics/psd2.ts`

Create a new mandate. Emits `psd2.mandate_created` with the scheme embedded in metadata so downstream tests can filter per scheme.

```ts
export async function createMandate(
  adapter: PaymentAdapter,
  input: {
    scheme: PsdMandateScheme;
    customerId: string;
    amountCentsCap?: number;
    currency?: string;
  },
): Promise<{ mandate: PsdMandate; step: AxisStep<PsdMandateState> }>;
```

#### `createPaddleMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/paddle.ts#L10) `packages/payment/src/paddle.ts`

Paddle Billing (Paddle v2) webhook mock. Real Paddle: `Paddle-Signature: ts=...;h1=...` over `{ts}:{body}` with HMAC-SHA256, notification secret. Shape difference vs Stripe: Paddle uses `data.attributes.*` instead of `data.object.*`.

```ts
export function createPaddleMock(config?: {
  secret?: string;
  toleranceMs?: number;
  now?: () => number;
}): PaymentAdapter;
```

#### `createStripeMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/stripe.ts#L10) `packages/payment/src/stripe.ts`

Stripe webhook mock. Real Stripe: `Stripe-Signature: t={ts},v1={sig}` over `{ts}.{body}`, secret from `whsec_*`. This mock exercises the same HMAC-SHA256 signing so tests that verify with the real Stripe SDK can run against this fixture.

```ts
export function createStripeMock(config?: {
  secret?: string;
  toleranceMs?: number;
  now?: () => number;
}): PaymentAdapter;
```

#### `createSubscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L30) `packages/payment/src/semantics/subscription-lifecycle.ts`

Create a new subscription. Emits `subscription.created`.

```ts
export async function createSubscription(
  adapter: PaymentAdapter,
  input: {
    customerId: string;
    planId: string;
    amountCents: number;
    currency?: string;
  },
): Promise<{ subscription: Subscription; step: AxisStep<SubscriptionState> }>;
```

#### `creditNoteInvoice`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L206) `packages/payment/src/semantics/invoice.ts`

Issue a credit note against a paid invoice. Emits `invoice.credit_noted` with the credit amount (negative, capped at the invoice amount so tests fail loudly on overrefund attempts).

```ts
export async function creditNoteInvoice(
  adapter: PaymentAdapter,
  invoice: Invoice,
  input: { creditAmountCents: number },
): Promise<AxisStep<InvoiceState>>;
```

#### `deliver`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L70) `packages/payment/src/semantics/webhook-idempotency.ts`

Attempt to deliver an event to the handler. Returns true if the caller should invoke the handler; false if the event was deduped, replay-blocked, or already poisoned.

```ts
export async function deliver(
  adapter: PaymentAdapter,
  session: WebhookIdempotencySession,
  event: PaymentWebhookEvent,
): Promise<{ deliver: boolean; step: AxisStep<WebhookState> }>;
```

#### `denyByPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L109) `packages/payment/src/semantics/refund-advanced.ts`

Explicit deny — the merchant refuses the refund because it violates policy (e.g., digital goods post-download).

```ts
export async function denyByPolicy(
  adapter: PaymentAdapter,
  session: RefundSession,
): Promise<AxisStep<RefundState>>;
```

#### `draftInvoice`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L29) `packages/payment/src/semantics/invoice.ts`

Draft a new invoice. Emits `invoice.drafted`.

```ts
export async function draftInvoice(
  adapter: PaymentAdapter,
  input: {
    customerId: string;
    amountCents: number;
    currency?: string;
  },
): Promise<{ invoice: Invoice; step: AxisStep<InvoiceState> }>;
```

#### `dunningAttempt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L78) `packages/payment/src/semantics/dunning.ts`

Run the next dunning attempt. Emits `dunning.attempt` on every retry, transitions to `in-grace-period` after the last configured attempt, and finalises to `exhausted` when `finalizeDunning` is called with `succeed: false` (or `recovered` with `succeed: true`).

```ts
export async function dunningAttempt(
  adapter: PaymentAdapter,
  session: DunningSession,
): Promise<AxisStep<DunningState>>;
```

#### `emitTaxLine`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L105) `packages/payment/src/semantics/tax.ts`

Emit the tax outcome. Neutral event = `tax.calculated` (standard), `tax.reverse_charged` (B2B intra-EU) or `tax.exempted` (out of coverage).

```ts
export async function emitTaxLine(
  adapter: PaymentAdapter,
  input: { customerId: string; line: TaxLine; currency?: string },
): Promise<AxisStep<'calculated' | 'reverse-charged' | 'exempted'>>;
```

#### `enterGracePeriod`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L77) `packages/payment/src/semantics/subscription-state-machine.ts`

Enter grace period after payment failure. Grace period is a bounded window where the subscription is still active from the customer's POV but the merchant has stopped granting renewed entitlement.

```ts
export async function enterGracePeriod(
  adapter: PaymentAdapter,
  session: SubscriptionMachineSession,
): Promise<AxisStep<SubscriptionMachineState>>;
```

#### `escalateArbitration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L105) `packages/payment/src/semantics/dispute.ts`

Escalate to arbitration — final round in the card-network dispute process, decided by the network with a non-refundable filing fee.

```ts
export async function escalateArbitration(
  adapter: PaymentAdapter,
  session: DisputeSession,
): Promise<AxisStep<DisputeState>>;
```

#### `exitGracePeriod`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L95) `packages/payment/src/semantics/subscription-state-machine.ts`

Exit grace period — either payment recovered (returns to active) or timeout reached (returns to expired).

```ts
export async function exitGracePeriod(
  adapter: PaymentAdapter,
  session: SubscriptionMachineSession,
  input: { recovered: boolean },
): Promise<AxisStep<SubscriptionMachineState>>;
```

#### `expireRate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L178) `packages/payment/src/semantics/fx-cross-border.ts`

Explicitly expire the current rate lock — used when the caller detects the lock window has passed.

```ts
export async function expireRate(
  adapter: PaymentAdapter,
  session: FxSession,
): Promise<AxisStep<FxState>>;
```

#### `fileSar`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L164) `packages/payment/src/semantics/regulatory-reporting.ts`

File a SAR (Suspicious Activity Report) with FinCEN / NCA. Terminal-ish — a filed SAR is not deletable, so the session enters `sar-filed` state and can only be moved to `audit-locked` afterwards.

```ts
export async function fileSar(
  adapter: PaymentAdapter,
  session: RegulatoryReportingSession,
  input: {
    reportId: string;
    regulator: 'FinCEN' | 'NCA';
    reason: string;
    fingerprint: string;
  },
): Promise<AxisStep<RegulatoryReportingState>>;
```

#### `finalizeDispute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L143) `packages/payment/src/semantics/dispute.ts`

Terminal — dispute resolved with an outcome. `won` returns funds to the merchant; `lost` finalises the chargeback.

```ts
export function finalizeDispute(
  session: DisputeSession,
  input: { won: boolean },
): DisputeSession;
```

#### `finalizeDunning`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L117) `packages/payment/src/semantics/dunning.ts`

Terminal step — either the last attempt succeeded during grace period (`succeed: true` → `dunning.recovered`), or the grace period elapsed (`succeed: false` → `dunning.exhausted`).

```ts
export async function finalizeDunning(
  adapter: PaymentAdapter,
  session: DunningSession,
  input: { succeed: boolean },
): Promise<AxisStep<DunningState>>;
```

#### `finalizeRecovery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L167) `packages/payment/src/semantics/revenue-recovery.ts`

Mark the recovery terminal — succeeded (recovered) or exhausted (lost).

```ts
export function finalizeRecovery(
  session: RecoverySession,
  input: { succeed: boolean },
): RecoverySession;
```

#### `flagVelocity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L138) `packages/payment/src/semantics/fraud-detection-advanced.ts`

Flag velocity — records that this customer exceeded the allowed transactions-per-hour threshold.

```ts
export async function flagVelocity(
  adapter: PaymentAdapter,
  session: FraudDetectionSession,
  input: { attemptsInWindow: number; windowMs: number },
): Promise<AxisStep<FraudDetectionState>>;
```

#### `fullRefund`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L91) `packages/payment/src/semantics/refund-advanced.ts`

Issue a full refund. Marks the session as fully refunded.

```ts
export async function fullRefund(
  adapter: PaymentAdapter,
  session: RefundSession,
): Promise<AxisStep<RefundState>>;
```

#### `grantConsent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L112) `packages/payment/src/semantics/psd2.ts`

Grant open banking consent. Emits `psd2.consent_granted` with the scope list embedded — real OBIE consents scope to `accounts` / `payments`, this mock echoes whatever caller passes so tests can assert on custom scopes.

```ts
export async function grantConsent(
  adapter: PaymentAdapter,
  input: {
    customerId: string;
    scopes: string[];
    validForMs?: number;
  },
): Promise<AxisStep<'granted'>>;
```

#### `handleEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L74) `packages/payment/src/semantics/lifecycle-orchestrator.ts`

event driven state 遷移 SSOT。 5 state × 8 event = 40 セル の 遷移 表を 1 switch で 実装。 無効遷移 は 現 state を保持 + events log に "invalid" 記録 (throw ではなく soft-reject、 v0.7 continuous-auth の guard-throw と 区別 = payment 経路 は event 過剰受信 が normal で、 throw だと dogfood consumer が 例外処理 に多くの コード を割く 必要が出るため soft-reject)。

```ts
export function handleEvent(input: {
  session: LifecycleSession;
  event: LifecycleEvent;
  timestamp: string;
}): LifecycleSession;
```

#### `initiateSettlement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L127) `packages/payment/src/semantics/fx-cross-border.ts`

Initiate settlement via the configured rail (SWIFT / SEPA / ACH etc.). Rate must not have expired.

```ts
export async function initiateSettlement(
  adapter: PaymentAdapter,
  session: FxSession,
  input: { beneficiaryIban?: string; beneficiaryBic?: string },
): Promise<AxisStep<FxState>>;
```

#### `issueCard`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L138) `packages/payment/src/semantics/embedded-finance.ts`

Issue a virtual or physical card against the account. Requires KYC verified (and KYB verified when required).

```ts
export async function issueCard(
  adapter: PaymentAdapter,
  session: EmbeddedFinanceSession,
  input: { cardId: string; type: 'virtual' | 'physical'; last4: string },
): Promise<AxisStep<EmbeddedFinanceState>>;
```

#### `linkWallet`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L157) `packages/payment/src/semantics/crypto-payment.ts`

Link a wallet address to the customer id for repeat billing.

```ts
export async function linkWallet(
  adapter: PaymentAdapter,
  session: CryptoPaymentSession,
  input: { walletAddress: string; signature: string },
): Promise<AxisStep<CryptoPaymentState>>;
```

#### `lockForAudit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L201) `packages/payment/src/semantics/regulatory-reporting.ts`

Lock the session for audit — no further reports accepted.

```ts
export function lockForAudit(session: RegulatoryReportingSession): RegulatoryReportingSession;
```

#### `lockRate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L83) `packages/payment/src/semantics/fx-cross-border.ts`

Lock an FX rate for the given currency pair + amount. The rate stays valid for `rateLockDurationMs`, after which callers must call `expireRate` and re-lock.

```ts
export async function lockRate(
  adapter: PaymentAdapter,
  session: FxSession,
  input: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    quoteId: string;
    amountFromCents: number;
  },
): Promise<AxisStep<FxState>>;
```

#### `markInstallmentPaid`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L175) `packages/payment/src/semantics/bnpl.ts`

Mark an installment as paid. Once all installments are paid the session enters `settled`.

```ts
export function markInstallmentPaid(session: BnplSession): BnplSession;
```

#### `markUncollectible`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L171) `packages/payment/src/semantics/invoice.ts`

Mark an invoice uncollectible (dunning exhausted). Emits `invoice.uncollectible`. Only allowed from `open`.

```ts
export async function markUncollectible(
  adapter: PaymentAdapter,
  invoice: Invoice,
): Promise<AxisStep<InvoiceState>>;
```

#### `markWindowExpired`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L120) `packages/payment/src/semantics/refund-advanced.ts`

Emit the window-expired terminal — refund attempted outside the window.

```ts
export async function markWindowExpired(
  adapter: PaymentAdapter,
  session: RefundSession,
): Promise<AxisStep<RefundState>>;
```

#### `migrateToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L107) `packages/payment/src/semantics/payment-method-vault.ts`

Migrate a token from one provider to another. The source token must exist; the target adapter receives a new token id under its provider namespace with the same fingerprint / network-token linkage.

```ts
export async function migrateToken(
  fromAdapter: PaymentAdapter,
  toAdapter: PaymentAdapter,
  session: VaultSession,
  input: { tokenId: string; newTokenId: string },
): Promise<AxisStep<VaultState>>;
```

#### `openAccount`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L54) `packages/payment/src/semantics/embedded-finance.ts`

Open a fresh BaaS account for the customer.

```ts
export async function openAccount(
  adapter: PaymentAdapter,
  input: {
    accountId: string;
    customerId: string;
    currency?: string;
    config?: EmbeddedFinanceConfig;
  },
): Promise<{ session: EmbeddedFinanceSession; step: AxisStep<EmbeddedFinanceState> }>;
```

#### `openChargeback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L42) `packages/payment/src/semantics/chargeback.ts`

Open a chargeback. Emits `chargeback.opened`.

```ts
export async function openChargeback(
  adapter: PaymentAdapter,
  input: {
    transactionId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    reason: ChargebackReason;
  },
): Promise<{ chargeback: Chargeback; step: AxisStep<ChargebackState> }>;
```

#### `openDispute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L38) `packages/payment/src/semantics/dispute.ts`

Open a dispute against an existing charge.

```ts
export function openDispute(input: {
  disputeId: string;
  chargeId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  reason: string;
}): DisputeSession;
```

#### `openInvoice`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L69) `packages/payment/src/semantics/invoice.ts`

Open (finalise) a draft. Emits `invoice.opened`. Only allowed from `draft`.

```ts
export async function openInvoice(
  adapter: PaymentAdapter,
  invoice: Invoice,
): Promise<AxisStep<InvoiceState>>;
```

#### `partialRefund`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L73) `packages/payment/src/semantics/refund-advanced.ts`

Issue a partial refund. Fails if the window has expired, if the amount violates policy, or if a prior full refund has already exhausted the charge.

```ts
export async function partialRefund(
  adapter: PaymentAdapter,
  session: RefundSession,
  input: { amountCents: number },
): Promise<AxisStep<RefundState>>;
```

#### `pauseSubscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L127) `packages/payment/src/semantics/subscription-lifecycle.ts`

Pause the subscription. Emits `subscription.paused`. Only allowed from active / upgraded / downgraded states.

```ts
export async function pauseSubscription(
  adapter: PaymentAdapter,
  subscription: Subscription,
): Promise<AxisStep<SubscriptionState>>;
```

#### `payInvoice`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L102) `packages/payment/src/semantics/invoice.ts`

Mark invoice paid. Emits `invoice.paid`. Only allowed from `open`.

```ts
export async function payInvoice(
  adapter: PaymentAdapter,
  invoice: Invoice,
): Promise<AxisStep<InvoiceState>>;
```

#### `PAYMENT_PROVIDERS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L16) `packages/payment/src/types.ts`

Runtime tuple of every payment provider, kept in sync with the `PaymentProvider` union above via `satisfies`. Downstream consumers use this to iterate provider ids at runtime (release-gate axis dispatch, fixture registration) without duplicating the string literals or reaching for reflection.

```ts
export declare const PAYMENT_PROVIDERS: readonly ["stripe", "paddle", "lemonsqueezy"];
```

#### `PaymentEngine`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/engine.ts#L29) `packages/payment/src/engine.ts`

```ts
export declare class PaymentEngine implements PaymentAdapter {
  readonly provider: PaymentProvider;
  private readonly config: EngineConfig;
  private readonly handlers = new Set<(event: PaymentWebhookEvent) => void | Promise<void>>();
  private idCounter = 0;
  constructor(config: EngineConfig);
  signWebhook(input: {
    type: string;
    amountCents: number;
    currency?: string;
    customerId: string;
    timestamp?: number;
  }): { rawBody: string; signature: string; event: PaymentWebhookEvent };
  verifyWebhook(input: {
    rawBody: string;
    signature: string;
    toleranceMs?: number;
  }): WebhookVerifyResult;
  onWebhook(handler: (event: PaymentWebhookEvent) => void | Promise<void>): () => void;
  async emit(event: PaymentWebhookEvent): Promise<void>;
  private computeSignature(rawBody: string, timestamp: number): string;
}
```

#### `paymentFailed`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L34) `packages/payment/src/fixture.ts`

```ts
export declare const paymentFailed: (adapter: PaymentAdapter, input: { amountCents: number; currency?: string; customerId: string; }) => { rawBody: string; signature: string; event: PaymentWebhookEvent; };
```

#### `preventChargeback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L133) `packages/payment/src/semantics/refund-advanced.ts`

Chargeback prevention utility — issues a full refund whenever the merchant preemptively wants to head off a chargeback. Only fires if the policy has `chargebackPrevention: true`.

```ts
export async function preventChargeback(
  adapter: PaymentAdapter,
  session: RefundSession,
): Promise<AxisStep<RefundState>>;
```

#### `probeCircuit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L142) `packages/payment/src/semantics/orchestration.ts`

Probe the circuit breaker — closes the breaker if the outage window has elapsed, otherwise stays open. Emits `orchestration.circuit_closed` when the breaker closes.

```ts
export async function probeCircuit(
  adapters: PaymentAdapter[],
  session: OrchestrationSession,
): Promise<AxisStep<OrchestrationState>>;
```

#### `providerEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/types.ts#L494) `packages/payment/src/semantics/types.ts`

Translate a neutral event name to the provider dialect. Falls back to the neutral name if the provider has no specific dialect entry — this makes the map partial-safe without silent typos.

```ts
export function providerEventName(
  provider: PaymentProvider,
  neutral: NeutralEventName,
): string;
```

#### `reactivateSubscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L229) `packages/payment/src/semantics/subscription-lifecycle.ts`

Reactivate a canceled subscription. Emits `subscription.reactivated`. Only allowed from `canceled` — the subscription returns to `active`.

```ts
export async function reactivateSubscription(
  adapter: PaymentAdapter,
  subscription: Subscription,
): Promise<AxisStep<SubscriptionState>>;
```

#### `recordChurn`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L95) `packages/payment/src/semantics/recurring-revenue-advanced.ts`

Record churned MRR — a subscription cancellation or downgrade to 0.

```ts
export async function recordChurn(
  adapter: PaymentAdapter,
  session: RecurringRevenueSession,
  input: { churnCents: number; subscriptionId: string },
): Promise<AxisStep<RecurringRevenueState>>;
```

#### `recordContraction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L165) `packages/payment/src/semantics/recurring-revenue-advanced.ts`

Record contraction (downgrade without churn) — separate from churn so NRR captures the difference.

```ts
export function recordContraction(
  session: RecurringRevenueSession,
  input: { contractionCents: number },
): RecurringRevenueSession;
```

#### `recordExpansion`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L116) `packages/payment/src/semantics/recurring-revenue-advanced.ts`

Record expansion MRR — an upgrade or seat add that grew the account.

```ts
export async function recordExpansion(
  adapter: PaymentAdapter,
  session: RecurringRevenueSession,
  input: { expansionCents: number; subscriptionId: string; kind: 'upgrade' | 'seat-add' | 'usage' },
): Promise<AxisStep<RecurringRevenueState>>;
```

#### `refunded`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L45) `packages/payment/src/fixture.ts`

```ts
export declare const refunded: (adapter: PaymentAdapter, input: { amountCents: number; currency?: string; customerId: string; }) => { rawBody: string; signature: string; event: PaymentWebhookEvent; };
```

#### `reportDac7`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L119) `packages/payment/src/semantics/tax-localization.ts`

Emit a DAC7 marketplace report entry. Real digital platforms must submit annual DAC7 reports to the EU tax authorities listing seller revenue by jurisdiction.

```ts
export async function reportDac7(
  adapter: PaymentAdapter,
  input: {
    sellerId: string;
    reportingYear: number;
    lines: TaxLocalizationLine[];
    customerId: string;
    currency?: string;
  },
): Promise<AxisStep<TaxLocalizationState>>;
```

#### `reportDora`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L126) `packages/payment/src/semantics/regulatory-reporting.ts`

Submit a DORA (Digital Operational Resilience Act) report — ICT risk management self-assessment + third-party register.

```ts
export async function reportDora(
  adapter: PaymentAdapter,
  session: RegulatoryReportingSession,
  input: {
    reportId: string;
    period: ReportPeriod;
    ictRiskScore: number;
    thirdPartyCount: number;
    incidentCount: number;
    fingerprint: string;
  },
): Promise<AxisStep<RegulatoryReportingState>>;
```

#### `reportFailure`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L125) `packages/payment/src/semantics/webhook-idempotency.ts`

Report handler failure — bumps the failure counter and eventually transitions to poison state.

```ts
export function reportFailure(
  session: WebhookIdempotencySession,
  event: PaymentWebhookEvent,
): number;
```

#### `reportPci`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L65) `packages/payment/src/semantics/regulatory-reporting.ts`

Submit a PCI DSS compliance report — attestation of Section 3.2 (do not store sensitive authentication data after authorisation).

```ts
export async function reportPci(
  adapter: PaymentAdapter,
  session: RegulatoryReportingSession,
  input: { reportId: string; period: ReportPeriod; fingerprint: string; saqLevel: 'A' | 'A-EP' | 'D' },
): Promise<AxisStep<RegulatoryReportingState>>;
```

#### `reportPsd2`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L91) `packages/payment/src/semantics/regulatory-reporting.ts`

Submit a PSD2 SCA (Strong Customer Authentication) compliance report to the EBA. Includes exemption count + challenge rate.

```ts
export async function reportPsd2(
  adapter: PaymentAdapter,
  session: RegulatoryReportingSession,
  input: {
    reportId: string;
    period: ReportPeriod;
    challengeRate: number;
    exemptionCount: number;
    fingerprint: string;
  },
): Promise<AxisStep<RegulatoryReportingState>>;
```

#### `representDispute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L85) `packages/payment/src/semantics/dispute.ts`

Represent the dispute — merchant challenges the chargeback with the submitted evidence. Advances the case to second presentment.

```ts
export async function representDispute(
  adapter: PaymentAdapter,
  session: DisputeSession,
): Promise<AxisStep<DisputeState>>;
```

#### `resolveAllModes`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L62) `packages/payment/src/real-driver.ts`

Convenience — resolve modes for all 3 providers in one pass. Used by release-gate + fidelity harness to report which combinations are live.

```ts
export function resolveAllModes(
  env: Record<string, string | undefined> = process.env,
): ResolvedMode[];
```

#### `resolveChargeback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L133) `packages/payment/src/semantics/chargeback.ts`

Resolve the dispute. `merchantWon: true` → `chargeback.won` (funds returned), `false` → `chargeback.lost` (funds forfeit + fee). Only allowed from `evidence-submitted`.

```ts
export async function resolveChargeback(
  adapter: PaymentAdapter,
  chargeback: Chargeback,
  input: { merchantWon: boolean },
): Promise<AxisStep<ChargebackState>>;
```

#### `resolveMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L39) `packages/payment/src/real-driver.ts`

Resolve the effective mode for a provider given a live env snapshot. `env` defaults to `process.env` so callers can inject a synthetic env for unit tests.

```ts
export function resolveMode(
  provider: PaymentProvider,
  env: Record<string, string | undefined> = process.env,
): ResolvedMode;
```

#### `resumeSubscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L161) `packages/payment/src/semantics/subscription-lifecycle.ts`

Resume a paused subscription. Emits `subscription.resumed`. Only allowed from `paused`.

```ts
export async function resumeSubscription(
  adapter: PaymentAdapter,
  subscription: Subscription,
): Promise<AxisStep<SubscriptionState>>;
```

#### `retryBackoffMs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L38) `packages/payment/src/semantics/retry.ts`

Compute the deterministic delay for attempt N (1-indexed). Attempt 1 has no backoff (fires immediately), attempt N &gt; 1 waits baseBackoffMs * 2^(N-2).

```ts
export function retryBackoffMs(attempt: number, baseBackoffMs: number): number;
```

#### `retryDeliver`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L72) `packages/payment/src/semantics/retry.ts`

Attempt to deliver the event. If `succeed: true` the event is emitted through the adapter and the session terminates in `delivered`. If `succeed: false` and attempts remain, emits `retry.scheduled` and returns with the next delay. Once maxAttempts is reached without success, the session terminates in `abandoned`.

```ts
export async function retryDeliver(
  adapter: PaymentAdapter,
  session: RetrySession,
  input: { succeed: boolean },
): Promise<AxisStep<RetryState>>;
```

#### `revokeMandate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L76) `packages/payment/src/semantics/psd2.ts`

Revoke an active mandate. Emits `psd2.mandate_revoked`. Idempotent — a second call on an already-revoked mandate throws so tests exercise the guard explicitly.

```ts
export async function revokeMandate(
  adapter: PaymentAdapter,
  mandate: PsdMandate,
): Promise<AxisStep<PsdMandateState>>;
```

#### `revokeToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L85) `packages/payment/src/semantics/payment-method-vault.ts`

Revoke an existing token — customer removed the card or the fraud team blacklisted the fingerprint.

```ts
export async function revokeToken(
  adapter: PaymentAdapter,
  session: VaultSession,
  input: { tokenId: string },
): Promise<AxisStep<VaultState>>;
```

#### `rotateSignature`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L139) `packages/payment/src/semantics/webhook-idempotency.ts`

Rotate the signing secret. Emits `webhook.signature_rotated` so downstream consumers know to refresh their cached secret.

```ts
export async function rotateSignature(
  adapter: PaymentAdapter,
  session: WebhookIdempotencySession,
): Promise<AxisStep<WebhookState>>;
```

#### `routeCharge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L87) `packages/payment/src/semantics/orchestration.ts`

Route a single charge attempt through the current provider adapter. `succeed=true` emits `orchestration.routed` and leaves the router on the same provider. `succeed=false` increments the failure counter and either triggers a failover, opens the breaker, or terminates.

```ts
export async function routeCharge(
  adapters: PaymentAdapter[],
  session: OrchestrationSession,
  input: { succeed: boolean; customerId: string },
): Promise<AxisStep<OrchestrationState>>;
```

#### `scaAuthenticate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L114) `packages/payment/src/semantics/sca.ts`

Complete SCA. Emits `sca.authenticated` and issues a synthetic strong auth token that downstream calls can attach for the 90-day validity window PSD2 mandates.

```ts
export async function scaAuthenticate(
  adapter: PaymentAdapter,
  session: ScaSession,
): Promise<AxisStep<ScaState>>;
```

#### `scaEvaluate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L55) `packages/payment/src/semantics/sca.ts`

Evaluate SCA. If `exemption` is supplied the session terminates in `exempt`, otherwise it moves to `required`.

```ts
export async function scaEvaluate(
  adapter: PaymentAdapter,
  session: ScaSession,
  input: { exemption?: ScaExemption },
): Promise<AxisStep<ScaState>>;
```

#### `scheduleInstallment`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L106) `packages/payment/src/semantics/bnpl.ts`

Schedule the next installment — advances the schedule pointer and emits the neutral event. Throws once all installments are scheduled.

```ts
export async function scheduleInstallment(
  adapter: PaymentAdapter,
  session: BnplSession,
): Promise<AxisStep<BnplState>>;
```

#### `scheduleSmartRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L83) `packages/payment/src/semantics/revenue-recovery.ts`

Schedule the next smart retry. Emits `recovery.smart_retry_scheduled` with the computed backoff and priority hint. Real Stripe uses ML to predict optimal retry times; the mock uses linear cascade timing.

```ts
export async function scheduleSmartRetry(
  adapter: PaymentAdapter,
  session: RecoverySession,
): Promise<AxisStep<RecoveryState>>;
```

#### `scoreDevice`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L89) `packages/payment/src/semantics/fraud-detection-advanced.ts`

Score device fingerprint — combines browser fingerprint, IP entropy, OS signature, canvas fingerprint into a 0-100 score.

```ts
export async function scoreDevice(
  adapter: PaymentAdapter,
  session: FraudDetectionSession,
  input: {
    score: number;
    fingerprint: string;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<AxisStep<FraudDetectionState>>;
```

#### `scoreMl`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L112) `packages/payment/src/semantics/payment-orchestration-ii.ts`

Run ML scoring on the current route. Score below `minMlScore` triggers fallback on the next `smartRoute` call.

```ts
export async function scoreMl(
  adapters: PaymentAdapter[],
  session: OrchestrationIISession,
  input: { score: number; features: Record<string, string | number> },
): Promise<AxisStep<OrchestrationIIState>>;
```

#### `scoreMlBlock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L162) `packages/payment/src/semantics/fraud-detection-advanced.ts`

Run the ML fusion model — combines device / biometric / velocity signals plus features into a 0-1 score. Above `mlBlockThreshold` blocks the tx.

```ts
export async function scoreMlBlock(
  adapter: PaymentAdapter,
  session: FraudDetectionSession,
  input: { score: number; modelVersion: string; features: Record<string, number> },
): Promise<AxisStep<FraudDetectionState>>;
```

#### `scoreRisk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L127) `packages/payment/src/semantics/bnpl.ts`

Run risk scoring on the customer. Score below `config.minRiskScore` marks the plan as defaulted and blocks further activity.

```ts
export async function scoreRisk(
  adapter: PaymentAdapter,
  session: BnplSession,
  input: { score: number; creditBureau?: string },
): Promise<AxisStep<BnplState>>;
```

#### `shiftLiability`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L124) `packages/payment/src/semantics/dispute.ts`

Liability shift — apply the 3DS liability shift for a passed challenge. Moves fraud loss from merchant to issuer; typically emitted right after dispute open when the original auth had a successful 3DS.

```ts
export async function shiftLiability(
  adapter: PaymentAdapter,
  session: DisputeSession,
  input: { threeDsAuthCode: string },
): Promise<AxisStep<DisputeState>>;
```

#### `smartRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L85) `packages/payment/src/semantics/payment-orchestration-ii.ts`

Route the charge through the current provider — the primary route in the cascade ladder.

```ts
export async function smartRoute(
  adapters: PaymentAdapter[],
  session: OrchestrationIISession,
): Promise<AxisStep<OrchestrationIIState>>;
```

#### `stackCoupon`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L148) `packages/payment/src/semantics/subscription-state-machine.ts`

Add a coupon to the stack. Non-stackable coupons replace any existing coupon; stackable coupons combine.

```ts
export async function stackCoupon(
  adapter: PaymentAdapter,
  session: SubscriptionMachineSession,
  input: CouponEntry,
): Promise<AxisStep<SubscriptionMachineState>>;
```

#### `startDunning`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L51) `packages/payment/src/semantics/dunning.ts`

Start a dunning session. No webhook is emitted at start — the initial failed charge is assumed to have been emitted via `signWebhook` / `checkoutCompleted` etc. Call {@link dunningAttempt} to drive the retry sequence.

```ts
export function startDunning(input: {
  invoiceId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  config?: DunningConfig;
}): DunningSession;
```

#### `startFraudDetection`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L57) `packages/payment/src/semantics/fraud-detection-advanced.ts`

Start a fresh fraud detection session for a transaction.

```ts
export function startFraudDetection(input: {
  transactionId: string;
  customerId: string;
  amountCents: number;
  currency?: string;
  config?: FraudDetectionConfig;
}): FraudDetectionSession;
```

#### `startFxTransfer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L58) `packages/payment/src/semantics/fx-cross-border.ts`

Start a fresh FX session.

```ts
export function startFxTransfer(input: {
  transferId: string;
  customerId: string;
  config?: FxConfig;
}): FxSession;
```

#### `startIdempotency`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L50) `packages/payment/src/semantics/webhook-idempotency.ts`

Start an idempotency session tied to a specific handler. Handler names scope the dedup table so different handlers can process the same event without interference.

```ts
export function startIdempotency(input: {
  handlerName: string;
  config?: WebhookIdempotencyConfig;
}): WebhookIdempotencySession;
```

#### `startLifecycle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L55) `packages/payment/src/semantics/lifecycle-orchestrator.ts`

lifecycle orchestrator の 開始。 default で active-billing 状態、 subscription 契約成立直後 に 呼出。

```ts
export function startLifecycle(input: { timestamp: string }): LifecycleSession;
```

#### `startOrchestration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L53) `packages/payment/src/semantics/orchestration.ts`

Start an orchestration session. `adapters` supplies one adapter per provider in the same order as `config.providers`.

```ts
export function startOrchestration(input: {
  intentId: string;
  amountCents: number;
  currency?: string;
  config: OrchestrationConfig;
}): OrchestrationSession;
```

#### `startOrchestrationII`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L52) `packages/payment/src/semantics/payment-orchestration-ii.ts`

Start an orchestration II session.

```ts
export function startOrchestrationII(input: {
  intentId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  config: OrchestrationIIConfig;
}): OrchestrationIISession;
```

#### `startRecovery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L54) `packages/payment/src/semantics/revenue-recovery.ts`

Start a recovery session. The initial failed charge is assumed to have been emitted through the base adapter already.

```ts
export function startRecovery(input: {
  invoiceId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  config?: RecoveryConfig;
}): RecoverySession;
```

#### `startRecurringRevenue`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L44) `packages/payment/src/semantics/recurring-revenue-advanced.ts`

Start a recurring revenue analytics session for a cohort.

```ts
export function startRecurringRevenue(input: {
  cohortId: string;
  customerId: string;
  currency?: string;
  mrrStartCents: number;
}): RecurringRevenueSession;
```

#### `startRefund`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L46) `packages/payment/src/semantics/refund-advanced.ts`

Start a refund session against an existing charge. `chargedAt` is the original charge timestamp; the window policy is evaluated relative to this timestamp.

```ts
export function startRefund(input: {
  chargeId: string;
  originalAmountCents: number;
  chargedAt: number;
  customerId: string;
  currency?: string;
  policy: RefundPolicy;
}): RefundSession;
```

#### `startRegulatoryReporting`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L44) `packages/payment/src/semantics/regulatory-reporting.ts`

Start a regulatory reporting session for an entity (merchant / issuer).

```ts
export function startRegulatoryReporting(input: {
  entityId: string;
  customerId: string;
  currency?: string;
}): RegulatoryReportingSession;
```

#### `startRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L50) `packages/payment/src/semantics/retry.ts`

Start a retry session for a given webhook event. The event is not emitted yet — call {@link retryDeliver} with `succeed: true` to emit and mark delivered, or `succeed: false` to schedule the next backoff. The idempotencyKey defaults to `event.id` so downstream consumers can dedupe repeated deliveries of the same event.

```ts
export function startRetry(input: {
  event: PaymentWebhookEvent;
  idempotencyKey?: string;
  config?: RetryConfig;
}): RetrySession;
```

#### `startSca`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L34) `packages/payment/src/semantics/sca.ts`

Start an SCA evaluation session. Call {@link scaEvaluate} to decide.

```ts
export function startSca(input: {
  paymentIntentId: string;
  amountCents: number;
  currency?: string;
  customerId: string;
}): ScaSession;
```

#### `startSubscriptionMachine`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L49) `packages/payment/src/semantics/subscription-state-machine.ts`

Start a subscription state-machine session against an existing subscription. This wraps the v0.3 subscription-lifecycle axis with the fine-grained payment-side state (grace period + coupon stacking) that downstream tests need to assert on.

```ts
export function startSubscriptionMachine(input: {
  subscriptionId: string;
  customerId: string;
  planPriceCents: number;
  currency?: string;
  gracePeriodMs?: number;
}): SubscriptionMachineSession;
```

#### `startThreeDs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L34) `packages/payment/src/semantics/three-ds.ts`

Start a 3DS session. No webhook is emitted at start — this is the local fingerprint capture step; call {@link threeDsRequestChallenge} to transition to the challenge, or {@link threeDsFrictionless} to skip.

```ts
export function startThreeDs(input: {
  paymentIntentId: string;
  amountCents: number;
  currency?: string;
  customerId: string;
}): ThreeDsSession;
```

#### `startVault`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L41) `packages/payment/src/semantics/payment-method-vault.ts`

Start a fresh vault session for a customer.

```ts
export function startVault(input: {
  customerId: string;
  currency?: string;
}): VaultSession;
```

#### `submitDisputeEvidence`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L66) `packages/payment/src/semantics/dispute.ts`

Submit evidence for the dispute — receipt, shipping confirmation, customer communication, etc.

```ts
export async function submitDisputeEvidence(
  adapter: PaymentAdapter,
  session: DisputeSession,
  input: { evidenceIds: string[] },
): Promise<AxisStep<DisputeState>>;
```

#### `submitEvidence`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L90) `packages/payment/src/semantics/chargeback.ts`

Submit evidence to represent the dispute. Emits `chargeback.evidence_submitted`. Only allowed from `opened`.

```ts
export async function submitEvidence(
  adapter: PaymentAdapter,
  chargeback: Chargeback,
  input: {
    receiptUrl?: string;
    shippingProof?: string;
    customerCommunication?: string;
  },
): Promise<AxisStep<ChargebackState>>;
```

#### `subscriptionCreated`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L23) `packages/payment/src/fixture.ts`

```ts
export declare const subscriptionCreated: (adapter: PaymentAdapter, input: { amountCents: number; currency?: string; customerId: string; }) => { rawBody: string; signature: string; event: PaymentWebhookEvent; };
```

#### `summarizeLifecycle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L179) `packages/payment/src/semantics/lifecycle-orchestrator.ts`

```ts
export function summarizeLifecycle(session: LifecycleSession): LifecycleSummary;
```

#### `threeDsFrictionless`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L131) `packages/payment/src/semantics/three-ds.ts`

Frictionless path — issuer accepted the transaction without a challenge. Emits `3ds.frictionless` and terminates. Only valid from `fingerprint`.

```ts
export async function threeDsFrictionless(
  adapter: PaymentAdapter,
  session: ThreeDsSession,
): Promise<AxisStep<ThreeDsState>>;
```

#### `threeDsRequestChallenge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L55) `packages/payment/src/semantics/three-ds.ts`

Request a 3DS challenge. Emits `3ds.challenge_required`. Session moves to `challenge-pending` — call {@link threeDsSubmitChallenge} to complete.

```ts
export async function threeDsRequestChallenge(
  adapter: PaymentAdapter,
  session: ThreeDsSession,
): Promise<AxisStep<ThreeDsState>>;
```

#### `threeDsSubmitChallenge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L93) `packages/payment/src/semantics/three-ds.ts`

Submit the challenge result. `transStatus` follows EMVCo values: `Y` = authenticated, `N` = not authenticated, `A` = attempt performed, `U` = unavailable, `C` = challenge required (should be pre-transitioned), `R` = rejected. `Y` / `A` → session `completed`; `N` / `R` / `U` throw so tests exercise both accept and reject explicitly.

```ts
export async function threeDsSubmitChallenge(
  adapter: PaymentAdapter,
  session: ThreeDsSession,
  input: { transStatus: ThreeDsTransStatus },
): Promise<AxisStep<ThreeDsState>>;
```

#### `tokenizeCard`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L60) `packages/payment/src/semantics/payment-method-vault.ts`

Tokenize a card into the vault. Emits `vault.token_created` and moves the session to `tokenized`.

```ts
export async function tokenizeCard(
  adapter: PaymentAdapter,
  session: VaultSession,
  input: Omit<VaultToken, 'provider'>,
): Promise<AxisStep<VaultState>>;
```

#### `triggerFallback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L141) `packages/payment/src/semantics/payment-orchestration-ii.ts`

Trigger a fallback to the next provider in the ladder. Increments the current index; exhausts the cascade when no more providers remain.

```ts
export async function triggerFallback(
  adapters: PaymentAdapter[],
  session: OrchestrationIISession,
): Promise<AxisStep<OrchestrationIIState>>;
```

#### `verifyBiometric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L117) `packages/payment/src/semantics/fraud-detection-advanced.ts`

Verify behavioral biometrics — typing rhythm + mouse motion + swipe pattern. Returns whether the observed pattern matches the historical profile.

```ts
export async function verifyBiometric(
  adapter: PaymentAdapter,
  session: FraudDetectionSession,
  input: { passed: boolean; confidence: number; signals: string[] },
): Promise<AxisStep<FraudDetectionState>>;
```

#### `verifyKyb`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L118) `packages/payment/src/semantics/embedded-finance.ts`

Run KYB (Know Your Business) verification — only meaningful when `config.requireKyb=true`.

```ts
export async function verifyKyb(
  adapter: PaymentAdapter,
  session: EmbeddedFinanceSession,
  input: { businessRegistryId: string; verified: boolean },
): Promise<AxisStep<EmbeddedFinanceState>>;
```

#### `verifyKyc`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L89) `packages/payment/src/semantics/embedded-finance.ts`

Run KYC verification on the account holder. Score is 0-100.

```ts
export async function verifyKyc(
  adapter: PaymentAdapter,
  session: EmbeddedFinanceSession,
  input: { score: number },
): Promise<AxisStep<EmbeddedFinanceState>>;
```

#### `verifyPciScope`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L160) `packages/payment/src/semantics/payment-method-vault.ts`

Assert PCI DSS SAQ-A compliance — verifies that no raw PAN or CVV is present in any token in the vault. Real merchants run this as a compile-time / runtime gate before every deploy.

```ts
export async function verifyPciScope(
  adapter: PaymentAdapter,
  session: VaultSession,
  input: { targetScope: 'SAQ-A' | 'SAQ-A-EP' | 'SAQ-D' },
): Promise<AxisStep<VaultState>>;
```

#### `voidInvoice`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L137) `packages/payment/src/semantics/invoice.ts`

Void an invoice. Emits `invoice.voided`. Allowed from `draft` or `open` (real providers reject voiding a paid invoice — must be credit-noted instead).

```ts
export async function voidInvoice(
  adapter: PaymentAdapter,
  invoice: Invoice,
): Promise<AxisStep<InvoiceState>>;
```

### 型

#### `AxisStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/types.ts#L507) `packages/payment/src/semantics/types.ts`

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

#### `BillingAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/types.ts#L13) `packages/payment/src/semantics/types.ts`

Advanced billing semantics — provider-neutral axis SSOT. v0.2 mocks only carried the webhook signature + dispatch primitive. v0.3 adds 9 production semantics that every real biller cares about — dunning, retry, 3DS, SCA, PSD2, subscription lifecycle, invoice, tax, chargeback. Each axis is expressed as a small state-machine helper that emits already signed webhook events through the existing PaymentAdapter, so downstream tests can drive the axis without knowing the provider's payload dialect.

```ts
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
  | 'payment-method-vault'
  // v0.5 — advanced billing III 8 axis (embedded finance / BNPL / crypto /
  // FX / recurring revenue analytics / orchestration II / fraud detection /
  // regulatory reporting). Extends the v0.4 fidelity harness from 3 × 17 to
  // 3 × 25 = 75 combination.
  | 'embedded-finance'
  | 'bnpl'
  | 'crypto-payment'
  | 'fx-cross-border'
  | 'recurring-revenue-advanced'
  | 'payment-orchestration-ii'
  | 'fraud-detection-advanced'
  | 'regulatory-reporting';
```

#### `BnplConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L22) `packages/payment/src/semantics/bnpl.ts`

```ts
export interface BnplConfig {
  /** number of installments (2-6 typical) */
  installments: number;
  /** ms between installment due dates */
  installmentIntervalMs?: number;
  /** minimum risk score (0-100) required to approve */
  minRiskScore?: number;
  /** late fee charged per missed installment, in cents */
  lateFeeCents?: number;
}
```

#### `BnplSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L33) `packages/payment/src/semantics/bnpl.ts`

```ts
export interface BnplSession {
  planId: string;
  customerId: string;
  totalCents: number;
  currency?: string;
  config: Required<BnplConfig>;
  installmentAmountCents: number;
  installmentsScheduled: number;
  installmentsPaid: number;
  riskScore: number;
  lateFeesTotalCents: number;
  state: BnplState;
  history: AxisStep<BnplState>[];
}
```

#### `BnplState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L12) `packages/payment/src/semantics/bnpl.ts`

BNPL (Buy Now Pay Later) axis — installment plan + risk scoring + credit decisioning + late fee. Real BNPL providers (Klarna / Affirm / Afterpay) split a purchase into 2-6 installments, run a soft credit check + risk score at checkout, and charge a late fee if a scheduled installment misses its due date. The mock reproduces plan creation, per-installment schedule emission, risk score emission, and late fee emission.

```ts
export type BnplState =
  | 'initial'
  | 'plan-created'
  | 'installments-scheduled'
  | 'risk-scored'
  | 'active'
  | 'late-fee-charged'
  | 'settled'
  | 'defaulted';
```

#### `Chain`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L22) `packages/payment/src/semantics/crypto-payment.ts`

```ts
export type Chain = 'ethereum' | 'polygon' | 'base' | 'arbitrum' | 'solana';
```

#### `Chargeback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L28) `packages/payment/src/semantics/chargeback.ts`

```ts
export interface Chargeback {
  id: string;
  transactionId: string;
  customerId: string;
  amountCents: number;
  currency?: string;
  reason: ChargebackReason;
  state: ChargebackState;
  history: AxisStep<ChargebackState>[];
}
```

#### `ChargebackReason`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L18) `packages/payment/src/semantics/chargeback.ts`

```ts
export type ChargebackReason =
  | 'fraudulent'
  | 'unrecognized'
  | 'duplicate'
  | 'product-not-received'
  | 'product-unacceptable'
  | 'subscription-canceled'
  | 'credit-not-processed'
  | 'general';
```

#### `ChargebackState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L12) `packages/payment/src/semantics/chargeback.ts`

Chargeback / dispute semantics. Real card networks (Visa VCR, Mastercard MCOP) run a multi-step dispute flow: opened → evidence submitted (or accept) → representment → arbitration → final outcome. The mock reduces that to the observable 4-event envelope providers surface (opened / evidence_submitted / won / lost) with a state machine that guards transitions.

```ts
export type ChargebackState =
  | 'opened'
  | 'evidence-submitted'
  | 'won'
  | 'lost';
```

#### `CouponEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L19) `packages/payment/src/semantics/subscription-state-machine.ts`

```ts
export interface CouponEntry {
  code: string;
  percentOff: number;
  amountOffCents?: number;
  /** ms until the coupon expires; 0 = never */
  ttlMs?: number;
  /** whether this coupon can stack with others */
  stackable?: boolean;
}
```

#### `CryptoInvoiceConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L25) `packages/payment/src/semantics/crypto-payment.ts`

```ts
export interface CryptoInvoiceConfig {
  /** required confirmation count before marking as confirmed */
  requiredConfirmations?: number;
  /** ms after which the invoice expires if not confirmed */
  expirationMs?: number;
  /** whether gas abstraction (paymaster) is enabled */
  gasAbstractionEnabled?: boolean;
}
```

#### `CryptoPaymentSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L34) `packages/payment/src/semantics/crypto-payment.ts`

```ts
export interface CryptoPaymentSession {
  invoiceId: string;
  customerId: string;
  amountCents: number;
  currency?: string;
  chain: Chain;
  token: Stablecoin;
  walletAddress: string | null;
  txHash: string | null;
  confirmations: number;
  state: CryptoPaymentState;
  config: Required<CryptoInvoiceConfig>;
  createdAt: number;
  history: AxisStep<CryptoPaymentState>[];
}
```

#### `CryptoPaymentState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L12) `packages/payment/src/semantics/crypto-payment.ts`

Crypto payment axis — stablecoin invoicing + on-chain confirmation + gas abstraction + wallet linking. Real crypto payment gateways (Coinbase Commerce / BitPay / MoonPay) accept USDC / USDT / ETH, poll the underlying chain for confirmations, absorb gas via meta-tx / paymaster (EIP-4337) so end users pay a stablecoin price, and link wallets to a customer id for repeat billing.

```ts
export type CryptoPaymentState =
  | 'initial'
  | 'invoice-created'
  | 'awaiting-confirmation'
  | 'confirmed'
  | 'gas-abstracted'
  | 'wallet-linked'
  | 'expired'
  | 'failed';
```

#### `DisputeSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L21) `packages/payment/src/semantics/dispute.ts`

```ts
export interface DisputeSession {
  disputeId: string;
  chargeId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  reason: string;
  state: DisputeState;
  evidence: string[];
  liabilityShifted: boolean;
  history: AxisStep<DisputeState>[];
  arbitrationOpenedAt: number | null;
}
```

#### `DisputeState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L12) `packages/payment/src/semantics/dispute.ts`

Dispute lifecycle axis — evidence submission + representment + arbitration + liability shift. Real card networks (Visa / Mastercard) define a 5-stage dispute cycle: retrieval → first chargeback → second presentment → arbitration → final ruling. Liability shift occurs when 3DS challenge was passed at authorisation, moving fraud loss from the merchant to the issuer.

```ts
export type DisputeState =
  | 'opened'
  | 'evidence-submitted'
  | 'represented'
  | 'arbitration-opened'
  | 'liability-shifted'
  | 'lost'
  | 'won';
```

#### `DunningConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L19) `packages/payment/src/semantics/dunning.ts`

```ts
export interface DunningConfig {
  /** attempts total (1st attempt included) */
  maxAttempts?: number;
  /** ms between attempts */
  retryIntervalMs?: number;
  /** ms grace period between last failed attempt and terminal state */
  gracePeriodMs?: number;
}
```

#### `DunningSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L28) `packages/payment/src/semantics/dunning.ts`

```ts
export interface DunningSession {
  invoiceId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  attempt: number;
  state: DunningState;
  config: Required<DunningConfig>;
  history: AxisStep<DunningState>[];
}
```

#### `DunningState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L13) `packages/payment/src/semantics/dunning.ts`

Dunning — payment retry sequence for a failed invoice. Real providers all run a scheduled retry cadence (Stripe Smart Retries default = 4 attempts over ~1 week, Paddle's dunning follows the merchant-configured schedule, Lemon Squeezy retries 4 times over 14 days). The mock reproduces the user-observable envelope: N attempts, each with a delay window, a grace period between last attempt and terminal state, and a notification hook that fires on every attempt.

```ts
export type DunningState =
  | 'active'
  | 'in-grace-period'
  | 'recovered'
  | 'exhausted';
```

#### `EmbeddedFinanceConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L26) `packages/payment/src/semantics/embedded-finance.ts`

```ts
export interface EmbeddedFinanceConfig {
  /** whether KYB (business verification) is required in addition to KYC */
  requireKyb?: boolean;
  /** minimum score (0-100) required to advance to card issuance */
  minScore?: number;
}
```

#### `EmbeddedFinanceSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L33) `packages/payment/src/semantics/embedded-finance.ts`

```ts
export interface EmbeddedFinanceSession {
  accountId: string;
  customerId: string;
  currency?: string;
  config: Required<EmbeddedFinanceConfig>;
  kycStatus: KycStatus;
  kybStatus: KycStatus;
  kycScore: number;
  cardIds: string[];
  state: EmbeddedFinanceState;
  history: AxisStep<EmbeddedFinanceState>[];
}
```

#### `EmbeddedFinanceState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L13) `packages/payment/src/semantics/embedded-finance.ts`

Embedded finance axis — Banking-as-a-Service (BaaS) + card issuance + KYC (Know Your Customer) + KYB (Know Your Business) verification. Real embedded finance providers (Stripe Treasury / Unit / Column) let a platform open bank accounts on behalf of end users, issue physical or virtual cards, and run compliance verification without the platform itself becoming a bank. The mock reproduces the observable envelope: account open → KYC / KYB verified → card issued.

```ts
export type EmbeddedFinanceState =
  | 'initial'
  | 'account-opened'
  | 'kyc-pending'
  | 'kyc-verified'
  | 'kyb-pending'
  | 'kyb-verified'
  | 'card-issued'
  | 'suspended'
  | 'closed';
```

#### `EngineConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/engine.ts#L20) `packages/payment/src/engine.ts`

Shared engine used by all 3 provider adapters. Handles the HMAC signing + verify + registered handler dispatch. Provider-specific bits (signature scheme, timestamp format, event id prefix, payload shape) are injected via the {@link EngineConfig}. All 3 real providers use HMAC-SHA256 over some canonical serialization of `{timestamp}.{body}` — Stripe's `Stripe-Signature` header is the canonical example, Paddle uses `Paddle-Signature`, Lemon Squeezy uses `X-Signature`. The mock exercises the same bytes.

```ts
export interface EngineConfig {
  provider: PaymentProvider;
  secret: string;
  idPrefix: string;
  toleranceMs: number;
  now(): number;
  buildRawBody(event: PaymentWebhookEvent): string;
}
```

#### `FidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fidelity.ts#L19) `packages/payment/src/semantics/fidelity.ts`

```ts
export interface FidelityCoverage {
  providers: PaymentProvider[];
  axes: BillingAxis[];
  rows: FidelityRow[];
}
```

#### `FidelityRow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fidelity.ts#L12) `packages/payment/src/semantics/fidelity.ts`

Fidelity harness — collects the provider × axis coverage grid that downstream release-gate reports on. Not a runner (no side effect emit); pure inspection so tests / release-gate can assert "3 provider × 25 axis" (v0.3 9 axis + v0.4 8 axis + v0.5 8 axis) without walking every neutral event by hand. The v0.5 slice alone is 3 provider × 8 axis = 24 combination, extending the v0.4 total from 51 rows to 75 rows.

```ts
export interface FidelityRow {
  provider: PaymentProvider;
  axis: BillingAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}
```

#### `FraudDetectionConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L24) `packages/payment/src/semantics/fraud-detection-advanced.ts`

```ts
export interface FraudDetectionConfig {
  /** device score threshold (0-100) below which the transaction is flagged */
  minDeviceScore?: number;
  /** max attempts per hour per customer before velocity flag fires */
  maxVelocityPerHour?: number;
  /** ML score threshold above which the transaction is blocked */
  mlBlockThreshold?: number;
}
```

#### `FraudDetectionSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L33) `packages/payment/src/semantics/fraud-detection-advanced.ts`

```ts
export interface FraudDetectionSession {
  transactionId: string;
  customerId: string;
  amountCents: number;
  currency?: string;
  config: Required<FraudDetectionConfig>;
  deviceScore: number | null;
  biometricPassed: boolean | null;
  velocityCount: number;
  mlScore: number | null;
  verdict: FraudVerdict;
  state: FraudDetectionState;
  history: AxisStep<FraudDetectionState>[];
}
```

#### `FraudDetectionState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L13) `packages/payment/src/semantics/fraud-detection-advanced.ts`

Fraud detection advanced axis — device fingerprint scoring + behavioral biometrics verification + velocity checking + ML-driven block decision. Real fraud engines (Stripe Radar / Sift / Signifyd) combine 4 signals to score a transaction: device fingerprint (browser + OS + IP entropy), behavioral biometrics (typing rhythm + mouse motion), velocity (attempts per unit time), and an ML model that fuses everything into a final accept / review / block verdict.

```ts
export type FraudDetectionState =
  | 'initial'
  | 'device-scored'
  | 'biometric-verified'
  | 'velocity-flagged'
  | 'ml-blocked'
  | 'accepted'
  | 'reviewing';
```

#### `FraudVerdict`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L22) `packages/payment/src/semantics/fraud-detection-advanced.ts`

```ts
export type FraudVerdict = 'accept' | 'review' | 'block';
```

#### `FxConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L33) `packages/payment/src/semantics/fx-cross-border.ts`

```ts
export interface FxConfig {
  /** ms the rate lock stays valid */
  rateLockDurationMs?: number;
  /** which settlement rail to use */
  settlementRail?: SettlementRail;
}
```

#### `FxRateQuote`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L22) `packages/payment/src/semantics/fx-cross-border.ts`

```ts
export interface FxRateQuote {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  quoteId: string;
  lockedAt: number;
  lockExpiresAt: number;
  amountFromCents: number;
  amountToCents: number;
}
```

#### `FxSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L40) `packages/payment/src/semantics/fx-cross-border.ts`

```ts
export interface FxSession {
  transferId: string;
  customerId: string;
  quote: FxRateQuote | null;
  state: FxState;
  config: Required<FxConfig>;
  settledAmountCents: number;
  history: AxisStep<FxState>[];
}
```

#### `FxState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L12) `packages/payment/src/semantics/fx-cross-border.ts`

FX / cross-border axis — multi-currency rate lock + SWIFT / SEPA settlement + rate expiration. Real cross-border providers (Wise / Airwallex / Currencycloud) quote a rate that stays valid for a fixed window (typically 60-3600 seconds), then settle via SWIFT (global) or SEPA (EU). The mock reproduces rate lock, settlement initiation, settlement completion, and rate expiration.

```ts
export type FxState =
  | 'initial'
  | 'rate-locked'
  | 'settlement-initiated'
  | 'settlement-completed'
  | 'expired'
  | 'failed';
```

#### `Invoice`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L17) `packages/payment/src/semantics/invoice.ts`

```ts
export interface Invoice {
  id: string;
  customerId: string;
  amountCents: number;
  currency?: string;
  state: InvoiceState;
  history: AxisStep<InvoiceState>[];
}
```

#### `InvoiceState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L10) `packages/payment/src/semantics/invoice.ts`

Invoice lifecycle. Real providers use the state machine draft → open → paid (or void / uncollectible). Credit notes are emitted post-paid to refund partial amounts without voiding the invoice. Guards enforce the legal transitions so tests exercise each edge explicitly.

```ts
export type InvoiceState =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible';
```

#### `KycStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L24) `packages/payment/src/semantics/embedded-finance.ts`

```ts
export type KycStatus = 'pending' | 'verified' | 'failed';
```

#### `LifecycleEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L31) `packages/payment/src/semantics/lifecycle-orchestrator.ts`

遷移 trigger event、 evaluate 経路 で 使う。

```ts
export type LifecycleEvent =
  | 'payment-succeeded'
  | 'payment-failed'
  | 'dunning-succeeded'
  | 'dunning-exhausted'
  | 'chargeback-filed'
  | 'chargeback-won'
  | 'chargeback-lost'
  | 'user-canceled';
```

#### `LifecycleSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L41) `packages/payment/src/semantics/lifecycle-orchestrator.ts`

```ts
export interface LifecycleSession {
  state: LifecycleState;
  billingCyclesCompleted: number;
  failedAttemptCount: number;
  dunningRoundsExecuted: number;
  chargebacksDisputed: number;
  lastEventAt: string;
  events: string[];
}
```

#### `LifecycleState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L23) `packages/payment/src/semantics/lifecycle-orchestrator.ts`

lifecycle-orchestrator の 5 state。 subscription lifecycle と revenue-recovery を 統合 した 生命 サイクル SSOT。

```ts
export type LifecycleState =
  | 'active-billing'      // 通常課金中、 全 signal 監視 active
  | 'grace-period'        // 支払い失敗直後、 dunning trigger 待ち
  | 'dunning-active'      // dunning cascade 実行中 (email/SMS/retry)
  | 'chargeback-dispute'  // chargeback 発生、 dispute 対応中
  | 'canceled';
```

#### `LifecycleSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L169) `packages/payment/src/semantics/lifecycle-orchestrator.ts`

lifecycle の 統計サマリー生成、 dogfood consumer が 監視 dashboard で 出力する 用途。 total events 数 + valid event 数 + 遷移 経路 の hash。

```ts
export interface LifecycleSummary {
  currentState: LifecycleState;
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  terminalEvents: number;
  cyclesCompleted: number;
  chargebacksDisputed: number;
}
```

#### `NeutralEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/types.ts#L54) `packages/payment/src/semantics/types.ts`

Provider-neutral event names used inside the axis helpers. Real providers emit different string ids (Stripe `invoice.payment_failed`, Paddle `transaction.payment_failed`, Lemon Squeezy `subscription_payment_failed`) — the {@link providerEventName} map handles the translation. Tests can assert on the neutral name via `event.type.endsWith(':&lt;neutral&gt;')` or on the provider-specific one via the raw type field.

```ts
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
  | 'vault.pci_scope_verified'
  // v0.5 — embedded finance (BaaS + card issuance + KYC/KYB)
  | 'embedded.account_opened'
  | 'embedded.card_issued'
  | 'embedded.kyc_verified'
  | 'embedded.kyb_verified'
  // v0.5 — BNPL (installment + risk + credit + late fee)
  | 'bnpl.plan_created'
  | 'bnpl.installment_scheduled'
  | 'bnpl.risk_scored'
  | 'bnpl.late_fee_charged'
  // v0.5 — crypto payment (stablecoin + on-chain + gas abstraction)
  | 'crypto.invoice_created'
  | 'crypto.tx_confirmed'
  | 'crypto.gas_abstracted'
  | 'crypto.wallet_linked'
  // v0.5 — FX / cross-border (multi-currency + rate lock + SWIFT/SEPA)
  | 'fx.rate_locked'
  | 'fx.settlement_initiated'
  | 'fx.settlement_completed'
  | 'fx.rate_expired'
  // v0.5 — recurring revenue advanced (MRR/ARR + churn + expansion + NRR)
  | 'rr.mrr_computed'
  | 'rr.churn_recorded'
  | 'rr.expansion_recorded'
  | 'rr.nrr_computed'
  // v0.5 — payment orchestration II (smart routing + ML + fallback)
  | 'po2.smart_routed'
  | 'po2.ml_scored'
  | 'po2.fallback_triggered'
  | 'po2.cascade_exhausted'
  // v0.5 — fraud detection advanced (device fingerprint + biometrics + velocity + ML)
  | 'fraud.device_scored'
  | 'fraud.biometric_verified'
  | 'fraud.velocity_flagged'
  | 'fraud.ml_blocked'
  // v0.5 — regulatory reporting (PCI DSS + PSD2 SCA + DORA + AML/KYC + SAR)
  | 'reg.pci_reported'
  | 'reg.psd2_reported'
  | 'reg.dora_reported'
  | 'reg.sar_filed';
```

#### `OrchestrationConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L19) `packages/payment/src/semantics/orchestration.ts`

```ts
export interface OrchestrationConfig {
  /** ordered provider list — index 0 = primary, rest = failover cascade */
  providers: PaymentProvider[];
  /** consecutive failures that open the breaker */
  circuitBreakerThreshold?: number;
  /** ms the breaker stays open before we probe again */
  circuitOpenDurationMs?: number;
  /** retry attempts against the current provider before failover */
  maxRetriesPerProvider?: number;
}
```

#### `OrchestrationIIConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L19) `packages/payment/src/semantics/payment-orchestration-ii.ts`

```ts
export interface OrchestrationIIConfig {
  /** ordered list of providers in fallback priority */
  providers: PaymentProvider[];
  /** whether ML scoring is used to pick the primary route */
  mlScoringEnabled?: boolean;
  /** minimum ML score (0-1) to accept a routing decision */
  minMlScore?: number;
  /** max attempts across the whole cascade */
  maxAttempts?: number;
}
```

#### `OrchestrationIISession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L30) `packages/payment/src/semantics/payment-orchestration-ii.ts`

```ts
export interface OrchestrationIISession {
  intentId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  config: Required<OrchestrationIIConfig>;
  currentIndex: number;
  attemptCount: number;
  mlScore: number | null;
  state: OrchestrationIIState;
  history: AxisStep<OrchestrationIIState>[];
}
```

#### `OrchestrationIIState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L11) `packages/payment/src/semantics/payment-orchestration-ii.ts`

Payment orchestration II axis — smart routing (BIN-based / cost-optimised) + ML-driven route decisioning + fallback ladder + retry cascade with exhaustion. Extends the v0.4 `orchestration` axis with an ML scoring signal, an explicit fallback ladder (as opposed to a simple linear cascade), and a terminal `cascade-exhausted` state.

```ts
export type OrchestrationIIState =
  | 'initial'
  | 'smart-routed'
  | 'ml-scored'
  | 'fallback-triggered'
  | 'cascade-exhausted'
  | 'terminated';
```

#### `OrchestrationSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L30) `packages/payment/src/semantics/orchestration.ts`

```ts
export interface OrchestrationSession {
  intentId: string;
  amountCents: number;
  currency?: string;
  config: Required<OrchestrationConfig>;
  currentProviderIndex: number;
  currentProviderFailures: number;
  totalFailures: number;
  state: OrchestrationState;
  history: AxisStep<OrchestrationState>[];
  circuitOpenedAt: number | null;
}
```

#### `OrchestrationState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L12) `packages/payment/src/semantics/orchestration.ts`

Orchestration axis — multi-provider routing + failover + retry ladder + circuit breaker. Real merchants split traffic across 2-3 providers to hedge against outages and to fine-tune per-BIN authorisation rates. The mock reproduces the observable envelope: a router that picks the primary provider, retries on failure, fails over to a secondary, and opens a circuit after a configurable failure threshold.

```ts
export type OrchestrationState =
  | 'routing'
  | 'failed-over'
  | 'circuit-open'
  | 'circuit-closed'
  | 'terminated';
```

#### `PaymentAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L58) `packages/payment/src/types.ts`

Adapter contract every provider mock implements. The 3 ops are the intersection kiwa tests actually assert on: - `signWebhook` — build a raw payload + signature pair (fixture) - `verifyWebhook` — verify signature + parse (mock server) - `emit` — synchronous fake webhook dispatch to registered handlers

```ts
export interface PaymentAdapter {
  readonly provider: PaymentProvider;
  signWebhook(input: {
    type: string;
    amountCents: number;
    currency?: string;
    customerId: string;
    timestamp?: number;
  }): { rawBody: string; signature: string; event: PaymentWebhookEvent };
  verifyWebhook(input: { rawBody: string; signature: string; toleranceMs?: number }): WebhookVerifyResult;
  onWebhook(handler: (event: PaymentWebhookEvent) => void | Promise<void>): () => void;
  emit(event: PaymentWebhookEvent): Promise<void>;
}
```

#### `PaymentMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L20) `packages/payment/src/real-driver.ts`

Real-driver env-gate — inspects `process.env` to decide whether the

```ts
export type PaymentMode = 'mock' | 'real';
```

#### `PaymentProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L7) `packages/payment/src/types.ts`

Payment provider identifier — provider prefix used by release-gate to dispatch axis evaluation. All

```ts
export type PaymentProvider = 'stripe' | 'paddle' | 'lemonsqueezy';
```

#### `PaymentWebhookEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L28) `packages/payment/src/types.ts`

A canonical webhook event shape shared across the three providers. Real providers emit slightly different payloads (Stripe uses `data.object`, Paddle uses `data.attributes`, Lemon Squeezy nests under `data.attributes` too but with different keys). This shape captures the intersection that kiwa mocks assert on — id, event type, amount + currency, customer, and a timestamp. The provider-specific `raw` field carries the exact raw webhook body a real client would sign, so signature verify tests exercise the actual bytes.

```ts
export interface PaymentWebhookEvent {
  provider: PaymentProvider;
  id: string;
  type: string;
  amountCents: number;
  currency: string;
  customerId: string;
  timestamp: number;
  raw: string;
}
```

#### `PsdMandate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L15) `packages/payment/src/semantics/psd2.ts`

```ts
export interface PsdMandate {
  id: string;
  scheme: PsdMandateScheme;
  customerId: string;
  amountCentsCap?: number;
  currency?: string;
  state: PsdMandateState;
  history: AxisStep<PsdMandateState>[];
}
```

#### `PsdMandateScheme`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L11) `packages/payment/src/semantics/psd2.ts`

PSD2 open banking + mandate semantics. Under PSD2 (EU) and the equivalent UK OBIE spec, recurring debits require a signed customer mandate (SEPA DD B2C, SEPA DD B2B, UK BACS DDI). Open banking payment initiation requires a granular consent from the customer's bank. This module tracks both — mandate lifecycle (create / revoke) and consent grant.

```ts
export type PsdMandateScheme = 'sepa-core' | 'sepa-b2b' | 'bacs' | 'open-banking';
```

#### `PsdMandateState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L13) `packages/payment/src/semantics/psd2.ts`

```ts
export type PsdMandateState = 'active' | 'revoked';
```

#### `RecoveryConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L21) `packages/payment/src/semantics/revenue-recovery.ts`

```ts
export interface RecoveryConfig {
  /** cascade step definitions ordered by fire time */
  cascade?: Array<'email' | 'in-app' | 'sms' | 'push'>;
  /** ms between cascade steps */
  cascadeStepMs?: number;
  /** whether the merchant subscribes to card updater */
  cardUpdaterEnabled?: boolean;
  /** whether the merchant uses network tokenization */
  networkTokenizationEnabled?: boolean;
}
```

#### `RecoverySession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L32) `packages/payment/src/semantics/revenue-recovery.ts`

```ts
export interface RecoverySession {
  invoiceId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  state: RecoveryState;
  config: Required<RecoveryConfig>;
  cascadeStepIndex: number;
  history: AxisStep<RecoveryState>[];
}
```

#### `RecoveryState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L12) `packages/payment/src/semantics/revenue-recovery.ts`

Revenue recovery axis — smart retry + dunning cascade + card updater + network tokenization. Real providers combine 4 mechanisms to recover failed payments: intelligent retry timing (Stripe Smart Retries), a multi-step dunning cascade (email + in-app + SMS), the card updater network to refresh expired cards, and network tokenization to survive card re-issue events without re-collecting PAN.

```ts
export type RecoveryState =
  | 'initial'
  | 'smart-retry-scheduled'
  | 'dunning-cascade'
  | 'card-updated'
  | 'network-tokenized'
  | 'recovered'
  | 'lost';
```

#### `RecurringRevenueSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L29) `packages/payment/src/semantics/recurring-revenue-advanced.ts`

```ts
export interface RecurringRevenueSession {
  cohortId: string;
  customerId: string;
  currency?: string;
  snapshot: RecurringRevenueSnapshot;
  computedMrr: number;
  computedArr: number;
  computedNrr: number;
  state: RecurringRevenueState;
  history: AxisStep<RecurringRevenueState>[];
}
```

#### `RecurringRevenueSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L19) `packages/payment/src/semantics/recurring-revenue-advanced.ts`

```ts
export interface RecurringRevenueSnapshot {
  cohortId: string;
  mrrStartCents: number;
  mrrEndCents: number;
  churnCents: number;
  contractionCents: number;
  expansionCents: number;
  newBusinessCents: number;
}
```

#### `RecurringRevenueState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L12) `packages/payment/src/semantics/recurring-revenue-advanced.ts`

Recurring revenue advanced axis — MRR (Monthly Recurring Revenue) + ARR (Annual Recurring Revenue) + churn tracking + expansion revenue + NRR (Net Revenue Retention). Real SaaS billing platforms (Stripe / Chargebee / Recurly) roll these metrics into cohort analytics: NRR = (MRR_end - churn - contraction + expansion) / MRR_start × 100. The mock reproduces MRR / ARR computation, churn / expansion recording, and NRR rollup.

```ts
export type RecurringRevenueState =
  | 'initial'
  | 'mrr-computed'
  | 'churn-recorded'
  | 'expansion-recorded'
  | 'nrr-computed';
```

#### `RefundPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L18) `packages/payment/src/semantics/refund-advanced.ts`

```ts
export interface RefundPolicy {
  /** ms window in which refunds are allowed */
  windowMs: number;
  /** minimum refundable amount in cents */
  minAmountCents?: number;
  /** maximum single-refund amount in cents */
  maxAmountCents?: number;
  /** whether the merchant proactively refunds to prevent chargebacks */
  chargebackPrevention?: boolean;
}
```

#### `RefundSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L29) `packages/payment/src/semantics/refund-advanced.ts`

```ts
export interface RefundSession {
  chargeId: string;
  originalAmountCents: number;
  chargedAt: number;
  customerId: string;
  currency?: string;
  policy: RefundPolicy;
  refundedCents: number;
  state: RefundState;
  history: AxisStep<RefundState>[];
}
```

#### `RefundState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L11) `packages/payment/src/semantics/refund-advanced.ts`

Refund advanced axis — partial refund + refund policy + refund window + chargeback prevention. Real merchants apply time-window policies (30 day / 60 day / no-refund), partial refunds with amount caps, and use refunds proactively to head off chargebacks that would otherwise incur $15-$25 fees plus liability shift.

```ts
export type RefundState =
  | 'requested'
  | 'partial-issued'
  | 'full-issued'
  | 'window-expired'
  | 'policy-denied';
```

#### `Regulator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L20) `packages/payment/src/semantics/regulatory-reporting.ts`

```ts
export type Regulator = 'PCI-SSC' | 'EBA' | 'ESA' | 'FinCEN' | 'NCA';
```

#### `RegulatoryReportingSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L31) `packages/payment/src/semantics/regulatory-reporting.ts`

```ts
export interface RegulatoryReportingSession {
  entityId: string;
  customerId: string;
  currency?: string;
  reports: ReportRecord[];
  sarFiled: boolean;
  state: RegulatoryReportingState;
  history: AxisStep<RegulatoryReportingState>[];
}
```

#### `RegulatoryReportingState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L12) `packages/payment/src/semantics/regulatory-reporting.ts`

Regulatory reporting axis — PCI DSS + PSD2 SCA + DORA (Digital Operational Resilience Act) + AML/KYC + SAR (Suspicious Activity Report). Real payment processors submit periodic reports to regulators: PCI DSS to card networks, PSD2 to EBA (European Banking Authority), DORA to competent authorities under the ESAs, and SAR to FinCEN (US) / NCA (UK) on demand when suspicious activity is detected.

```ts
export type RegulatoryReportingState =
  | 'initial'
  | 'pci-reported'
  | 'psd2-reported'
  | 'dora-reported'
  | 'sar-filed'
  | 'audit-locked';
```

#### `ReportPeriod`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L21) `packages/payment/src/semantics/regulatory-reporting.ts`

```ts
export type ReportPeriod = 'monthly' | 'quarterly' | 'annual' | 'on-demand';
```

#### `ReportRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L23) `packages/payment/src/semantics/regulatory-reporting.ts`

```ts
export interface ReportRecord {
  reportId: string;
  regulator: Regulator;
  period: ReportPeriod;
  submittedAt: number;
  fingerprint: string;
}
```

#### `ResolvedMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L22) `packages/payment/src/real-driver.ts`

```ts
export interface ResolvedMode {
  mode: PaymentMode;
  provider: PaymentProvider;
  reason: 'default-mock' | 'kiwa-mode-real' | 'missing-key' | 'invalid-mode';
}
```

#### `RetryConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L14) `packages/payment/src/semantics/retry.ts`

```ts
export interface RetryConfig {
  maxAttempts?: number;
  /** milliseconds between attempt N and N+1 = baseBackoffMs * 2^(N-1) */
  baseBackoffMs?: number;
}
```

#### `RetrySession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L20) `packages/payment/src/semantics/retry.ts`

```ts
export interface RetrySession {
  idempotencyKey: string;
  event: PaymentWebhookEvent;
  attempt: number;
  state: RetryState;
  config: Required<RetryConfig>;
  history: AxisStep<RetryState>[];
}
```

#### `RetryState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L12) `packages/payment/src/semantics/retry.ts`

Webhook delivery retry semantics. All 3 real providers retry undelivered webhooks with exponential backoff until a configured max attempt count (Stripe = 3 days at increasing intervals, Paddle = 3 attempts at 5s / 5m / 10m, Lemon Squeezy = up to 3 attempts). The mock reproduces the observable envelope: an idempotency key per event, backoff schedule, and a max-attempt abandon terminal state.

```ts
export type RetryState = 'scheduled' | 'delivered' | 'abandoned';
```

#### `ScaExemption`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L13) `packages/payment/src/semantics/sca.ts`

```ts
export type ScaExemption =
  | 'low-value'
  | 'trusted-beneficiary'
  | 'transaction-risk-analysis'
  | 'merchant-initiated'
  | 'recurring-subsequent'
  | 'corporate';
```

#### `ScaSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L21) `packages/payment/src/semantics/sca.ts`

```ts
export interface ScaSession {
  paymentIntentId: string;
  amountCents: number;
  currency?: string;
  customerId: string;
  state: ScaState;
  strongAuthToken?: string;
  history: AxisStep<ScaState>[];
}
```

#### `ScaState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L11) `packages/payment/src/semantics/sca.ts`

Strong Customer Authentication (SCA) semantics under PSD2. Real providers expose SCA through: (1) exemption evaluation (low-value, TRA, MIT, recurring subsequent), (2) required authentication when no exemption applies, (3) post-auth token issue. This module wraps the 3-state envelope: `required` / `exempt` / `authenticated`.

```ts
export type ScaState = 'evaluating' | 'required' | 'exempt' | 'authenticated';
```

#### `SettlementRail`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L20) `packages/payment/src/semantics/fx-cross-border.ts`

```ts
export type SettlementRail = 'SWIFT' | 'SEPA' | 'ACH' | 'FASTER' | 'RTGS';
```

#### `Stablecoin`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L23) `packages/payment/src/semantics/crypto-payment.ts`

```ts
export type Stablecoin = 'USDC' | 'USDT' | 'DAI' | 'ETH' | 'SOL';
```

#### `Subscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L17) `packages/payment/src/semantics/subscription-lifecycle.ts`

```ts
export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  amountCents: number;
  currency?: string;
  state: SubscriptionState;
  history: AxisStep<SubscriptionState>[];
}
```

#### `SubscriptionMachineSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L29) `packages/payment/src/semantics/subscription-state-machine.ts`

```ts
export interface SubscriptionMachineSession {
  subscriptionId: string;
  customerId: string;
  planPriceCents: number;
  currency?: string;
  currentCyclePriceCents: number;
  state: SubscriptionMachineState;
  gracePeriodMs: number;
  gracePeriodEnteredAt: number | null;
  pausedAt: number | null;
  coupons: CouponEntry[];
  history: AxisStep<SubscriptionMachineState>[];
}
```

#### `SubscriptionMachineState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L12) `packages/payment/src/semantics/subscription-state-machine.ts`

Subscription state machine axis — grace period + pause / resume + proration + coupon stacking. Real subscription billing has a distinct grace period (past-due but not yet cancelled), first-class pause / resume (Stripe `paused_collection`, Paddle `subscription.paused`), mid-cycle proration for plan changes, and stackable discounts / coupons whose effective percent must be recomputed on every renewal.

```ts
export type SubscriptionMachineState =
  | 'active'
  | 'grace-period'
  | 'paused'
  | 'canceled'
  | 'expired';
```

#### `SubscriptionState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L10) `packages/payment/src/semantics/subscription-lifecycle.ts`

Subscription lifecycle state machine. Real providers converge on the same 7-state envelope: created → (upgraded / downgraded / paused / resumed) → canceled → reactivated. This module wraps that envelope with strict transition guards so tests fail loudly on invalid transitions.

```ts
export type SubscriptionState =
  | 'active'
  | 'upgraded'
  | 'downgraded'
  | 'paused'
  | 'canceled';
```

#### `TaxCalcInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L24) `packages/payment/src/semantics/tax.ts`

```ts
export interface TaxCalcInput {
  netAmountCents: number;
  buyerCountry: string;
  buyerVatId?: string;
  merchantCountry: string;
  productKind?: 'digital' | 'physical' | 'service';
}
```

#### `TaxJurisdiction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L17) `packages/payment/src/semantics/tax-localization.ts`

```ts
export type TaxJurisdiction =
  | 'EU'
  | 'UK'
  | 'US'
  | 'AU'
  | 'CA'
  | 'JP'
  | 'other';
```

#### `TaxKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L12) `packages/payment/src/semantics/tax.ts`

Tax semantics — VAT / GST / sales tax + reverse charge + tax registration. Real providers surface tax through per-line calculation (Stripe Tax, Paddle Merchant of Record includes VAT/GST inclusive, Lemon Squeezy MOR). This module reproduces the observable envelope: a pure `calculateTax` helper for local decisions plus 3 emit helpers for the neutral events downstream harnesses filter on.

```ts
export type TaxKind = 'vat' | 'gst' | 'sales-tax';
```

#### `TaxKindLocalized`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L26) `packages/payment/src/semantics/tax-localization.ts`

```ts
export type TaxKindLocalized =
  | 'vat'
  | 'gst'
  | 'sales-tax'
  | 'dac7-report';
```

#### `TaxLine`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L14) `packages/payment/src/semantics/tax.ts`

```ts
export interface TaxLine {
  kind: TaxKind;
  country: string;
  rateBps: number;
  amountCents: number;
  taxCents: number;
  reverseCharged: boolean;
  exempt: boolean;
}
```

#### `TaxLocalizationInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L32) `packages/payment/src/semantics/tax-localization.ts`

```ts
export interface TaxLocalizationInput {
  jurisdiction: TaxJurisdiction;
  amountCents: number;
  customerId: string;
  currency?: string;
  /** ISO-3166-2 subdivision for US destination sourcing */
  region?: string;
  /** whether the customer is B2B (reverse charge applies) */
  b2b?: boolean;
}
```

#### `TaxLocalizationLine`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L43) `packages/payment/src/semantics/tax-localization.ts`

```ts
export interface TaxLocalizationLine {
  jurisdiction: TaxJurisdiction;
  kind: TaxKindLocalized;
  amountCents: number;
  taxCents: number;
  ratePercent: number;
  reverseCharge: boolean;
}
```

#### `TaxLocalizationState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L11) `packages/payment/src/semantics/tax-localization.ts`

Tax localization axis — VAT + GST + sales tax + EU DAC7 reporting. Real merchants selling cross-border have to compute the correct indirect tax by jurisdiction (EU VAT MOSS / OSS, UK VAT, AU GST, US destination sales tax) and file periodic marketplace reporting under EU DAC7 for digital platforms.

```ts
export type TaxLocalizationState =
  | 'calculating'
  | 'calculated'
  | 'reported'
  | 'exempt';
```

#### `ThreeDsSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L20) `packages/payment/src/semantics/three-ds.ts`

```ts
export interface ThreeDsSession {
  paymentIntentId: string;
  amountCents: number;
  currency?: string;
  customerId: string;
  state: ThreeDsState;
  history: AxisStep<ThreeDsState>[];
}
```

#### `ThreeDsState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L12) `packages/payment/src/semantics/three-ds.ts`

3D Secure v2 challenge flow. Real providers surface 3DS through a two- or three-step flow: fingerprint (device data collection), challenge (user interaction), result (accept/reject). Frictionless flow skips the challenge when the issuer risk assessment is low. The mock reproduces the observable envelope only — no real ACS callout, just event ordering with sensible metadata (transStatus, eci) drawn from EMVCo 3DS 2.2.

```ts
export type ThreeDsState =
  | 'fingerprint'
  | 'challenge-pending'
  | 'completed'
  | 'frictionless';
```

#### `ThreeDsTransStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L18) `packages/payment/src/semantics/three-ds.ts`

```ts
export type ThreeDsTransStatus = 'Y' | 'N' | 'A' | 'C' | 'U' | 'R';
```

#### `VaultSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L29) `packages/payment/src/semantics/payment-method-vault.ts`

```ts
export interface VaultSession {
  customerId: string;
  currency?: string;
  tokens: Map<string, VaultToken>;
  state: VaultState;
  pciScope: 'SAQ-A' | 'SAQ-A-EP' | 'SAQ-D' | 'unknown';
  history: AxisStep<VaultState>[];
}
```

#### `VaultState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L11) `packages/payment/src/semantics/payment-method-vault.ts`

Payment method vault axis — tokenization + PCI DSS SAQ-A + cross-provider migration. Real merchants tokenize PAN + CVV so the raw card data never lands on their systems (SAQ-A / SAQ-A-EP compliance) and portable tokens (network tokens, PSP-agnostic tokens) let merchants migrate from Stripe to Paddle without asking customers to re-enter card details.

```ts
export type VaultState =
  | 'empty'
  | 'tokenized'
  | 'revoked'
  | 'migrated'
  | 'pci-verified';
```

#### `VaultToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L18) `packages/payment/src/semantics/payment-method-vault.ts`

```ts
export interface VaultToken {
  tokenId: string;
  provider: PaymentProvider;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  fingerprint: string;
  networkTokenId?: string;
}
```

#### `WebhookIdempotencyConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L20) `packages/payment/src/semantics/webhook-idempotency.ts`

```ts
export interface WebhookIdempotencyConfig {
  /** ms window for dedup lookups (event ids older than this are pruned) */
  dedupWindowMs?: number;
  /** max redelivery attempts before poison-queue */
  maxDeliveryAttempts?: number;
  /** ms window for replay protection (timestamp tolerance) */
  replayToleranceMs?: number;
}
```

#### `WebhookIdempotencySession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L29) `packages/payment/src/semantics/webhook-idempotency.ts`

```ts
export interface WebhookIdempotencySession {
  handlerName: string;
  config: Required<WebhookIdempotencyConfig>;
  seenIds: Map<string, number>;
  signatureVersion: number;
  deliveryFailures: Map<string, number>;
  state: WebhookState;
  history: AxisStep<WebhookState>[];
}
```

#### `WebhookState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L13) `packages/payment/src/semantics/webhook-idempotency.ts`

Webhook idempotency advanced axis — dedup key + replay protection + signature rotation + poison queue. Real payment webhooks routinely duplicate (retry storms, at-least-once delivery), replay attackers can capture and resubmit a valid signed body inside the tolerance window, providers rotate signing secrets during incident response, and repeatedly failing handlers need to be sidelined into a poison queue so successful traffic isn't blocked.

```ts
export type WebhookState =
  | 'idle'
  | 'dedup-hit'
  | 'replay-blocked'
  | 'rotated'
  | 'poisoned';
```

#### `WebhookVerifyResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L45) `packages/payment/src/types.ts`

Signature verify result — returned by every provider's `verifyWebhook`. Includes the parsed event on success and a reason string on failure so kiwa tests can assert on specific rejection paths without string-matching the whole error message.

```ts
export interface WebhookVerifyResult {
  ok: boolean;
  event: PaymentWebhookEvent | null;
  reason: 'ok' | 'bad-signature' | 'stale-timestamp' | 'malformed-body';
}
```
<!-- kiwa-public-api:end -->
