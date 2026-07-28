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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>abstractGas</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L136) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

Abstract gas via paymaster (EIP-4337 or similar meta-tx). Customer pays in the invoice token; the paymaster covers the native gas token.

```ts
export declare function abstractGas(adapter: PaymentAdapter, session: CryptoPaymentSession, input: {
    paymasterAddress: string;
    gasSubsidyCents: number;
}): Promise<AxisStep<CryptoPaymentState>>;
```

#### <code v-pre>advanceCascade</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L101) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Advance the dunning cascade one step. Emits `recovery.dunning_cascade_step` with the channel (email / in-app / sms / push) and step index.

```ts
export declare function advanceCascade(adapter: PaymentAdapter, session: RecoverySession): Promise<AxisStep<RecoveryState>>;
```

#### <code v-pre>applyCardUpdate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L130) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Card updater ran — customer's expiring card was refreshed via the network. Emits `recovery.card_updated` with the new PAN suffix hint.

```ts
export declare function applyCardUpdate(adapter: PaymentAdapter, session: RecoverySession, input: {
    last4: string;
    expMonth: number;
    expYear: number;
}): Promise<AxisStep<RecoveryState>>;
```

#### <code v-pre>applyNetworkToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L150) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Network tokenization applied — customer card issued a network token that survives PAN re-issue.

```ts
export declare function applyNetworkToken(adapter: PaymentAdapter, session: RecoverySession, input: {
    networkTokenId: string;
}): Promise<AxisStep<RecoveryState>>;
```

#### <code v-pre>applyProration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L115) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Apply proration for a mid-cycle plan change. `daysElapsed` is the number of days into the current billing cycle; `newPlanPriceCents` is the target plan's monthly price.

```ts
export declare function applyProration(adapter: PaymentAdapter, session: SubscriptionMachineSession, input: {
    daysElapsed: number;
    daysInCycle: number;
    newPlanPriceCents: number;
}): Promise<AxisStep<SubscriptionMachineState>>;
```

#### <code v-pre>assertMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L74) <code v-pre>packages/payment/src/real-driver.ts</code>

Assert that a provider is in a specific mode. Used by dogfood apps that expect real driver mode in CI + fail loudly if the env is not configured.

```ts
export declare function assertMode(provider: PaymentProvider, expected: PaymentMode, env?: Record<string, string | undefined>): void;
```

#### <code v-pre>calculateLocalizedTax</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L67) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

Compute the tax line for a given jurisdiction + amount + B2B flag. Handles EU reverse charge (B2B intra-EU → tax borne by buyer) and emits the correct provider dialect for VAT vs GST vs sales-tax.

```ts
export declare function calculateLocalizedTax(adapter: PaymentAdapter, input: TaxLocalizationInput): Promise<{
    line: TaxLocalizationLine;
    step: AxisStep<TaxLocalizationState>;
}>;
```

#### <code v-pre>calculateTax</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L61) <code v-pre>packages/payment/src/semantics/tax.ts</code>

Pure tax calculation — no adapter side effect. Returns a fully populated {@link TaxLine} so callers can decide whether to emit `tax.calculated`, `tax.reverse_charged` or `tax.exempted`. Rules: - buyer B2B (has VAT id) + cross-border EU + digital / service → reverse charge - buyer country not in table → exempt (out of coverage) - otherwise → standard calc netCents * rateBps / 10000

```ts
export declare function calculateTax(input: TaxCalcInput): TaxLine;
```

#### <code v-pre>cancelSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L195) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Cancel the subscription. Emits `subscription.canceled`. Idempotent guard: cancelling an already-canceled subscription throws.

```ts
export declare function cancelSubscription(adapter: PaymentAdapter, subscription: Subscription): Promise<AxisStep<SubscriptionState>>;
```

#### <code v-pre>changePlan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L76) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Change plan (upgrade or downgrade). The amount change relative to the current plan determines the neutral event: strictly greater = `upgraded`, strictly less = `downgraded`. Equal-amount change is rejected so tests exercise no-op guards explicitly.

```ts
export declare function changePlan(adapter: PaymentAdapter, subscription: Subscription, input: {
    newPlanId: string;
    newAmountCents: number;
}): Promise<AxisStep<SubscriptionState>>;
```

#### <code v-pre>chargeLateFee</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L151) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

Charge a late fee for a missed installment.

```ts
export declare function chargeLateFee(adapter: PaymentAdapter, session: BnplSession, input: {
    installmentIndex: number;
}): Promise<AxisStep<BnplState>>;
```

#### <code v-pre>checkoutCompleted</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L12) <code v-pre>packages/payment/src/fixture.ts</code>

Common fixture builders for the 3 provider mocks. Each fixture returns an already-signed webhook (rawBody + signature + parsed event) so tests can either pass the rawBody + signature into `verifyWebhook` or hand the event directly to `emit`. Only high-frequency event types are covered here — for provider-specific event types, call `signWebhook({ type: '...', ... })` directly.

```ts
export declare const checkoutCompleted: (adapter: PaymentAdapter, input: {
    amountCents: number;
    currency?: string;
    customerId: string;
}) => {
    rawBody: string;
    signature: string;
    event: PaymentWebhookEvent;
};
```

#### <code v-pre>closeAccount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L162) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Close the account — terminal state, no further ops accepted.

```ts
export declare function closeAccount(session: EmbeddedFinanceSession): EmbeddedFinanceSession;
```

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fidelity.ts#L166) <code v-pre>packages/payment/src/semantics/fidelity.ts</code>

Collect the provider × axis coverage grid. `adapters` is the list of adapters to inspect — usually all 3 (`createStripeMock()`, `createPaddleMock()`, `createLemonSqueezyMock()`). The output is a flat row list `adapters.length * 25 = 75` for the default setup (9 v0.3 axis + 8 v0.4 axis + 8 v0.5 axis = 25 axis × 3 provider), plus `providers` + `axes` roll-up lists so callers can assert on the grid dimensions.

```ts
export declare function collectFidelityCoverage(adapters: PaymentAdapter[]): FidelityCoverage;
```

#### <code v-pre>completeSettlement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L151) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

Complete settlement — funds arrived at the beneficiary bank.

```ts
export declare function completeSettlement(adapter: PaymentAdapter, session: FxSession, input: {
    settlementRef: string;
}): Promise<AxisStep<FxState>>;
```

#### <code v-pre>computeMrr</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L79) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Compute MRR / ARR from the current snapshot. MRR = mrrEnd, ARR = MRR × 12.

```ts
export declare function computeMrr(adapter: PaymentAdapter, session: RecurringRevenueSession): Promise<AxisStep<RecurringRevenueState>>;
```

#### <code v-pre>computeNrr</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L140) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Compute NRR (Net Revenue Retention) — the industry-standard growth quality metric. NRR = (MRR_start - churn - contraction + expansion) / MRR_start × 100. NRR &gt; 100% means the cohort grew despite churn.

```ts
export declare function computeNrr(adapter: PaymentAdapter, session: RecurringRevenueSession): Promise<AxisStep<RecurringRevenueState>>;
```

#### <code v-pre>confirmTx</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L105) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

Record an on-chain confirmation. Emits `crypto.tx_confirmed` once the required confirmation count is reached.

```ts
export declare function confirmTx(adapter: PaymentAdapter, session: CryptoPaymentSession, input: {
    txHash: string;
    confirmations: number;
}): Promise<AxisStep<CryptoPaymentState>>;
```

#### <code v-pre>createBnplPlan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L58) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

Create a BNPL plan. Splits `totalCents` into equal installments (rounded to integer cents; the last installment absorbs any rounding remainder).

```ts
export declare function createBnplPlan(adapter: PaymentAdapter, input: {
    planId: string;
    customerId: string;
    totalCents: number;
    currency?: string;
    config: BnplConfig;
}): Promise<{
    session: BnplSession;
    step: AxisStep<BnplState>;
}>;
```

#### <code v-pre>createCryptoInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L59) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

Create a crypto invoice for the given amount + chain + token.

```ts
export declare function createCryptoInvoice(adapter: PaymentAdapter, input: {
    invoiceId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    chain: Chain;
    token: Stablecoin;
    config?: CryptoInvoiceConfig;
}): Promise<{
    session: CryptoPaymentSession;
    step: AxisStep<CryptoPaymentState>;
}>;
```

#### <code v-pre>createLemonSqueezyMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/lemonsqueezy.ts#L10) <code v-pre>packages/payment/src/lemonsqueezy.ts</code>

Lemon Squeezy webhook mock. Real Lemon Squeezy: `X-Signature: hmac_sha256({body})` (no timestamp mixed in — LS signs the raw body only, verified against a webhook secret). The mock still adds a timestamp for freshness checks so tests can exercise stale rejection.

```ts
export declare function createLemonSqueezyMock(config?: {
    secret?: string;
    toleranceMs?: number;
    now?: () => number;
}): PaymentAdapter;
```

#### <code v-pre>createMandate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L29) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

Create a new mandate. Emits `psd2.mandate_created` with the scheme embedded in metadata so downstream tests can filter per scheme.

```ts
export declare function createMandate(adapter: PaymentAdapter, input: {
    scheme: PsdMandateScheme;
    customerId: string;
    amountCentsCap?: number;
    currency?: string;
}): Promise<{
    mandate: PsdMandate;
    step: AxisStep<PsdMandateState>;
}>;
```

#### <code v-pre>createPaddleMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/paddle.ts#L10) <code v-pre>packages/payment/src/paddle.ts</code>

