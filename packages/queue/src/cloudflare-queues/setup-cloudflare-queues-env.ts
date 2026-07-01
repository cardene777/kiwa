import { createMiniflareCloudflareQueuesEnv } from './miniflare-cloudflare-queues.js';
import { createWranglerCloudflareQueuesEnv } from './wrangler-cloudflare-queues.js';
import type {
  CloudflareQueuesTestEnv,
  SetupCloudflareQueuesEnvOptions,
} from './types.js';

/**
 * Factory for Cloudflare Queues test environments.
 *
 * `mode: 'miniflare'` (default) returns a fast, in-process fake — no wrangler
 * subprocess, no network. Deterministic enough to exercise send / consumer
 * batch / retry / DLQ semantics without spinning up an external process.
 *
 * `mode: 'wrangler'` boots (or connects to) a real `wrangler dev --local`
 * process and verifies it responds before returning the env. The env still
 * runs consumer batch handlers in-process (v0.2 scope) so retry / DLQ
 * assertions stay deterministic across backends.
 */
export async function setupCloudflareQueuesEnv(
  opts: SetupCloudflareQueuesEnvOptions = {},
): Promise<CloudflareQueuesTestEnv> {
  const mode = opts.mode ?? 'miniflare';
  if (mode !== 'miniflare' && mode !== 'wrangler') {
    throw new Error(
      `setupCloudflareQueuesEnv: unknown mode "${String(mode)}" — expected "miniflare" or "wrangler"`,
    );
  }
  if (mode === 'miniflare') {
    return createMiniflareCloudflareQueuesEnv(opts);
  }
  return createWranglerCloudflareQueuesEnv(opts);
}
