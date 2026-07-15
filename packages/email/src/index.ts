export {
  createEmailClient,
  type EmailProvider,
  type EmailClient,
  type EmailMessage,
  type EmailSendResult,
  type EmailTemplateContext,
  type SentEmailRecord,
} from './client.js';

export {
  verifyWebhookSignature,
  type SignatureVerifyResult,
} from './signature.js';

export {
  parseDeliveryEvent,
  type NormalizedDeliveryEvent,
  type RawDeliveryEvent,
  type DeliveryEventType,
} from './delivery.js';

export {
  renderTemplate,
  type TemplateRenderResult,
} from './template.js';
