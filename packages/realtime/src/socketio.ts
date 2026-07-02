import { RealtimeEngine } from './engine.js';
import type { RealtimeMock, RealtimeMockConfig } from './types.js';

/**
 * Socket.io mock。
 *
 * SDK 呼出形式 (real `socket.io-client`) は以下 ...
 *
 * ```ts
 * const socket = io('http://localhost:3000/chat');  // namespace = '/chat'
 * socket.on('connect', () => {...});
 * socket.emit('message', payload);
 * socket.on('message', (data) => {...});
 * // server side: io.of('/chat').to('room-1').emit('message', ...)
 * ```
 *
 * 本 mock は namespace + room の 2 階層 pub/sub を engine channel に normalize、
 * `join(room)` / `leave(room)` / `emit(event, data)` / `on(event, handler)` を
 * 提供する。 reconnect + pending event replay + backpressure sim も内蔵。
 *
 * mock channel 名 = `<namespace>|<room>` (namespace 未指定は `/`)。
 */

export interface SocketIoSocket {
  readonly id: string;
  readonly namespace: string;
  connected: boolean;
  on(event: string, handler: (...args: unknown[]) => void): SocketIoSocket;
  off(event: string, handler?: (...args: unknown[]) => void): SocketIoSocket;
  emit(event: string, ...args: unknown[]): SocketIoSocket;
  join(room: string): Promise<void>;
  leave(room: string): Promise<void>;
  disconnect(): SocketIoSocket;
  connect(): SocketIoSocket;
  /** 現在 join 中の room 集合。 */
  rooms(): Set<string>;
}

export interface SocketIoNamespace {
  readonly name: string;
  to(room: string): SocketIoNamespace;
  emit(event: string, ...args: unknown[]): void;
  sockets: Map<string, SocketIoSocket>;
}

export interface SocketIoMock extends RealtimeMock {
  readonly provider: 'socketio';
  /** client socket (default namespace '/')。 */
  io(namespace?: string): SocketIoSocket;
  /** server side namespace (test で `.to(room).emit()` する用)。 */
  of(namespace: string): SocketIoNamespace;
}

export function createSocketioMock(config: RealtimeMockConfig = {}): SocketIoMock {
  const engine = new RealtimeEngine({ provider: 'socketio', ...config });
  const sockets = new Map<string, SocketIoSocket>();
  const namespaces = new Map<string, SocketIoNamespace>();

  const client: SocketIoMock = {
    provider: 'socketio',
    io(namespace = '/') {
      const key = namespace;
      const existing = sockets.get(key);
      if (existing) return existing;
      const sock = buildSocket(engine, namespace);
      sockets.set(key, sock);
      return sock;
    },
    of(namespace: string) {
      const existing = namespaces.get(namespace);
      if (existing) return existing;
      const ns = buildNamespace(engine, namespace);
      namespaces.set(namespace, ns);
      return ns;
    },
    subscribe: (channel, handler) => engine.subscribe(channel, handler),
    publish: (channel, event, payload) => engine.publish(channel, event, payload),
    trackPresence: (channel, uid, payload) => engine.trackPresence(channel, uid, payload),
    untrackPresence: (channel, uid) => engine.untrackPresence(channel, uid),
    getConnectionState: () => engine.getConnectionState(),
    disconnect: () => engine.disconnect(),
    reconnect: () => engine.reconnect(),
    getMetrics: () => engine.getMetrics(),
    reset: () => {
      engine.reset();
      sockets.clear();
      namespaces.clear();
    },
  };
  return client;
}

function normalizeChannel(namespace: string, room: string): string {
  return `${namespace}|${room}`;
}

function buildSocket(engine: RealtimeEngine, namespace: string): SocketIoSocket {
  const id = `sock_${Math.random().toString(36).slice(2, 10)}`;
  const eventHandlers = new Map<string, Array<(...args: unknown[]) => void>>();
  const joinedRooms = new Set<string>();
  const subHandles = new Map<string, { unsubscribe(): Promise<void> }>();
  let connected = false;

  const bindConnection = (state: 'connect' | 'disconnect' | 'reconnect'): void => {
    const arr = eventHandlers.get(state) ?? [];
    for (const h of arr) h();
  };

  const subscribeRoom = async (room: string): Promise<void> => {
    if (subHandles.has(room)) return;
    const ch = normalizeChannel(namespace, room);
    const handle = await engine.subscribe(ch, (event) => {
      if (event.kind === 'broadcast') {
        const arr = eventHandlers.get(event.event) ?? [];
        for (const h of arr) h(event.payload);
      } else if (event.kind === 'connection') {
        if (event.state === 'connected') {
          if (!connected) {
            connected = true;
            bindConnection('connect');
          }
        } else if (event.state === 'disconnected') {
          if (connected) {
            connected = false;
            bindConnection('disconnect');
          }
        } else if (event.state === 'reconnecting') {
          bindConnection('reconnect');
        }
      }
    });
    subHandles.set(room, handle);
  };

  const socket: SocketIoSocket = {
    id,
    namespace,
    get connected() {
      return connected;
    },
    set connected(_v) {
      /* no-op setter for typing */
    },
    on(event, handler) {
      const arr = eventHandlers.get(event) ?? [];
      arr.push(handler);
      eventHandlers.set(event, arr);
      // default room (namespace の primary) を subscribe しておく
      void subscribeRoom('__default__');
      // connect event を初回登録時に発火 (真の socket.io 相当は connect 前の
      // on('connect') バインドを想定するが、 mock では 1 tick 遅延で発火)
      if (event === 'connect' && !connected) {
        void engine.ensureConnected().then(() => {
          connected = true;
          const arr2 = eventHandlers.get('connect') ?? [];
          for (const h of arr2) h();
        });
      }
      return socket;
    },
    off(event, handler) {
      if (!handler) {
        eventHandlers.delete(event);
      } else {
        const arr = eventHandlers.get(event) ?? [];
        const filtered = arr.filter((h) => h !== handler);
        eventHandlers.set(event, filtered);
      }
      return socket;
    },
    emit(event, ...args) {
      // emit は接続している room 全てに server 経由で broadcast
      const payload = args.length === 1 ? args[0] : args;
      const rooms = joinedRooms.size > 0 ? [...joinedRooms] : ['__default__'];
      for (const room of rooms) {
        void engine.publish(normalizeChannel(namespace, room), event, payload);
      }
      return socket;
    },
    async join(room: string) {
      joinedRooms.add(room);
      await subscribeRoom(room);
    },
    async leave(room: string) {
      joinedRooms.delete(room);
      const handle = subHandles.get(room);
      if (handle) {
        await handle.unsubscribe();
        subHandles.delete(room);
      }
    },
    disconnect() {
      connected = false;
      void engine.disconnect();
      bindConnection('disconnect');
      return socket;
    },
    connect() {
      void engine.reconnect().then(() => {
        connected = true;
        bindConnection('connect');
      });
      return socket;
    },
    rooms() {
      return new Set(joinedRooms);
    },
  };
  return socket;
}

function buildNamespace(engine: RealtimeEngine, name: string): SocketIoNamespace {
  let targetRoom: string | null = null;
  const ns: SocketIoNamespace = {
    name,
    sockets: new Map(),
    to(room: string) {
      targetRoom = room;
      return ns;
    },
    emit(event: string, ...args: unknown[]) {
      const payload = args.length === 1 ? args[0] : args;
      const room = targetRoom ?? '__default__';
      const ch = normalizeChannel(name, room);
      void engine.publish(ch, event, payload);
      targetRoom = null;
    },
  };
  return ns;
}
