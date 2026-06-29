// Nuxt 3 / Nitro plugin lifecycle test helper for kiwa (Issue #523).
//
// A Nitro plugin is `export default defineNitroPlugin((nitroApp) => { ... })`
// which runs once at server startup. The plugin can register lifecycle hooks:
//   - request                  → before each request
//   - beforeResponse           → before response is sent
//   - afterResponse            → after response is flushed
//   - error                    → request-level error
//   - render:html              → SSR HTML mutation
//   - render:response          → SSR Response mutation
//   - close                    → server shutdown
// kiwa simulates the NitroApp.hooks API so test code can verify which hooks
// the plugin registers and trigger them with synthetic payloads.

export type NitroHookName =
  | 'request'
  | 'beforeResponse'
  | 'afterResponse'
  | 'error'
  | 'render:html'
  | 'render:response'
  | 'close';

export type NitroHookHandler<TPayload = unknown> = (payload: TPayload) => Promise<void> | void;

export interface SimulatedNitroApp {
  readonly hooks: {
    hook<TPayload = unknown>(name: NitroHookName, handler: NitroHookHandler<TPayload>): void;
    callHook<TPayload = unknown>(name: NitroHookName, payload: TPayload): Promise<void>;
    hookOnce<TPayload = unknown>(name: NitroHookName, handler: NitroHookHandler<TPayload>): void;
    removeHook(name: NitroHookName, handler: NitroHookHandler): void;
  };
  readonly localFetch?: (request: Request) => Promise<Response>;
  readonly h3App: unknown;
}

export type NitroPlugin = (nitroApp: SimulatedNitroApp) => Promise<void> | void;

export interface InvokeNitroPluginOptions {
  readonly plugin: NitroPlugin;
  /**
   * Optional local fetch hook to expose on the simulated NitroApp. Useful when
   * the plugin under test reaches `nitroApp.localFetch(req)`.
   */
  readonly localFetch?: (request: Request) => Promise<Response>;
}

export interface RegisteredHook {
  readonly name: NitroHookName;
  readonly handler: NitroHookHandler;
  readonly once: boolean;
}

export interface InvokeNitroPluginResult {
  readonly registered: RegisteredHook[];
  readonly callHook: <TPayload = unknown>(name: NitroHookName, payload: TPayload) => Promise<void>;
  readonly callHookErrors: Array<{ readonly name: NitroHookName; readonly error: unknown }>;
  readonly error: unknown;
}

/**
 * Invoke a Nitro plugin setup in isolation and return the hooks it registered
 * + a `callHook` driver to fire them with synthetic payloads.
 */
export async function invokeNitroPlugin(opts: InvokeNitroPluginOptions): Promise<InvokeNitroPluginResult> {
  const registered: RegisteredHook[] = [];
  const callHookErrors: Array<{ readonly name: NitroHookName; readonly error: unknown }> = [];
  const onceHandlers = new WeakSet<NitroHookHandler>();
  const nitroApp: SimulatedNitroApp = {
    hooks: {
      hook(name, handler) {
        registered.push({ name, handler: handler as NitroHookHandler, once: false });
      },
      hookOnce(name, handler) {
        const h = handler as NitroHookHandler;
        onceHandlers.add(h);
        registered.push({ name, handler: h, once: true });
      },
      async callHook(name, payload) {
        const matching = registered.filter((r) => r.name === name);
        for (const reg of matching) {
          try {
            await reg.handler(payload);
          } catch (err) {
            callHookErrors.push({ name, error: err });
          }
          if (reg.once && onceHandlers.has(reg.handler)) {
            const idx = registered.indexOf(reg);
            if (idx >= 0) registered.splice(idx, 1);
          }
        }
      },
      removeHook(name, handler) {
        const idx = registered.findIndex((r) => r.name === name && r.handler === handler);
        if (idx >= 0) registered.splice(idx, 1);
      },
    },
    ...(typeof opts.localFetch !== 'undefined' ? { localFetch: opts.localFetch } : {}),
    h3App: {},
  };
  let setupError: unknown;
  try {
    await opts.plugin(nitroApp);
  } catch (caught) {
    setupError = caught;
  }
  return {
    registered,
    callHook: nitroApp.hooks.callHook,
    callHookErrors,
    error: setupError,
  };
}
