/**
 * Alert mock — v2.0 addition (v1.17-1).
 *
 * Prometheus AlertManager style mock. AlertRule evaluates against the
 * TelemetryCollector metrics sink; AlertRouter routes fired alerts to
 * named receivers with hierarchical matching. Silences suppress by
 * label match with an expiry window. Escalation walks a state machine
 * (pending → firing → escalated → resolved) so kiwa tests can assert
 * "receiver X saw alert Y", "silence Z suppressed the fire",
 * "escalation reached tier 2 at t=30s".
 */
import { TelemetryCollector, type MetricRecord } from './telemetry.js';

export type AlertOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

export type AlertSeverity = 'info' | 'warn' | 'critical';

export type AlertState = 'pending' | 'firing' | 'escalated' | 'resolved';

export interface AlertRule {
  id: string;
  metricName: string;
  operator: AlertOperator;
  threshold: number;
  /**
   * Sample count required over which the operator must hold before
   * the rule transitions from pending → firing. Default: 1.
   */
  forSamples?: number;
  labels: Record<string, string>;
  severity: AlertSeverity;
}

export interface AlertFire {
  ruleId: string;
  severity: AlertSeverity;
  labels: Record<string, string>;
  value: number;
  firedAt: number;
  state: AlertState;
}

export interface RouteEntry {
  /**
   * Label match — all key/value pairs must be present on the fire's
   * labels for the entry to be considered.
   */
  match: Record<string, string>;
  receiver: string;
  /**
   * Nested routes are evaluated when the parent match holds; the
   * first nested match that satisfies wins over the parent (deepest
   * match wins). Nested routes without a match are treated as a
   * catch-all inside the parent branch.
   */
  routes?: RouteEntry[];
}

export interface Silence {
  id: string;
  match: Record<string, string>;
  expiresAt: number;
}

export interface EscalationStep {
  /** Milliseconds after firing before this step applies. */
  afterMs: number;
  receiver: string;
}

export interface AlertReceiverEvent {
  receiver: string;
  fire: AlertFire;
  reason: 'route' | 'escalation';
  deliveredAt: number;
}

/**
 * Prometheus AlertManager style alert router + rule engine + silence
 * store + escalation state machine, glued to a TelemetryCollector.
 */
export class AlertRouter {
  private readonly rules = new Map<string, AlertRule>();
  private readonly silences: Silence[] = [];
  private readonly escalations = new Map<string, EscalationStep[]>();
  private readonly deliveries: AlertReceiverEvent[] = [];
  private readonly active = new Map<string, AlertFire>();
  private route: RouteEntry | null = null;
  private readonly collector: TelemetryCollector;
  private readonly now: () => number;
  private pendingCounts = new Map<string, number>();

  constructor(collector: TelemetryCollector, options?: { now?: () => number }) {
    this.collector = collector;
    this.now = options?.now ?? Date.now;
  }

  registerRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  setRoute(route: RouteEntry): void {
    this.route = route;
  }

  addSilence(silence: Silence): void {
    this.silences.push(silence);
  }

  setEscalation(ruleId: string, steps: EscalationStep[]): void {
    // Sorted so the state machine walks strictly ascending time.
    this.escalations.set(ruleId, [...steps].sort((a, b) => a.afterMs - b.afterMs));
  }

