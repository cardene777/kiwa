/**
 * Cloudflare Workers 形式の fetch handler。
 *
 * `export default { fetch }` の形で、 KV binding の読み書き / `waitUntil` による背景処理 /
 * redirect / 失敗時の `passThroughOnException` を 1 つの handler で扱う。
 *
 * `@kiwa-lab/edge` の `invokeEdgeHandler` は `fetch(request, env, ctx)` を直接呼ぶため、
 * Miniflare / workerd を起動せずに test できる。
 */

import type {
  EdgeEnvBindings,
  KVNamespace,
  SimulatedExecutionContext,
} from '@kiwa-lab/edge';

/** handler が期待する env binding。 */
export interface WorkerEnv extends EdgeEnvBindings {
  /** 短縮 URL の対応表。 test では `createKvNamespace` の mock を渡す。 */
  readonly LINKS: KVNamespace;
  /** 書込 API に要る共有鍵。 */
  readonly API_KEY?: string;
}

/** 遷移数を数える。 応答を待たせないため `waitUntil` に載せる。 */
async function recordHit(env: WorkerEnv, slug: string): Promise<void> {
  const current = await env.LINKS.get(`hits:${slug}`);
  const next = Number.parseInt(current ?? '0', 10) + 1;
  await env.LINKS.put(`hits:${slug}`, String(next));
}

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: SimulatedExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // 健全性確認。 binding も鍵も要らない。
    if (url.pathname === '/health') {
      return new Response('ok', { status: 200 });
    }

    // 短縮 URL の登録。 共有鍵が一致した時だけ受ける。
    if (url.pathname === '/links' && request.method === 'POST') {
      if (env.API_KEY === undefined || request.headers.get('x-api-key') !== env.API_KEY) {
        return new Response('forbidden', { status: 403 });
      }
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        // 本体が JSON でない形は、 handler 自身の欠陥ではないので通過させる。
        ctx.passThroughOnException();
        return new Response('bad request', { status: 400 });
      }
      const { slug, target } = (body ?? {}) as { slug?: string; target?: string };
      if (typeof slug !== 'string' || typeof target !== 'string') {
        return new Response('bad request', { status: 400 });
      }
      await env.LINKS.put(`link:${slug}`, target);
      return new Response(JSON.stringify({ slug }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    }

    // 短縮 URL の解決。 見つかれば redirect し、 計数は応答を待たせない。
    const slug = url.pathname.slice(1);
    if (slug !== '') {
      const target = await env.LINKS.get(`link:${slug}`);
      if (target === null) return new Response('not found', { status: 404 });
      ctx.waitUntil(recordHit(env, slug));
      return new Response(null, { status: 302, headers: { location: target } });
    }

    return new Response('not found', { status: 404 });
  },
};
