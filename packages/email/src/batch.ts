import type { EmailClient, EmailMessage, EmailSendResult } from './client.js';

export interface BatchSendOptions {
  concurrency?: number;
  stopOnFirstFailure?: boolean;
}

export interface BatchSendResult {
  total: number;
  succeeded: number;
  failed: number;
  results: EmailSendResult[];
}

/**
 * batch send with limited concurrency。 default concurrency = 5、
 * stopOnFirstFailure=true で最初の failure で中断。
 */
export async function sendBatch(
  client: EmailClient,
  messages: readonly EmailMessage[],
  options: BatchSendOptions = {},
): Promise<BatchSendResult> {
  const concurrency = options.concurrency ?? 5;
  const stopOnFirst = options.stopOnFirstFailure ?? false;
  const results: EmailSendResult[] = [];
  let stopped = false;
  for (let i = 0; i < messages.length; i += concurrency) {
    if (stopped) break;
    const chunk = messages.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map((m) => client.send(m)));
    for (const r of chunkResults) {
      results.push(r);
      if (stopOnFirst && r.status === 'failed') {
        stopped = true;
        break;
      }
    }
  }
  const failed = results.filter((r) => r.status === 'failed').length;
  return {
    total: messages.length,
    succeeded: results.length - failed,
    failed,
    results,
  };
}
