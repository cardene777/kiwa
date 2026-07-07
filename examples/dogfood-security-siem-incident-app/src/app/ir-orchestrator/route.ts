/**
 * `/ir-orchestrator` HTTP handler — fused SIEM correlation → incident
 * decision ops the runtime exposes to the orchestrator surface. The
 * route is intentionally shape-neutral — the fidelity harness feeds
 * plain objects in and asserts on plain objects out, so the same test
 * can exercise mock and real without spinning up a Splunk + PagerDuty
 * sidecar.
 *
 * The orchestrator surface layers a fused decision on top of the two
 * axis outputs — the caller reports whether the SIEM correlation
 * matched and the enrichment inputs (affected users / data
 * classification / service down), and the orchestrator picks a
 * severity + decides whether to trigger an incident. This mirrors a
 * Splunk SOAR playbook that requires a correlation match before
 * escalating and picks a sev1-5 rung based on impact.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type OrchestratorOpKind = 'decide';

export interface OrchestratorRequest {
  kind: OrchestratorOpKind;
  sessionId: string;
  correlationMatched?: boolean;
  affectedUsers?: number;
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
  serviceDown?: boolean;
}

export interface OrchestratorResponse {
  ok: boolean;
  kind: OrchestratorOpKind;
  sessionId: string;
  correlationMatched?: boolean;
  incidentTriggered?: boolean;
  severity?: 'sev1' | 'sev2' | 'sev3' | 'sev4' | 'sev5';
  errorKind?: string;
}

export function validateOrchestratorRequest(
  body: unknown,
):
  | { ok: true; value: OrchestratorRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (b['kind'] !== 'decide') {
    return { ok: false, errorKind: 'kind_must_be_decide' };
  }
  if (typeof b['correlationMatched'] !== 'boolean') {
    return { ok: false, errorKind: 'correlationMatched_required_boolean' };
  }
  if (typeof b['affectedUsers'] !== 'number' || (b['affectedUsers'] as number) < 0) {
    return { ok: false, errorKind: 'affectedUsers_required_non_negative_number' };
  }
  const dc = b['dataClassification'];
  if (
    dc !== 'public' &&
    dc !== 'internal' &&
    dc !== 'confidential' &&
    dc !== 'restricted'
  ) {
    return {
      ok: false,
      errorKind: 'dataClassification_must_be_public_internal_confidential_or_restricted',
    };
  }
  if (typeof b['serviceDown'] !== 'boolean') {
    return { ok: false, errorKind: 'serviceDown_required_boolean' };
  }
  return {
    ok: true,
    value: {
      kind: 'decide',
      sessionId: b['sessionId'],
      correlationMatched: b['correlationMatched'],
      affectedUsers: b['affectedUsers'] as number,
      dataClassification: dc,
      serviceDown: b['serviceDown'],
    },
  };
}

export async function handleOrchestratorRequest(
  adapter: SecurityAdapter,
  req: OrchestratorRequest,
): Promise<OrchestratorResponse> {
  try {
    const result = await adapter.orchestrateDecision({
      sessionId: req.sessionId,
      correlationMatched: req.correlationMatched!,
      affectedUsers: req.affectedUsers!,
      dataClassification: req.dataClassification!,
      serviceDown: req.serviceDown!,
    });
    return {
      ok: true,
      kind: 'decide',
      sessionId: result.sessionId,
      correlationMatched: result.correlationMatched,
      incidentTriggered: result.incidentTriggered,
      severity: result.severity,
    };
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