Paddle Billing (Paddle v2) webhook mock. Real Paddle: `Paddle-Signature: ts=...;h1=...` over `{ts}:{body}` with HMAC-SHA256, notification secret. Shape difference vs Stripe: Paddle uses `data.attributes.*` instead of `data.object.*`.

```ts
export declare function createPaddleMock(config?: {
    secret?: string;
    toleranceMs?: number;
    now?: () => number;
}): PaymentAdapter;
```

#### <code v-pre>createStripeMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/stripe.ts#L10) <code v-pre>packages/payment/src/stripe.ts</code>

Stripe webhook mock. Real Stripe: `Stripe-Signature: t={ts},v1={sig}` over `{ts}.{body}`, secret from `whsec_*`. This mock exercises the same HMAC-SHA256 signing so tests that verify with the real Stripe SDK can run against this fixture.

```ts
export declare function createStripeMock(config?: {
    secret?: string;
    toleranceMs?: number;
    now?: () => number;
}): PaymentAdapter;
```

#### <code v-pre>createSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L30) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Create a new subscription. Emits `subscription.created`.

```ts
export declare function createSubscription(adapter: PaymentAdapter, input: {
    customerId: string;
    planId: string;
    amountCents: number;
    currency?: string;
}): Promise<{
    subscription: Subscription;
    step: AxisStep<SubscriptionState>;
}>;
```

#### <code v-pre>creditNoteInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L206) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Issue a credit note against a paid invoice. Emits `invoice.credit_noted` with the credit amount (negative, capped at the invoice amount so tests fail loudly on overrefund attempts).

```ts
export declare function creditNoteInvoice(adapter: PaymentAdapter, invoice: Invoice, input: {
    creditAmountCents: number;
}): Promise<AxisStep<InvoiceState>>;
```

#### <code v-pre>deliver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L70) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

Attempt to deliver an event to the handler. Returns true if the caller should invoke the handler; false if the event was deduped, replay-blocked, or already poisoned.

```ts
export declare function deliver(adapter: PaymentAdapter, session: WebhookIdempotencySession, event: PaymentWebhookEvent): Promise<{
    deliver: boolean;
    step: AxisStep<WebhookState>;
}>;
```

#### <code v-pre>denyByPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L109) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Explicit deny — the merchant refuses the refund because it violates policy (e.g., digital goods post-download).

```ts
export declare function denyByPolicy(adapter: PaymentAdapter, session: RefundSession): Promise<AxisStep<RefundState>>;
```

#### <code v-pre>draftInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L29) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Draft a new invoice. Emits `invoice.drafted`.

```ts
export declare function draftInvoice(adapter: PaymentAdapter, input: {
    customerId: string;
    amountCents: number;
    currency?: string;
}): Promise<{
    invoice: Invoice;
    step: AxisStep<InvoiceState>;
}>;
```

#### <code v-pre>dunningAttempt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L78) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

Run the next dunning attempt. Emits `dunning.attempt` on every retry, transitions to `in-grace-period` after the last configured attempt, and finalises to `exhausted` when `finalizeDunning` is called with `succeed: false` (or `recovered` with `succeed: true`).

```ts
export declare function dunningAttempt(adapter: PaymentAdapter, session: DunningSession): Promise<AxisStep<DunningState>>;
```

#### <code v-pre>emitTaxLine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L105) <code v-pre>packages/payment/src/semantics/tax.ts</code>

Emit the tax outcome. Neutral event = `tax.calculated` (standard), `tax.reverse_charged` (B2B intra-EU) or `tax.exempted` (out of coverage).

```ts
export declare function emitTaxLine(adapter: PaymentAdapter, input: {
    customerId: string;
    line: TaxLine;
    currency?: string;
}): Promise<AxisStep<'calculated' | 'reverse-charged' | 'exempted'>>;
```

#### <code v-pre>enterGracePeriod</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L77) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Enter grace period after payment failure. Grace period is a bounded window where the subscription is still active from the customer's POV but the merchant has stopped granting renewed entitlement.

```ts
export declare function enterGracePeriod(adapter: PaymentAdapter, session: SubscriptionMachineSession): Promise<AxisStep<SubscriptionMachineState>>;
```

#### <code v-pre>escalateArbitration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L105) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Escalate to arbitration — final round in the card-network dispute process, decided by the network with a non-refundable filing fee.

```ts
export declare function escalateArbitration(adapter: PaymentAdapter, session: DisputeSession): Promise<AxisStep<DisputeState>>;
```

#### <code v-pre>exitGracePeriod</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L95) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Exit grace period — either payment recovered (returns to active) or timeout reached (returns to expired).

```ts
export declare function exitGracePeriod(adapter: PaymentAdapter, session: SubscriptionMachineSession, input: {
    recovered: boolean;
}): Promise<AxisStep<SubscriptionMachineState>>;
```

#### <code v-pre>expireRate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L178) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

Explicitly expire the current rate lock — used when the caller detects the lock window has passed.

```ts
export declare function expireRate(adapter: PaymentAdapter, session: FxSession): Promise<AxisStep<FxState>>;
```

#### <code v-pre>fileSar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L164) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

File a SAR (Suspicious Activity Report) with FinCEN / NCA. Terminal-ish — a filed SAR is not deletable, so the session enters `sar-filed` state and can only be moved to `audit-locked` afterwards.

```ts
export declare function fileSar(adapter: PaymentAdapter, session: RegulatoryReportingSession, input: {
    reportId: string;
    regulator: 'FinCEN' | 'NCA';
    reason: string;
    fingerprint: string;
}): Promise<AxisStep<RegulatoryReportingState>>;
```

#### <code v-pre>finalizeDispute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L143) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Terminal — dispute resolved with an outcome. `won` returns funds to the merchant; `lost` finalises the chargeback.

```ts
export declare function finalizeDispute(session: DisputeSession, input: {
    won: boolean;
}): DisputeSession;
```

#### <code v-pre>finalizeDunning</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L117) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

Terminal step — either the last attempt succeeded during grace period (`succeed: true` → `dunning.recovered`), or the grace period elapsed (`succeed: false` → `dunning.exhausted`).

```ts
export declare function finalizeDunning(adapter: PaymentAdapter, session: DunningSession, input: {
    succeed: boolean;
}): Promise<AxisStep<DunningState>>;
```

#### <code v-pre>finalizeRecovery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L167) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Mark the recovery terminal — succeeded (recovered) or exhausted (lost).

```ts
export declare function finalizeRecovery(session: RecoverySession, input: {
    succeed: boolean;
}): RecoverySession;
```

#### <code v-pre>flagVelocity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L138) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Flag velocity — records that this customer exceeded the allowed transactions-per-hour threshold.

```ts
export declare function flagVelocity(adapter: PaymentAdapter, session: FraudDetectionSession, input: {
    attemptsInWindow: number;
    windowMs: number;
}): Promise<AxisStep<FraudDetectionState>>;
```

#### <code v-pre>fullRefund</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L91) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Issue a full refund. Marks the session as fully refunded.

```ts
export declare function fullRefund(adapter: PaymentAdapter, session: RefundSession): Promise<AxisStep<RefundState>>;
```

#### <code v-pre>grantConsent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L112) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

Grant open banking consent. Emits `psd2.consent_granted` with the scope list embedded — real OBIE consents scope to `accounts` / `payments`, this mock echoes whatever caller passes so tests can assert on custom scopes.

```ts
export declare function grantConsent(adapter: PaymentAdapter, input: {
    customerId: string;
    scopes: string[];
    validForMs?: number;
}): Promise<AxisStep<'granted'>>;
```

#### <code v-pre>handleEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L74) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

event driven state 遷移 SSOT。 5 state × 8 event = 40 セル の 遷移 表を 1 switch で 実装。 無効遷移 は 現 state を保持 + events log に "invalid" 記録 (throw ではなく soft-reject、 v0.7 continuous-auth の guard-throw と 区別 = payment 経路 は event 過剰受信 が normal で、 throw だと dogfood consumer が 例外処理 に多くの コード を割く 必要が出るため soft-reject)。

```ts
export declare function handleEvent(input: {
    session: LifecycleSession;
    event: LifecycleEvent;
    timestamp: string;
}): LifecycleSession;
```

#### <code v-pre>initiateSettlement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L127) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

Initiate settlement via the configured rail (SWIFT / SEPA / ACH etc.). Rate must not have expired.

```ts
export declare function initiateSettlement(adapter: PaymentAdapter, session: FxSession, input: {
    beneficiaryIban?: string;
    beneficiaryBic?: string;
}): Promise<AxisStep<FxState>>;
```

#### <code v-pre>issueCard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L138) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Issue a virtual or physical card against the account. Requires KYC verified (and KYB verified when required).

```ts
export declare function issueCard(adapter: PaymentAdapter, session: EmbeddedFinanceSession, input: {
    cardId: string;
    type: 'virtual' | 'physical';
    last4: string;
}): Promise<AxisStep<EmbeddedFinanceState>>;
```

#### <code v-pre>linkWallet</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L157) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

Link a wallet address to the customer id for repeat billing.

```ts
export declare function linkWallet(adapter: PaymentAdapter, session: CryptoPaymentSession, input: {
    walletAddress: string;
    signature: string;
}): Promise<AxisStep<CryptoPaymentState>>;
```

#### <code v-pre>lockForAudit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L201) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Lock the session for audit — no further reports accepted.

```ts
export declare function lockForAudit(session: RegulatoryReportingSession): RegulatoryReportingSession;
```

