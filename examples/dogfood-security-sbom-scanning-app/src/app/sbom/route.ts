/**
 * `/sbom` HTTP handler — SBOM CycloneDX / SPDX emission + validation +
 * license policy ops the runtime exposes to the sbom surface. The route
 * is intentionally shape-neutral — the fidelity harness feeds plain
 * objects in and asserts on plain objects out, so the same test can
 * exercise mock and real without spinning up a Trivy scanner.
 *
 * The sbom surface pairs the parent v1.37-1 `sbom` axis (CycloneDX +
 * SPDX + validation + license policy + advisory lookup) with
 * `@kiwa-test/security` v0.1 — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type { SbomComponent } from '@kiwa-test/security';
import type { SecurityAdapter } from '../../adapters/interface.js';

export type SbomOpKind =
  | 'start'
  | 'addComponent'
  | 'emitCycloneDx'
  | 'emitSpdx'
  | 'validate'
  | 'evaluateLicense'
  | 'close';

export interface SbomRequest {
  kind: SbomOpKind;
  sbomId: string;
  component?: SbomComponent;
  nowIso?: string;
}

export interface SbomResponse {
  ok: boolean;
  kind: SbomOpKind;
  sbomId: string;
  componentCount?: number;
  format?: 'cyclonedx' | 'spdx';
  formatVersion?: string;
  document?: unknown;
  errors?: string[];
  verdicts?: Array<{
    purl: string;
    license: string | null;
    verdict: 'allow' | 'warn' | 'deny';
  }>;
  overallVerdict?: 'allow' | 'warn' | 'deny';
  errorKind?: string;
}

export function validateSbomRequest(
  body: unknown,
): { ok: true; value: SbomRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sbomId'] !== 'string' || !b['sbomId']) {
    return { ok: false, errorKind: 'sbomId_required' };
  }
  const kind = b['kind'];
  if (
    kind !== 'start' &&
    kind !== 'addComponent' &&
    kind !== 'emitCycloneDx' &&
    kind !== 'emitSpdx' &&
    kind !== 'validate' &&
    kind !== 'evaluateLicense' &&
    kind !== 'close'
  ) {
    return { ok: false, errorKind: 'kind_unrecognised' };
  }
  const value: SbomRequest = {
    kind,
    sbomId: b['sbomId'],
  };
  if (kind === 'addComponent') {
    if (!b['component'] || typeof b['component'] !== 'object') {
      return { ok: false, errorKind: 'component_required' };
    }
    const c = b['component'] as Record<string, unknown>;
    if (typeof c['name'] !== 'string' || !c['name']) {
      return { ok: false, errorKind: 'component_name_required' };
    }
    if (typeof c['version'] !== 'string' || !c['version']) {
      return { ok: false, errorKind: 'component_version_required' };
    }
    if (typeof c['purl'] !== 'string' || !c['purl']) {
      return { ok: false, errorKind: 'component_purl_required' };
    }
    const component: SbomComponent = {
      name: c['name'],
      version: c['version'],
      purl: c['purl'],
    };
    if (typeof c['license'] === 'string') {
      component.license = c['license'];
    }
    value.component = component;
  }
  if (kind === 'emitCycloneDx' || kind === 'emitSpdx') {
    if (typeof b['nowIso'] === 'string') {
      value.nowIso = b['nowIso'];
    }
  }
  return { ok: true, value };
}

export async function handleSbomRequest(
  adapter: SecurityAdapter,
  req: SbomRequest,
): Promise<SbomResponse> {
  try {
    if (req.kind === 'start') {
      await adapter.startSbom({ sbomId: req.sbomId });
      return { ok: true, kind: 'start', sbomId: req.sbomId };
    }
    if (req.kind === 'addComponent') {
      const result = await adapter.addComponent({
        sbomId: req.sbomId,
        component: req.component!,
      });
      return {
        ok: true,
        kind: 'addComponent',
        sbomId: result.sbomId,
        componentCount: result.componentCount,
      };
    }
    if (req.kind === 'emitCycloneDx' || req.kind === 'emitSpdx') {
      const emit =
        req.kind === 'emitCycloneDx'
          ? adapter.emitCycloneDx.bind(adapter)
          : adapter.emitSpdx.bind(adapter);
      const emitInput: Parameters<SecurityAdapter['emitCycloneDx']>[0] = {
        sbomId: req.sbomId,
      };
      if (req.nowIso !== undefined) {
        emitInput.nowIso = req.nowIso;
      }
      const result = await emit(emitInput);
      return {
        ok: true,
        kind: req.kind,
        sbomId: result.sbomId,
        format: result.format,
        formatVersion: result.formatVersion,
        document: result.document,
      };
    }
    if (req.kind === 'validate') {
      const result = await adapter.validateSbom({ sbomId: req.sbomId });
      return {
        ok: result.ok,
        kind: 'validate',
        sbomId: result.sbomId,
        errors: result.errors,
      };
    }
    if (req.kind === 'evaluateLicense') {
      const result = await adapter.evaluateLicense({ sbomId: req.sbomId });
      return {
        ok: true,
        kind: 'evaluateLicense',
        sbomId: result.sbomId,
        verdicts: result.verdicts,
        overallVerdict: result.overallVerdict,
      };
    }
    await adapter.closeSbom({ sbomId: req.sbomId });
    return { ok: true, kind: 'close', sbomId: req.sbomId };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      sbomId: req.sbomId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
