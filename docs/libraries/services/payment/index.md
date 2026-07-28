# @kiwa-lab/payment

`@kiwa-lab/payment` は、Stripe、Paddle、Lemon Squeezy の決済 Webhook と請求ライフサイクルをテストする mock harness です。プロバイダーごとの raw payload と HMAC 署名を作成し、検証、handler 呼び出し、請求状態の遷移を外部接続なしで確認できます。

<img src="/images/kiwa-docs/services/payment-overview.webp" alt="決済 Webhook を作成し、署名を検証してアプリケーションへ配送する流れ" width="1717" height="916" loading="lazy" decoding="async">

## 対象にする契約

checkout、subscription、payment failure、refund の event を正しい provider と金額で作り、同じ adapter で raw body と signature を検証します。body や signature の改変、古い timestamp、壊れた JSON は reject されるため、handler へ配送する前の境界を固定できます。handler は登録順に呼ばれ、不要になった handler は解除できます。

請求失敗、retry、3DS、SCA、subscription、invoice、tax、chargeback の状態遷移は、作成した event をアプリケーションがどの状態へ反映するかを test します。event を作るだけで実際の決済や請求が発生することはありません。

## 対応する provider

| provider | 作成関数 | event id の接頭辞 |
| --- | --- | --- |
| `stripe` | `createStripeMock` | `evt_` |
| `paddle` | `createPaddleMock` | provider 固有の prefix |
| `lemonsqueezy` | `createLemonSqueezyMock` | provider 固有の prefix |

三つの mock は共通の `PaymentAdapter` を実装します。fixture やアプリケーションテストを provider ごとに書き換えず、同じ `signWebhook`、`verifyWebhook`、`onWebhook`、`emit` で検証できます。

## 使わない場面

本番 API への請求、実際の決済手段、PCI の準拠、Paddle や Lemon Squeezy の全 payload schema を保証するものではありません。`KIWA_MODE=real` と key の有無を確認する API はありますが、このパッケージ自体に実プロバイダー driver は含まれません。実課金の統合は sandbox または staging で確認してください。

## 読み進める

[Quickstart](./quickstart) で signed checkout event を検証します。[使い方](./how-to) では拒否、handler、請求失敗と dunning を扱います。共通 adapter と実行モードの詳細は [リファレンス](./reference) にあります。