#### <code v-pre>lockRate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L83) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

Lock an FX rate for the given currency pair + amount. The rate stays valid for `rateLockDurationMs`, after which callers must call `expireRate` and re-lock.

```ts
export declare function lockRate(adapter: PaymentAdapter, session: FxSession, input: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    quoteId: string;
    amountFromCents: number;
}): Promise<AxisStep<FxState>>;
```

#### <code v-pre>markInstallmentPaid</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L175) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

Mark an installment as paid. Once all installments are paid the session enters `settled`.

```ts
export declare function markInstallmentPaid(session: BnplSession): BnplSession;
```

#### <code v-pre>markUncollectible</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L171) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Mark an invoice uncollectible (dunning exhausted). Emits `invoice.uncollectible`. Only allowed from `open`.

```ts
export declare function markUncollectible(adapter: PaymentAdapter, invoice: Invoice): Promise<AxisStep<InvoiceState>>;
```

#### <code v-pre>markWindowExpired</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L120) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Emit the window-expired terminal — refund attempted outside the window.

```ts
export declare function markWindowExpired(adapter: PaymentAdapter, session: RefundSession): Promise<AxisStep<RefundState>>;
```

#### <code v-pre>migrateToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L107) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Migrate a token from one provider to another. The source token must exist; the target adapter receives a new token id under its provider namespace with the same fingerprint / network-token linkage.

```ts
export declare function migrateToken(fromAdapter: PaymentAdapter, toAdapter: PaymentAdapter, session: VaultSession, input: {
    tokenId: string;
    newTokenId: string;
}): Promise<AxisStep<VaultState>>;
```

#### <code v-pre>openAccount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L54) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Open a fresh BaaS account for the customer.

```ts
export declare function openAccount(adapter: PaymentAdapter, input: {
    accountId: string;
    customerId: string;
    currency?: string;
    config?: EmbeddedFinanceConfig;
}): Promise<{
    session: EmbeddedFinanceSession;
    step: AxisStep<EmbeddedFinanceState>;
}>;
```

#### <code v-pre>openChargeback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L42) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

Open a chargeback. Emits `chargeback.opened`.

```ts
export declare function openChargeback(adapter: PaymentAdapter, input: {
    transactionId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    reason: ChargebackReason;
}): Promise<{
    chargeback: Chargeback;
    step: AxisStep<ChargebackState>;
}>;
```

#### <code v-pre>openDispute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L38) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Open a dispute against an existing charge.

```ts
export declare function openDispute(input: {
    disputeId: string;
    chargeId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    reason: string;
}): DisputeSession;
```

#### <code v-pre>openInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L69) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Open (finalise) a draft. Emits `invoice.opened`. Only allowed from `draft`.

```ts
export declare function openInvoice(adapter: PaymentAdapter, invoice: Invoice): Promise<AxisStep<InvoiceState>>;
```

#### <code v-pre>partialRefund</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L73) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Issue a partial refund. Fails if the window has expired, if the amount violates policy, or if a prior full refund has already exhausted the charge.

```ts
export declare function partialRefund(adapter: PaymentAdapter, session: RefundSession, input: {
    amountCents: number;
}): Promise<AxisStep<RefundState>>;
```

#### <code v-pre>pauseSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L127) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Pause the subscription. Emits `subscription.paused`. Only allowed from active / upgraded / downgraded states.

```ts
export declare function pauseSubscription(adapter: PaymentAdapter, subscription: Subscription): Promise<AxisStep<SubscriptionState>>;
```

#### <code v-pre>payInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L102) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Mark invoice paid. Emits `invoice.paid`. Only allowed from `open`.

```ts
export declare function payInvoice(adapter: PaymentAdapter, invoice: Invoice): Promise<AxisStep<InvoiceState>>;
```

#### <code v-pre>PAYMENT&#95;PROVIDERS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L16) <code v-pre>packages/payment/src/types.ts</code>

Runtime tuple of every payment provider, kept in sync with the `PaymentProvider` union above via `satisfies`. Downstream consumers use this to iterate provider ids at runtime (release-gate axis dispatch, fixture registration) without duplicating the string literals or reaching for reflection.

```ts
export declare const PAYMENT_PROVIDERS: readonly ["stripe", "paddle", "lemonsqueezy"];
```

#### <code v-pre>PaymentEngine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/engine.ts#L29) <code v-pre>packages/payment/src/engine.ts</code>

```ts
export declare class PaymentEngine implements PaymentAdapter {
    readonly provider: PaymentProvider;
    constructor(config: EngineConfig);
    signWebhook(input: {
        type: string;
        amountCents: number;
        currency?: string;
        customerId: string;
        timestamp?: number;
    }): {
        rawBody: string;
        signature: string;
        event: PaymentWebhookEvent;
    };
    verifyWebhook(input: {
        rawBody: string;
        signature: string;
        toleranceMs?: number;
    }): WebhookVerifyResult;
    onWebhook(handler: (event: PaymentWebhookEvent) => void | Promise<void>): () => void;
    emit(event: PaymentWebhookEvent): Promise<void>;
}
```

#### <code v-pre>paymentFailed</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L34) <code v-pre>packages/payment/src/fixture.ts</code>

```ts
export declare const paymentFailed: (adapter: PaymentAdapter, input: {
    amountCents: number;
    currency?: string;
    customerId: string;
}) => {
    rawBody: string;
    signature: string;
    event: PaymentWebhookEvent;
};
```

#### <code v-pre>preventChargeback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L133) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Chargeback prevention utility — issues a full refund whenever the merchant preemptively wants to head off a chargeback. Only fires if the policy has `chargebackPrevention: true`.

```ts
export declare function preventChargeback(adapter: PaymentAdapter, session: RefundSession): Promise<AxisStep<RefundState>>;
```

#### <code v-pre>probeCircuit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L142) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

Probe the circuit breaker — closes the breaker if the outage window has elapsed, otherwise stays open. Emits `orchestration.circuit_closed` when the breaker closes.

```ts
export declare function probeCircuit(adapters: PaymentAdapter[], session: OrchestrationSession): Promise<AxisStep<OrchestrationState>>;
```

#### <code v-pre>providerEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/types.ts#L494) <code v-pre>packages/payment/src/semantics/types.ts</code>

Translate a neutral event name to the provider dialect. Falls back to the neutral name if the provider has no specific dialect entry — this makes the map partial-safe without silent typos.

```ts
export declare function providerEventName(provider: PaymentProvider, neutral: NeutralEventName): string;
```

#### <code v-pre>reactivateSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L229) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Reactivate a canceled subscription. Emits `subscription.reactivated`. Only allowed from `canceled` — the subscription returns to `active`.

```ts
export declare function reactivateSubscription(adapter: PaymentAdapter, subscription: Subscription): Promise<AxisStep<SubscriptionState>>;
```

#### <code v-pre>recordChurn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L95) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Record churned MRR — a subscription cancellation or downgrade to 0.

```ts
export declare function recordChurn(adapter: PaymentAdapter, session: RecurringRevenueSession, input: {
    churnCents: number;
    subscriptionId: string;
}): Promise<AxisStep<RecurringRevenueState>>;
```

#### <code v-pre>recordContraction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L165) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Record contraction (downgrade without churn) — separate from churn so NRR captures the difference.

```ts
export declare function recordContraction(session: RecurringRevenueSession, input: {
    contractionCents: number;
}): RecurringRevenueSession;
```

#### <code v-pre>recordExpansion</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L116) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Record expansion MRR — an upgrade or seat add that grew the account.

```ts
export declare function recordExpansion(adapter: PaymentAdapter, session: RecurringRevenueSession, input: {
    expansionCents: number;
    subscriptionId: string;
    kind: 'upgrade' | 'seat-add' | 'usage';
}): Promise<AxisStep<RecurringRevenueState>>;
```

#### <code v-pre>refunded</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L45) <code v-pre>packages/payment/src/fixture.ts</code>

```ts
export declare const refunded: (adapter: PaymentAdapter, input: {
    amountCents: number;
    currency?: string;
    customerId: string;
}) => {
    rawBody: string;
    signature: string;
    event: PaymentWebhookEvent;
};
```

#### <code v-pre>reportDac7</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L119) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

Emit a DAC7 marketplace report entry. Real digital platforms must submit annual DAC7 reports to the EU tax authorities listing seller revenue by jurisdiction.

```ts
export declare function reportDac7(adapter: PaymentAdapter, input: {
    sellerId: string;
    reportingYear: number;
    lines: TaxLocalizationLine[];
    customerId: string;
    currency?: string;
}): Promise<AxisStep<TaxLocalizationState>>;
```

#### <code v-pre>reportDora</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L126) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Submit a DORA (Digital Operational Resilience Act) report — ICT risk management self-assessment + third-party register.

```ts
export declare function reportDora(adapter: PaymentAdapter, session: RegulatoryReportingSession, input: {
    reportId: string;
    period: ReportPeriod;
    ictRiskScore: number;
    thirdPartyCount: number;
    incidentCount: number;
    fingerprint: string;
}): Promise<AxisStep<RegulatoryReportingState>>;
```

#### <code v-pre>reportFailure</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L125) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

Report handler failure — bumps the failure counter and eventually transitions to poison state.

```ts
export declare function reportFailure(session: WebhookIdempotencySession, event: PaymentWebhookEvent): number;
```

#### <code v-pre>reportPci</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L65) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Submit a PCI DSS compliance report — attestation of Section 3.2 (do not store sensitive authentication data after authorisation).

