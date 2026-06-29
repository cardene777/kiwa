import { describe, expect, it } from 'vitest';
import { invokeNitroPlugin } from '../src/invoke-nitro-plugin.js';

describe('invokeNitroPlugin', () => {
  it('T-NNP-001: captures a single registered hook', async () => {
    const result = await invokeNitroPlugin({
      plugin: (nitroApp) => {
        nitroApp.hooks.hook('request', () => undefined);
      },
    });
    expect(result.registered).toHaveLength(1);
    expect(result.registered[0]?.name).toBe('request');
    expect(result.registered[0]?.once).toBe(false);
  });

  it('T-NNP-002: registers multiple hooks across different names', async () => {
    const result = await invokeNitroPlugin({
      plugin: (nitroApp) => {
        nitroApp.hooks.hook('request', () => undefined);
        nitroApp.hooks.hook('beforeResponse', () => undefined);
        nitroApp.hooks.hook('error', () => undefined);
      },
    });
    expect(result.registered.map((r) => r.name)).toEqual(['request', 'beforeResponse', 'error']);
  });

  it('T-NNP-003: callHook fires handlers with the supplied payload', async () => {
    let captured: { method?: string } = {};
    const result = await invokeNitroPlugin({
      plugin: (nitroApp) => {
        nitroApp.hooks.hook('request', (event: { method: string }) => {
          captured = event;
        });
      },
    });
    await result.callHook('request', { method: 'GET' });
    expect(captured.method).toBe('GET');
  });

  it('T-NNP-004: async hook handlers awaited correctly', async () => {
    const log: string[] = [];
    const result = await invokeNitroPlugin({
      plugin: (nitroApp) => {
        nitroApp.hooks.hook('beforeResponse', async () => {
          await Promise.resolve();
          log.push('handler');
        });
      },
    });
    await result.callHook('beforeResponse', undefined);
    expect(log).toEqual(['handler']);
  });

  it('T-NNP-005: multiple handlers for same hook all called in order', async () => {
    const log: string[] = [];
    const result = await invokeNitroPlugin({
      plugin: (nitroApp) => {
        nitroApp.hooks.hook('request', () => {
          log.push('a');
        });
        nitroApp.hooks.hook('request', () => {
          log.push('b');
        });
      },
    });
    await result.callHook('request', {});
    expect(log).toEqual(['a', 'b']);
  });

  it('T-NNP-006: callHook with no matching handler is a no-op', async () => {
    const result = await invokeNitroPlugin({
      plugin: (nitroApp) => {
        nitroApp.hooks.hook('request', () => undefined);
      },
    });
    await expect(result.callHook('error', undefined)).resolves.toBeUndefined();
  });

  it('T-NNP-007: hookOnce removes handler after first call', async () => {
    let callCount = 0;
    const result = await invokeNitroPlugin({
      plugin: (nitroApp) => {
        nitroApp.hooks.hookOnce('close', () => {
          callCount = callCount + 1;
          return undefined;
        });
      },
    });
    await result.callHook('close', undefined);
    await result.callHook('close', undefined);
    expect(callCount).toBe(1);
  });

  it('T-NNP-008: handler errors captured into callHookErrors without stopping other handlers', async () => {
    const log: string[] = [];
    const result = await invokeNitroPlugin({
      plugin: (nitroApp) => {
        nitroApp.hooks.hook('request', () => {
          throw new Error('hook 1 broke');
        });
        nitroApp.hooks.hook('request', () => {
          log.push('hook 2 ran');
        });
      },
    });
    await result.callHook('request', undefined);
    expect(log).toEqual(['hook 2 ran']);
    expect(result.callHookErrors).toHaveLength(1);
    expect((result.callHookErrors[0]?.error as Error).message).toBe('hook 1 broke');
  });

  it('T-NNP-009: plugin setup throw captured in error field', async () => {
    const result = await invokeNitroPlugin({
      plugin: () => {
        throw new Error('setup failed');
      },
    });
    expect((result.error as Error).message).toBe('setup failed');
    expect(result.registered).toEqual([]);
  });

  it('T-NNP-010: localFetch option exposed on nitroApp', async () => {
    let receivedFetch: ((req: Request) => Promise<Response>) | undefined;
    await invokeNitroPlugin({
      plugin: (nitroApp) => {
        receivedFetch = nitroApp.localFetch;
      },
      localFetch: async () => new Response('ok'),
    });
    expect(typeof receivedFetch).toBe('function');
    const resp = await receivedFetch?.(new Request('http://x/'));
    expect(await resp?.text()).toBe('ok');
  });

  it('T-NNP-011: omitted localFetch is undefined on nitroApp', async () => {
    let receivedFetch: ((req: Request) => Promise<Response>) | undefined;
    await invokeNitroPlugin({
      plugin: (nitroApp) => {
        receivedFetch = nitroApp.localFetch;
      },
    });
    expect(receivedFetch).toBeUndefined();
  });

  it('T-NNP-012: removeHook detaches a registered handler', async () => {
    let calls = 0;
    const result = await invokeNitroPlugin({
      plugin: (nitroApp) => {
        const handler = () => {
          calls += 1;
        };
        nitroApp.hooks.hook('request', handler);
        nitroApp.hooks.removeHook('request', handler);
      },
    });
    await result.callHook('request', undefined);
    expect(calls).toBe(0);
    expect(result.registered).toHaveLength(0);
  });

  it('T-NNP-013: render:html payload mutation captured', async () => {
    const result = await invokeNitroPlugin({
      plugin: (nitroApp) => {
        nitroApp.hooks.hook('render:html', (html: { body: string[] }) => {
          html.body.push('<script>analytics()</script>');
        });
      },
    });
    const payload = { body: [] as string[] };
    await result.callHook('render:html', payload);
    expect(payload.body).toEqual(['<script>analytics()</script>']);
  });

  it('T-NNP-014: async plugin setup awaited correctly', async () => {
    let setupCompleted = false;
    const result = await invokeNitroPlugin({
      plugin: async (nitroApp) => {
        await Promise.resolve();
        nitroApp.hooks.hook('close', () => undefined);
        setupCompleted = true;
      },
    });
    expect(setupCompleted).toBe(true);
    expect(result.registered.map((r) => r.name)).toEqual(['close']);
  });
});
