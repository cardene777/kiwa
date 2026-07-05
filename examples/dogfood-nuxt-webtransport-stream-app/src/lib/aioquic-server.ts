/**
 * aioquic launcher stub — the real adapter will spawn an aioquic HTTP/3
 * server in a testcontainer when the env keys are present. This module
 * exposes the shape of that future launcher without pulling in the Python
 * runtime yet, so callers can depend on it today and the follow-up milestone
 * only has to fill in the container spin-up.
 *
 * The gate mirrors `dogfood-nextjs-webrtc-video-app/src/lib/mediasoup-server.ts` —
 * every function returns a deterministic error when the env is missing, so
 * unit tests can drive both branches without an actual aioquic process.
 */

export interface AioquicServerHandle {
  /** UDP port the QUIC endpoint listens on. */
  port: number;
  /** Origin URL the client should point `new WebTransport(...)` at. */
  origin: string;
  /** Torn down when the test finishes. */
  close(): Promise<void>;
}

export interface StartAioquicServerInput {
  /** Optional cert path override; default uses aioquic's built-in self-signed. */
  certPath?: string;
  /** Optional resumption ticket TTL (seconds); default 30. */
  resumptionTtlSec?: number;
}

/**
 * Report whether an aioquic launcher can be spawned. Mirrors the adapter env
 * check so tests can decide whether to skip real-mode branches.
 */
export function detectAioquicMissing(): string | null {
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  if (process.env['WEBTRANSPORT_KEY'] === '1') return null;
  return 'KIWA_WEBTRANSPORT_ENV_MISSING';
}

/**
 * Placeholder — the follow-up milestone wires this to spawn an aioquic
 * container. Today it throws with a clear error when the env is missing, and
 * throws `not_yet_implemented` when the env is present but the container
 * runner is not shipped.
 */
export async function startAioquicServer(
  _input: StartAioquicServerInput = {},
): Promise<AioquicServerHandle> {
  const missing = detectAioquicMissing();
  if (missing) {
    throw new Error(`startAioquicServer: ${missing}`);
  }
  throw new Error(
    'startAioquicServer: not_yet_implemented (follow-up milestone ships the testcontainers runner)',
  );
}
