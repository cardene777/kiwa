// Real Nuxt 3 / Nitro plugin — wires the pure `createAnalyticsPlugin` factory
// with a console-backed logger and an incrementing request-id generator. The
// pure factory is unit-testable via @kiwa-lab/nuxt's invokeNitroPlugin helper.

import { createAnalyticsPlugin, type AnalyticsContext } from './_kiwa/analytics-plugin.js';

let counter = 0;

const productionCtx: AnalyticsContext = {
  logger: {
    info: (msg, payload) => console.log(`[analytics] ${msg}`, payload ?? {}),
    error: (msg, payload) => console.error(`[analytics] ${msg}`, payload ?? {}),
  },
  generateRequestId: () => `req-${++counter}-${Date.now().toString(36)}`,
};

export default defineNitroPlugin(createAnalyticsPlugin(productionCtx));
