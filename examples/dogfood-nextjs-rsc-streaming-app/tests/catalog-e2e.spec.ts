/**
 * Catalog end-to-end fidelity spec (streaming-ssr axis).
 *
 * Sub-Issue CAR-785 (v1.34-2) AC — the mock adapter drives a full streaming
 * SSR + Suspense pending + error boundary + progressive/selective
 * hydration ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across four axes.
 *
 *  1. startCatalog + pendCatalogBoundary mark each boundary as suspense-
 *     pending in the order the runtime encounters them.
 *  2. captureCatalogError records recoverable + non-recoverable error
 *     boundaries so downstream release-gate rows can distinguish the two.
 *  3. hydrateCatalogBoundary drives progressive hydration then completes
 *     selective hydration for every non-failed boundary, mirroring how
 *     React 19.1 selectively hydrates the boundary whose data settles
 *     first.
 *  4. A non-recoverable error boundary short-circuits hydration for its
 *     subtree so the remaining boundaries can still hydrate independently.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleCatalogRequest,
  validateCatalogRequest,
} from '../src/app/catalog/route.js';
import type { RscStreamingAdapter } from '../src/adapters/interface.js';

let mock: RscStreamingAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ seed: 11, latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — streaming SSR catalog ceremony', () => {
  it('axis 1: pendCatalogBoundary emits one trace per boundary in order', async () => {
    await mock.streamCatalog({
      routeId: '/catalog/1',
      catalogId: 'catalog-1',
      boundaries: ['hero', 'grid', 'footer'],
    });
    const pending = mock.traces().filter((t) => t.op === 'pendCatalogBoundary');
    expect(pending).toHaveLength(3);
    expect((pending[0]?.detail as { boundaryId?: string })?.boundaryId).toBe('hero');
    expect((pending[1]?.detail as { boundaryId?: string })?.boundaryId).toBe('grid');
    expect((pending[2]?.detail as { boundaryId?: string })?.boundaryId).toBe('footer');
  });

  it('axis 1: hydrated boundaries end up in the hydratedBoundaries set', async () => {
    const result = await mock.streamCatalog({
      routeId: '/catalog/2',
      catalogId: 'catalog-2',
      boundaries: ['a', 'b'],
    });
    expect(result.hydratedBoundaries).toEqual(['a', 'b']);
    expect(result.pendingBoundaries).toEqual([]);
  });

  it('axis 2: recoverable error boundaries are captured and the boundary still hydrates', async () => {
    const result = await mock.streamCatalog({
      routeId: '/catalog/3',
      catalogId: 'catalog-3',
      boundaries: ['x', 'y'],
      errors: [{ boundaryId: 'x', message: 'flaky data', recoverable: true }],
    });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.boundaryId).toBe('x');
    expect(result.hydratedBoundaries).toContain('x');
    expect(result.hydratedBoundaries).toContain('y');
  });

  it('axis 2: non-recoverable errors short-circuit hydration for that boundary', async () => {
    const result = await mock.streamCatalog({
      routeId: '/catalog/4',
      catalogId: 'catalog-4',
      boundaries: ['fatal', 'ok'],
      errors: [{ boundaryId: 'fatal', message: 'no route', recoverable: false }],
    });
    expect(result.hydratedBoundaries).not.toContain('fatal');
    expect(result.hydratedBoundaries).toContain('ok');
  });

  it('axis 2: captureCatalogError trace records recoverability', async () => {
    await mock.streamCatalog({
      routeId: '/catalog/5',
      catalogId: 'catalog-5',
      boundaries: ['a'],
      errors: [{ boundaryId: 'a', message: 'x', recoverable: false }],
    });
    const err = mock.traces().find((t) => t.op === 'captureCatalogError');
    expect((err?.detail as { recoverable?: boolean })?.recoverable).toBe(false);
  });

  it('axis 3: hydrateCatalogBoundary emits one trace per hydrated boundary', async () => {
    await mock.streamCatalog({
      routeId: '/catalog/6',
      catalogId: 'catalog-6',
      boundaries: ['a', 'b', 'c'],
    });
    const hydrates = mock.traces().filter((t) => t.op === 'hydrateCatalogBoundary');
    expect(hydrates).toHaveLength(3);
  });

  it('axis 3: metrics.boundariesHydrated counts only successful hydrations', async () => {
    await mock.streamCatalog({
      routeId: '/catalog/7',
      catalogId: 'catalog-7',
      boundaries: ['ok', 'fail'],
      errors: [{ boundaryId: 'fail', message: 'x', recoverable: false }],
    });
    expect(mock.metrics().boundariesHydrated).toBe(1);
    expect(mock.metrics().errorsCaptured).toBe(1);
  });

  it('axis 4: multiple sequential catalogs each produce isolated boundaries', async () => {
    const a = await mock.streamCatalog({
      routeId: '/1',
      catalogId: 'a',
      boundaries: ['x'],
    });
    const b = await mock.streamCatalog({
      routeId: '/2',
      catalogId: 'b',
      boundaries: ['y', 'z'],
    });
    expect(a.hydratedBoundaries).toEqual(['x']);
    expect(b.hydratedBoundaries).toEqual(['y', 'z']);
    expect(mock.metrics().catalogsStreamed).toBe(2);
  });

  it('axis 4: catalogLatencySamplesMs records one sample per streamCatalog', async () => {
    await mock.streamCatalog({ routeId: '/1', catalogId: 'a', boundaries: ['x'] });
    await mock.streamCatalog({ routeId: '/2', catalogId: 'b', boundaries: ['y'] });
    expect(mock.metrics().catalogLatencySamplesMs).toHaveLength(2);
  });

  it('rejects empty boundaries array', async () => {
    await expect(
      mock.streamCatalog({ routeId: '/1', catalogId: 'a', boundaries: [] }),
    ).rejects.toThrow(/boundaries/);
  });

  it('rejects empty routeId', async () => {
    await expect(
      mock.streamCatalog({ routeId: '', catalogId: 'a', boundaries: ['x'] }),
    ).rejects.toThrow(/routeId/);
  });

  it('rejects empty catalogId', async () => {
    await expect(
      mock.streamCatalog({ routeId: '/', catalogId: '', boundaries: ['x'] }),
    ).rejects.toThrow(/catalogId/);
  });
});

describe('catalog route handler — request validation', () => {
  it('accepts a valid stream request', () => {
    const result = validateCatalogRequest({
      kind: 'stream',
      routeId: '/catalog/x',
      catalogId: 'x',
      boundaries: ['a', 'b'],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a stream request with empty boundaries', () => {
    const result = validateCatalogRequest({
      kind: 'stream',
      routeId: '/x',
      catalogId: 'x',
      boundaries: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('boundaries_required_non_empty_strings');
  });

  it('rejects an error entry that is missing the boundaryId', () => {
    const result = validateCatalogRequest({
      kind: 'stream',
      routeId: '/x',
      catalogId: 'x',
      boundaries: ['a'],
      errors: [{ message: 'x' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('error_boundaryId_required');
  });

  it('handleCatalogRequest returns pendingCount + hydratedCount', async () => {
    const parsed = validateCatalogRequest({
      kind: 'stream',
      routeId: '/catalog/handler',
      catalogId: 'h',
      boundaries: ['a', 'b'],
    });
    if (!parsed.ok) throw new Error('unreachable');
    const response = await handleCatalogRequest(mock, parsed.value);
    expect(response.ok).toBe(true);
    expect(response.pendingCount).toBe(0);
    expect(response.hydratedCount).toBe(2);
  });

  it('handleCatalogRequest surfaces mock errors as ok:false', async () => {
    const response = await handleCatalogRequest(mock, {
      kind: 'stream',
      routeId: '',
      catalogId: '',
      boundaries: ['x'],
    });
    expect(response.ok).toBe(false);
  });
});

describe('real adapter — env-detect skeleton (catalog)', () => {
  it('streamCatalog throws with KIWA_RSC_STREAMING_ENV_MISSING when env is not ready', async () => {
    const real = makeRealAdapter();
    await expect(
      real.streamCatalog({ routeId: '/x', catalogId: 'x', boundaries: ['a'] }),
    ).rejects.toThrow(/KIWA_RSC_STREAMING_ENV_MISSING|KIWA_MODE=mock/);
    // The real adapter records the failure under the startCatalog op (the
    // first op of the streamCatalog ceremony).
    const trace = real.traces().find((t) => t.op === 'startCatalog');
    expect(trace?.ok).toBe(false);
  });

  it('detectRealEnvMissing returns null when RSC_STREAMING_BROWSER_READY=1', () => {
    const previousReady = process.env['RSC_STREAMING_BROWSER_READY'];
    const previousMode = process.env['KIWA_MODE'];
    process.env['RSC_STREAMING_BROWSER_READY'] = '1';
    delete process.env['KIWA_MODE'];
    try {
      expect(detectRealEnvMissing()).toBeNull();
    } finally {
      if (previousReady !== undefined) process.env['RSC_STREAMING_BROWSER_READY'] = previousReady;
      else delete process.env['RSC_STREAMING_BROWSER_READY'];
      if (previousMode !== undefined) process.env['KIWA_MODE'] = previousMode;
    }
  });
});
