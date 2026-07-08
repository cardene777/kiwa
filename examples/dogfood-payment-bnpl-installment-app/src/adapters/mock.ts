/**
 * Mock adapter — drives `@kiwa/payment` v0.5 bnpl semantics
 * (createBnplPlan / scheduleInstallment / scoreRisk / chargeLateFee /
 * markInstallmentPaid) so the same app code exercises a deterministic
 * BNPL ceremony without a real Klarna / Affirm / Afterpay endpoint. Both
 * mock and real adapters satisfy {@link PaymentAdapter}, so the fidelity
 * harness can diff them side-by-side.
 *
 * State model — one session per (sessionId) tuple across each surface;
 * each session is isolated so per-surface metrics stay separated. The
 * plan surface owns plan creation + per-installment schedule envelope;
 * the risk surface owns soft credit check + aggregate threshold; the
 * collection surface owns late fee charges + installment mark paid +
 * settle terminal + status snapshots.
 *
 * The mock intentionally piggy-backs on the v0.5 bnpl semantics
 * BnplSession — every op appends the matching neutral event into the
 * trace so the fidelity harness can assert the mock and real adapters
 * produce identical event orderings.
 */

import {
  createStripeMock,
  createBnplPlan as createBnplPlanSem,
  scheduleInstallment as scheduleInstallmentSem,
  scoreRisk as scoreRiskSem,
  chargeLateFee as chargeLateFeeSem,
  markInstallmentPaid as markInstallmentPaidSem,
  type BnplSession,
  type PaymentAdapter as PaymentWebhookAdapter,
} from '@kiwa/payment';
import type {
  CollectionLateFeeResult,
  CollectionMarkPaidResult,
  CollectionSettleResult,
  CollectionStatusResult,
  PaymentAdapter,
  PlanCreateResult,
  PlanScheduleResult,
  RiskScoreResult,
  RiskThresholdResult,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
  /**
   * Initial webhook adapter used to drive the v0.5 semantics helpers.
   * Defaults to a stripe mock so the neutral event names emit under the
   * `stripe.*` provider vocabulary. Tests that want a paddle / lemonsqueezy
   * flavour can inject one here.
   */
  webhookAdapter?: PaymentWebhookAdapter;
}

interface PlanSessionState {
  sessionId: string;
  provider: 'klarna' | 'affirm' | 'afterpay';
  /** planId → BnplSession from v0.5 semantics. */
  plans: Map<string, BnplSession>;
  closed: boolean;
}

interface RiskSessionState {
  sessionId: string;
  planId: string;
  creditBureau: 'experian' | 'equifax' | 'transunion' | 'internal';
  closed: boolean;
}

