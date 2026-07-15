import type { WSClient } from './client.js';
import type { WSPayload } from './message.js';

export type WSProvider = 'ws' | 'uwebsockets' | 'socketio' | 'colyseus';

export interface WSServerOptions {
  provider?: WSProvider;
  now?: () => number;
  idSeed?: number;
}

export interface WSSentRecord {
  id: string;
  provider: WSProvider;
  target: 'client' | 'broadcast';
  clientId?: string;
  payload: WSPayload;
  sentAt: number;
}

export interface WSServerEvents {
  onConnect?: (client: WSClient) => void;
  onDisconnect?: (client: WSClient) => void;
  onMessage?: (client: WSClient, payload: WSPayload) => void;
}

export interface WSServer {
  provider: WSProvider;
  clients: () => WSClient[];
  accept: (client: WSClient) => void;
  disconnect: (clientId: string) => void;
  broadcast: (payload: WSPayload) => void;
  listSent: () => WSSentRecord[];
  clear: () => void;
  on: <K extends keyof WSServerEvents>(event: K, handler: NonNullable<WSServerEvents[K]>) => void;
  nextId: () => string;
  recordSent: (record: WSSentRecord) => void;
  emit: (client: WSClient, payload: WSPayload) => void;
}

/**
 * provider 別 mock server。 provider 差は id prefix と挙動 default のみ、 API は共通 interface。
 */
export function createWSServer(options: WSServerOptions = {}): WSServer {
  const provider = options.provider ?? 'ws';
  const now = options.now ?? (() => 0);
  const idPrefix = { ws: 'ws', uwebsockets: 'uws', socketio: 'sio', colyseus: 'col' }[provider];
  const sent: WSSentRecord[] = [];
  const clients: WSClient[] = [];
  const events: WSServerEvents = {};
  let counter = options.idSeed ?? 0;

  const server: WSServer = {
    provider,
    clients: () => [...clients],
    accept(client) {
      clients.push(client);
      client._attachServer(server);
      events.onConnect?.(client);
    },
    disconnect(clientId) {
      const idx = clients.findIndex((c) => c.id === clientId);
      if (idx < 0) return;
      const [client] = clients.splice(idx, 1);
      if (client) {
        client._markClosed();
        events.onDisconnect?.(client);
      }
    },
    broadcast(payload) {
      counter += 1;
      const id = `${idPrefix}-b-${counter}`;
      sent.push({ id, provider, target: 'broadcast', payload, sentAt: now() });
      for (const c of clients) {
        c._receive(payload);
      }
    },
    listSent: () => [...sent],
    clear() {
      sent.length = 0;
      clients.length = 0;
    },
    on(event, handler) {
      events[event] = handler as typeof events[typeof event];
    },
    nextId() {
      counter += 1;
      return `${idPrefix}-c-${counter}`;
    },
    recordSent(record) {
      sent.push(record);
    },
    emit(client, payload) {
      events.onMessage?.(client, payload);
    },
  };
  return server;
}
