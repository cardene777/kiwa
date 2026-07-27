# @kiwa-lab/email

`@kiwa-lab/email` は Resend、SendGrid、Postmark、AWS SES の送信、テンプレート、Webhook、配信イベントを in-process で検証するライブラリです。実 provider を呼ばずに、アプリケーションが queued result、送信履歴、delivery event をどう扱うかを test します。

![メール送信が記録と配信イベントへ進み失敗時だけ再試行する流れ](/images/kiwa-docs/services/email-overview.png)

## 対象にする境界

送信 request は `EmailClient.send` で queued result として記録されます。template の interpolation、provider 固有の Webhook signature、raw delivery event の正規化を別々に検証できます。送信 API の到達性や受信 inbox を確認するものではありません。

## 使う場面

signup welcome mail、password reset、通知メール、delivery webhook を CI で再現するときに使います。provider によって異なる ID prefix、signature encoding、raw event shape を application の分岐として扱う場合にも使えます。

## 使わない場面

実 provider の reputation、DNS、suppression list、inbox rendering、実際の retry scheduling は対象外です。実環境の delivery を確認する integration test と、in-process の契約 test を分けてください。

## provider の違い

Resend と Postmark は hex HMAC-SHA256、SendGrid は base64 HMAC-SHA256、AWS SES は hex HMAC-SHA1 を Webhook signature に使います。`verifyWebhookSignature` へ provider を明示し、別 provider の signature を通さない test を書きます。

## lifecycle

client は in-process で送信記録を保持します。test ごとに新しい client を作ると record が分離されます。共有 client を使う場合は `listSent()` の履歴を assertion の前提にし、別 scenario の送信を混ぜないでください。

## 次に読む

[Quickstart](./quickstart) では queued result と送信履歴を確認します。[使い方](./how-to) では template と delivery webhook を検証します。retry、batch、idempotency を含む公開 API は [リファレンス](./reference) にあります。