```ts
export declare function reportPci(adapter: PaymentAdapter, session: RegulatoryReportingSession, input: {
    reportId: string;
    period: ReportPeriod;
    fingerprint: string;
    saqLevel: 'A' | 'A-EP' | 'D';
}): Promise<AxisStep<RegulatoryReportingState>>;
```

#### <code v-pre>reportPsd2</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L91) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Submit a PSD2 SCA (Strong Customer Authentication) compliance report to the EBA. Includes exemption count + challenge rate.

```ts
export declare function reportPsd2(adapter: PaymentAdapter, session: RegulatoryReportingSession, input: {
    reportId: string;
    period: ReportPeriod;
    challengeRate: number;
    exemptionCount: number;
    fingerprint: string;
}): Promise<AxisStep<RegulatoryReportingState>>;
```

#### <code v-pre>representDispute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L85) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Represent the dispute — merchant challenges the chargeback with the submitted evidence. Advances the case to second presentment.

```ts
export declare function representDispute(adapter: PaymentAdapter, session: DisputeSession): Promise<AxisStep<DisputeState>>;
```

#### <code v-pre>resolveAllModes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L62) <code v-pre>packages/payment/src/real-driver.ts</code>

Convenience — resolve modes for all 3 providers in one pass. Used by release-gate + fidelity harness to report which combinations are live.

```ts
export declare function resolveAllModes(env?: Record<string, string | undefined>): ResolvedMode[];
```

#### <code v-pre>resolveChargeback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L133) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

Resolve the dispute. `merchantWon: true` → `chargeback.won` (funds returned), `false` → `chargeback.lost` (funds forfeit + fee). Only allowed from `evidence-submitted`.

```ts
export declare function resolveChargeback(adapter: PaymentAdapter, chargeback: Chargeback, input: {
    merchantWon: boolean;
}): Promise<AxisStep<ChargebackState>>;
```

#### <code v-pre>resolveMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L39) <code v-pre>packages/payment/src/real-driver.ts</code>

Resolve the effective mode for a provider given a live env snapshot. `env` defaults to `process.env` so callers can inject a synthetic env for unit tests.

```ts
export declare function resolveMode(provider: PaymentProvider, env?: Record<string, string | undefined>): ResolvedMode;
```

#### <code v-pre>resumeSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L161) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Resume a paused subscription. Emits `subscription.resumed`. Only allowed from `paused`.

```ts
export declare function resumeSubscription(adapter: PaymentAdapter, subscription: Subscription): Promise<AxisStep<SubscriptionState>>;
```

#### <code v-pre>retryBackoffMs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L38) <code v-pre>packages/payment/src/semantics/retry.ts</code>

Compute the deterministic delay for attempt N (1-indexed). Attempt 1 has no backoff (fires immediately), attempt N &gt; 1 waits baseBackoffMs * 2^(N-2).

```ts
export declare function retryBackoffMs(attempt: number, baseBackoffMs: number): number;
```

#### <code v-pre>retryDeliver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L72) <code v-pre>packages/payment/src/semantics/retry.ts</code>

Attempt to deliver the event. If `succeed: true` the event is emitted through the adapter and the session terminates in `delivered`. If `succeed: false` and attempts remain, emits `retry.scheduled` and returns with the next delay. Once maxAttempts is reached without success, the session terminates in `abandoned`.

```ts
export declare function retryDeliver(adapter: PaymentAdapter, session: RetrySession, input: {
    succeed: boolean;
}): Promise<AxisStep<RetryState>>;
```

#### <code v-pre>revokeMandate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L76) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

Revoke an active mandate. Emits `psd2.mandate_revoked`. Idempotent — a second call on an already-revoked mandate throws so tests exercise the guard explicitly.

```ts
export declare function revokeMandate(adapter: PaymentAdapter, mandate: PsdMandate): Promise<AxisStep<PsdMandateState>>;
```

#### <code v-pre>revokeToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L85) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Revoke an existing token — customer removed the card or the fraud team blacklisted the fingerprint.

```ts
export declare function revokeToken(adapter: PaymentAdapter, session: VaultSession, input: {
    tokenId: string;
}): Promise<AxisStep<VaultState>>;
```

#### <code v-pre>rotateSignature</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L139) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

Rotate the signing secret. Emits `webhook.signature_rotated` so downstream consumers know to refresh their cached secret.

```ts
export declare function rotateSignature(adapter: PaymentAdapter, session: WebhookIdempotencySession): Promise<AxisStep<WebhookState>>;
```

#### <code v-pre>routeCharge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L87) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

Route a single charge attempt through the current provider adapter. `succeed=true` emits `orchestration.routed` and leaves the router on the same provider. `succeed=false` increments the failure counter and either triggers a failover, opens the breaker, or terminates.

```ts
export declare function routeCharge(adapters: PaymentAdapter[], session: OrchestrationSession, input: {
    succeed: boolean;
    customerId: string;
}): Promise<AxisStep<OrchestrationState>>;
```

#### <code v-pre>scaAuthenticate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L114) <code v-pre>packages/payment/src/semantics/sca.ts</code>

Complete SCA. Emits `sca.authenticated` and issues a synthetic strong auth token that downstream calls can attach for the 90-day validity window PSD2 mandates.

```ts
export declare function scaAuthenticate(adapter: PaymentAdapter, session: ScaSession): Promise<AxisStep<ScaState>>;
```

#### <code v-pre>scaEvaluate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L55) <code v-pre>packages/payment/src/semantics/sca.ts</code>

Evaluate SCA. If `exemption` is supplied the session terminates in `exempt`, otherwise it moves to `required`.

```ts
export declare function scaEvaluate(adapter: PaymentAdapter, session: ScaSession, input: {
    exemption?: ScaExemption;
}): Promise<AxisStep<ScaState>>;
```

#### <code v-pre>scheduleInstallment</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L106) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

Schedule the next installment — advances the schedule pointer and emits the neutral event. Throws once all installments are scheduled.

```ts
export declare function scheduleInstallment(adapter: PaymentAdapter, session: BnplSession): Promise<AxisStep<BnplState>>;
```

#### <code v-pre>scheduleSmartRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L83) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Schedule the next smart retry. Emits `recovery.smart_retry_scheduled` with the computed backoff and priority hint. Real Stripe uses ML to predict optimal retry times; the mock uses linear cascade timing.

```ts
export declare function scheduleSmartRetry(adapter: PaymentAdapter, session: RecoverySession): Promise<AxisStep<RecoveryState>>;
```

#### <code v-pre>scoreDevice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L89) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Score device fingerprint — combines browser fingerprint, IP entropy, OS signature, canvas fingerprint into a 0-100 score.

```ts
export declare function scoreDevice(adapter: PaymentAdapter, session: FraudDetectionSession, input: {
    score: number;
    fingerprint: string;
    ipAddress?: string;
    userAgent?: string;
}): Promise<AxisStep<FraudDetectionState>>;
```

#### <code v-pre>scoreMl</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L112) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

Run ML scoring on the current route. Score below `minMlScore` triggers fallback on the next `smartRoute` call.

```ts
export declare function scoreMl(adapters: PaymentAdapter[], session: OrchestrationIISession, input: {
    score: number;
    features: Record<string, string | number>;
}): Promise<AxisStep<OrchestrationIIState>>;
```

#### <code v-pre>scoreMlBlock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L162) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Run the ML fusion model — combines device / biometric / velocity signals plus features into a 0-1 score. Above `mlBlockThreshold` blocks the tx.

```ts
export declare function scoreMlBlock(adapter: PaymentAdapter, session: FraudDetectionSession, input: {
    score: number;
    modelVersion: string;
    features: Record<string, number>;
}): Promise<AxisStep<FraudDetectionState>>;
```

#### <code v-pre>scoreRisk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L127) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

Run risk scoring on the customer. Score below `config.minRiskScore` marks the plan as defaulted and blocks further activity.

```ts
export declare function scoreRisk(adapter: PaymentAdapter, session: BnplSession, input: {
    score: number;
    creditBureau?: string;
}): Promise<AxisStep<BnplState>>;
```

#### <code v-pre>shiftLiability</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L124) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Liability shift — apply the 3DS liability shift for a passed challenge. Moves fraud loss from merchant to issuer; typically emitted right after dispute open when the original auth had a successful 3DS.

```ts
export declare function shiftLiability(adapter: PaymentAdapter, session: DisputeSession, input: {
    threeDsAuthCode: string;
}): Promise<AxisStep<DisputeState>>;
```

#### <code v-pre>smartRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L85) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

Route the charge through the current provider — the primary route in the cascade ladder.

```ts
export declare function smartRoute(adapters: PaymentAdapter[], session: OrchestrationIISession): Promise<AxisStep<OrchestrationIIState>>;
```

#### <code v-pre>stackCoupon</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L148) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Add a coupon to the stack. Non-stackable coupons replace any existing coupon; stackable coupons combine.

```ts
export declare function stackCoupon(adapter: PaymentAdapter, session: SubscriptionMachineSession, input: CouponEntry): Promise<AxisStep<SubscriptionMachineState>>;
```

#### <code v-pre>startDunning</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L51) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

Start a dunning session. No webhook is emitted at start — the initial failed charge is assumed to have been emitted via `signWebhook` / `checkoutCompleted` etc. Call {@link dunningAttempt} to drive the retry sequence.

```ts
export declare function startDunning(input: {
    invoiceId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    config?: DunningConfig;
}): DunningSession;
```

