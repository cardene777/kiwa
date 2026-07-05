/**
 * `/signaling` HTTP handler — the boundary the Next.js runtime exposes for
 * SDP offer / answer + ICE candidate exchange. In production this would
 * typically be a WebSocket route so peers can trickle candidates as they
 * gather, but the harness runs against a plain fetch-shaped request/response
 * so unit tests can drive it without a live socket. The behaviour observed
 * is identical — the mediasoup Transport that receives an SDP offer replies
 * with an answer regardless of transport channel.
 *
 * Requests are validated at this boundary — the room manager itself trusts
 * the adapter contract, so a malformed payload cannot corrupt SFU state.
 */

import type { VideoCallAdapter } from '../../adapters/interface.js';

export type SignalingKind = 'offer' | 'answer' | 'ice-candidate' | 'ice-restart';

export interface SignalingRequestBase {
  roomId: string;
  peerId: string;
}

export interface SignalingOfferRequest extends SignalingRequestBase {
  kind: 'offer';
  role: 'offerer';
  initialMedia?: Array<'audio' | 'video'>;
}

export interface SignalingAnswerRequest extends SignalingRequestBase {
  kind: 'answer';
  role: 'answerer';
  initialMedia?: Array<'audio' | 'video'>;
}

export interface SignalingIceCandidateRequest extends SignalingRequestBase {
  kind: 'ice-candidate';
  /** The SFU pushes candidates in via the same channel; this is the client-side notice. */
  candidateId: string;
}

export interface SignalingIceRestartRequest extends SignalingRequestBase {
  kind: 'ice-restart';
  forceRelay?: boolean;
}

export type SignalingRequest =
  | SignalingOfferRequest
  | SignalingAnswerRequest
  | SignalingIceCandidateRequest
  | SignalingIceRestartRequest;

export interface SignalingResponse {
  ok: boolean;
  kind: SignalingKind;
  roomId: string;
  peerId: string;
  sdpFingerprint?: string;
  candidatesGathered?: number;
  relayUsed?: boolean;
  errorKind?: string;
}

/**
 * Validate a signaling payload independently of the adapter — returning an
 * errorKind here lets the fidelity harness assert on rejection paths
 * (empty roomId, unknown kind, etc) without exercising the SFU.
 */
export function validateSignalingRequest(
  body: unknown,
): { ok: true; value: SignalingRequest } | { ok: false; errorKind: string } {
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
  if (
    kind !== 'offer' &&
    kind !== 'answer' &&
    kind !== 'ice-candidate' &&
    kind !== 'ice-restart'
  ) {
    return { ok: false, errorKind: 'invalid_kind' };
  }
  return { ok: true, value: b as unknown as SignalingRequest };
}

export interface SignalingHandlerOptions {
  adapter: VideoCallAdapter;
}

export function createSignalingHandler(opts: SignalingHandlerOptions) {
  const { adapter } = opts;
  return async function signalingHandler(
    req: SignalingRequest,
  ): Promise<SignalingResponse> {
    if (req.kind === 'offer') {
      const result = await adapter.joinRoom({
        roomId: req.roomId,
        peerId: req.peerId,
        role: 'offerer',
        ...(req.initialMedia ? { initialMedia: req.initialMedia } : {}),
      });
      return {
        ok: true,
        kind: 'offer',
        roomId: req.roomId,
        peerId: req.peerId,
        sdpFingerprint: result.sdpFingerprint,
      };
    }
    if (req.kind === 'answer') {
      const result = await adapter.joinRoom({
        roomId: req.roomId,
        peerId: req.peerId,
        role: 'answerer',
        ...(req.initialMedia ? { initialMedia: req.initialMedia } : {}),
      });
      return {
        ok: true,
        kind: 'answer',
        roomId: req.roomId,
        peerId: req.peerId,
        sdpFingerprint: result.sdpFingerprint,
      };
    }
    if (req.kind === 'ice-restart') {
      const result = await adapter.iceRestart({
        roomId: req.roomId,
        peerId: req.peerId,
        ...(req.forceRelay ? { forceRelay: true } : {}),
      });
      return {
        ok: true,
        kind: 'ice-restart',
        roomId: req.roomId,
        peerId: req.peerId,
        candidatesGathered: result.candidatesGathered,
        relayUsed: result.relayUsed,
      };
    }
    // ice-candidate has no adapter op — mediasoup would push the candidate
    // into the transport's remote description; the mock captures the same
    // signal in the ICE state stream driven by joinRoom / iceRestart.
    return {
      ok: true,
      kind: 'ice-candidate',
      roomId: req.roomId,
      peerId: req.peerId,
    };
  };
}
