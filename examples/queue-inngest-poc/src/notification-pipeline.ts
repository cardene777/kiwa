import type {
  InngestFunctionDefinition,
  InngestTestEnv,
} from '@kiwa/queue';

/**
 * A small notification-pipeline style Inngest function stitched together so the
 * PoC can prove the `sendEvent → run → assert` loop end-to-end without booting
 * a real dev-server.
 *
 * The pipeline models a signup-completed flow — load the user, send a welcome
 * email, wait for a reminder window, then write an audit log entry. Every step
 * is deterministic so tests can assert the observed trace directly.
 */
export interface SignupCompletedEvent {
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface NotificationSink {
  emailsSent: Array<{ to: string; plan: string }>;
  auditLog: Array<{ userId: string; plan: string }>;
  failNext: number;
  send: (input: { to: string; plan: string }) => Promise<{ id: string }>;
}

export function createNotificationSink(opts?: {
  failFirst?: number | undefined;
}): NotificationSink {
  const emailsSent: NotificationSink['emailsSent'] = [];
  const auditLog: NotificationSink['auditLog'] = [];
  return {
    emailsSent,
    auditLog,
    failNext: opts?.failFirst ?? 0,
    async send(input) {
      if (this.failNext > 0) {
        this.failNext -= 1;
        throw new Error(`transient SMTP failure ${input.to}`);
      }
      emailsSent.push(input);
      return { id: `email-${emailsSent.length}` };
    },
  };
}

/**
 * Build the signup-completed function definition. Kept as a factory so tests
 * can inject their own sink for retry / failure scenarios.
 */
export function createSignupCompletedFn(
  sink: NotificationSink,
): InngestFunctionDefinition<SignupCompletedEvent, { ok: true; auditId: string }> {
  return {
    id: 'signup-completed',
    event: 'user/signup.completed',
    retries: 3,
    handler: async ({ step, event }) => {
      // Emulate looking up a user record — sink-free so this step never fails.
      const user = await step.run('load-user', () => ({
        id: event.data.userId,
        email: `${event.data.userId}@example.test`,
      }));
      // Emulate sending a welcome email — the sink governs whether this
      // succeeds so the retry test can inject transient failures.
      await step.run('send-welcome-email', () =>
        sink.send({ to: user.email, plan: event.data.plan }),
      );
      // Emulate the reminder wait — stub mode records the step id without
      // burning real time.
      await step.sleep('wait-for-reminder', 24 * 60 * 60 * 1000);
      const audit = await step.run('audit-log', () => {
        const entry = { userId: user.id, plan: event.data.plan };
        sink.auditLog.push(entry);
        return { id: `audit-${sink.auditLog.length}` };
      });
      return { ok: true, auditId: audit.id };
    },
  };
}

/**
 * Convenience helper — attach the signup-completed function to an env with a
 * fresh sink. Returns the sink so tests can inspect its post-run state.
 */
export function attachSignupPipeline(
  env: InngestTestEnv,
  opts?: { failFirst?: number | undefined },
): NotificationSink {
  const sink = createNotificationSink(opts);
  env.registerFunction(createSignupCompletedFn(sink));
  return sink;
}
