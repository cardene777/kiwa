/**
 * nginx-quic launcher stub — the real adapter will spawn an nginx-quic HTTP/3
 * server in a testcontainer when the env keys are present. This module
 * exposes the shape of that future launcher without pulling in the QUIC-
 * enabled nginx build yet, so callers can depend on it today and the
 * follow-up milestone only has to fill in the container spin-up.
 *
 * The gate mirrors `dogfood-nuxt-webtransport-stream-app/src/lib/aioquic-server.ts` —
 * every function returns a deterministic error when the env is missing, so
 * unit tests can drive both branches without an actual nginx-quic process.
 */

export interface NginxQuicServerHandle {
  /** UDP port the QUIC endpoint listens on. */
  port: number;
  /** Origin URL the client should point HTTP/3 requests at. */
  origin: string;
  /** Torn down when the test finishes. */
  close(): Promise<void>;
}

export interface StartNginxQuicServerInput {
  /** Optional cert path override; default uses nginx-quic's built-in self-signed. */
  certPath?: string;
  /** Optional 0-RTT session ticket TTL (seconds); default 30. */
  sessionTicketTtlSec?: number;
  /** Optional HPACK dynamic table size (bytes); default 4096. */
  hpackTableSize?: number;
}

/**
 * Report whether an nginx-quic launcher can be spawned. Mirrors the adapter
 * env check so tests can decide whether to skip real-mode branches.
 */
export function detectNginxQuicMissing(): string | null {
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  if (process.env['HTTP3_KEY'] === '1') return null;
  return 'KIWA_HTTP3_ENV_MISSING';
}

/**
 * Placeholder — the follow-up milestone wires this to spawn an nginx-quic
 * container. Today it throws with a clear error when the env is missing, and
 * throws `not_yet_implemented` when the env is present but the container
 * runner is not shipped.
 */
export async function startNginxQuicServer(
  _input: StartNginxQuicServerInput = {},
): Promise<NginxQuicServerHandle> {
  const missing = detectNginxQuicMissing();
  if (missing) {
    throw new Error(`startNginxQuicServer: ${missing}`);
  }
  throw new Error(
    'startNginxQuicServer: not_yet_implemented (follow-up milestone ships the testcontainers runner)',
  );
}
