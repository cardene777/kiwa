/**
 * `/scanner` HTTP handler — Trivy style OSV / NVD advisory lookup +
 * combined SBOM + secrets-scan report composition ops the runtime exposes
 * to the scanner surface. The route is intentionally shape-neutral — the
 * fidelity harness feeds plain objects in and asserts on plain objects
 * out, so the same test can exercise mock and real without spinning up a
 * Trivy container.
 *
 * The scanner surface pairs the parent v1.37-1 `sbom` axis (OSV / NVD +
 * license) with the `secrets-scan` axis (finding count) — every op has a
 * neutral event counterpart the fidelity harness can compare across mock
 * vs real.
 */

import type { Advisory } from '@kiwa-test/security';
import type { SecurityAdapter } from '../../adapters/interface.js';

export type ScannerOpKind = 'lookup' | 'report';

export interface ScannerRequest {
  kind: ScannerOpKind;
  scanId: string;
  sbomId: string;
  feed: { advisories: Advisory[] };
}

export interface ScannerResponse {
  ok: boolean;
  kind: ScannerOpKind;
  scanId: string;
  sbomId: string;
  advisories?: Array<{
    componentPurl: string;
    advisoryIds: string[];
    severity: string[];
  }>;
  componentCount?: number;
  vulnerableCount?: number;
  secretsCount?: number;
  licenseDenies?: number;
  overallVerdict?: 'allow' | 'warn' | 'deny';
  errorKind?: string;
}

export function validateScannerRequest(
  body: unknown,
): { ok: true; value: ScannerRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['scanId'] !== 'string' || !b['scanId']) {
    return { ok: false, errorKind: 'scanId_required' };
  }
  if (typeof b['sbomId'] !== 'string' || !b['sbomId']) {
    return { ok: false, errorKind: 'sbomId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'lookup' && kind !== 'report') {
    return { ok: false, errorKind: 'kind_must_be_lookup_or_report' };
  }
  const feed = b['feed'];
  if (!feed || typeof feed !== 'object') {
    return { ok: false, errorKind: 'feed_required' };
  }
  const rawAdvisories = (feed as Record<string, unknown>)['advisories'];
  if (!Array.isArray(rawAdvisories)) {
    return { ok: false, errorKind: 'advisories_must_be_array' };
  }
  const advisories: Advisory[] = [];
  for (const raw of rawAdvisories) {
    if (!raw || typeof raw !== 'object') {
      return { ok: false, errorKind: 'advisory_not_object' };
    }
    const a = raw as Record<string, unknown>;
    if (typeof a['id'] !== 'string' || !a['id']) {
      return { ok: false, errorKind: 'advisory_id_required' };
    }
    const severity = a['severity'];
    if (severity !== 'low' && severity !== 'medium' && severity !== 'high' && severity !== 'critical') {
      return { ok: false, errorKind: 'advisory_severity_invalid' };
    }
    if (typeof a['summary'] !== 'string') {
      return { ok: false, errorKind: 'advisory_summary_required' };
    }
    if (a['source'] !== 'osv' && a['source'] !== 'nvd') {
      return { ok: false, errorKind: 'advisory_source_invalid' };
    }
    if (!Array.isArray(a['affects'])) {
      return { ok: false, errorKind: 'advisory_affects_required' };
    }
    const affects: Advisory['affects'] = [];
    for (const affect of a['affects'] as unknown[]) {
      if (!affect || typeof affect !== 'object') {
        return { ok: false, errorKind: 'advisory_affects_entry_invalid' };
      }
      const af = affect as Record<string, unknown>;
      if (typeof af['purl'] !== 'string' || !af['purl']) {
        return { ok: false, errorKind: 'advisory_affects_purl_required' };
      }
      if (typeof af['versionRange'] !== 'string' || !af['versionRange']) {
        return { ok: false, errorKind: 'advisory_affects_versionRange_required' };
      }
      affects.push({ purl: af['purl'], versionRange: af['versionRange'] });
    }
    advisories.push({
      id: a['id'],
      severity,
      summary: a['summary'],
      source: a['source'],
      affects,
    });
  }
  const value: ScannerRequest = {
    kind,
    scanId: b['scanId'],
    sbomId: b['sbomId'],
    feed: { advisories },
  };
  return { ok: true, value };
}

export async function handleScannerRequest(
  adapter: SecurityAdapter,
  req: ScannerRequest,
): Promise<ScannerResponse> {
  try {
    if (req.kind === 'lookup') {
      const result = await adapter.lookupAdvisories({
        scanId: req.scanId,
        sbomId: req.sbomId,
        feed: req.feed,
      });
      return {
        ok: true,
        kind: 'lookup',
        scanId: result.scanId,
        sbomId: req.sbomId,
        advisories: result.advisories.map((hit) => ({
          componentPurl: hit.component.purl,
          advisoryIds: hit.advisories.map((a) => a.id),
          severity: hit.advisories.map((a) => a.severity),
        })),
      };
    }
    const result = await adapter.buildReport({
      scanId: req.scanId,
      sbomId: req.sbomId,
      feed: req.feed,
    });
    return {
      ok: true,
      kind: 'report',
      scanId: result.scanId,
      sbomId: req.sbomId,
      componentCount: result.componentCount,
      vulnerableCount: result.vulnerableCount,
      secretsCount: result.secretsCount,
      licenseDenies: result.licenseDenies,
      overallVerdict: result.overallVerdict,
    };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      scanId: req.scanId,
      sbomId: req.sbomId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
