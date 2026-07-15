import type { WebhookVerifier, IncomingWebhook, WebhookVerifyOutcome } from './client.js';

export interface BatchVerifyOptions {
  stopOnFirstRejection?: boolean;
}

export interface BatchVerifyResult {
  total: number;
  verified: number;
  rejected: number;
  results: WebhookVerifyOutcome[];
}

/** batch verify: 複数 incoming webhook を一括 verify、 stopOnFirstRejection で中断。 */
export function verifyBatch(
  verifier: WebhookVerifier,
  incomings: readonly IncomingWebhook[],
  options: BatchVerifyOptions = {},
): BatchVerifyResult {
  const stopOnFirst = options.stopOnFirstRejection ?? false;
  const results: WebhookVerifyOutcome[] = [];
  for (const incoming of incomings) {
    const outcome = verifier.verify(incoming);
    results.push(outcome);
    if (stopOnFirst && outcome.status === 'rejected') break;
  }
  const rejected = results.filter((r) => r.status === 'rejected').length;
  return {
    total: incomings.length,
    verified: results.length - rejected,
    rejected,
    results,
  };
}
