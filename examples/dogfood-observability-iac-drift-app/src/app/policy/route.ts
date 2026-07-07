/**
 * `/policy` HTTP handler — OPA policy evaluation + cost attribution ops
 * the runtime exposes to the policy surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and asserts
 * on plain objects out, so the same test can exercise mock and real
 * without spinning up a real OPA server or cost-explorer API endpoint.
 *
 * The policy surface pairs the parent v1.42-1 `iac` observability axis
 * (evaluatePolicy + attributeCost) with the runtime session lifecycle
 * (start / close) — every op has a neutral event counterpart the fidelity
 * harness can compare across mock vs real.
 */

import type {
  CostAttribution,
  IacAdapter,
  ObservabilityTarget,
  PolicyResult,
} from '../../adapters/interface.js';

export type PolicyOpKind = 'start' | 'evaluate' | 'attribute' | 'close';

const VALID_TARGETS: readonly ObservabilityTarget[] = [
  'grafana-oss',
  'prometheus',
  'loki',
  'otel-collector',
];

export interface PolicyRequest {
  kind: PolicyOpKind;
  sessionId: string;
  // start
  workspace?: string;
  target?: ObservabilityTarget;
  // evaluate
  results?: PolicyResult[];
  // attribute
  attributions?: CostAttribution[];
}

export interface PolicyResponse {
  ok: boolean;
  kind: PolicyOpKind;
  sessionId: string;
  workspace?: string;
  target?: ObservabilityTarget;
  policyCount?: number;
  passed?: number;
  failed?: number;
  totalViolations?: number;
  teamCount?: number;
  totalMonthlyCostUsd?: number;
  errorKind?: string;
}

export function validatePolicyRequest(
  body: unknown,
): { ok: true; value: PolicyRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'start' && kind !== 'evaluate' && kind !== 'attribute' && kind !== 'close') {
    return { ok: false, errorKind: 'kind_must_be_start_evaluate_attribute_or_close' };
  }
  const value: PolicyRequest = { kind, sessionId: b['sessionId'] };
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
  if (kind === 'evaluate') {
    if (!Array.isArray(b['results'])) {
      return { ok: false, errorKind: 'results_required_array' };
    }
    const raw = b['results'] as unknown[];
    const results: PolicyResult[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') {
        return { ok: false, errorKind: 'result_not_object' };
      }
      const r = item as Record<string, unknown>;
      if (typeof r['policyId'] !== 'string' || !r['policyId']) {
        return { ok: false, errorKind: 'result_policyId_required' };
      }
      if (typeof r['passed'] !== 'boolean') {
        return { ok: false, errorKind: 'result_passed_required_boolean' };
      }
      if (typeof r['violationCount'] !== 'number') {
        return { ok: false, errorKind: 'result_violationCount_required_number' };
      }
      results.push({
        policyId: r['policyId'],
        passed: r['passed'],
        violationCount: r['violationCount'],
      });
    }
    value.results = results;
    return { ok: true, value };
  }
  if (kind === 'attribute') {
    if (!Array.isArray(b['attributions'])) {
      return { ok: false, errorKind: 'attributions_required_array' };
    }
    const raw = b['attributions'] as unknown[];
    const attributions: CostAttribution[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') {
        return { ok: false, errorKind: 'attribution_not_object' };
      }
      const a = item as Record<string, unknown>;
      if (typeof a['team'] !== 'string' || !a['team']) {
        return { ok: false, errorKind: 'attribution_team_required' };
      }
      if (typeof a['monthlyCostUsd'] !== 'number') {
        return { ok: false, errorKind: 'attribution_monthlyCostUsd_required_number' };
      }
      attributions.push({
        team: a['team'],
        monthlyCostUsd: a['monthlyCostUsd'],
      });
    }
    value.attributions = attributions;
    return { ok: true, value };
  }
  // kind === 'close'
  return { ok: true, value };
}

export async function handlePolicyRequest(
  adapter: IacAdapter,
  req: PolicyRequest,
): Promise<PolicyResponse> {
  try {
    if (req.kind === 'start') {
      await adapter.startPolicy({
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
    if (req.kind === 'evaluate') {
      const result = await adapter.evaluatePolicy({
        sessionId: req.sessionId,
        results: req.results!,
      });
      return {
        ok: true,
        kind: 'evaluate',
        sessionId: result.sessionId,
        workspace: result.workspace,
        policyCount: result.policyCount,
        passed: result.passed,
        failed: result.failed,
        totalViolations: result.totalViolations,
      };
    }
    if (req.kind === 'attribute') {
      const result = await adapter.attributeCost({
        sessionId: req.sessionId,
        attributions: req.attributions!,
      });
      return {
        ok: true,
        kind: 'attribute',
        sessionId: result.sessionId,
        workspace: result.workspace,
        teamCount: result.teamCount,
        totalMonthlyCostUsd: result.totalMonthlyCostUsd,
      };
    }
    await adapter.closePolicy({ sessionId: req.sessionId });
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
