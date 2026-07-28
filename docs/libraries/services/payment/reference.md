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
| <code v-pre>expected $&#123;provider&#125; in $&#123;expected&#125; mode but resolved $&#123;resolved.mode&#125; ($&#123;resolved.reason&#125;)</code> | [packages/payment/src/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L81) |
| <code v-pre>scheduleInstallment: all installments already scheduled</code> | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L111) |
| <code v-pre>scoreRisk: score must be between 0 and 100</code> | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L133) |
| <code v-pre>chargeLateFee: session is $&#123;session.state&#125;</code> | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L157) |
| <code v-pre>chargeLateFee: installmentIndex out of range</code> | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L160) |
| <code v-pre>createBnplPlan: totalCents must be positive</code> | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L69) |
| <code v-pre>createBnplPlan: installments must be between 2 and 12</code> | [packages/payment/src/semantics/bnpl.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L76) |
| <code v-pre>submitEvidence: chargeback $&#123;chargeback.id&#125; is $&#123;chargeback.state&#125;</code> | [packages/payment/src/semantics/chargeback.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L100) |
| <code v-pre>resolveChargeback: chargeback is $&#123;chargeback.state&#125;, submit evidence first</code> | [packages/payment/src/semantics/chargeback.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L139) |
| <code v-pre>confirmTx: session is $&#123;session.state&#125;</code> | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L111) |
| <code v-pre>confirmTx: invoice expired</code> | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L116) |
| <code v-pre>abstractGas: gas abstraction disabled in config</code> | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L142) |
| <code v-pre>abstractGas: gasSubsidyCents must be non-negative</code> | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L145) |
| <code v-pre>linkWallet: walletAddress must not be empty</code> | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L163) |
| <code v-pre>linkWallet: signature required for wallet linkage</code> | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L166) |
| <code v-pre>createCryptoInvoice: amountCents must be positive</code> | [packages/payment/src/semantics/crypto-payment.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L72) |
| <code v-pre>escalateArbitration: dispute must be represented first</code> | [packages/payment/src/semantics/dispute.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L110) |
| <code v-pre>shiftLiability: liability already shifted</code> | [packages/payment/src/semantics/dispute.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L130) |
| <code v-pre>submitDisputeEvidence: session is $&#123;session.state&#125;, cannot add evidence</code> | [packages/payment/src/semantics/dispute.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L72) |
| <code v-pre>representDispute: evidence must be submitted first</code> | [packages/payment/src/semantics/dispute.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L90) |
| <code v-pre>representDispute: cannot represent without evidence</code> | [packages/payment/src/semantics/dispute.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L93) |
| <code v-pre>finalizeDunning: session already $&#123;session.state&#125;</code> | [packages/payment/src/semantics/dunning.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L123) |
| <code v-pre>dunningAttempt: session is $&#123;session.state&#125;, cannot attempt</code> | [packages/payment/src/semantics/dunning.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L83) |
| <code v-pre>verifyKyb: KYB not required for this session</code> | [packages/payment/src/semantics/embedded-finance.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L124) |
| <code v-pre>issueCard: KYC must be verified before issuing a card</code> | [packages/payment/src/semantics/embedded-finance.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L144) |
| <code v-pre>issueCard: KYB must be verified before issuing a card</code> | [packages/payment/src/semantics/embedded-finance.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L147) |
| <code v-pre>verifyKyc: session is $&#123;session.state&#125;</code> | [packages/payment/src/semantics/embedded-finance.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L95) |
| <code v-pre>verifyKyc: score must be between 0 and 100</code> | [packages/payment/src/semantics/embedded-finance.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L98) |
| <code v-pre>scoreDevice: score must be between 0 and 100</code> | [packages/payment/src/semantics/fraud-detection-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L100) |
| <code v-pre>verifyBiometric: confidence must be between 0 and 1</code> | [packages/payment/src/semantics/fraud-detection-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L123) |
| <code v-pre>flagVelocity: attemptsInWindow must be non-negative</code> | [packages/payment/src/semantics/fraud-detection-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L144) |
| <code v-pre>scoreMlBlock: score must be between 0 and 1</code> | [packages/payment/src/semantics/fraud-detection-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L168) |
| <code v-pre>initiateSettlement: no rate locked</code> | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L133) |
| <code v-pre>initiateSettlement: rate lock expired</code> | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L137) |
| <code v-pre>completeSettlement: session is $&#123;session.state&#125;, must be settlement-initiated</code> | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L157) |
| <code v-pre>completeSettlement: no rate locked</code> | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L163) |
| <code v-pre>expireRate: no rate locked</code> | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L183) |
| <code v-pre>lockRate: rate must be positive</code> | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L95) |
| <code v-pre>lockRate: amountFromCents must be positive</code> | [packages/payment/src/semantics/fx-cross-border.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L98) |
| <code v-pre>payInvoice: invoice $&#123;invoice.id&#125; is $&#123;invoice.state&#125;</code> | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L107) |
| <code v-pre>voidInvoice: invoice $&#123;invoice.id&#125; is $&#123;invoice.state&#125;, cannot void</code> | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L142) |
| <code v-pre>markUncollectible: invoice $&#123;invoice.id&#125; is $&#123;invoice.state&#125;</code> | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L176) |
| <code v-pre>creditNoteInvoice: invoice $&#123;invoice.id&#125; is $&#123;invoice.state&#125;, must be paid</code> | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L212) |
| <code v-pre>creditNoteInvoice: creditAmountCents must be &gt; 0</code> | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L215) |
| <code v-pre>creditNoteInvoice: credit $&#123;input.creditAmountCents&#125; exceeds invoice $&#123;invoice.amountCents&#125;</code> | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L218) |
| <code v-pre>openInvoice: invoice $&#123;invoice.id&#125; is $&#123;invoice.state&#125;</code> | [packages/payment/src/semantics/invoice.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L74) |
| <code v-pre>routeCharge: no adapter registered for $&#123;provider&#125;</code> | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L101) |
| <code v-pre>routeCharge: no adapter for failover $&#123;session.config.providers&#91;session.currentProviderIndex&#93;&#125;</code> | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L126) |
| <code v-pre>probeCircuit: session is $&#123;session.state&#125;, not circuit-open</code> | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L147) |
| <code v-pre>probeCircuit: currentProviderIndex out of range</code> | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L153) |
| <code v-pre>probeCircuit: no adapter for $&#123;provider&#125;</code> | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L172) |
| <code v-pre>startOrchestration: providers must not be empty</code> | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L64) |
| <code v-pre>routeCharge: session already terminated</code> | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L93) |
| <code v-pre>routeCharge: circuit is open, call probeCircuit first</code> | [packages/payment/src/semantics/orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L96) |
| <code v-pre>migrateToken: source token $&#123;input.tokenId&#125; not found</code> | [packages/payment/src/semantics/payment-method-vault.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L115) |
| <code v-pre>migrateToken: source token belongs to $&#123;source.provider&#125;, not $&#123;fromAdapter.provider&#125;</code> | [packages/payment/src/semantics/payment-method-vault.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L118) |
| <code v-pre>verifyPciScope: raw PAN/CVV detected in vault</code> | [packages/payment/src/semantics/payment-method-vault.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L172) |
| <code v-pre>tokenizeCard: token $&#123;input.tokenId&#125; already exists</code> | [packages/payment/src/semantics/payment-method-vault.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L66) |
| <code v-pre>revokeToken: token $&#123;input.tokenId&#125; not found</code> | [packages/payment/src/semantics/payment-method-vault.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L92) |
| <code v-pre>scoreMl: ML scoring disabled in config</code> | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L118) |
| <code v-pre>scoreMl: score must be between 0 and 1</code> | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L121) |
| <code v-pre>scoreMl: no adapter for $&#123;providerName&#125;</code> | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L128) |
| <code v-pre>triggerFallback: cascade already exhausted</code> | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L146) |
| <code v-pre>triggerFallback: no adapter for $&#123;lastProvider&#125;</code> | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L159) |
| <code v-pre>triggerFallback: currentIndex out of range</code> | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L169) |
| <code v-pre>triggerFallback: no adapter for $&#123;providerName&#125;</code> | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L173) |
| <code v-pre>startOrchestrationII: providers must not be empty</code> | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L64) |
| <code v-pre>smartRoute: session is $&#123;session.state&#125;</code> | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L90) |
| <code v-pre>smartRoute: currentIndex out of range</code> | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L94) |
| <code v-pre>smartRoute: no adapter for $&#123;providerName&#125;</code> | [packages/payment/src/semantics/payment-orchestration-ii.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L98) |
| <code v-pre>revokeMandate: mandate $&#123;mandate.id&#125; is $&#123;mandate.state&#125;</code> | [packages/payment/src/semantics/psd2.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L81) |
| <code v-pre>recordChurn: churnCents must be non-negative</code> | [packages/payment/src/semantics/recurring-revenue-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L101) |
| <code v-pre>recordExpansion: expansionCents must be non-negative</code> | [packages/payment/src/semantics/recurring-revenue-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L122) |
| <code v-pre>recordContraction: contractionCents must be non-negative</code> | [packages/payment/src/semantics/recurring-revenue-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L170) |
| <code v-pre>startRecurringRevenue: mrrStartCents must be non-negative</code> | [packages/payment/src/semantics/recurring-revenue-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L51) |
| <code v-pre>preventChargeback: chargebackPrevention disabled in policy</code> | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L138) |
| <code v-pre>refund window has expired</code> | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L145) |
| <code v-pre>amount below minAmountCents</code> | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L151) |
| <code v-pre>amount above maxAmountCents</code> | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L154) |
| <code v-pre>partialRefund: refund exceeds original charge</code> | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L81) |
| <code v-pre>fullRefund: no remaining amount to refund</code> | [packages/payment/src/semantics/refund-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L98) |
| <code v-pre>reportPsd2: challengeRate must be between 0 and 1</code> | [packages/payment/src/semantics/regulatory-reporting.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L103) |
| <code v-pre>reportDora: ictRiskScore must be between 0 and 100</code> | [packages/payment/src/semantics/regulatory-reporting.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L139) |
| <code v-pre>fileSar: SAR already filed for this session</code> | [packages/payment/src/semantics/regulatory-reporting.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L175) |
| <code v-pre>fileSar: reason must not be empty</code> | [packages/payment/src/semantics/regulatory-reporting.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L178) |
| <code v-pre>retryDeliver: session is $&#123;session.state&#125;</code> | [packages/payment/src/semantics/retry.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L78) |
| <code v-pre>advanceCascade: session already $&#123;session.state&#125;</code> | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L106) |
| <code v-pre>advanceCascade: cascade exhausted</code> | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L110) |
| <code v-pre>advanceCascade: cascade step index out of range</code> | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L115) |
| <code v-pre>applyCardUpdate: cardUpdater disabled in config</code> | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L136) |
| <code v-pre>applyNetworkToken: networkTokenization disabled in config</code> | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L156) |
| <code v-pre>scheduleSmartRetry: session already $&#123;session.state&#125;</code> | [packages/payment/src/semantics/revenue-recovery.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L88) |
| <code v-pre>scaAuthenticate: session is $&#123;session.state&#125;</code> | [packages/payment/src/semantics/sca.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L119) |
| <code v-pre>scaEvaluate: session is $&#123;session.state&#125;</code> | [packages/payment/src/semantics/sca.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L61) |
| <code v-pre>pauseSubscription: subscription is $&#123;subscription.state&#125;</code> | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L132) |
| <code v-pre>resumeSubscription: subscription is $&#123;subscription.state&#125;</code> | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L166) |
| <code v-pre>cancelSubscription: subscription is already canceled</code> | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L200) |
| <code v-pre>reactivateSubscription: subscription is $&#123;subscription.state&#125;</code> | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L234) |
| <code v-pre>changePlan: subscription $&#123;subscription.id&#125; is canceled</code> | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L82) |
| <code v-pre>changePlan: subscription $&#123;subscription.id&#125; is paused, resume first</code> | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L85) |
| <code v-pre>changePlan: newAmountCents equals current amountCents (no-op)</code> | [packages/payment/src/semantics/subscription-lifecycle.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L88) |
| <code v-pre>exitGracePeriod: session is $&#123;session.state&#125;</code> | [packages/payment/src/semantics/subscription-state-machine.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L101) |
| <code v-pre>applyProration: daysInCycle must be positive</code> | [packages/payment/src/semantics/subscription-state-machine.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L125) |
| <code v-pre>enterGracePeriod: session is $&#123;session.state&#125;, must be active</code> | [packages/payment/src/semantics/subscription-state-machine.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L82) |
| <code v-pre>threeDsFrictionless: session is $&#123;session.state&#125;</code> | [packages/payment/src/semantics/three-ds.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L136) |
| <code v-pre>threeDsRequestChallenge: session is $&#123;session.state&#125;</code> | [packages/payment/src/semantics/three-ds.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L60) |
| <code v-pre>threeDsSubmitChallenge: session is $&#123;session.state&#125;</code> | [packages/payment/src/semantics/three-ds.ts](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L99) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [engine.ts](./api/engine) | 1 | 1 |
| [fixture.ts](./api/fixture) | 4 | 0 |
| [lemonsqueezy.ts](./api/lemonsqueezy) | 1 | 0 |
| [paddle.ts](./api/paddle) | 1 | 0 |
| [real-driver.ts](./api/real-driver) | 3 | 2 |
| [semantics/bnpl.ts](./api/semantics__bnpl) | 5 | 3 |
| [semantics/chargeback.ts](./api/semantics__chargeback) | 3 | 3 |
| [semantics/crypto-payment.ts](./api/semantics__crypto-payment) | 4 | 5 |
| [semantics/dispute.ts](./api/semantics__dispute) | 6 | 2 |
| [semantics/dunning.ts](./api/semantics__dunning) | 3 | 3 |
| [semantics/embedded-finance.ts](./api/semantics__embedded-finance) | 5 | 4 |
| [semantics/fidelity.ts](./api/semantics__fidelity) | 1 | 2 |
| [semantics/fraud-detection-advanced.ts](./api/semantics__fraud-detection-advanced) | 5 | 4 |
| [semantics/fx-cross-border.ts](./api/semantics__fx-cross-border) | 5 | 5 |
| [semantics/invoice.ts](./api/semantics__invoice) | 6 | 2 |
| [semantics/lifecycle-orchestrator.ts](./api/semantics__lifecycle-orchestrator) | 3 | 4 |
| [semantics/orchestration.ts](./api/semantics__orchestration) | 3 | 3 |
| [semantics/payment-method-vault.ts](./api/semantics__payment-method-vault) | 5 | 3 |
| [semantics/payment-orchestration-ii.ts](./api/semantics__payment-orchestration-ii) | 4 | 3 |
| [semantics/psd2.ts](./api/semantics__psd2) | 3 | 3 |
| [semantics/recurring-revenue-advanced.ts](./api/semantics__recurring-revenue-advanced) | 6 | 3 |
| [semantics/refund-advanced.ts](./api/semantics__refund-advanced) | 6 | 3 |
| [semantics/regulatory-reporting.ts](./api/semantics__regulatory-reporting) | 6 | 5 |
| [semantics/retry.ts](./api/semantics__retry) | 3 | 3 |
| [semantics/revenue-recovery.ts](./api/semantics__revenue-recovery) | 6 | 3 |
| [semantics/sca.ts](./api/semantics__sca) | 3 | 3 |
| [semantics/subscription-lifecycle.ts](./api/semantics__subscription-lifecycle) | 6 | 2 |
| [semantics/subscription-state-machine.ts](./api/semantics__subscription-state-machine) | 5 | 3 |
| [semantics/tax.ts](./api/semantics__tax) | 2 | 3 |
| [semantics/tax-localization.ts](./api/semantics__tax-localization) | 2 | 5 |
| [semantics/three-ds.ts](./api/semantics__three-ds) | 4 | 3 |
| [semantics/types.ts](./api/semantics__types) | 1 | 3 |
| [semantics/webhook-idempotency.ts](./api/semantics__webhook-idempotency) | 4 | 3 |
| [stripe.ts](./api/stripe) | 1 | 0 |
| [types.ts](./api/types) | 1 | 4 |

<!-- kiwa-public-api:end -->
