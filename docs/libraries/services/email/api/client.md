---
title: "@kiwa-lab/email client の API 契約"
---

# <code v-pre>@kiwa-lab/email</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createEmailClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L55) <code v-pre>packages/email/src/client.ts</code>

provider 別のみ mock 差 (id prefix / accepted status label) を持たせつつ、 全 API 共通 interface。 実 provider (Resend / SendGrid / Postmark / SES) の SDK を差し替えても同じ signature で呼べる想定。

```ts
export declare function createEmailClient(options?: CreateEmailClientOptions): EmailClient;
```

### 型

#### <code v-pre>EmailClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L35) <code v-pre>packages/email/src/client.ts</code>

```ts
export interface EmailClient {
    provider: EmailProvider;
    send: (msg: EmailMessage) => Promise<EmailSendResult>;
    renderTemplate: (templateId: string, data: EmailTemplateContext) => string;
    listSent: () => SentEmailRecord[];
    clear: () => void;
}
```

#### <code v-pre>EmailMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L5) <code v-pre>packages/email/src/client.ts</code>

```ts
export interface EmailMessage {
    from: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    templateId?: string;
    templateData?: EmailTemplateContext;
    headers?: Record<string, string>;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
}
```

#### <code v-pre>EmailProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L3) <code v-pre>packages/email/src/client.ts</code>

```ts
export type EmailProvider = 'resend' | 'sendgrid' | 'postmark' | 'ses';
```

#### <code v-pre>EmailSendResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L21) <code v-pre>packages/email/src/client.ts</code>

```ts
export interface EmailSendResult {
    id: string;
    provider: EmailProvider;
    status: 'queued' | 'sent' | 'failed';
    acceptedAt: number;
    reason?: string;
}
```

#### <code v-pre>EmailTemplateContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L19) <code v-pre>packages/email/src/client.ts</code>

```ts
export type EmailTemplateContext = Record<string, string | number | boolean>;
```

#### <code v-pre>SentEmailRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L29) <code v-pre>packages/email/src/client.ts</code>

```ts
export interface SentEmailRecord extends EmailSendResult {
    message: EmailMessage;
    renderedHtml?: string;
    renderedText?: string;
}
```