#### <code v-pre>startFraudDetection</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L57) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Start a fresh fraud detection session for a transaction.

```ts
export declare function startFraudDetection(input: {
    transactionId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    config?: FraudDetectionConfig;
}): FraudDetectionSession;
```

#### <code v-pre>startFxTransfer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L58) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

Start a fresh FX session.

```ts
export declare function startFxTransfer(input: {
    transferId: string;
    customerId: string;
    config?: FxConfig;
}): FxSession;
```

#### <code v-pre>startIdempotency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L50) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

Start an idempotency session tied to a specific handler. Handler names scope the dedup table so different handlers can process the same event without interference.

```ts
export declare function startIdempotency(input: {
    handlerName: string;
    config?: WebhookIdempotencyConfig;
}): WebhookIdempotencySession;
```

#### <code v-pre>startLifecycle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L55) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

lifecycle orchestrator の 開始。 default で active-billing 状態、 subscription 契約成立直後 に 呼出。

```ts
export declare function startLifecycle(input: {
    timestamp: string;
}): LifecycleSession;
```

#### <code v-pre>startOrchestration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L53) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

Start an orchestration session. `adapters` supplies one adapter per provider in the same order as `config.providers`.

```ts
export declare function startOrchestration(input: {
    intentId: string;
    amountCents: number;
    currency?: string;
    config: OrchestrationConfig;
}): OrchestrationSession;
```

#### <code v-pre>startOrchestrationII</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L52) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

Start an orchestration II session.

```ts
export declare function startOrchestrationII(input: {
    intentId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    config: OrchestrationIIConfig;
}): OrchestrationIISession;
```

#### <code v-pre>startRecovery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L54) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Start a recovery session. The initial failed charge is assumed to have been emitted through the base adapter already.

```ts
export declare function startRecovery(input: {
    invoiceId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    config?: RecoveryConfig;
}): RecoverySession;
```

#### <code v-pre>startRecurringRevenue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L44) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Start a recurring revenue analytics session for a cohort.

```ts
export declare function startRecurringRevenue(input: {
    cohortId: string;
    customerId: string;
    currency?: string;
    mrrStartCents: number;
}): RecurringRevenueSession;
```

#### <code v-pre>startRefund</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L46) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Start a refund session against an existing charge. `chargedAt` is the original charge timestamp; the window policy is evaluated relative to this timestamp.

```ts
export declare function startRefund(input: {
    chargeId: string;
    originalAmountCents: number;
    chargedAt: number;
    customerId: string;
    currency?: string;
    policy: RefundPolicy;
}): RefundSession;
```

#### <code v-pre>startRegulatoryReporting</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L44) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Start a regulatory reporting session for an entity (merchant / issuer).

```ts
export declare function startRegulatoryReporting(input: {
    entityId: string;
    customerId: string;
    currency?: string;
}): RegulatoryReportingSession;
```

#### <code v-pre>startRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L50) <code v-pre>packages/payment/src/semantics/retry.ts</code>

Start a retry session for a given webhook event. The event is not emitted yet — call {@link retryDeliver} with `succeed: true` to emit and mark delivered, or `succeed: false` to schedule the next backoff. The idempotencyKey defaults to `event.id` so downstream consumers can dedupe repeated deliveries of the same event.

```ts
export declare function startRetry(input: {
    event: PaymentWebhookEvent;
    idempotencyKey?: string;
    config?: RetryConfig;
}): RetrySession;
```

#### <code v-pre>startSca</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L34) <code v-pre>packages/payment/src/semantics/sca.ts</code>

Start an SCA evaluation session. Call {@link scaEvaluate} to decide.

```ts
export declare function startSca(input: {
    paymentIntentId: string;
    amountCents: number;
    currency?: string;
    customerId: string;
}): ScaSession;
```

#### <code v-pre>startSubscriptionMachine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L49) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Start a subscription state-machine session against an existing subscription. This wraps the v0.3 subscription-lifecycle axis with the fine-grained payment-side state (grace period + coupon stacking) that downstream tests need to assert on.

```ts
export declare function startSubscriptionMachine(input: {
    subscriptionId: string;
    customerId: string;
    planPriceCents: number;
    currency?: string;
    gracePeriodMs?: number;
}): SubscriptionMachineSession;
```

#### <code v-pre>startThreeDs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L34) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

Start a 3DS session. No webhook is emitted at start — this is the local fingerprint capture step; call {@link threeDsRequestChallenge} to transition to the challenge, or {@link threeDsFrictionless} to skip.

```ts
export declare function startThreeDs(input: {
    paymentIntentId: string;
    amountCents: number;
    currency?: string;
    customerId: string;
}): ThreeDsSession;
```

#### <code v-pre>startVault</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L41) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Start a fresh vault session for a customer.

```ts
export declare function startVault(input: {
    customerId: string;
    currency?: string;
}): VaultSession;
```

#### <code v-pre>submitDisputeEvidence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L66) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Submit evidence for the dispute — receipt, shipping confirmation, customer communication, etc.

```ts
export declare function submitDisputeEvidence(adapter: PaymentAdapter, session: DisputeSession, input: {
    evidenceIds: string[];
}): Promise<AxisStep<DisputeState>>;
```

#### <code v-pre>submitEvidence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L90) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

Submit evidence to represent the dispute. Emits `chargeback.evidence_submitted`. Only allowed from `opened`.

```ts
export declare function submitEvidence(adapter: PaymentAdapter, chargeback: Chargeback, input: {
    receiptUrl?: string;
    shippingProof?: string;
    customerCommunication?: string;
}): Promise<AxisStep<ChargebackState>>;
```

#### <code v-pre>subscriptionCreated</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L23) <code v-pre>packages/payment/src/fixture.ts</code>

```ts
export declare const subscriptionCreated: (adapter: PaymentAdapter, input: {
    amountCents: number;
    currency?: string;
    customerId: string;
}) => {
    rawBody: string;
    signature: string;
    event: PaymentWebhookEvent;
};
```

#### <code v-pre>summarizeLifecycle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L179) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

```ts
export declare function summarizeLifecycle(session: LifecycleSession): LifecycleSummary;
```

#### <code v-pre>threeDsFrictionless</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L131) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

Frictionless path — issuer accepted the transaction without a challenge. Emits `3ds.frictionless` and terminates. Only valid from `fingerprint`.

```ts
export declare function threeDsFrictionless(adapter: PaymentAdapter, session: ThreeDsSession): Promise<AxisStep<ThreeDsState>>;
```

#### <code v-pre>threeDsRequestChallenge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L55) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

Request a 3DS challenge. Emits `3ds.challenge_required`. Session moves to `challenge-pending` — call {@link threeDsSubmitChallenge} to complete.

```ts
export declare function threeDsRequestChallenge(adapter: PaymentAdapter, session: ThreeDsSession): Promise<AxisStep<ThreeDsState>>;
```

#### <code v-pre>threeDsSubmitChallenge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L93) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

Submit the challenge result. `transStatus` follows EMVCo values: `Y` = authenticated, `N` = not authenticated, `A` = attempt performed, `U` = unavailable, `C` = challenge required (should be pre-transitioned), `R` = rejected. `Y` / `A` → session `completed`; `N` / `R` / `U` throw so tests exercise both accept and reject explicitly.

```ts
export declare function threeDsSubmitChallenge(adapter: PaymentAdapter, session: ThreeDsSession, input: {
    transStatus: ThreeDsTransStatus;
}): Promise<AxisStep<ThreeDsState>>;
```

#### <code v-pre>tokenizeCard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L60) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Tokenize a card into the vault. Emits `vault.token_created` and moves the session to `tokenized`.

```ts
export declare function tokenizeCard(adapter: PaymentAdapter, session: VaultSession, input: Omit<VaultToken, 'provider'>): Promise<AxisStep<VaultState>>;
```

#### <code v-pre>triggerFallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L141) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

Trigger a fallback to the next provider in the ladder. Increments the current index; exhausts the cascade when no more providers remain.

```ts
export declare function triggerFallback(adapters: PaymentAdapter[], session: OrchestrationIISession): Promise<AxisStep<OrchestrationIIState>>;
```

#### <code v-pre>verifyBiometric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L117) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Verify behavioral biometrics — typing rhythm + mouse motion + swipe pattern. Returns whether the observed pattern matches the historical profile.

```ts
export declare function verifyBiometric(adapter: PaymentAdapter, session: FraudDetectionSession, input: {
    passed: boolean;
    confidence: number;
    signals: string[];
}): Promise<AxisStep<FraudDetectionState>>;
```

#### <code v-pre>verifyKyb</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L118) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Run KYB (Know Your Business) verification — only meaningful when `config.requireKyb=true`.

```ts
export declare function verifyKyb(adapter: PaymentAdapter, session: EmbeddedFinanceSession, input: {
    businessRegistryId: string;
    verified: boolean;
}): Promise<AxisStep<EmbeddedFinanceState>>;
```

#### <code v-pre>verifyKyc</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L89) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Run KYC verification on the account holder. Score is 0-100.

```ts
export declare function verifyKyc(adapter: PaymentAdapter, session: EmbeddedFinanceSession, input: {
    score: number;
}): Promise<AxisStep<EmbeddedFinanceState>>;
```

#### <code v-pre>verifyPciScope</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L160) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Assert PCI DSS SAQ-A compliance — verifies that no raw PAN or CVV is present in any token in the vault. Real merchants run this as a compile-time / runtime gate before every deploy.

