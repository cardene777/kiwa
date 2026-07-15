import type { WSServer } from './server.js';
import type { WSPayload } from './message.js';

export type WSMessageHandler = (payload: WSPayload) => void;
export type WSCloseHandler = (code: number, reason: string) => void;

export interface WSClientOptions {
  id?: string;
  now?: () => number;
}

export interface WSClient {
  id: string;
  server?: WSServer;
  isOpen: boolean;
  send: (payload: WSPayload) => void;
  onMessage: (handler: WSMessageHandler) => void;
  onClose: (handler: WSCloseHandler) => void;
  close: (code?: number, reason?: string) => void;
  received: () => WSPayload[];
  _attachServer: (server: WSServer) => void;
  _receive: (payload: WSPayload) => void;
  _markClosed: () => void;
}

/**
 * client mock。 server を受け取ってすぐ accept する経路 (auto handshake、 real WS の open event 相当)。
 */
export function connectClient(server: WSServer, options: WSClientOptions = {}): WSClient {
  const messageHandlers: WSMessageHandler[] = [];
  const closeHandlers: WSCloseHandler[] = [];
  const received: WSPayload[] = [];
  const id = options.id ?? server.nextId();

  const client: WSClient = {
    id,
    isOpen: true,
    send(payload) {
      if (!client.isOpen) throw new Error(`client ${id} is closed`);
      if (!client.server) throw new Error(`client ${id} not attached to server`);
      client.server.recordSent({
        id: `${id}-s-${received.length + 1}`,
        provider: client.server.provider,
        target: 'client',
        clientId: id,
        payload,
        sentAt: options.now?.() ?? 0,
      });
      client.server.emit(client, payload);
    },
    onMessage(handler) {
      messageHandlers.push(handler);
    },
    onClose(handler) {
      closeHandlers.push(handler);
    },
    close(code = 1000, reason = 'normal closure') {
      if (!client.isOpen) return;
      client.isOpen = false;
      for (const h of closeHandlers) h(code, reason);
    },
    received: () => [...received],
    _attachServer(s) {
      client.server = s;
    },
    _receive(payload) {
      received.push(payload);
      for (const h of messageHandlers) h(payload);
    },
    _markClosed() {
      client.isOpen = false;
      for (const h of closeHandlers) h(1006, 'server disconnected');
    },
  };
  server.accept(client);
  return client;
}