interface CollectionSessionState {
  sessionId: string;
  planId: string;
  /** planId → BnplSession reference (shared with plan session). */
  planRef: BnplSession | null;
  closed: boolean;
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): PaymentAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const webhookAdapter =
    opts.webhookAdapter ?? createStripeMock({ secret: 'whsec_dogfood_bnpl' });
  const trace: TraceEvent[] = [];
  const plans = new Map<string, PlanSessionState>();
  const risks = new Map<string, RiskSessionState>();
  const collections = new Map<string, CollectionSessionState>();

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function coerceErrorKind(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'unknown_error';
  }

  /**
   * Look up the shared BnplSession for a given planId across every plan
   * session. The mock uses a plan-id → BnplSession lookup so risk +
   * collection sessions can address the same underlying plan.
   */
  function findPlan(planId: string): BnplSession | null {
    for (const [, session] of plans) {
      const plan = session.plans.get(planId);
      if (plan) return plan;
    }
    return null;
  }

  return {
    mode: 'mock',

    async startPlan(input) {
      if (plans.has(input.sessionId)) {
        record('startPlan', false, { errorKind: 'plan_session_exists' });
        throw new Error('plan_session_exists');
      }
      plans.set(input.sessionId, {
        sessionId: input.sessionId,
        provider: input.provider,
        plans: new Map(),
        closed: false,
      });
      record('startPlan', true, {
        detail: { sessionId: input.sessionId, provider: input.provider },
      });
    },

    async createPlan(input) {
      const session = plans.get(input.sessionId);
      if (!session) {
        record('createPlan', false, { errorKind: 'plan_session_not_found' });
        throw new Error('plan_session_not_found');
      }
      if (session.closed) {
        record('createPlan', false, { errorKind: 'plan_session_closed' });
        throw new Error('plan_session_closed');
      }
      if (session.plans.has(input.planId)) {
        record('createPlan', false, { errorKind: 'plan_already_created' });
        throw new Error('plan_already_created');
      }
      try {
        const config: {
          installments: number;
          installmentIntervalMs?: number;
          minRiskScore?: number;
          lateFeeCents?: number;
        } = { installments: input.installments };
        if (input.installmentIntervalMs !== undefined) {
          config.installmentIntervalMs = input.installmentIntervalMs;
        }
        if (input.minRiskScore !== undefined) {
          config.minRiskScore = input.minRiskScore;
        }
        if (input.lateFeeCents !== undefined) {
          config.lateFeeCents = input.lateFeeCents;
        }
        const { session: bnplSession } = await createBnplPlanSem(webhookAdapter, {
          planId: input.planId,
          customerId: input.customerId,
          totalCents: input.totalCents,
          currency: input.currency,
          config,
        });
        session.plans.set(input.planId, bnplSession);
        const result: PlanCreateResult = {
          sessionId: input.sessionId,
          planId: input.planId,
          customerId: input.customerId,
          totalCents: input.totalCents,
          currency: input.currency,
          installments: bnplSession.config.installments,
          installmentAmountCents: bnplSession.installmentAmountCents,
          state: bnplSession.state,
          latencyMs,
        };
        record('createPlan', true, { detail: result });
        return result;
      } catch (err) {
        record('createPlan', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async scheduleInstallment(input) {
      const session = plans.get(input.sessionId);
      if (!session) {
        record('scheduleInstallment', false, {
          errorKind: 'plan_session_not_found',
        });
        throw new Error('plan_session_not_found');
      }
      const plan = session.plans.get(input.planId);
      if (!plan) {
        record('scheduleInstallment', false, { errorKind: 'plan_not_found' });
        throw new Error('plan_not_found');
      }
      try {
        const step = await scheduleInstallmentSem(webhookAdapter, plan);
        const dueOffsetMs = typeof step.metadata['dueOffsetMs'] === 'number'
          ? step.metadata['dueOffsetMs']
          : 0;
        const result: PlanScheduleResult = {
          sessionId: input.sessionId,
          planId: input.planId,
          installmentIndex: plan.installmentsScheduled,
          installmentAmountCents: plan.installmentAmountCents,
          dueOffsetMs,
          state: plan.state,
          latencyMs,
        };
        record('scheduleInstallment', true, { detail: result });
        return result;
      } catch (err) {
        record('scheduleInstallment', false, {
          errorKind: coerceErrorKind(err),
        });
        throw err;
      }
    },

    async closePlan(input) {
      const session = plans.get(input.sessionId);
      if (!session) {
        record('closePlan', false, { errorKind: 'plan_session_not_found' });
        throw new Error('plan_session_not_found');
      }
      session.closed = true;
      plans.delete(input.sessionId);
      record('closePlan', true, { detail: { sessionId: input.sessionId } });
    },

    async startRisk(input) {
      if (risks.has(input.sessionId)) {
        record('startRisk', false, { errorKind: 'risk_session_exists' });
        throw new Error('risk_session_exists');
      }
      risks.set(input.sessionId, {
        sessionId: input.sessionId,
        planId: input.planId,
        creditBureau: input.creditBureau,
        closed: false,
      });
      record('startRisk', true, {
        detail: {
          sessionId: input.sessionId,
          planId: input.planId,
          creditBureau: input.creditBureau,
        },
      });
    },

    async scoreCustomerRisk(input) {
      const session = risks.get(input.sessionId);
      if (!session) {
        record('scoreCustomerRisk', false, {
          errorKind: 'risk_session_not_found',
        });
        throw new Error('risk_session_not_found');
      }
      if (session.closed) {
        record('scoreCustomerRisk', false, { errorKind: 'risk_session_closed' });
        throw new Error('risk_session_closed');
      }
      if (input.planId !== session.planId) {
        record('scoreCustomerRisk', false, { errorKind: 'plan_id_mismatch' });
        throw new Error('plan_id_mismatch');
      }
      if (input.score < 0 || input.score > 100) {
        record('scoreCustomerRisk', false, { errorKind: 'score_out_of_range' });
        throw new Error('score_out_of_range');
      }
      if (input.minRequired < 0 || input.minRequired > 100) {
        record('scoreCustomerRisk', false, {
          errorKind: 'min_required_out_of_range',
        });
        throw new Error('min_required_out_of_range');
      }
      const plan = findPlan(input.planId);
      if (!plan) {
        record('scoreCustomerRisk', false, { errorKind: 'plan_not_found' });
        throw new Error('plan_not_found');
      }
      // Sync the semantics minRiskScore with the caller so the semantics-
      // side pass/fail matches the adapter-side pass/fail.
      plan.config.minRiskScore = input.minRequired;
      try {
        await scoreRiskSem(webhookAdapter, plan, {
          score: input.score,
          creditBureau: session.creditBureau,
        });
        const passed = input.score >= input.minRequired;
        const result: RiskScoreResult = {
          sessionId: input.sessionId,
          planId: input.planId,
          customerId: plan.customerId,
          score: input.score,
          minRequired: input.minRequired,
          passed,
          creditBureau: session.creditBureau,
          state: plan.state,
          latencyMs,
        };
        record('scoreCustomerRisk', true, { detail: result });
        return result;
      } catch (err) {
        record('scoreCustomerRisk', false, {
          errorKind: coerceErrorKind(err),
        });
        throw err;
      }
    },

    async checkRiskThreshold(input) {
      const session = risks.get(input.sessionId);
      if (!session) {
        record('checkRiskThreshold', false, {
          errorKind: 'risk_session_not_found',
        });
        throw new Error('risk_session_not_found');
      }
      if (input.planId !== session.planId) {
        record('checkRiskThreshold', false, { errorKind: 'plan_id_mismatch' });
        throw new Error('plan_id_mismatch');
      }
      if (input.minRequired < 0 || input.minRequired > 100) {
        record('checkRiskThreshold', false, {
          errorKind: 'min_required_out_of_range',
        });
        throw new Error('min_required_out_of_range');
      }
      const passed = input.aggregateScore >= input.minRequired;
      const result: RiskThresholdResult = {
        sessionId: input.sessionId,
        planId: input.planId,
        aggregateScore: input.aggregateScore,
        minRequired: input.minRequired,
        passed,
        latencyMs,
      };
      record('checkRiskThreshold', true, { detail: result });
      return result;
    },

    async closeRisk(input) {
      const session = risks.get(input.sessionId);
      if (!session) {
        record('closeRisk', false, { errorKind: 'risk_session_not_found' });
        throw new Error('risk_session_not_found');
      }
      session.closed = true;
      risks.delete(input.sessionId);
      record('closeRisk', true, { detail: { sessionId: input.sessionId } });
    },

    async startCollection(input) {
      if (collections.has(input.sessionId)) {
        record('startCollection', false, {
          errorKind: 'collection_session_exists',
        });
        throw new Error('collection_session_exists');
      }
      const planRef = findPlan(input.planId);
      collections.set(input.sessionId, {
        sessionId: input.sessionId,
        planId: input.planId,
        planRef,
        closed: false,
      });
      record('startCollection', true, {
        detail: { sessionId: input.sessionId, planId: input.planId },
      });
    },

    async chargeLateFee(input) {
      const session = collections.get(input.sessionId);
      if (!session) {
        record('chargeLateFee', false, {
          errorKind: 'collection_session_not_found',
        });
        throw new Error('collection_session_not_found');
      }
      if (session.closed) {
        record('chargeLateFee', false, {
          errorKind: 'collection_session_closed',
        });
        throw new Error('collection_session_closed');
      }
      if (input.planId !== session.planId) {
        record('chargeLateFee', false, { errorKind: 'plan_id_mismatch' });
        throw new Error('plan_id_mismatch');
      }
      const plan = session.planRef ?? findPlan(input.planId);
      if (!plan) {
        record('chargeLateFee', false, { errorKind: 'plan_not_found' });
        throw new Error('plan_not_found');
      }
      try {
        await chargeLateFeeSem(webhookAdapter, plan, {
          installmentIndex: input.installmentIndex,
        });
        const result: CollectionLateFeeResult = {
          sessionId: input.sessionId,
          planId: input.planId,
          installmentIndex: input.installmentIndex,
          lateFeeCents: plan.config.lateFeeCents,
          totalLateFeesCents: plan.lateFeesTotalCents,
          state: plan.state,
          latencyMs,
        };
        record('chargeLateFee', true, { detail: result });
        return result;
      } catch (err) {
        record('chargeLateFee', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async markPaid(input) {
      const session = collections.get(input.sessionId);
      if (!session) {
        record('markPaid', false, {
          errorKind: 'collection_session_not_found',
        });
        throw new Error('collection_session_not_found');
      }
      if (input.planId !== session.planId) {
        record('markPaid', false, { errorKind: 'plan_id_mismatch' });
        throw new Error('plan_id_mismatch');
      }
      const plan = session.planRef ?? findPlan(input.planId);
      if (!plan) {
        record('markPaid', false, { errorKind: 'plan_not_found' });
        throw new Error('plan_not_found');
      }
      if (plan.installmentsPaid >= plan.config.installments) {
        record('markPaid', false, { errorKind: 'plan_already_settled' });
        throw new Error('plan_already_settled');
      }
      markInstallmentPaidSem(plan);
      const result: CollectionMarkPaidResult = {
        sessionId: input.sessionId,
        planId: input.planId,
        installmentsPaid: plan.installmentsPaid,
        installmentsScheduled: plan.installmentsScheduled,
        state: plan.state,
        latencyMs,
      };
      record('markPaid', true, { detail: result });
      return result;
    },

    async settlePlan(input) {
      const session = collections.get(input.sessionId);
      if (!session) {
        record('settlePlan', false, {
          errorKind: 'collection_session_not_found',
        });
        throw new Error('collection_session_not_found');
      }
      if (input.planId !== session.planId) {
        record('settlePlan', false, { errorKind: 'plan_id_mismatch' });
        throw new Error('plan_id_mismatch');
      }
      const plan = session.planRef ?? findPlan(input.planId);
      if (!plan) {
        record('settlePlan', false, { errorKind: 'plan_not_found' });
        throw new Error('plan_not_found');
      }
      // Drive markInstallmentPaid until settled.
      while (plan.installmentsPaid < plan.config.installments) {
        markInstallmentPaidSem(plan);
      }
      const result: CollectionSettleResult = {
        sessionId: input.sessionId,
        planId: input.planId,
        installmentsPaid: plan.installmentsPaid,
        totalLateFeesCents: plan.lateFeesTotalCents,
        state: plan.state,
        latencyMs,
      };
      record('settlePlan', true, { detail: result });
      return result;
    },

    async checkCollectionStatus(input) {
      const session = collections.get(input.sessionId);
      if (!session) {
        record('checkCollectionStatus', false, {
          errorKind: 'collection_session_not_found',
        });
        throw new Error('collection_session_not_found');
      }
      if (input.planId !== session.planId) {
        record('checkCollectionStatus', false, {
          errorKind: 'plan_id_mismatch',
        });
        throw new Error('plan_id_mismatch');
      }
      const plan = session.planRef ?? findPlan(input.planId);
      if (!plan) {
        record('checkCollectionStatus', false, { errorKind: 'plan_not_found' });
        throw new Error('plan_not_found');
      }
      const installmentsRemaining = Math.max(
        0,
        plan.config.installments - plan.installmentsPaid,
      );
      const result: CollectionStatusResult = {
        sessionId: input.sessionId,
        planId: input.planId,
        installmentsPaid: plan.installmentsPaid,
        installmentsScheduled: plan.installmentsScheduled,
        installmentsRemaining,
        totalLateFeesCents: plan.lateFeesTotalCents,
        state: plan.state,
        latencyMs,
      };
      record('checkCollectionStatus', true, { detail: result });
      return result;
    },

    async closeCollection(input) {
      const session = collections.get(input.sessionId);
      if (!session) {
        record('closeCollection', false, {
          errorKind: 'collection_session_not_found',
        });
        throw new Error('collection_session_not_found');
      }
      session.closed = true;
      collections.delete(input.sessionId);
      record('closeCollection', true, {
        detail: { sessionId: input.sessionId },
      });
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
      plans.clear();
      risks.clear();
      collections.clear();
    },
  };
}
