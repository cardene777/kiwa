import { renderTemplate } from './template.js';

export type EmailProvider = 'resend' | 'sendgrid' | 'postmark' | 'ses';

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

export type EmailTemplateContext = Record<string, string | number | boolean>;

export interface EmailSendResult {
  id: string;
  provider: EmailProvider;
  status: 'queued' | 'sent' | 'failed';
  acceptedAt: number;
  reason?: string;
}

export interface SentEmailRecord extends EmailSendResult {
  message: EmailMessage;
  renderedHtml?: string;
  renderedText?: string;
}

export interface EmailClient {
  provider: EmailProvider;
  send: (msg: EmailMessage) => Promise<EmailSendResult>;
  renderTemplate: (templateId: string, data: EmailTemplateContext) => string;
  listSent: () => SentEmailRecord[];
  clear: () => void;
}

export interface CreateEmailClientOptions {
  provider?: EmailProvider;
  templates?: Record<string, string>;
  failOn?: (msg: EmailMessage) => boolean;
  now?: () => number;
  idSeed?: number;
}

/**
 * provider 別のみ mock 差 (id prefix / accepted status label) を持たせつつ、 全 API 共通 interface。
 * 実 provider (Resend / SendGrid / Postmark / SES) の SDK を差し替えても同じ signature で呼べる想定。
 */
export function createEmailClient(options: CreateEmailClientOptions = {}): EmailClient {
  const provider = options.provider ?? 'resend';
  const templates = options.templates ?? {};
  const now = options.now ?? (() => Number.parseInt(String(Math.floor(9e11)), 10));
  const failOn = options.failOn;
  const idPrefix = { resend: 're', sendgrid: 'sg', postmark: 'pm', ses: 'ses' }[provider];
  const sent: SentEmailRecord[] = [];
  let counter = options.idSeed ?? 0;

  return {
    provider,
    async send(msg: EmailMessage): Promise<EmailSendResult> {
      counter += 1;
      const id = `${idPrefix}-${counter}`;
      const acceptedAt = now();
      if (failOn && failOn(msg)) {
        const failed: EmailSendResult = { id, provider, status: 'failed', acceptedAt, reason: 'provider rejected' };
        sent.push({ ...failed, message: msg });
        return failed;
      }
      let renderedHtml = msg.html;
      let renderedText = msg.text;
      if (msg.templateId) {
        const tmpl = templates[msg.templateId];
        if (!tmpl) {
          const failed: EmailSendResult = { id, provider, status: 'failed', acceptedAt, reason: `template not found: ${msg.templateId}` };
          sent.push({ ...failed, message: msg });
          return failed;
        }
        renderedHtml = renderTemplate(tmpl, msg.templateData ?? {}).html;
      }
      const baseResult: EmailSendResult = { id, provider, status: 'queued', acceptedAt };
      const record: SentEmailRecord = { ...baseResult, message: msg };
      if (renderedHtml !== undefined) record.renderedHtml = renderedHtml;
      if (renderedText !== undefined) record.renderedText = renderedText;
      sent.push(record);
      return baseResult;
    },
    renderTemplate(templateId: string, data: EmailTemplateContext): string {
      const tmpl = templates[templateId];
      if (!tmpl) throw new Error(`template not found: ${templateId}`);
      return renderTemplate(tmpl, data).html;
    },
    listSent(): SentEmailRecord[] {
      return [...sent];
    },
    clear(): void {
      sent.length = 0;
    },
  };
}
