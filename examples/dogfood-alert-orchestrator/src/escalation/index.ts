import type { EscalationLadderStep } from '../adapters/interface.js';

/**
 * Escalation ladder — L1 30s → L2 5min → L3 30min. AC of Issue #780
 * mirrors PagerDuty's 3-tier escalation policy so the mock exercises
 * the full state machine without arbitrarily longer windows.
 *
 * L1 (30s) — on-call primary
 * L2 (5min) — on-call secondary
 * L3 (30min) — engineering manager
 */
export function seededEscalation(): EscalationLadderStep[] {
  return [
    { step: 'L1', afterMs: 30_000, receiver: 'oncall-primary' },
    { step: 'L2', afterMs: 5 * 60 * 1000, receiver: 'oncall-secondary' },
    { step: 'L3', afterMs: 30 * 60 * 1000, receiver: 'eng-manager' },
  ];
}

/** Look up the ladder step whose afterMs threshold has just been crossed. */
export function stepFor(
  ladder: EscalationLadderStep[],
  elapsedMs: number,
): EscalationLadderStep | null {
  let candidate: EscalationLadderStep | null = null;
  for (const step of ladder) {
    if (elapsedMs >= step.afterMs) {
      if (!candidate || step.afterMs > candidate.afterMs) candidate = step;
    }
  }
  return candidate;
}
