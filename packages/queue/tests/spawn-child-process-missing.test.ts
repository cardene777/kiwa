/**
 * `node:child_process` を読み込めない runtime での挙動を確かめる検査 (Issue #2166)。
 *
 * dev-server (Inngest) と wrangler (Cloudflare Queues) の 2 adapter は、 process を
 * 起こす直前に `await import('node:child_process')` を行い、 失敗したら「Node >= 20 が
 * 要る」 と読める形に置き換えて throw する。 この置き換えが効いていないと、 呼び手には
 * bundler / runtime 由来の解決エラーだけが届き、 原因が adapter の外にあるように見える。
 *
 * import そのものを失敗させたいので、 この検査は module 全体で `node:child_process` を
 * 「読み込むと例外になる module」 に差し替える。 同じ file 内の他の検査にも効くため、
 * 本 file は import 失敗の経路だけを扱い、 成功経路は別 file が持つ。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => {
  throw new Error('Cannot find module node:child_process');
});

const { setupInngestEnv } = await import('../src/inngest/setup-inngest-env.js');
const { setupCloudflareQueuesEnv } = await import(
  '../src/cloudflare-queues/setup-cloudflare-queues-env.js'
);

afterEach(() => {
  vi.unstubAllGlobals();
});

/** probe まで到達しないことを示すため、 fetch は呼ばれたら失敗させる。 */
function failingFetch(): { calls: number } {
  const state = { calls: 0 };
  vi.stubGlobal('fetch', async () => {
    state.calls += 1;
    throw new Error('fetch should not be reached');
  });
  return state;
}

describe('spawn 前の node:child_process 解決', () => {
  it('T-INNGEST-037 Inngest dev-server は要件と元エラーを併記して throw する', async () => {
    const fetchState = failingFetch();

    // 元エラーの文面は差し替え層が決めるため中身は問わない。 見るのは
    // 「要件を明示した前置き」 と「元エラーを捨てずに繋いでいること」 の 2 点。
    await expect(setupInngestEnv({ mode: 'dev-server' })).rejects.toThrow(
      /dev-server mode requires node:child_process \(Node >= 20\)\. Original error: \S/s,
    );
    // 起動できていない以上、 probe には進まない。
    expect(fetchState.calls).toBe(0);
  });

  it('T-CFQ-031 wrangler も同じ形で要件と元エラーを併記して throw する', async () => {
    const fetchState = failingFetch();

    await expect(setupCloudflareQueuesEnv({ mode: 'wrangler' })).rejects.toThrow(
      /wrangler mode requires node:child_process \(Node >= 20\)\. Original error: \S/s,
    );
    expect(fetchState.calls).toBe(0);
  });

  it('T-CFQ-032 url 指定なら child_process を読まずに済む', async () => {
    // url を渡す経路は process を起こさないため、 child_process が無くても成立する。
    // ここが落ちると「外部管理の wrangler を使う」 選択肢まで巻き添えになる。
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 404 }));
    const env = await setupCloudflareQueuesEnv({
      mode: 'wrangler',
      wrangler: { url: 'http://127.0.0.1:8787', startupTimeoutMs: 1000 },
    });
    expect(env.backend).toBe('wrangler');
    expect(env.devServerUrl).toBe('http://127.0.0.1:8787');
    await env.stop();
  });
});
