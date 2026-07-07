/**
 * `/drift` HTTP handler — drift detection ops the runtime exposes to the
 * drift surface. The route is intentionally shape-neutral — the fidelity
 * harness feeds plain objects in and asserts on plain objects out, so the
 * same test can exercise mock and real without spinning up a real
 * Terraform state endpoint.
 *
 * The drift surface pairs the parent v1.42-1 `iac` observability axis
 * (detectDrift) with the runtime session lifecycle (start / close) —
 * every op has a neutral event counterpart the fidelity harness can
 * compare across mock vs real.
 */

import type {
  IacAdapter,
  ObservabilityTarget,
} from '../../adapters/interface.js';

export type DriftOpKind = 'start' | 'detect' | 'close';

const VALID_TARGETS: readonly ObservabilityTarget[] = [
  'grafana-oss',
  'prometheus',
  'loki',
  'otel-collector',
];

export interface DriftRequest {
  kind: DriftOpKind;
  sessionId: string;
  // start
  workspace?: string;
  target?: ObservabilityTarget;
  // detect
  expected?: string[];
  actual?: string[];
}

export interface DriftResponse {
  ok: boolean;
  kind: DriftOpKind;
  sessionId: string;
  workspace?: string;
  target?: ObservabilityTarget;
  driftCount?: number;
  driftedResources?: string[];
  hasDrift?: boolean;
  errorKind?: string;
}

export function validateDriftRequest(
  body: unknown,
): { ok: true; value: DriftRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'start' && kind !== 'detect' && kind !== 'close') {
    return { ok: false, errorKind: 'kind_must_be_start_detect_or_close' };
  }
  const value: DriftRequest = { kind, sessionId: b['sessionId'] };
  if (kind === 'start') {
    if (typeof b['workspace'] !== 'string' || !b['workspace']) {
      return { ok: false, errorKind: 'workspace_required' };
    }
    if (!VALID_TARGETS.includes(b['target'] as ObservabilityTarget)) {
      return { ok: false, errorKind: 'target_required_valid' };
    }
    value.workspace = b['workspace'];
    value.target = b['target'] as ObservabilityTarget;
    return { ok: true, value };
  }
  if (kind === 'detect') {
    if (!Array.isArray(b['expected'])) {
      return { ok: false, errorKind: 'expected_required_array' };
    }
    if (!Array.isArray(b['actual'])) {
      return { ok: false, errorKind: 'actual_required_array' };
    }
    for (const item of b['expected'] as unknown[]) {
      if (typeof item !== 'string') {
        return { ok: false, errorKind: 'expected_item_must_be_string' };
      }
    }
    for (const item of b['actual'] as unknown[]) {
      if (typeof item !== 'string') {
        return { ok: false, errorKind: 'actual_item_must_be_string' };
      }
    }
    value.expected = b['expected'] as string[];
    value.actual = b['actual'] as string[];
    return { ok: true, value };
  }
  // kind === 'close'
  return { ok: true, value };
}

export async function handleDriftRequest(
  adapter: IacAdapter,
  req: DriftRequest,
): Promise<DriftResponse> {
  try {
    if (req.kind === 'start') {
      await adapter.startDrift({
        sessionId: req.sessionId,
        workspace: req.workspace!,
        target: req.target!,
      });
      return {
        ok: true,
        kind: 'start',
        sessionId: req.sessionId,
        workspace: req.workspace!,
        target: req.target!,
      };
    }
    if (req.kind === 'detect') {
      const result = await adapter.detectDrift({
        sessionId: req.sessionId,
        expected: req.expected!,
        actual: req.actual!,
      });
      return {
        ok: true,
        kind: 'detect',
        sessionId: result.sessionId,
        workspace: result.workspace,
        driftCount: result.driftCount,
        driftedResources: result.driftedResources,
        hasDrift: result.hasDrift,
      };
    }
    await adapter.closeDrift({ sessionId: req.sessionId });
    return { ok: true, kind: 'close', sessionId: req.sessionId };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      sessionId: req.sessionId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
