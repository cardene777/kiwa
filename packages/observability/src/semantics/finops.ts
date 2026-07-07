import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

/**
 * FinOps observability axis — cost per request + team attribution + rightsizing +
 * spot instance savings state machine (v2.2 advanced III).
 *
 * 4-step lifecycle: record-cost-per-request → attribute-team → recommend-rightsizing →
 * optimize-spot。 FOCUS 1.0 (Finops Open Cost & Usage Specification, 2026 GA)
 * 準拠の cost data 経路。
 */

export type FinopsState =
  | 'idle'
  | 'cost-per-request-recorded'
  | 'team-attributed'
  | 'rightsizing-recommended'
  | 'spot-optimized';

export interface FinopsTeamCost {
  team: string;
  costUsd: number;
}

export interface FinopsRightsizingRecommendation {
  resource: string;
  currentSizeUsd: number;
  recommendedSizeUsd: number;
}

export interface FinopsSession {
  target: ObservabilityTarget;
  accountId: string;
  state: FinopsState;
  history: AxisStep<FinopsState>[];
  totalRequests: number;
  totalCostUsd: number;
  teamCosts: FinopsTeamCost[];
  recommendations: FinopsRightsizingRecommendation[];
  spotSavingsRatio: number;
}

export function startFinopsSession(input: {
  target: ObservabilityTarget;
  accountId: string;
}): FinopsSession {
  if (input.accountId.length === 0) {
    throw new Error('startFinopsSession: accountId must not be empty');
  }
  return {
    target: input.target,
    accountId: input.accountId,
    state: 'idle',
    history: [],
    totalRequests: 0,
    totalCostUsd: 0,
    teamCosts: [],
    recommendations: [],
    spotSavingsRatio: 0,
  };
}

export function recordCostPerRequest(
  session: FinopsSession,
  input: { requests: number; totalCostUsd: number },
): AxisStep<FinopsState> {
  if (session.state !== 'idle') {
    throw new Error(`recordCostPerRequest: session is ${session.state}, not idle`);
  }
  if (input.requests <= 0) {
    throw new Error('recordCostPerRequest: requests must be positive');
  }
  if (input.totalCostUsd < 0) {
    throw new Error('recordCostPerRequest: totalCostUsd must be non-negative');
  }
  session.totalRequests = input.requests;
  session.totalCostUsd = input.totalCostUsd;
  const costPerRequestUsd = input.totalCostUsd / input.requests;
  session.state = 'cost-per-request-recorded';
  return emit(session, 'finops.cost_per_request_recorded', {
    requests: input.requests,
    totalCostUsd: input.totalCostUsd,
    costPerRequestUsd,
  });
}

export function attributeTeam(
  session: FinopsSession,
  input: { teamCosts: FinopsTeamCost[] },
): AxisStep<FinopsState> {
  if (session.state !== 'cost-per-request-recorded') {
    throw new Error(`attributeTeam: session is ${session.state}, not cost-per-request-recorded`);
  }
  if (input.teamCosts.length === 0) {
    throw new Error('attributeTeam: teamCosts must not be empty');
  }
  for (const t of input.teamCosts) {
    if (t.costUsd < 0) {
      throw new Error(`attributeTeam: cost for ${t.team} must be non-negative`);
    }
  }
  session.teamCosts = [...input.teamCosts];
  const totalAttributedUsd = input.teamCosts.reduce((acc, t) => acc + t.costUsd, 0);
  const unattributedUsd = Math.max(0, session.totalCostUsd - totalAttributedUsd);
  session.state = 'team-attributed';
  return emit(session, 'finops.team_attributed', {
    teamCount: input.teamCosts.length,
    totalAttributedUsd,
    unattributedUsd,
  });
}

export function recommendRightsizing(
  session: FinopsSession,
  input: { recommendations: FinopsRightsizingRecommendation[] },
): AxisStep<FinopsState> {
  if (session.state !== 'team-attributed') {
    throw new Error(`recommendRightsizing: session is ${session.state}, not team-attributed`);
  }
  if (input.recommendations.length === 0) {
    throw new Error('recommendRightsizing: recommendations must not be empty');
  }
  for (const r of input.recommendations) {
    if (r.currentSizeUsd < 0 || r.recommendedSizeUsd < 0) {
      throw new Error(`recommendRightsizing: costs for ${r.resource} must be non-negative`);
    }
  }
  session.recommendations = [...input.recommendations];
  const totalSavingsUsd = input.recommendations.reduce(
    (acc, r) => acc + Math.max(0, r.currentSizeUsd - r.recommendedSizeUsd),
    0,
  );
  session.state = 'rightsizing-recommended';
  return emit(session, 'finops.rightsizing_recommended', {
    resourceCount: input.recommendations.length,
    totalSavingsUsd,
  });
}

export function optimizeSpot(
  session: FinopsSession,
  input: { onDemandUsd: number; spotUsd: number },
): AxisStep<FinopsState> {
  if (session.state !== 'rightsizing-recommended') {
    throw new Error(`optimizeSpot: session is ${session.state}, not rightsizing-recommended`);
  }
  if (input.onDemandUsd <= 0) {
    throw new Error('optimizeSpot: onDemandUsd must be positive');
  }
  if (input.spotUsd < 0) {
    throw new Error('optimizeSpot: spotUsd must be non-negative');
  }
  if (input.spotUsd > input.onDemandUsd) {
    throw new Error('optimizeSpot: spotUsd must not exceed onDemandUsd');
  }
  const savingsUsd = input.onDemandUsd - input.spotUsd;
  session.spotSavingsRatio = savingsUsd / input.onDemandUsd;
  session.state = 'spot-optimized';
  return emit(session, 'finops.spot_optimized', {
    onDemandUsd: input.onDemandUsd,
    spotUsd: input.spotUsd,
    savingsUsd,
    savingsRatio: session.spotSavingsRatio,
  });
}

function emit(
  session: FinopsSession,
  neutralEvent: AxisStep<FinopsState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<FinopsState> {
  const step: AxisStep<FinopsState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, accountId: session.accountId, ...metadata },
  };
  session.history.push(step);
  return step;
}
