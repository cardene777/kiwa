import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

export type AlertRoutingAdvancedState =
  | 'idle'
  | 'silenced'
  | 'inhibited'
  | 'escalated'
  | 'paged';

export interface Silence {
  matcher: Record<string, string>;
  startMs: number;
  endMs: number;
  reason: string;
}

export interface InhibitRule {
  sourceMatcher: Record<string, string>;
  targetMatcher: Record<string, string>;
  equalLabels: string[];
}

export interface EscalationStep {
  afterMinutes: number;
  target: 'primary-oncall' | 'secondary-oncall' | 'incident-commander' | 'exec-page';
}

export interface AlertRoutingAdvancedSession {
  target: ObservabilityTarget;
  routerId: string;
  state: AlertRoutingAdvancedState;
  silences: Silence[];
  inhibits: InhibitRule[];
  escalationChain: EscalationStep[];
  activeEscalationIndex: number;
  pagedTargets: string[];
  history: AxisStep<AlertRoutingAdvancedState>[];
}

export function startAlertRoutingAdvanced(input: {
  target: ObservabilityTarget;
  routerId: string;
}): AlertRoutingAdvancedSession {
  if (input.routerId.length === 0) {
    throw new Error('startAlertRoutingAdvanced: routerId must not be empty');
  }
  return {
    target: input.target,
    routerId: input.routerId,
    state: 'idle',
    silences: [],
    inhibits: [],
    escalationChain: [],
    activeEscalationIndex: -1,
    pagedTargets: [],
    history: [],
  };
}

export function applySilence(
  session: AlertRoutingAdvancedSession,
  silence: Silence,
): AxisStep<AlertRoutingAdvancedState> {
  if (silence.endMs <= silence.startMs) {
    throw new Error('applySilence: endMs must be after startMs');
  }
  if (Object.keys(silence.matcher).length === 0) {
    throw new Error('applySilence: matcher must not be empty');
  }
  session.silences.push(silence);
  session.state = 'silenced';
  return emit(session, 'alertrt.silence_applied', {
    reason: silence.reason,
    durationMs: silence.endMs - silence.startMs,
    matcherKeys: Object.keys(silence.matcher).join(','),
  });
}

export function applyInhibit(
  session: AlertRoutingAdvancedSession,
  rule: InhibitRule,
): AxisStep<AlertRoutingAdvancedState> {
  if (Object.keys(rule.sourceMatcher).length === 0) {
    throw new Error('applyInhibit: sourceMatcher must not be empty');
  }
  if (Object.keys(rule.targetMatcher).length === 0) {
    throw new Error('applyInhibit: targetMatcher must not be empty');
  }
  if (rule.equalLabels.length === 0) {
    throw new Error('applyInhibit: equalLabels must not be empty');
  }
  session.inhibits.push(rule);
  session.state = 'inhibited';
  return emit(session, 'alertrt.inhibit_applied', {
    equalLabels: rule.equalLabels.join(','),
    sourceKeys: Object.keys(rule.sourceMatcher).join(','),
    targetKeys: Object.keys(rule.targetMatcher).join(','),
  });
}

export function setEscalationChain(
  session: AlertRoutingAdvancedSession,
  chain: EscalationStep[],
): void {
  if (chain.length === 0) {
    throw new Error('setEscalationChain: chain must not be empty');
  }
  for (let i = 1; i < chain.length; i++) {
    if ((chain[i]?.afterMinutes ?? 0) <= (chain[i - 1]?.afterMinutes ?? 0)) {
      throw new Error('setEscalationChain: afterMinutes must be strictly increasing');
    }
  }
  session.escalationChain = [...chain];
  session.activeEscalationIndex = -1;
}

export function advanceEscalation(
  session: AlertRoutingAdvancedSession,
): AxisStep<AlertRoutingAdvancedState> {
  if (session.escalationChain.length === 0) {
    throw new Error('advanceEscalation: chain must be set first');
  }
  if (session.activeEscalationIndex >= session.escalationChain.length - 1) {
    throw new Error('advanceEscalation: chain already at final step');
  }
  session.activeEscalationIndex += 1;
  const step = session.escalationChain[session.activeEscalationIndex];
  if (!step) {
    throw new Error('advanceEscalation: current step is undefined');
  }
  session.state = 'escalated';
  return emit(session, 'alertrt.escalation_advanced', {
    stepIndex: session.activeEscalationIndex,
    afterMinutes: step.afterMinutes,
    target: step.target,
  });
}

export function pageOncall(
  session: AlertRoutingAdvancedSession,
  input: { target: string },
): AxisStep<AlertRoutingAdvancedState> {
  if (input.target.length === 0) {
    throw new Error('pageOncall: target must not be empty');
  }
  session.pagedTargets.push(input.target);
  session.state = 'paged';
  return emit(session, 'alertrt.oncall_paged', {
    target: input.target,
    totalPaged: session.pagedTargets.length,
  });
}

export function isSilenced(
  session: AlertRoutingAdvancedSession,
  labels: Record<string, string>,
  atMs: number,
): boolean {
  return session.silences.some(
    (s) =>
      atMs >= s.startMs &&
      atMs <= s.endMs &&
      Object.entries(s.matcher).every(([k, v]) => labels[k] === v),
  );
}

function emit(
  session: AlertRoutingAdvancedSession,
  neutralEvent: AxisStep<AlertRoutingAdvancedState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<AlertRoutingAdvancedState> {
  const step: AxisStep<AlertRoutingAdvancedState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, routerId: session.routerId, ...metadata },
  };
  session.history.push(step);
  return step;
}