```ts
export declare function verifyPciScope(adapter: PaymentAdapter, session: VaultSession, input: {
    targetScope: 'SAQ-A' | 'SAQ-A-EP' | 'SAQ-D';
}): Promise<AxisStep<VaultState>>;
```

#### <code v-pre>voidInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L137) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Void an invoice. Emits `invoice.voided`. Allowed from `draft` or `open` (real providers reject voiding a paid invoice — must be credit-noted instead).

```ts
export declare function voidInvoice(adapter: PaymentAdapter, invoice: Invoice): Promise<AxisStep<InvoiceState>>;
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

#### <code v-pre>BnplConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L22) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

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

#### <code v-pre>BnplSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L33) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

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

#### <code v-pre>BnplState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L12) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

BNPL (Buy Now Pay Later) axis — installment plan + risk scoring + credit decisioning + late fee. Real BNPL providers (Klarna / Affirm / Afterpay) split a purchase into 2-6 installments, run a soft credit check + risk score at checkout, and charge a late fee if a scheduled installment misses its due date. The mock reproduces plan creation, per-installment schedule emission, risk score emission, and late fee emission.

```ts
export type BnplState = 'initial' | 'plan-created' | 'installments-scheduled' | 'risk-scored' | 'active' | 'late-fee-charged' | 'settled' | 'defaulted';
```

#### <code v-pre>Chain</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L22) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

```ts
export type Chain = 'ethereum' | 'polygon' | 'base' | 'arbitrum' | 'solana';
```

#### <code v-pre>Chargeback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L28) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

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

#### <code v-pre>ChargebackReason</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L18) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

```ts
export type ChargebackReason = 'fraudulent' | 'unrecognized' | 'duplicate' | 'product-not-received' | 'product-unacceptable' | 'subscription-canceled' | 'credit-not-processed' | 'general';
```

#### <code v-pre>ChargebackState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L12) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

Chargeback / dispute semantics. Real card networks (Visa VCR, Mastercard MCOP) run a multi-step dispute flow: opened → evidence submitted (or accept) → representment → arbitration → final outcome. The mock reduces that to the observable 4-event envelope providers surface (opened / evidence_submitted / won / lost) with a state machine that guards transitions.

```ts
export type ChargebackState = 'opened' | 'evidence-submitted' | 'won' | 'lost';
```

#### <code v-pre>CouponEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L19) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

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

#### <code v-pre>CryptoInvoiceConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L25) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

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

#### <code v-pre>CryptoPaymentSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L34) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

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

#### <code v-pre>CryptoPaymentState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L12) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

Crypto payment axis — stablecoin invoicing + on-chain confirmation + gas abstraction + wallet linking. Real crypto payment gateways (Coinbase Commerce / BitPay / MoonPay) accept USDC / USDT / ETH, poll the underlying chain for confirmations, absorb gas via meta-tx / paymaster (EIP-4337) so end users pay a stablecoin price, and link wallets to a customer id for repeat billing.

```ts
export type CryptoPaymentState = 'initial' | 'invoice-created' | 'awaiting-confirmation' | 'confirmed' | 'gas-abstracted' | 'wallet-linked' | 'expired' | 'failed';
```

#### <code v-pre>DisputeSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L21) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

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

#### <code v-pre>DisputeState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L12) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Dispute lifecycle axis — evidence submission + representment + arbitration + liability shift. Real card networks (Visa / Mastercard) define a 5-stage dispute cycle: retrieval → first chargeback → second presentment → arbitration → final ruling. Liability shift occurs when 3DS challenge was passed at authorisation, moving fraud loss from the merchant to the issuer.

```ts
export type DisputeState = 'opened' | 'evidence-submitted' | 'represented' | 'arbitration-opened' | 'liability-shifted' | 'lost' | 'won';
```

#### <code v-pre>DunningConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L19) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

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

#### <code v-pre>DunningSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L28) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

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

#### <code v-pre>DunningState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L13) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

Dunning — payment retry sequence for a failed invoice. Real providers all run a scheduled retry cadence (Stripe Smart Retries default = 4 attempts over ~1 week, Paddle's dunning follows the merchant-configured schedule, Lemon Squeezy retries 4 times over 14 days). The mock reproduces the user-observable envelope: N attempts, each with a delay window, a grace period between last attempt and terminal state, and a notification hook that fires on every attempt.

```ts
export type DunningState = 'active' | 'in-grace-period' | 'recovered' | 'exhausted';
```

#### <code v-pre>EmbeddedFinanceConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L26) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

```ts
export interface EmbeddedFinanceConfig {
    /** whether KYB (business verification) is required in addition to KYC */
    requireKyb?: boolean;
    /** minimum score (0-100) required to advance to card issuance */
    minScore?: number;
}
```

#### <code v-pre>EmbeddedFinanceSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L33) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

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

#### <code v-pre>EmbeddedFinanceState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L13) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Embedded finance axis — Banking-as-a-Service (BaaS) + card issuance + KYC (Know Your Customer) + KYB (Know Your Business) verification. Real embedded finance providers (Stripe Treasury / Unit / Column) let a platform open bank accounts on behalf of end users, issue physical or virtual cards, and run compliance verification without the platform itself becoming a bank. The mock reproduces the observable envelope: account open → KYC / KYB verified → card issued.

```ts
export type EmbeddedFinanceState = 'initial' | 'account-opened' | 'kyc-pending' | 'kyc-verified' | 'kyb-pending' | 'kyb-verified' | 'card-issued' | 'suspended' | 'closed';
```

#### <code v-pre>EngineConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/engine.ts#L20) <code v-pre>packages/payment/src/engine.ts</code>

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

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fidelity.ts#L19) <code v-pre>packages/payment/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    providers: PaymentProvider[];
    axes: BillingAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fidelity.ts#L12) <code v-pre>packages/payment/src/semantics/fidelity.ts</code>

Fidelity harness — collects the provider × axis coverage grid that downstream release-gate reports on. Not a runner (no side effect emit); pure inspection so tests / release-gate can assert "3 provider × 25 axis" (v0.3 9 axis + v0.4 8 axis + v0.5 8 axis) without walking every neutral event by hand. The v0.5 slice alone is 3 provider × 8 axis = 24 combination, extending the v0.4 total from 51 rows to 75 rows.

```ts
export interface FidelityRow {
    provider: PaymentProvider;
    axis: BillingAxis;
    neutralEvents: NeutralEventName[];
    providerEvents: string[];
}
```

#### <code v-pre>FraudDetectionConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L24) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

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

#### <code v-pre>FraudDetectionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L33) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

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

#### <code v-pre>FraudDetectionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L13) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

Fraud detection advanced axis — device fingerprint scoring + behavioral biometrics verification + velocity checking + ML-driven block decision. Real fraud engines (Stripe Radar / Sift / Signifyd) combine 4 signals to score a transaction: device fingerprint (browser + OS + IP entropy), behavioral biometrics (typing rhythm + mouse motion), velocity (attempts per unit time), and an ML model that fuses everything into a final accept / review / block verdict.

```ts
export type FraudDetectionState = 'initial' | 'device-scored' | 'biometric-verified' | 'velocity-flagged' | 'ml-blocked' | 'accepted' | 'reviewing';
```

#### <code v-pre>FraudVerdict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fraud-detection-advanced.ts#L22) <code v-pre>packages/payment/src/semantics/fraud-detection-advanced.ts</code>

```ts
export type FraudVerdict = 'accept' | 'review' | 'block';
```

#### <code v-pre>FxConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L33) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

```ts
export interface FxConfig {
    /** ms the rate lock stays valid */
    rateLockDurationMs?: number;
    /** which settlement rail to use */
    settlementRail?: SettlementRail;
}
```

#### <code v-pre>FxRateQuote</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L22) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

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

#### <code v-pre>FxSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L40) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

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

#### <code v-pre>FxState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L12) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

FX / cross-border axis — multi-currency rate lock + SWIFT / SEPA settlement + rate expiration. Real cross-border providers (Wise / Airwallex / Currencycloud) quote a rate that stays valid for a fixed window (typically 60-3600 seconds), then settle via SWIFT (global) or SEPA (EU). The mock reproduces rate lock, settlement initiation, settlement completion, and rate expiration.

```ts
export type FxState = 'initial' | 'rate-locked' | 'settlement-initiated' | 'settlement-completed' | 'expired' | 'failed';
```

#### <code v-pre>Invoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L17) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

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

#### <code v-pre>InvoiceState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L10) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Invoice lifecycle. Real providers use the state machine draft → open → paid (or void / uncollectible). Credit notes are emitted post-paid to refund partial amounts without voiding the invoice. Guards enforce the legal transitions so tests exercise each edge explicitly.

```ts
export type InvoiceState = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
```

#### <code v-pre>KycStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L24) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

```ts
export type KycStatus = 'pending' | 'verified' | 'failed';
```

#### <code v-pre>LifecycleEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L31) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

遷移 trigger event、 evaluate 経路 で 使う。

```ts
export type LifecycleEvent = 'payment-succeeded' | 'payment-failed' | 'dunning-succeeded' | 'dunning-exhausted' | 'chargeback-filed' | 'chargeback-won' | 'chargeback-lost' | 'user-canceled';
```

#### <code v-pre>LifecycleSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L41) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

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

#### <code v-pre>LifecycleState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L23) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

lifecycle-orchestrator の 5 state。 subscription lifecycle と revenue-recovery を 統合 した 生命 サイクル SSOT。

```ts
export type LifecycleState = 'active-billing' | 'grace-period' | 'dunning-active' | 'chargeback-dispute' | 'canceled';
```

#### <code v-pre>LifecycleSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L169) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

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

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/types.ts#L54) <code v-pre>packages/payment/src/semantics/types.ts</code>

Provider-neutral event names used inside the axis helpers. Real providers emit different string ids (Stripe `invoice.payment_failed`, Paddle `transaction.payment_failed`, Lemon Squeezy `subscription_payment_failed`) — the {@link providerEventName} map handles the translation. Tests can assert on the neutral name via `event.type.endsWith(':&lt;neutral&gt;')` or on the provider-specific one via the raw type field.

```ts
export type NeutralEventName = 'dunning.attempt' | 'dunning.exhausted' | 'dunning.recovered' | 'retry.scheduled' | 'retry.delivered' | 'retry.abandoned' | '3ds.challenge_required' | '3ds.challenge_completed' | '3ds.frictionless' | 'sca.required' | 'sca.exempt' | 'sca.authenticated' | 'psd2.mandate_created' | 'psd2.mandate_revoked' | 'psd2.consent_granted' | 'subscription.created' | 'subscription.upgraded' | 'subscription.downgraded' | 'subscription.paused' | 'subscription.resumed' | 'subscription.canceled' | 'subscription.reactivated' | 'invoice.drafted' | 'invoice.opened' | 'invoice.paid' | 'invoice.voided' | 'invoice.uncollectible' | 'invoice.credit_noted' | 'tax.calculated' | 'tax.reverse_charged' | 'tax.exempted' | 'chargeback.opened' | 'chargeback.evidence_submitted' | 'chargeback.won' | 'chargeback.lost' | 'orchestration.routed' | 'orchestration.failed_over' | 'orchestration.circuit_opened' | 'orchestration.circuit_closed' | 'recovery.smart_retry_scheduled' | 'recovery.dunning_cascade_step' | 'recovery.card_updated' | 'recovery.network_tokenized' | 'refund.partial' | 'refund.full' | 'refund.window_expired' | 'refund.policy_denied' | 'dispute.evidence_submitted' | 'dispute.represented' | 'dispute.arbitration_opened' | 'dispute.liability_shifted' | 'webhook.dedup_hit' | 'webhook.replay_blocked' | 'webhook.signature_rotated' | 'webhook.poison_queued' | 'tax.vat_calculated' | 'tax.gst_calculated' | 'tax.sales_tax_calculated' | 'tax.dac7_reported' | 'subscription.grace_period_entered' | 'subscription.grace_period_exited' | 'subscription.proration_applied' | 'subscription.coupon_stacked' | 'vault.token_created' | 'vault.token_revoked' | 'vault.migrated' | 'vault.pci_scope_verified' | 'embedded.account_opened' | 'embedded.card_issued' | 'embedded.kyc_verified' | 'embedded.kyb_verified' | 'bnpl.plan_created' | 'bnpl.installment_scheduled' | 'bnpl.risk_scored' | 'bnpl.late_fee_charged' | 'crypto.invoice_created' | 'crypto.tx_confirmed' | 'crypto.gas_abstracted' | 'crypto.wallet_linked' | 'fx.rate_locked' | 'fx.settlement_initiated' | 'fx.settlement_completed' | 'fx.rate_expired' | 'rr.mrr_computed' | 'rr.churn_recorded' | 'rr.expansion_recorded' | 'rr.nrr_computed' | 'po2.smart_routed' | 'po2.ml_scored' | 'po2.fallback_triggered' | 'po2.cascade_exhausted' | 'fraud.device_scored' | 'fraud.biometric_verified' | 'fraud.velocity_flagged' | 'fraud.ml_blocked' | 'reg.pci_reported' | 'reg.psd2_reported' | 'reg.dora_reported' | 'reg.sar_filed';
```

#### <code v-pre>OrchestrationConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L19) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

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

#### <code v-pre>OrchestrationIIConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L19) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

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

#### <code v-pre>OrchestrationIISession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L30) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

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

#### <code v-pre>OrchestrationIIState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L11) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

Payment orchestration II axis — smart routing (BIN-based / cost-optimised) + ML-driven route decisioning + fallback ladder + retry cascade with exhaustion. Extends the v0.4 `orchestration` axis with an ML scoring signal, an explicit fallback ladder (as opposed to a simple linear cascade), and a terminal `cascade-exhausted` state.

```ts
export type OrchestrationIIState = 'initial' | 'smart-routed' | 'ml-scored' | 'fallback-triggered' | 'cascade-exhausted' | 'terminated';
```

#### <code v-pre>OrchestrationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L30) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

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

#### <code v-pre>OrchestrationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L12) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

Orchestration axis — multi-provider routing + failover + retry ladder + circuit breaker. Real merchants split traffic across 2-3 providers to hedge against outages and to fine-tune per-BIN authorisation rates. The mock reproduces the observable envelope: a router that picks the primary provider, retries on failure, fails over to a secondary, and opens a circuit after a configurable failure threshold.

```ts
export type OrchestrationState = 'routing' | 'failed-over' | 'circuit-open' | 'circuit-closed' | 'terminated';
```

#### <code v-pre>PaymentAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L58) <code v-pre>packages/payment/src/types.ts</code>

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
    }): {
        rawBody: string;
        signature: string;
        event: PaymentWebhookEvent;
    };
    verifyWebhook(input: {
        rawBody: string;
        signature: string;
        toleranceMs?: number;
    }): WebhookVerifyResult;
    onWebhook(handler: (event: PaymentWebhookEvent) => void | Promise<void>): () => void;
    emit(event: PaymentWebhookEvent): Promise<void>;
}
```

