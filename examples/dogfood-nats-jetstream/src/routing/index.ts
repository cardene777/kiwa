/**
 * Subject-based routing flow — literal subject + `*` single-token wildcard
 * + `>` catch-all wildcard + queue group load balancing.
 *
 * Real NATS supports queue groups where each subscription in a group
 * receives *at most one* copy of a message (broker-side round-robin). The
 * mock delivers to every active subscription, so this flow layers queue
 * group semantics on top by tracking group membership and rotating a
 * per-group cursor before invoking the underlying handler.
 */

import type {
  MessageHandler,
  NatsMock,
  NatsSubscription,
  StreamingMessage,
} from '@kiwa-lab/streaming';

export interface RoutingRun {
  readonly subscribe: (input: SubscribeInput) => NatsSubscription;
  readonly publish: <T>(subject: string, data: T) => Promise<void>;
  readonly deliveries: () => readonly RoutingDelivery[];
  readonly queueGroupSizes: () => Record<string, number>;
  readonly reset: () => void;
}

export interface SubscribeInput {
  readonly subject: string;
  readonly queue?: string;
  readonly handler: MessageHandler;
  readonly label: string;
}

export interface RoutingDelivery {
  readonly label: string;
  readonly subject: string;
  readonly value: unknown;
  readonly queue?: string | undefined;
}

interface QueueGroupState {
  readonly members: SubscribeInput[];
  cursor: number;
  /** Per-message dispatch key so peers exit early on the same publish. */
  lastDispatchedFor: WeakSet<StreamingMessage>;
}

/**
 * Build the routing run bound to a NATS mock. Non-queue subscriptions
 * are delivered as-is; queue-group subscriptions share deliveries in a
 * round-robin per message (only 1 member handles each publish).
 */
export function createRoutingRun(input: { readonly nats: NatsMock }): RoutingRun {
  const nats = input.nats;
  const queueGroups = new Map<string, QueueGroupState>();
  const deliveries: RoutingDelivery[] = [];

  function recordDelivery(entry: SubscribeInput, message: StreamingMessage): void {
    deliveries.push({
      label: entry.label,
      subject: message.topic,
      value: message.value,
      queue: entry.queue,
    });
  }

  return {
    subscribe(sub: SubscribeInput): NatsSubscription {
      if (sub.queue !== undefined) {
        const groupKey = `${sub.subject}::${sub.queue}`;
        const state =
          queueGroups.get(groupKey) ??
          ({ members: [], cursor: 0, lastDispatchedFor: new WeakSet() } as QueueGroupState);
        state.members.push(sub);
        queueGroups.set(groupKey, state);
        return nats.subscribe(sub.subject, async (msg: StreamingMessage) => {
          // Advance the group's cursor once per message — the mock's
          // fanout invokes every subscription in the group, so we key
          // the round-robin off the message identity to make sure only
          // 1 member records + runs per publish.
          if (!state.lastDispatchedFor.has(msg)) {
            state.cursor += 1;
            state.lastDispatchedFor.add(msg);
          }
          const picked = state.members[(state.cursor - 1) % state.members.length];
          if (picked?.label !== sub.label) return;
          await sub.handler(msg);
          recordDelivery(sub, msg);
        });
      }
      return nats.subscribe(sub.subject, async (msg: StreamingMessage) => {
        await sub.handler(msg);
        recordDelivery(sub, msg);
      });
    },
    publish: <T>(subject: string, data: T) =>
      nats.publish<T>(subject, data).then(() => undefined),
    deliveries: () => [...deliveries],
    queueGroupSizes: () => {
      const out: Record<string, number> = {};
      for (const [key, state] of queueGroups.entries()) {
        out[key] = state.members.length;
      }
      return out;
    },
    reset(): void {
      deliveries.length = 0;
      queueGroups.clear();
    },
  };
}
