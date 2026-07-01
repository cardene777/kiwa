import type { BullMQTestEnv, QueueJobSnapshot } from '@kiwa-test/queue';

/**
 * A small email-worker style processor stitched together so the PoC can prove
 * the whole `add → process → assert` loop without booting a real queue.
 *
 * The worker mimics a signup-confirmation flow — it accepts an email body,
 * "sends" it via an injected sink, and returns the sink log entry.
 */
export interface EmailBody {
  to: string;
  subject: string;
  body: string;
}

export interface EmailSink {
  sent: EmailBody[];
  send: (email: EmailBody) => Promise<{ id: string; to: string }>;
}

export function createEmailSink(opts?: { failFirst?: number | undefined }): EmailSink {
  const sent: EmailBody[] = [];
  let calls = 0;
  const failFirst = opts?.failFirst ?? 0;
  return {
    sent,
    async send(email) {
      calls += 1;
      if (calls <= failFirst) {
        throw new Error(`transient SMTP failure ${calls}/${failFirst}`);
      }
      sent.push(email);
      return { id: `email-${sent.length}`, to: email.to };
    },
  };
}

/**
 * Register the email-send processor on the env. Exposes the processor as a
 * plain function so unit-shaped tests can call it directly if they want.
 */
export function registerEmailProcessor(
  env: BullMQTestEnv,
  sink: EmailSink,
): (
  job: QueueJobSnapshot<EmailBody, { id: string; to: string }>,
) => Promise<{ id: string; to: string }> {
  const processor = async (
    job: QueueJobSnapshot<EmailBody, { id: string; to: string }>,
  ) => sink.send(job.data);
  env.process(processor);
  return processor;
}