#### <code v-pre>PaymentMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L20) <code v-pre>packages/payment/src/real-driver.ts</code>

Real-driver env-gate — inspects `process.env` to decide whether the

```ts
export type PaymentMode = 'mock' | 'real';
```

#### <code v-pre>PaymentProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L7) <code v-pre>packages/payment/src/types.ts</code>

Payment provider identifier — provider prefix used by release-gate to dispatch axis evaluation. All

```ts
export type PaymentProvider = 'stripe' | 'paddle' | 'lemonsqueezy';
```

#### <code v-pre>PaymentWebhookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L28) <code v-pre>packages/payment/src/types.ts</code>

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

#### <code v-pre>PsdMandate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L15) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

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

#### <code v-pre>PsdMandateScheme</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L11) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

PSD2 open banking + mandate semantics. Under PSD2 (EU) and the equivalent UK OBIE spec, recurring debits require a signed customer mandate (SEPA DD B2C, SEPA DD B2B, UK BACS DDI). Open banking payment initiation requires a granular consent from the customer's bank. This module tracks both — mandate lifecycle (create / revoke) and consent grant.

```ts
export type PsdMandateScheme = 'sepa-core' | 'sepa-b2b' | 'bacs' | 'open-banking';
```

#### <code v-pre>PsdMandateState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L13) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

```ts
export type PsdMandateState = 'active' | 'revoked';
```

#### <code v-pre>RecoveryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L21) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

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

#### <code v-pre>RecoverySession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L32) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

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

#### <code v-pre>RecoveryState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L12) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Revenue recovery axis — smart retry + dunning cascade + card updater + network tokenization. Real providers combine 4 mechanisms to recover failed payments: intelligent retry timing (Stripe Smart Retries), a multi-step dunning cascade (email + in-app + SMS), the card updater network to refresh expired cards, and network tokenization to survive card re-issue events without re-collecting PAN.

```ts
export type RecoveryState = 'initial' | 'smart-retry-scheduled' | 'dunning-cascade' | 'card-updated' | 'network-tokenized' | 'recovered' | 'lost';
```

#### <code v-pre>RecurringRevenueSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L29) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

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

#### <code v-pre>RecurringRevenueSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L19) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

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

#### <code v-pre>RecurringRevenueState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L12) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Recurring revenue advanced axis — MRR (Monthly Recurring Revenue) + ARR (Annual Recurring Revenue) + churn tracking + expansion revenue + NRR (Net Revenue Retention). Real SaaS billing platforms (Stripe / Chargebee / Recurly) roll these metrics into cohort analytics: NRR = (MRR_end - churn - contraction + expansion) / MRR_start × 100. The mock reproduces MRR / ARR computation, churn / expansion recording, and NRR rollup.

```ts
export type RecurringRevenueState = 'initial' | 'mrr-computed' | 'churn-recorded' | 'expansion-recorded' | 'nrr-computed';
```

#### <code v-pre>RefundPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L18) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

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

#### <code v-pre>RefundSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L29) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

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

#### <code v-pre>RefundState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L11) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Refund advanced axis — partial refund + refund policy + refund window + chargeback prevention. Real merchants apply time-window policies (30 day / 60 day / no-refund), partial refunds with amount caps, and use refunds proactively to head off chargebacks that would otherwise incur $15-$25 fees plus liability shift.

```ts
export type RefundState = 'requested' | 'partial-issued' | 'full-issued' | 'window-expired' | 'policy-denied';
```

#### <code v-pre>Regulator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L20) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

```ts
export type Regulator = 'PCI-SSC' | 'EBA' | 'ESA' | 'FinCEN' | 'NCA';
```

#### <code v-pre>RegulatoryReportingSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L31) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

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

#### <code v-pre>RegulatoryReportingState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L12) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

