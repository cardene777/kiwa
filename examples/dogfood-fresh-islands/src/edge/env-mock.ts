/**
 * Deno edge-runtime env mock — Fresh runs on Deno Deploy so route handlers
 * observe `Deno.env.get(...)` / `Deno.serve(...)` rather than Node process
 * env / http.createServer. The dogfood mocks both so handler code can be
 * exercised without spinning up a real Deno runtime.
 *
 * The mock is stateful across a single `withEdgeEnv` call — `Deno.env.get`
 * reflects the supplied env object, and `Deno.serve` records how many times
 * it was called so the fidelity harness can prove the handler wired itself
 * up to the mocked serve hook.
 */

export interface EdgeRuntimeSnapshot {
  readonly denoInstalled: boolean;
  readonly envRead: Record<string, string | undefined>;
  readonly serveCalls: number;
}

interface DenoLike {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): {
    finished: Promise<void>;
  };
}

interface GlobalWithDeno {
  Deno?: DenoLike | undefined;
}

export interface WithEdgeEnvOptions {
  readonly env: Record<string, string>;
  /** When true, pretend a real Deno runtime is installed by exposing a
   *  minimal shape. Defaults to true so the dogfood keeps the mock path in
   *  the same shape a real handler would see. */
  readonly denoInstalled?: boolean;
}

/**
 * Run `body` under a mocked `Deno` global. Records which env keys the body
 * read + how many times `Deno.serve` was invoked, then restores the previous
 * `Deno` binding on exit (even on throw).
 */
export async function withEdgeEnv<T>(
  opts: WithEdgeEnvOptions,
  body: (snapshot: {
    read: (key: string) => string | undefined;
    serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  }) => T | Promise<T>,
): Promise<{ result: T; snapshot: EdgeRuntimeSnapshot }> {
  const denoInstalled = opts.denoInstalled ?? true;
  const g = globalThis as unknown as GlobalWithDeno;
  const previousDeno = g.Deno;
  const envRead: Record<string, string | undefined> = {};
  let serveCalls = 0;

  const denoMock: DenoLike | undefined = denoInstalled
    ? {
        env: {
          get(key: string): string | undefined {
            const value = opts.env[key];
            envRead[key] = value;
            return value;
          },
        },
        serve(_handler): { finished: Promise<void> } {
          serveCalls += 1;
          return { finished: Promise.resolve() };
        },
      }
    : undefined;

  g.Deno = denoMock;
  try {
    const result = await body({
      read(key) {
        return denoMock ? denoMock.env.get(key) : undefined;
      },
      serve(handler) {
        if (denoMock) denoMock.serve(handler);
      },
    });
    return {
      result,
      snapshot: { denoInstalled, envRead, serveCalls },
    };
  } finally {
    if (previousDeno === undefined) {
      delete g.Deno;
    } else {
      g.Deno = previousDeno;
    }
  }
}

/**
 * Sample handler that reads `KIWA_FRESH_MODE` from the mocked env and calls
 * `Deno.serve` once. The fidelity harness drives this to prove the mock
 * exposes the exact 2-op Deno surface Fresh handlers rely on.
 */
export function sampleEdgeHandler(_req: Request): Response {
  const deno = (globalThis as unknown as GlobalWithDeno).Deno;
  const mode = deno?.env.get('KIWA_FRESH_MODE') ?? 'unknown';
  if (deno) deno.serve(async () => new Response('ok'));
  return new Response(JSON.stringify({ mode }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
