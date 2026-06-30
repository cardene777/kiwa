// middleware.ts — Astro middleware (counter endpoint の locals.requestId 注入用)。
//
// 全 request に対し x-request-id ヘッダーがあれば locals に流す。 e2e で counter
// endpoint の x-request-id echo を確認する経路。

import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const requestId = context.request.headers.get('x-request-id') ?? 'astro-default';
  (context.locals as { requestId?: string }).requestId = requestId;
  return next();
});
