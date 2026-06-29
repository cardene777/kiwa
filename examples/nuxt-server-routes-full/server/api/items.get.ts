// Real Nuxt 3 server route — thin wrapper that delegates to the kiwa-testable
// pure handler in `_kiwa/items-handler.ts`. Keeping the H3 binding here means
// kiwa unit tests can import `itemsHandler` directly without needing h3 at all.

import { itemsHandler, type ItemsHandlerEvent } from './_kiwa/items-handler.js';

export default defineEventHandler((event) => {
  const adapter: ItemsHandlerEvent = {
    query: getQuery(event) as Readonly<Record<string, string | string[]>>,
    headers: (() => {
      const map = new Map<string, string>();
      const headers = getHeaders(event);
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === 'string') map.set(k.toLowerCase(), v);
      }
      return map;
    })(),
    setHeader(name: string, value: string) {
      setResponseHeader(event, name, value);
    },
    setStatusCode(code: number) {
      setResponseStatus(event, code);
    },
  };
  return itemsHandler(adapter);
});
