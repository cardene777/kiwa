/**
 * `/secrets-scan` HTTP handler — TruffleHog + Gitleaks style scanning +
 * rotation SLA ops the runtime exposes to the secrets-scan surface. The
 * route is intentionally shape-neutral — the fidelity harness feeds plain
 * objects in and asserts on plain objects out, so the same test can
 * exercise mock and real without spinning up a Gitleaks binary.
 *
 * The secrets-scan surface pairs the parent v1.37-1 `secrets-scan` axis
 * (TruffleHog signature + Gitleaks style rule + rotation policy) with
 * `@kiwa-lab/security` v0.1 — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type SecretsScanOpKind =
  | 'start'
  | 'scan'
  | 'trackRotation'
  | 'markRotated'
  | 'close';

export interface SecretsScanRequest {
  kind: SecretsScanOpKind;
  scanId: string;
  source?: string;
  rotateWithinDays?: number;
  findingIndex?: number;
  discoveredAtMs?: number;
  rotatedAtMs?: number;
}

export interface SecretsScanResponse {
  ok: boolean;
  kind: SecretsScanOpKind;
  scanId: string;
  findings?: Array<{
    kind: string;
    matched: string;
    line: number;
    column: number;
    entropy: number;
    ruleDescription: string;
  }>;
  findingKind?: string;
  discoveredAtMs?: number;
  rotateWithinDays?: number;
  rotatedAtMs?: number;
  overdue?: boolean;
  errorKind?: string;
}

export function validateSecretsScanRequest(
  body: unknown,
): { ok: true; value: SecretsScanRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['scanId'] !== 'string' || !b['scanId']) {
    return { ok: false, errorKind: 'scanId_required' };
  }
  const kind = b['kind'];
  if (
    kind !== 'start' &&
    kind !== 'scan' &&
    kind !== 'trackRotation' &&
    kind !== 'markRotated' &&
    kind !== 'close'
  ) {
    return { ok: false, errorKind: 'kind_unrecognised' };
  }
  const value: SecretsScanRequest = { kind, scanId: b['scanId'] };
  if (kind === 'start') {
    if (typeof b['rotateWithinDays'] !== 'number' || b['rotateWithinDays'] <= 0) {
      return { ok: false, errorKind: 'rotateWithinDays_required' };
    }
    value.rotateWithinDays = b['rotateWithinDays'];
  }
  if (kind === 'scan') {
    if (typeof b['source'] !== 'string') {
      return { ok: false, errorKind: 'source_required' };
    }
    value.source = b['source'];
  }
  if (kind === 'trackRotation' || kind === 'markRotated') {
    if (typeof b['findingIndex'] !== 'number' || b['findingIndex'] < 0) {
      return { ok: false, errorKind: 'findingIndex_required' };
    }
    value.findingIndex = b['findingIndex'];
    if (kind === 'trackRotation') {
      if (typeof b['discoveredAtMs'] !== 'number') {
        return { ok: false, errorKind: 'discoveredAtMs_required' };
      }
      value.discoveredAtMs = b['discoveredAtMs'];
    }
    if (kind === 'markRotated') {
      if (typeof b['rotatedAtMs'] !== 'number') {
        return { ok: false, errorKind: 'rotatedAtMs_required' };
      }
      value.rotatedAtMs = b['rotatedAtMs'];
    }
  }
  return { ok: true, value };
}

export async function handleSecretsScanRequest(
  adapter: SecurityAdapter,
  req: SecretsScanRequest,
): Promise<SecretsScanResponse> {
  try {
    if (req.kind === 'start') {
      await adapter.startSecrets({
        scanId: req.scanId,
        rotateWithinDays: req.rotateWithinDays!,
      });
      return { ok: true, kind: 'start', scanId: req.scanId };
    }
    if (req.kind === 'scan') {
      const result = await adapter.scanSource({
        scanId: req.scanId,
        source: req.source!,
      });
      return {
        ok: true,
        kind: 'scan',
        scanId: result.scanId,
        findings: result.findings.map((f) => ({
          kind: f.kind,
          matched: f.matched,
          line: f.line,
          column: f.column,
          entropy: f.entropy,
          ruleDescription: f.ruleDescription,
        })),
      };
    }
    if (req.kind === 'trackRotation') {
      const result = await adapter.trackRotation({
        scanId: req.scanId,
        findingIndex: req.findingIndex!,
        discoveredAtMs: req.discoveredAtMs!,
      });
      return {
        ok: true,
        kind: 'trackRotation',
        scanId: result.scanId,
        findingKind: result.findingKind,
        discoveredAtMs: result.discoveredAtMs,
        rotateWithinDays: result.rotateWithinDays,
      };
    }
    if (req.kind === 'markRotated') {
      const result = await adapter.markRotated({
        scanId: req.scanId,
        findingIndex: req.findingIndex!,
        rotatedAtMs: req.rotatedAtMs!,
      });
      return {
        ok: true,
        kind: 'markRotated',
        scanId: result.scanId,
        findingKind: result.findingKind,
        rotatedAtMs: result.rotatedAtMs,
        overdue: result.overdue,
      };
    }
    await adapter.closeSecrets({ scanId: req.scanId });
    return { ok: true, kind: 'close', scanId: req.scanId };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      scanId: req.scanId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
