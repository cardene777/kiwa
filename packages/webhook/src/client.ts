import { verifyWebhookSignature, type SignatureVerifyResult } from './signature.js';
import { parseWebhookPayload, type NormalizedWebhookEvent } from './payload.js';

export type WebhookProvider = 'stripe' | 'github' | 'slack' | 'twilio';

export interface IncomingWebhook {
  payload: string;
  signature: string;
  headers?: Record<string, string>;
}

export interface WebhookVerifyOutcome {
  id: string;
  provider: WebhookProvider;
  status: 'verified' | 'rejected';
  reason?: string;
  event?: NormalizedWebhookEvent;
  receivedAt: number;
}

export interface DeliveredWebhookRecord extends WebhookVerifyOutcome {
  raw: IncomingWebhook;
  signatureResult: SignatureVerifyResult;
}

export interface WebhookVerifier {
  provider: WebhookProvider;
  verify: (incoming: IncomingWebhook) => WebhookVerifyOutcome;
  listDelivered: () => DeliveredWebhookRecord[];
  clear: () => void;
}

export interface CreateWebhookVerifierOptions {
  provider?: WebhookProvider;
  secret: string;
  now?: () => number;
  idSeed?: number;
  toleranceSec?: number;
}

/**
 * provider 別 verifier を作成。 verify() 呼出で signature + payload parse + record を
 * atomic に実行し、 listDelivered() で受信ログを取り出せる in-process mock。
 * 実 provider (Stripe Events API / GitHub webhook / Slack Events API / Twilio) の
 * signature 検証と event shape を同じ signature で再現する。
 */
export function createWebhookVerifier(options: CreateWebhookVerifierOptions): WebhookVerifier {
  const provider = options.provider ?? 'stripe';
  const secret = options.secret;
  const now = options.now ?? (() => 0);
  const toleranceSec = options.toleranceSec;
  const idPrefix = { stripe: 'evt', github: 'gh', slack: 'sl', twilio: 'tw' }[provider];
  const delivered: DeliveredWebhookRecord[] = [];
  let counter = options.idSeed ?? 0;

  return {
    provider,
    verify(incoming: IncomingWebhook): WebhookVerifyOutcome {
      counter += 1;
      const id = `${idPrefix}-${counter}`;
      const receivedAt = now();
      const signatureResult = verifyWebhookSignature(
        incoming.payload,
        incoming.signature,
        secret,
        provider,
        toleranceSec !== undefined ? { toleranceSec, now } : undefined,
      );
      if (!signatureResult.valid) {
        const outcome: WebhookVerifyOutcome = {
          id,
          provider,
          status: 'rejected',
          receivedAt,
        };
        if (signatureResult.reason) outcome.reason = signatureResult.reason;
        delivered.push({ ...outcome, raw: incoming, signatureResult });
        return outcome;
      }
      let event: NormalizedWebhookEvent | undefined;
      try {
        const raw = JSON.parse(incoming.payload) as Record<string, unknown>;
        event = parseWebhookPayload({ provider, raw });
      } catch (e) {
        const outcome: WebhookVerifyOutcome = {
          id,
          provider,
          status: 'rejected',
          reason: `payload parse failed: ${(e as Error).message}`,
          receivedAt,
        };
        delivered.push({ ...outcome, raw: incoming, signatureResult });
        return outcome;
      }
      const outcome: WebhookVerifyOutcome = {
        id,
        provider,
        status: 'verified',
        receivedAt,
      };
      if (event !== undefined) outcome.event = event;
      delivered.push({ ...outcome, raw: incoming, signatureResult });
      return outcome;
    },
    listDelivered(): DeliveredWebhookRecord[] {
      return [...delivered];
    },
    clear(): void {
      delivered.length = 0;
    },
  };
}
