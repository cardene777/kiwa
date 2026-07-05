/**
 * SFU room registry — the in-memory catalog the signaling routes talk to.
 *
 * In production mediasoup would own a `Worker` + `Router` + N `Transport` +
 * `Producer` / `Consumer` per peer, all living in a native worker process.
 * This dogfood models the same lifecycle at the JavaScript layer so mock and
 * real adapters can share a state model — the harness inspects the same
 * room / peer / producer counts regardless of which adapter is driving.
 *
 * The registry is a `Map` keyed by roomId. Each room holds a `Map` of peers,
 * each peer holds a `Map` of published producers keyed by trackId. Consumers
 * are represented as (peerId -> Set<trackId>) so downstream simulcast layer
 * queries stay indexable by (viewer, source track).
 */

import type { MediaKind, PeerRole } from '../adapters/interface.js';

/** One published producer — matches mediasoup's `Producer` surface subset. */
export interface Producer {
  trackId: string;
  kind: MediaKind;
  simulcastEnabled: boolean;
  muted: boolean;
}

/** One consumer preference — mediasoup's `Consumer.setPreferredLayers` mirror. */
export interface ConsumerPreference {
  producerTrackId: string;
  layer: 'low' | 'med' | 'high';
}

/** One peer in a room — mediasoup Transport + Producer + Consumer trio mirror. */
export interface RoomPeer {
  peerId: string;
  role: PeerRole;
  joinedAt: number;
  producers: Map<string, Producer>;
  consumerPrefs: Map<string, ConsumerPreference>;
}

/** One video call room — a bundle of peers sharing an SFU router. */
export interface Room {
  roomId: string;
  createdAt: number;
  peers: Map<string, RoomPeer>;
}

export interface WebRtcServer {
  createRoom(roomId: string): Room;
  getRoom(roomId: string): Room | null;
  addPeer(roomId: string, peerId: string, role: PeerRole): RoomPeer;
  removePeer(roomId: string, peerId: string): boolean;
  addProducer(roomId: string, peerId: string, producer: Producer): boolean;
  removeProducer(roomId: string, peerId: string, trackId: string): boolean;
  setConsumerLayer(
    roomId: string,
    peerId: string,
    producerTrackId: string,
    layer: 'low' | 'med' | 'high',
  ): boolean;
  setProducerMuted(
    roomId: string,
    peerId: string,
    trackId: string,
    muted: boolean,
  ): boolean;
  listRooms(): Room[];
  reset(): void;
}

export function createWebRtcServer(): WebRtcServer {
  const rooms = new Map<string, Room>();
  return {
    createRoom(roomId: string): Room {
      const existing = rooms.get(roomId);
      if (existing) return existing;
      const room: Room = {
        roomId,
        createdAt: Date.now(),
        peers: new Map(),
      };
      rooms.set(roomId, room);
      return room;
    },
    getRoom(roomId: string): Room | null {
      return rooms.get(roomId) ?? null;
    },
    addPeer(roomId: string, peerId: string, role: PeerRole): RoomPeer {
      let room = rooms.get(roomId);
      if (!room) room = this.createRoom(roomId);
      const existing = room.peers.get(peerId);
      if (existing) return existing;
      const peer: RoomPeer = {
        peerId,
        role,
        joinedAt: Date.now(),
        producers: new Map(),
        consumerPrefs: new Map(),
      };
      room.peers.set(peerId, peer);
      return peer;
    },
    removePeer(roomId: string, peerId: string): boolean {
      const room = rooms.get(roomId);
      if (!room) return false;
      const removed = room.peers.delete(peerId);
      if (room.peers.size === 0) rooms.delete(roomId);
      return removed;
    },
    addProducer(roomId: string, peerId: string, producer: Producer): boolean {
      const room = rooms.get(roomId);
      const peer = room?.peers.get(peerId);
      if (!peer) return false;
      peer.producers.set(producer.trackId, producer);
      return true;
    },
    removeProducer(roomId: string, peerId: string, trackId: string): boolean {
      const room = rooms.get(roomId);
      const peer = room?.peers.get(peerId);
      if (!peer) return false;
      return peer.producers.delete(trackId);
    },
    setConsumerLayer(roomId, peerId, producerTrackId, layer): boolean {
      const room = rooms.get(roomId);
      const peer = room?.peers.get(peerId);
      if (!peer) return false;
      peer.consumerPrefs.set(producerTrackId, { producerTrackId, layer });
      return true;
    },
    setProducerMuted(roomId, peerId, trackId, muted): boolean {
      const room = rooms.get(roomId);
      const peer = room?.peers.get(peerId);
      const producer = peer?.producers.get(trackId);
      if (!producer) return false;
      producer.muted = muted;
      return true;
    },
    listRooms(): Room[] {
      return Array.from(rooms.values());
    },
    reset(): void {
      rooms.clear();
    },
  };
}