Regulatory reporting axis — PCI DSS + PSD2 SCA + DORA (Digital Operational Resilience Act) + AML/KYC + SAR (Suspicious Activity Report). Real payment processors submit periodic reports to regulators: PCI DSS to card networks, PSD2 to EBA (European Banking Authority), DORA to competent authorities under the ESAs, and SAR to FinCEN (US) / NCA (UK) on demand when suspicious activity is detected.

```ts
export type RegulatoryReportingState = 'initial' | 'pci-reported' | 'psd2-reported' | 'dora-reported' | 'sar-filed' | 'audit-locked';
```

#### <code v-pre>ReportPeriod</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L21) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

```ts
export type ReportPeriod = 'monthly' | 'quarterly' | 'annual' | 'on-demand';
```

#### <code v-pre>ReportRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/regulatory-reporting.ts#L23) <code v-pre>packages/payment/src/semantics/regulatory-reporting.ts</code>

```ts
export interface ReportRecord {
    reportId: string;
    regulator: Regulator;
    period: ReportPeriod;
    submittedAt: number;
    fingerprint: string;
}
```

#### <code v-pre>ResolvedMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L22) <code v-pre>packages/payment/src/real-driver.ts</code>

```ts
export interface ResolvedMode {
    mode: PaymentMode;
    provider: PaymentProvider;
    reason: 'default-mock' | 'kiwa-mode-real' | 'missing-key' | 'invalid-mode';
}
```

#### <code v-pre>RetryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L14) <code v-pre>packages/payment/src/semantics/retry.ts</code>

```ts
export interface RetryConfig {
    maxAttempts?: number;
    /** milliseconds between attempt N and N+1 = baseBackoffMs * 2^(N-1) */
    baseBackoffMs?: number;
}
```

#### <code v-pre>RetrySession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L20) <code v-pre>packages/payment/src/semantics/retry.ts</code>

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

#### <code v-pre>RetryState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L12) <code v-pre>packages/payment/src/semantics/retry.ts</code>

Webhook delivery retry semantics. All 3 real providers retry undelivered webhooks with exponential backoff until a configured max attempt count (Stripe = 3 days at increasing intervals, Paddle = 3 attempts at 5s / 5m / 10m, Lemon Squeezy = up to 3 attempts). The mock reproduces the observable envelope: an idempotency key per event, backoff schedule, and a max-attempt abandon terminal state.

```ts
export type RetryState = 'scheduled' | 'delivered' | 'abandoned';
```

#### <code v-pre>ScaExemption</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L13) <code v-pre>packages/payment/src/semantics/sca.ts</code>

```ts
export type ScaExemption = 'low-value' | 'trusted-beneficiary' | 'transaction-risk-analysis' | 'merchant-initiated' | 'recurring-subsequent' | 'corporate';
```

#### <code v-pre>ScaSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L21) <code v-pre>packages/payment/src/semantics/sca.ts</code>

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

#### <code v-pre>ScaState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/sca.ts#L11) <code v-pre>packages/payment/src/semantics/sca.ts</code>

Strong Customer Authentication (SCA) semantics under PSD2. Real providers expose SCA through: (1) exemption evaluation (low-value, TRA, MIT, recurring subsequent), (2) required authentication when no exemption applies, (3) post-auth token issue. This module wraps the 3-state envelope: `required` / `exempt` / `authenticated`.

```ts
export type ScaState = 'evaluating' | 'required' | 'exempt' | 'authenticated';
```

#### <code v-pre>SettlementRail</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L20) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

```ts
export type SettlementRail = 'SWIFT' | 'SEPA' | 'ACH' | 'FASTER' | 'RTGS';
```

#### <code v-pre>Stablecoin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L23) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

```ts
export type Stablecoin = 'USDC' | 'USDT' | 'DAI' | 'ETH' | 'SOL';
```

#### <code v-pre>Subscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L17) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

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

#### <code v-pre>SubscriptionMachineSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L29) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

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

#### <code v-pre>SubscriptionMachineState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L12) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Subscription state machine axis — grace period + pause / resume + proration + coupon stacking. Real subscription billing has a distinct grace period (past-due but not yet cancelled), first-class pause / resume (Stripe `paused_collection`, Paddle `subscription.paused`), mid-cycle proration for plan changes, and stackable discounts / coupons whose effective percent must be recomputed on every renewal.

```ts
export type SubscriptionMachineState = 'active' | 'grace-period' | 'paused' | 'canceled' | 'expired';
```

#### <code v-pre>SubscriptionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L10) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Subscription lifecycle state machine. Real providers converge on the same 7-state envelope: created → (upgraded / downgraded / paused / resumed) → canceled → reactivated. This module wraps that envelope with strict transition guards so tests fail loudly on invalid transitions.

```ts
export type SubscriptionState = 'active' | 'upgraded' | 'downgraded' | 'paused' | 'canceled';
```

#### <code v-pre>TaxCalcInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L24) <code v-pre>packages/payment/src/semantics/tax.ts</code>

```ts
export interface TaxCalcInput {
    netAmountCents: number;
    buyerCountry: string;
    buyerVatId?: string;
    merchantCountry: string;
    productKind?: 'digital' | 'physical' | 'service';
}
```

#### <code v-pre>TaxJurisdiction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L17) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

```ts
export type TaxJurisdiction = 'EU' | 'UK' | 'US' | 'AU' | 'CA' | 'JP' | 'other';
```

#### <code v-pre>TaxKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L12) <code v-pre>packages/payment/src/semantics/tax.ts</code>

Tax semantics — VAT / GST / sales tax + reverse charge + tax registration. Real providers surface tax through per-line calculation (Stripe Tax, Paddle Merchant of Record includes VAT/GST inclusive, Lemon Squeezy MOR). This module reproduces the observable envelope: a pure `calculateTax` helper for local decisions plus 3 emit helpers for the neutral events downstream harnesses filter on.

```ts
export type TaxKind = 'vat' | 'gst' | 'sales-tax';
```

#### <code v-pre>TaxKindLocalized</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L26) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

```ts
export type TaxKindLocalized = 'vat' | 'gst' | 'sales-tax' | 'dac7-report';
```

#### <code v-pre>TaxLine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L14) <code v-pre>packages/payment/src/semantics/tax.ts</code>

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

#### <code v-pre>TaxLocalizationInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L32) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

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

#### <code v-pre>TaxLocalizationLine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L43) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

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

#### <code v-pre>TaxLocalizationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L11) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

Tax localization axis — VAT + GST + sales tax + EU DAC7 reporting. Real merchants selling cross-border have to compute the correct indirect tax by jurisdiction (EU VAT MOSS / OSS, UK VAT, AU GST, US destination sales tax) and file periodic marketplace reporting under EU DAC7 for digital platforms.

```ts
export type TaxLocalizationState = 'calculating' | 'calculated' | 'reported' | 'exempt';
```

#### <code v-pre>ThreeDsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L20) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

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

#### <code v-pre>ThreeDsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L12) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

3D Secure v2 challenge flow. Real providers surface 3DS through a two- or three-step flow: fingerprint (device data collection), challenge (user interaction), result (accept/reject). Frictionless flow skips the challenge when the issuer risk assessment is low. The mock reproduces the observable envelope only — no real ACS callout, just event ordering with sensible metadata (transStatus, eci) drawn from EMVCo 3DS 2.2.

```ts
export type ThreeDsState = 'fingerprint' | 'challenge-pending' | 'completed' | 'frictionless';
```

#### <code v-pre>ThreeDsTransStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/three-ds.ts#L18) <code v-pre>packages/payment/src/semantics/three-ds.ts</code>

```ts
export type ThreeDsTransStatus = 'Y' | 'N' | 'A' | 'C' | 'U' | 'R';
```

#### <code v-pre>VaultSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L29) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

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

#### <code v-pre>VaultState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L11) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Payment method vault axis — tokenization + PCI DSS SAQ-A + cross-provider migration. Real merchants tokenize PAN + CVV so the raw card data never lands on their systems (SAQ-A / SAQ-A-EP compliance) and portable tokens (network tokens, PSP-agnostic tokens) let merchants migrate from Stripe to Paddle without asking customers to re-enter card details.

```ts
export type VaultState = 'empty' | 'tokenized' | 'revoked' | 'migrated' | 'pci-verified';
```

#### <code v-pre>VaultToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L18) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

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

#### <code v-pre>WebhookIdempotencyConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L20) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

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

#### <code v-pre>WebhookIdempotencySession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L29) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

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

#### <code v-pre>WebhookState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L13) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

Webhook idempotency advanced axis — dedup key + replay protection + signature rotation + poison queue. Real payment webhooks routinely duplicate (retry storms, at-least-once delivery), replay attackers can capture and resubmit a valid signed body inside the tolerance window, providers rotate signing secrets during incident response, and repeatedly failing handlers need to be sidelined into a poison queue so successful traffic isn't blocked.

```ts
export type WebhookState = 'idle' | 'dedup-hit' | 'replay-blocked' | 'rotated' | 'poisoned';
```

#### <code v-pre>WebhookVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L45) <code v-pre>packages/payment/src/types.ts</code>

Signature verify result — returned by every provider's `verifyWebhook`. Includes the parsed event on success and a reason string on failure so kiwa tests can assert on specific rejection paths without string-matching the whole error message.

```ts
export interface WebhookVerifyResult {
    ok: boolean;
    event: PaymentWebhookEvent | null;
    reason: 'ok' | 'bad-signature' | 'stale-timestamp' | 'malformed-body';
}
```
<!-- kiwa-public-api:end -->
