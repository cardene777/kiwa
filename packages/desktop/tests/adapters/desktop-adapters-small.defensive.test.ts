import { describe, expect, it } from 'vitest';
import { InvokeCache, buildCacheKey } from '../../src/adapters/invoke-cache.js';
import { summarizeFidelity, summarizeFidelityBehaviorDiff } from '../../src/adapters/fidelity-harness.js';
import { cliForAxis, buildSpawnInvocation } from '../../src/adapters/spawn-driver.js';
import { sanitizeEnv, executeSpawn } from '../../src/adapters/spawn-executor.js';
import type { FidelityDiff } from '../../src/adapters/fidelity-harness.js';
import { ADAPTER_MODES, isAdapterMode } from '../../src/adapters/types.js';

describe('adapter/types runtime const defensive', () => {
  it('ADAPTER_MODES exports 2-element mock/real tuple', () => {
    expect(ADAPTER_MODES).toEqual(['mock', 'real']);
  });

  it('isAdapterMode returns true for mock and real', () => {
    expect(isAdapterMode('mock')).toBe(true);
    expect(isAdapterMode('real')).toBe(true);
  });

  it('isAdapterMode returns false for unknown value', () => {
    expect(isAdapterMode('unknown')).toBe(false);
    expect(isAdapterMode('')).toBe(false);
  });
});

describe('fidelity-harness summarize defensive branches', () => {
  it('summarizeFidelity returns all-matched when diffs is empty', () => {
    const summary = summarizeFidelity([]);
    expect(summary.total).toBe(0);
    expect(summary.matched).toBe(0);
    expect(summary.unmatched).toBe(0);
  });

  it('summarizeFidelity counts matched vs mismatched correctly', () => {
    const diffs: FidelityDiff[] = [
      {
        axis: 'clipboard',
        target: 'macos',
        mockEvents: ['clipboard.written'],
        realEvents: ['clipboard.written'],
        matched: true,
        mockCompleted: true,
        realCompleted: true,
        metadataDiffs: [],
        durationDiffMs: 0,
      },
      {
        axis: 'notification',
        target: 'macos',
        mockEvents: ['notification.scheduled'],
        realEvents: [],
        matched: false,
        mockCompleted: true,
        realCompleted: false,
        metadataDiffs: [],
        durationDiffMs: 5,
      },
    ];
    const summary = summarizeFidelity(diffs);
    expect(summary.total).toBe(2);
    expect(summary.matched).toBe(1);
    expect(summary.unmatched).toBe(1);
  });

  it('summarizeFidelityBehaviorDiff aggregates metadataDiff and durationDiff', () => {
    const diffs: FidelityDiff[] = [
      {
        axis: 'clipboard',
        target: 'macos',
        mockEvents: ['clipboard.written'],
        realEvents: ['clipboard.written'],
        matched: true,
        mockCompleted: true,
        realCompleted: true,
        metadataDiffs: [
          {
            stepIndex: 0,
            neutralEvent: 'clipboard.written',
            key: 'format',
            mockValue: 'text',
            realValue: 'html',
          },
        ],
        durationDiffMs: 12,
      },
    ];
    const summary = summarizeFidelityBehaviorDiff(diffs);
    expect(summary.totalMetadataDiffs).toBeGreaterThanOrEqual(1);
    expect(summary.axesWithBehaviorDiff).toContain('clipboard');
  });
});

describe('InvokeCache defensive branches', () => {
  it('isEnabled returns false when enabled=false', () => {
    const cache = new InvokeCache({ enabled: false });
    expect(cache.isEnabled()).toBe(false);
  });

  it('isEnabled returns false when ttlMs is negative', () => {
    const cache = new InvokeCache({ ttlMs: -1 });
    expect(cache.isEnabled()).toBe(false);
  });

  it('isEnabled returns false when maxEntries is negative', () => {
    const cache = new InvokeCache({ maxEntries: -1 });
    expect(cache.isEnabled()).toBe(false);
  });

  it('isEnabled returns true when ttlMs=0 (unlimited) and maxEntries=0 (unlimited)', () => {
    const cache = new InvokeCache({ ttlMs: 0, maxEntries: 0 });
    expect(cache.isEnabled()).toBe(true);
  });

  it('get returns cache-disabled when cache is disabled', () => {
    const cache = new InvokeCache({ enabled: false });
    expect(cache.get('any-key').status).toBe('cache-disabled');
  });

  it('get returns cache-miss for unknown key', () => {
    const cache = new InvokeCache();
    expect(cache.get('unknown-key').status).toBe('cache-miss');
  });

  it('buildCacheKey handles undefined args as empty array', () => {
    const key = buildCacheKey({ axis: 'clipboard', target: 'macos' });
    expect(key).toBe('clipboard:macos:[]');
  });

  it('buildCacheKey serializes args deterministically', () => {
    const key = buildCacheKey({
      axis: 'notification',
      target: 'linux',
      args: ['--send', 'title=hello'],
    });
    expect(key).toContain('notification:linux:');
    expect(key).toContain('--send');
  });

  it('size returns 0 for empty cache', () => {
    const cache = new InvokeCache();
    expect(cache.size()).toBe(0);
  });

  it('getClockValue returns injected clock value', () => {
    const cache = new InvokeCache(undefined, () => 42);
    expect(cache.getClockValue()).toBe(42);
  });
});

