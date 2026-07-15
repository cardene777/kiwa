export {
  createNotificationClient,
  type NotificationProvider,
  type PushProvider,
  type SmsProvider,
  type NotificationClient,
  type PushMessage,
  type SmsMessage,
  type InAppMessage,
  type NotificationSendResult,
  type NotificationChannel,
  type SentNotificationRecord,
} from './client.js';

export {
  sendPush,
  type PushDeliveryConfig,
} from './push.js';

export {
  sendSMS,
  type SmsDeliveryConfig,
} from './sms.js';

export {
  sendInApp,
  type InAppDispatchConfig,
} from './inapp.js';

export {
  parseNotificationEvent,
  type NormalizedNotificationEvent,
  type RawNotificationEvent,
  type NotificationEventType,
} from './delivery.js';
