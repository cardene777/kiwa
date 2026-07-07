/**
 * `/plan` HTTP handler — Terraform plan capture ops the runtime exposes
 * to the plan surface. The route is intentionally shape-neutral — the
 * fidelity harness feeds plain objects in and asserts on plain objects
 * out, so the same test can exercise mock and real without spinning up a
 * real Terraform state endpoint.
 *
 * The plan surface pairs the parent v1.42-1 `iac` observability axis
 * (capturePlan) with the runtime session lifecycle (start / close) —
 * every op has a neutral event counterpart the fidelity harness can
 * compare across mock vs real.
 */

import type {
  IacAdapter,
  ObservabilityTarget,
  ResourceChange,
} from '../../adapters/interface.js';

export type PlanOpKind = 'start' | 'capture' | 'close';

const VALID_TARGETS: readonly ObservabilityTarget[] = [
  'grafana-oss',
  'prometheus',
  'loki',
  'otel-collector',
];

const VALID_ACTIONS: ReadonlyArray<ResourceChange['action']> = [
  'create',
  'update',
  'delete',
  'no-op',
];

export interface PlanRequest {
  kind: PlanOpKind;
  sessionId: string;
  // start
  workspace?: string;
  target?: ObservabilityTarget;
  // capture
  changes?: ResourceChange[];
}

export interface PlanResponse {
  ok: boolean;
  kind: PlanOpKind;
  sessionId: string;
  workspace?: string;
  target?: ObservabilityTarget;
  changeCount?: number;
  additions?: number;
  modifications?: number;
  deletions?: number;
  errorKind?: string;
}

export function validatePlanRequest(
  body: unknown,
): { ok: true; value: PlanRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'start' && kind !== 'capture' && kind !== 'close') {
    return { ok: false, errorKind: 'kind_must_be_start_capture_or_close' };
  }
  const value: PlanRequest = { kind, sessionId: b['sessionId'] };
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
  if (kind === 'capture') {
    if (!Array.isArray(b['changes'])) {
      return { ok: false, errorKind: 'changes_required_array' };
    }
    const rawChanges = b['changes'] as unknown[];
    const changes: ResourceChange[] = [];
    for (const raw of rawChanges) {
      if (!raw || typeof raw !== 'object') {
        return { ok: false, errorKind: 'change_not_object' };
      }
      const c = raw as Record<string, unknown>;
      if (typeof c['address'] !== 'string' || !c['address']) {
        return { ok: false, errorKind: 'change_address_required' };
      }
      if (!VALID_ACTIONS.includes(c['action'] as ResourceChange['action'])) {
        return { ok: false, errorKind: 'change_action_required_valid' };
      }
      changes.push({
        address: c['address'],
        action: c['action'] as ResourceChange['action'],
      });
    }
    value.changes = changes;
    return { ok: true, value };
  }
  // kind === 'close'
  return { ok: true, value };
}

export async function handlePlanRequest(
  adapter: IacAdapter,
  req: PlanRequest,
): Promise<PlanResponse> {
  try {
    if (req.kind === 'start') {
      await adapter.startPlan({
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
    if (req.kind === 'capture') {
      const result = await adapter.capturePlan({
        sessionId: req.sessionId,
        changes: req.changes!,
      });
      return {
        ok: true,
        kind: 'capture',
        sessionId: result.sessionId,
        workspace: result.workspace,
        changeCount: result.changeCount,
        additions: result.additions,
        modifications: result.modifications,
        deletions: result.deletions,
      };
    }
    await adapter.closePlan({ sessionId: req.sessionId });
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