  /**
   * Evaluate every registered rule against the current collector
   * state. Rules whose predicate holds continuously for `forSamples`
   * evaluations transition pending → firing and are routed. Rules
   * whose predicate flips back to false transition to resolved.
   */
  evaluate(): AlertReceiverEvent[] {
    const at = this.now();
    const newlyFired: AlertFire[] = [];
    for (const rule of this.rules.values()) {
      const matches = this.collector.metrics.filter((m) => m.name === rule.metricName);
      const latest = matches[matches.length - 1];
      const holds = latest !== undefined && compare(latest.value, rule.operator, rule.threshold);
      if (holds) {
        const prev = this.pendingCounts.get(rule.id) ?? 0;
        const next = prev + 1;
        this.pendingCounts.set(rule.id, next);
        const required = rule.forSamples ?? 1;
        const alreadyActive = this.active.has(rule.id);
        if (next >= required && !alreadyActive) {
          const fire: AlertFire = {
            ruleId: rule.id,
            severity: rule.severity,
            labels: { ...rule.labels },
            value: latest!.value,
            firedAt: at,
            state: 'firing',
          };
          this.active.set(rule.id, fire);
          newlyFired.push(fire);
        }
      } else {
        this.pendingCounts.set(rule.id, 0);
        const active = this.active.get(rule.id);
        if (active) {
          active.state = 'resolved';
          this.active.delete(rule.id);
        }
      }
    }

    const events: AlertReceiverEvent[] = [];
    for (const fire of newlyFired) {
      if (this.isSilenced(fire)) continue;
      const receiver = this.pickReceiver(fire);
      if (!receiver) continue;
      const ev: AlertReceiverEvent = {
        receiver,
        fire,
        reason: 'route',
        deliveredAt: at,
      };
      this.deliveries.push(ev);
      events.push(ev);
    }
    return events;
  }

  /**
   * Advance the escalation clock. Any active fire whose escalation
   * step's `afterMs` has elapsed since firedAt gets routed to the
   * escalation receiver and transitions firing → escalated.
   */
  tickEscalation(): AlertReceiverEvent[] {
    const at = this.now();
    const events: AlertReceiverEvent[] = [];
    for (const fire of this.active.values()) {
      if (this.isSilenced(fire)) continue;
      const steps = this.escalations.get(fire.ruleId);
      if (!steps || steps.length === 0) continue;
      const elapsed = at - fire.firedAt;
      // Fire the highest step whose threshold is met and has not been
      // fired yet. Duplicate delivery is prevented by walking the
      // deliveries array to check per-step delivery uniqueness.
      for (const step of steps) {
        if (elapsed < step.afterMs) continue;
        const alreadyDelivered = this.deliveries.some(
          (d) => d.reason === 'escalation'
            && d.fire.ruleId === fire.ruleId
            && d.fire.firedAt === fire.firedAt
            && d.receiver === step.receiver,
        );
        if (alreadyDelivered) continue;
        const ev: AlertReceiverEvent = {
          receiver: step.receiver,
          fire: { ...fire, state: 'escalated' },
          reason: 'escalation',
          deliveredAt: at,
        };
        fire.state = 'escalated';
        this.deliveries.push(ev);
        events.push(ev);
      }
    }
    return events;
  }

  getDeliveries(): AlertReceiverEvent[] {
    return this.deliveries;
  }

  getActive(): AlertFire[] {
    return [...this.active.values()];
  }

  private isSilenced(fire: AlertFire): boolean {
    const at = this.now();
    return this.silences.some((s) => {
      if (s.expiresAt <= at) return false;
      for (const [k, v] of Object.entries(s.match)) {
        if (fire.labels[k] !== v) return false;
      }
      return true;
    });
  }

  private pickReceiver(fire: AlertFire): string | null {
    if (!this.route) return null;
    return walkRoute(this.route, fire.labels);
  }
}

function walkRoute(
  entry: RouteEntry,
  labels: Record<string, string>,
): string | null {
  if (!matchesLabels(entry.match, labels)) return null;
  if (entry.routes && entry.routes.length > 0) {
    for (const child of entry.routes) {
      const deep = walkRoute(child, labels);
      if (deep) return deep;
    }
  }
  return entry.receiver;
}

function matchesLabels(match: Record<string, string>, labels: Record<string, string>): boolean {
  for (const [k, v] of Object.entries(match)) {
    if (labels[k] !== v) return false;
  }
  return true;
}

function compare(a: number, op: AlertOperator, b: number): boolean {
  switch (op) {
    case 'gt':
      return a > b;
    case 'gte':
      return a >= b;
    case 'lt':
      return a < b;
    case 'lte':
      return a <= b;
    case 'eq':
      return a === b;
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

/**
 * Convenience — narrow accessor: metric records for a metric name.
 * Kept exported so kiwa test scenarios can double-check assertion
 * denominators without duplicating the filter predicate.
 */
export function metricsForRule(
  collector: TelemetryCollector,
  rule: AlertRule,
): MetricRecord[] {
  return collector.metrics.filter((m) => m.name === rule.metricName);
}
