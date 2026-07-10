// Real Nuxt 3 / Nitro plugin — wires the pure hook bodies from
// `_kiwa/analytics-plugin.ts` to the hooks Nitro actually calls.
//
// The pure factory `createAnalyticsPlugin` registers those same bodies on the
// simulated NitroApp that `@kiwa-lab/nuxt`'s `invokeNitroPlugin` builds, which is
// what the unit tests drive. The simulator hands every hook a single payload;
// Nitro does not. `request` receives an `H3Event`, `beforeResponse` an event and
// a response, and `error` an `Error` followed by its context. Passing the factory
// to `defineNitroPlugin` compiled only while `defineNitroPlugin` was an unresolved
// name — and at runtime `onError` would have read `.message` off `undefined`,
// because the first argument is the error itself and not a payload holding one.
//
// So the translation lives here, at the boundary, and the work lives in one place.

import { onBeforeResponse, onError, onRequest } from './_kiwa/analytics-plugin.js';
import type { AnalyticsContext } from './_kiwa/analytics-plugin.js';

let counter = 0;

const productionCtx: AnalyticsContext = {
  logger: {
    info: (msg, payload) => console.log(`[analytics] ${msg}`, payload ?? {}),
    error: (msg, payload) => console.error(`[analytics] ${msg}`, payload ?? {}),
  },
  generateRequestId: () => `req-${++counter}-${Date.now().toString(36)}`,
};

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    // `event.context` is passed by reference, so the request id and start time
    // `onRequest` writes land on the event the rest of the request can see.
    onRequest(productionCtx, {
      method: event.method,
      url: event.path,
      context: event.context,
    });
  });

  nitroApp.hooks.hook('beforeResponse', (event) => {
    onBeforeResponse(productionCtx, {
      context: event.context,
      status: getResponseStatus(event),
    });
  });

  nitroApp.hooks.hook('error', (error, context) => {
    onError(productionCtx, { error, url: context.event?.path });
  });
});