describe('spawn-driver defensive branches', () => {
  it('cliForAxis returns null for semantics-only axis', () => {
    expect(cliForAxis('electron')).toBeNull();
    expect(cliForAxis('tauri')).toBeNull();
    expect(cliForAxis('webview')).toBeNull();
    expect(cliForAxis('dark-mode')).toBeNull();
  });

  it('cliForAxis returns CLI mapping for real-driver axis', () => {
    expect(cliForAxis('auto-updater')).not.toBeNull();
    expect(cliForAxis('notification')).not.toBeNull();
    expect(cliForAxis('fs-permissions')).not.toBeNull();
  });

  it('buildSpawnInvocation applies default env from process.env when env not provided', () => {
    const inv = buildSpawnInvocation({
      command: 'osascript',
      args: ['-e', 'return 1'],
    });
    expect(inv.command).toBe('osascript');
    expect(inv.args).toEqual(['-e', 'return 1']);
    expect(inv.env).toBeDefined();
  });

  it('buildSpawnInvocation preserves explicit cwd when provided', () => {
    const inv = buildSpawnInvocation({
      command: 'osascript',
      env: { PATH: '/usr/bin' },
      cwd: '/tmp',
    });
    expect(inv.cwd).toBe('/tmp');
  });

  it('buildSpawnInvocation omits cwd when not provided', () => {
    const inv = buildSpawnInvocation({
      command: 'osascript',
      env: { PATH: '/usr/bin' },
    });
    expect(inv.cwd).toBeUndefined();
  });
});

describe('spawn-executor defensive branches', () => {
  it('sanitizeEnv drops keys not in allowlist', () => {
    const sanitized = sanitizeEnv('osascript', {
      PATH: '/usr/bin',
      HOME: '/Users/foo',
      DANGEROUS: 'x',
    });
    expect(sanitized.PATH).toBe('/usr/bin');
    expect(sanitized.HOME).toBe('/Users/foo');
    expect(sanitized).not.toHaveProperty('DANGEROUS');
  });

  it('sanitizeEnv drops empty string values', () => {
    const sanitized = sanitizeEnv('osascript', {
      PATH: '',
      HOME: '/Users/foo',
    });
    expect(sanitized).not.toHaveProperty('PATH');
    expect(sanitized.HOME).toBe('/Users/foo');
  });

  it('sanitizeEnv drops non-string values (undefined)', () => {
    const sanitized = sanitizeEnv('osascript', {
      PATH: '/usr/bin',
      HOME: undefined as unknown as string,
    });
    expect(sanitized.PATH).toBe('/usr/bin');
    expect(sanitized).not.toHaveProperty('HOME');
  });

  it('sanitizeEnv preserves USER when in allowlist for osascript', () => {
    const sanitized = sanitizeEnv('osascript', { USER: 'foo', RANDOM: 'y' });
    expect(sanitized.USER).toBe('foo');
    expect(sanitized).not.toHaveProperty('RANDOM');
  });

  it('sanitizeEnv preserves DISPLAY when in allowlist for xclip', () => {
    const sanitized = sanitizeEnv('xclip', { DISPLAY: ':0', WAYLAND_DISPLAY: 'wayland-0' });
    expect(sanitized.DISPLAY).toBe(':0');
    expect(sanitized.WAYLAND_DISPLAY).toBe('wayland-0');
  });

  it('executeSpawn rejects when spawnFn throws synchronously', async () => {
    const throwingSpawn = (() => {
      throw new Error('spawn-throw-sync');
    }) as unknown as typeof executeSpawn extends (
      input: unknown,
      spawnFn?: infer S,
    ) => unknown
      ? S
      : never;
    await expect(
      executeSpawn(
        { command: 'osascript', args: ['-e', 'return'], env: { PATH: '/usr/bin' } },
        throwingSpawn as never,
      ),
    ).rejects.toThrow(/spawn-throw-sync/);
  });
});
