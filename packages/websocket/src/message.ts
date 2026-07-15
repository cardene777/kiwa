import type { WSClient } from './client.js';
import type { WSServer } from './server.js';

export type WSPayload = string | Uint8Array | { type: string; data: unknown };

export type WSBroadcastFilter = (client: WSClient) => boolean;

/**
 * target = server なら該当 client に direct send、 client なら server 経由で emit。
 */
export function sendMessage(
  from: WSServer | WSClient,
  target: WSClient | string | null,
  payload: WSPayload,
): void {
  if ('provider' in from && 'accept' in from) {
    // from = server
    const server = from as WSServer;
    if (target === null) {
      server.broadcast(payload);
      return;
    }
    const clientId = typeof target === 'string' ? target : (target as WSClient).id;
    const client = server.clients().find((c) => c.id === clientId);
    if (!client) throw new Error(`client not found: ${clientId}`);
    client._receive(payload);
    return;
  }
  // from = client
  const client = from as WSClient;
  client.send(payload);
}

/**
 * server-side broadcast。 filter で選別可能 (room / tag 等の subset broadcast simulate)。
 */
export function broadcastMessage(server: WSServer, payload: WSPayload, filter?: WSBroadcastFilter): void {
  if (!filter) {
    server.broadcast(payload);
    return;
  }
  for (const c of server.clients()) {
    if (filter(c)) c._receive(payload);
  }
}
