/**
 * `/catalog` HTTP handler — streaming SSR + Suspense pending + error
 * boundary + progressive/selective hydration ops the Next.js runtime
 * exposes to the catalog surface. The route is intentionally shape-neutral
 * — the fidelity harness feeds plain objects in and asserts on plain
 * objects out, so the same test can exercise mock and real without
 * spinning up Next.js.
 *
 * The catalog surface pairs the parent v1.34-1 `streaming-ssr` axis with
 * `setupNextRscEnv` from `@kiwa-test/nextjs` v1.2 — every op has a neutral
 * event counterpart the fidelity harness can compare across mock vs real.
 */

import type { RscStreamingAdapter } from '../../adapters/interface.js';

export type CatalogOpKind = 'stream';

export interface CatalogRequestBase {
  routeId: string;
  catalogId: string;
}

export interface CatalogStreamRequest extends CatalogRequestBase {
  kind: 'stream';
  boundaries: string[];
  errors?: Array<{ boundaryId: string; message: string; recoverable?: boolean }>;
}

export type CatalogRequest = CatalogStreamRequest;

export interface CatalogResponse {
  ok: boolean;
  kind: CatalogOpKind;
  routeId: string;
  catalogId: string;
  pendingCount?: number;
  hydratedCount?: number;
  errorCount?: number;
  errorKind?: string;
}

export function validateCatalogRequest(
  body: unknown,
): { ok: true; value: CatalogRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['routeId'] !== 'string' || !b['routeId']) {
    return { ok: false, errorKind: 'routeId_required' };
  }
  if (typeof b['catalogId'] !== 'string' || !b['catalogId']) {
    return { ok: false, errorKind: 'catalogId_required' };
  }
  if (b['kind'] !== 'stream') {
    return { ok: false, errorKind: 'kind_must_be_stream' };
  }
  if (
    !Array.isArray(b['boundaries']) ||
    b['boundaries'].length === 0 ||
    !b['boundaries'].every((v) => typeof v === 'string' && v.length > 0)
  ) {
    return { ok: false, errorKind: 'boundaries_required_non_empty_strings' };
  }
  const req: CatalogStreamRequest = {
    kind: 'stream',
    routeId: b['routeId'],
    catalogId: b['catalogId'],
    boundaries: b['boundaries'] as string[],
  };
  if (Array.isArray(b['errors'])) {
    const parsedErrors: NonNullable<CatalogStreamRequest['errors']> = [];
    for (const raw of b['errors']) {
      if (!raw || typeof raw !== 'object') {
        return { ok: false, errorKind: 'error_entry_not_object' };
      }
      const entry = raw as Record<string, unknown>;
      if (typeof entry['boundaryId'] !== 'string' || !entry['boundaryId']) {
        return { ok: false, errorKind: 'error_boundaryId_required' };
      }
      if (typeof entry['message'] !== 'string' || !entry['message']) {
        return { ok: false, errorKind: 'error_message_required' };
      }
      const parsed: NonNullable<CatalogStreamRequest['errors']>[number] = {
        boundaryId: entry['boundaryId'],
        message: entry['message'],
      };
      if (typeof entry['recoverable'] === 'boolean') {
        parsed.recoverable = entry['recoverable'];
      }
      parsedErrors.push(parsed);
    }
    req.errors = parsedErrors;
  }
  return { ok: true, value: req };
}

export async function handleCatalogRequest(
  adapter: RscStreamingAdapter,
  req: CatalogRequest,
): Promise<CatalogResponse> {
  try {
    const input: Parameters<RscStreamingAdapter['streamCatalog']>[0] = {
      routeId: req.routeId,
      catalogId: req.catalogId,
      boundaries: req.boundaries,
    };
    if (req.errors !== undefined) input.errors = req.errors;
    const result = await adapter.streamCatalog(input);
    return {
      ok: true,
      kind: 'stream',
      routeId: result.routeId,
      catalogId: result.catalogId,
      pendingCount: result.pendingBoundaries.length,
      hydratedCount: result.hydratedBoundaries.length,
      errorCount: result.errors.length,
    };
  } catch (err) {
    return {
      ok: false,
      kind: 'stream',
      routeId: req.routeId,
      catalogId: req.catalogId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
