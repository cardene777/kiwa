/**
 * `/room` HTTP handler — publish / unpublish / mute / layer-select ops the
 * Next.js runtime exposes to a room UI. Signaling is separate at
 * `/signaling` (SDP + ICE only) so the two surfaces mirror how mediasoup
 * splits its control API (Transport / Router) from its media API (Producer /
 * Consumer / DataProducer).
 *
 * The handler is intentionally shape-neutral — the fidelity harness feeds
 * plain objects in and asserts on plain objects out, so the same test can
 * exercise mock and real without spinning up Next.js.
 */

import type { MediaKind, VideoCallAdapter } from '../../adapters/interface.js';

export type RoomOpKind =
  | 'publish'
  | 'unpublish'
  | 'mute'
  | 'unmute'
  | 'select-layer'
  | 'leave';

export interface RoomRequestBase {
  roomId: string;
  peerId: string;
}

export interface RoomPublishRequest extends RoomRequestBase {
  kind: 'publish';
  media: MediaKind;
  simulcast?: boolean;
}

export interface RoomUnpublishRequest extends RoomRequestBase {
  kind: 'unpublish';
  trackId: string;
}

export interface RoomMuteRequest extends RoomRequestBase {
  kind: 'mute' | 'unmute';
  trackId: string;
}

export interface RoomSelectLayerRequest extends RoomRequestBase {
  kind: 'select-layer';
  trackId: string;
  layer: 'low' | 'med' | 'high';
}

export interface RoomLeaveRequest extends RoomRequestBase {
  kind: 'leave';
}

export type RoomRequest =
  | RoomPublishRequest
  | RoomUnpublishRequest
  | RoomMuteRequest
  | RoomSelectLayerRequest
  | RoomLeaveRequest;

export interface RoomResponse {
  ok: boolean;
  kind: RoomOpKind;
  roomId: string;
  peerId: string;
  trackId?: string;
  layer?: 'low' | 'med' | 'high';
  simulcastLayers?: number;
  muted?: boolean;
  errorKind?: string;
}

export function validateRoomRequest(
  body: unknown,
): { ok: true; value: RoomRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['roomId'] !== 'string' || !b['roomId']) {
    return { ok: false, errorKind: 'missing_room_id' };
  }
  if (typeof b['peerId'] !== 'string' || !b['peerId']) {
    return { ok: false, errorKind: 'missing_peer_id' };
  }
  const kind = b['kind'];
  const ALLOWED: RoomOpKind[] = ['publish', 'unpublish', 'mute', 'unmute', 'select-layer', 'leave'];
  if (typeof kind !== 'string' || !ALLOWED.includes(kind as RoomOpKind)) {
    return { ok: false, errorKind: 'invalid_kind' };
  }
  if (kind === 'publish') {
    const media = b['media'];
    if (media !== 'audio' && media !== 'video') {
      return { ok: false, errorKind: 'invalid_media' };
    }
  }
  if (kind === 'unpublish' || kind === 'mute' || kind === 'unmute' || kind === 'select-layer') {
    if (typeof b['trackId'] !== 'string' || !b['trackId']) {
      return { ok: false, errorKind: 'missing_track_id' };
    }
  }
  if (kind === 'select-layer') {
    const layer = b['layer'];
    if (layer !== 'low' && layer !== 'med' && layer !== 'high') {
      return { ok: false, errorKind: 'invalid_layer' };
    }
  }
  return { ok: true, value: b as unknown as RoomRequest };
}

export interface RoomHandlerOptions {
  adapter: VideoCallAdapter;
}

export function createRoomHandler(opts: RoomHandlerOptions) {
  const { adapter } = opts;
  return async function roomHandler(req: RoomRequest): Promise<RoomResponse> {
    if (req.kind === 'publish') {
      const result = await adapter.publishTrack({
        roomId: req.roomId,
        peerId: req.peerId,
        kind: req.media,
        ...(req.simulcast !== undefined ? { simulcast: req.simulcast } : {}),
      });
      return {
        ok: true,
        kind: 'publish',
        roomId: req.roomId,
        peerId: req.peerId,
        trackId: result.trackId,
        simulcastLayers: result.simulcastLayers.length,
      };
    }
    if (req.kind === 'unpublish') {
      await adapter.unpublishTrack({
        roomId: req.roomId,
        peerId: req.peerId,
        trackId: req.trackId,
      });
      return {
        ok: true,
        kind: 'unpublish',
        roomId: req.roomId,
        peerId: req.peerId,
        trackId: req.trackId,
      };
    }
    if (req.kind === 'mute') {
      const result = await adapter.muteTrack({
        roomId: req.roomId,
        peerId: req.peerId,
        trackId: req.trackId,
      });
      return {
        ok: true,
        kind: 'mute',
        roomId: req.roomId,
        peerId: req.peerId,
        trackId: result.trackId,
        muted: result.muted,
      };
    }
    if (req.kind === 'unmute') {
      const result = await adapter.unmuteTrack({
        roomId: req.roomId,
        peerId: req.peerId,
        trackId: req.trackId,
      });
      return {
        ok: true,
        kind: 'unmute',
        roomId: req.roomId,
        peerId: req.peerId,
        trackId: result.trackId,
        muted: result.muted,
      };
    }
    if (req.kind === 'select-layer') {
      const result = await adapter.selectLayer({
        roomId: req.roomId,
        peerId: req.peerId,
        trackId: req.trackId,
        layer: req.layer,
      });
      return {
        ok: true,
        kind: 'select-layer',
        roomId: req.roomId,
        peerId: req.peerId,
        trackId: result.trackId,
        layer: result.layer,
      };
    }
    // leave
    await adapter.leaveRoom({ roomId: req.roomId, peerId: req.peerId });
    return {
      ok: true,
      kind: 'leave',
      roomId: req.roomId,
      peerId: req.peerId,
    };
  };
}
