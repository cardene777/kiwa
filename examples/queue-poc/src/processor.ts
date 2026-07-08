import type { QueueClient } from '@kiwa/data';

export interface Order {
  orderId: string;
  amount: number;
}

export interface OrderState {
  acceptedOrders: string[];
  rejectedOrders: string[];
}

export function startOrderProcessor(
  client: QueueClient<Order>,
  state: OrderState,
  opts: { maxAmount?: number } = {},
): () => void {
  const maxAmount = opts.maxAmount ?? 1000;
  return client.consume(async (msg, ack) => {
    if (msg.body.amount > maxAmount) {
      state.rejectedOrders.push(msg.body.orderId);
      ack.ack();
      return;
    }
    state.acceptedOrders.push(msg.body.orderId);
    ack.ack();
  });
}
