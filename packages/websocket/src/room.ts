import type { WSClient } from './client.js';
import type { WSPayload } from './message.js';

export interface RoomRegistry {
  join: (roomName: string, client: WSClient) => void;
  leave: (roomName: string, clientId: string) => void;
  listMembers: (roomName: string) => WSClient[];
  broadcastToRoom: (roomName: string, payload: WSPayload) => number;
  listRooms: () => string[];
  presenceOf: (roomName: string) => PresenceInfo[];
}

export interface PresenceInfo {
  clientId: string;
  joinedAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * room/channel 抽象。 client を roomName で group 化し、 broadcastToRoom で
 * 該当 member にのみ配信。 real Socket.IO room / Colyseus room 相当を mock。
 */
export function createRoomRegistry(now: () => number = () => 0): RoomRegistry {
  const rooms = new Map<string, Map<string, { client: WSClient; info: PresenceInfo }>>();
  return {
    join(roomName, client) {
      let room = rooms.get(roomName);
      if (!room) {
        room = new Map();
        rooms.set(roomName, room);
      }
      room.set(client.id, { client, info: { clientId: client.id, joinedAt: now() } });
    },
    leave(roomName, clientId) {
      const room = rooms.get(roomName);
      if (!room) return;
      room.delete(clientId);
      if (room.size === 0) rooms.delete(roomName);
    },
    listMembers(roomName) {
      const room = rooms.get(roomName);
      return room ? [...room.values()].map((e) => e.client) : [];
    },
    broadcastToRoom(roomName, payload) {
      const room = rooms.get(roomName);
      if (!room) return 0;
      let count = 0;
      for (const { client } of room.values()) {
        if (client.isOpen) {
          client._receive(payload);
          count += 1;
        }
      }
      return count;
    },
    listRooms() {
      return [...rooms.keys()];
    },
    presenceOf(roomName) {
      const room = rooms.get(roomName);
      return room ? [...room.values()].map((e) => e.info) : [];
    },
  };
}
