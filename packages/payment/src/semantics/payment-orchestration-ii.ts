import type { PaymentAdapter, PaymentProvider } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Payment orchestration II axis — smart routing (BIN-based / cost-optimised) +
 * ML-driven route decisioning + fallback ladder + retry cascade with
 * exhaustion. Extends the v0.4 `orchestration` axis with an ML scoring
 * signal, an explicit fallback ladder (as opposed to a simple linear
 * cascade), and a terminal `cascade-exhausted` state.
 */
export type OrchestrationIIState =
  | 'initial'
  | 'smart-routed'
  | 'ml-scored'
  | 'fallback-triggered'
  | 'cascade-exhausted'
  | 'terminated';

export interface OrchestrationIIConfig {
  /** ordered list of providers in fallback priority */
  providers: PaymentProvider[];
  /** whether ML scoring is used to pick the primary route */
  mlScoringEnabled?: boolean;
  /** minimum ML score (0-1) to accept a routing decision */
  minMlScore?: number;
  /** max attempts across the whole cascade */
  maxAttempts?: number;
}

export interface OrchestrationIISession {
  intentId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  config: Required<OrchestrationIIConfig>;
  currentIndex: number;
  attemptCount: number;
  mlScore: number | null;
  state: OrchestrationIIState;
  history: AxisStep<OrchestrationIIState>[];
}

const ORCH2_DEFAULTS: Omit<Required<OrchestrationIIConfig>, 'providers'> = {
  mlScoringEnabled: true,
  minMlScore: 0.5,
  maxAttempts: 5,
};

/**
 * Start an orchestration II session.
 */
export function startOrchestrationII(input: {
  intentId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  config: OrchestrationIIConfig;
}): OrchestrationIISession {
  const config: Required<OrchestrationIIConfig> = {
    ...ORCH2_DEFAULTS,
    ...input.config,
  };
  if (config.providers.length === 0) {
    throw new Error('startOrchestrationII: providers must not be empty');
  }
  const session: OrchestrationIISession = {
    intentId: input.intentId,
    amountCents: input.amountCents,
    customerId: input.customerId,
    config,
    currentIndex: 0,
    attemptCount: 0,
    mlScore: null,
    state: 'initial',
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  return session;
}

/**
 * Route the charge through the current provider — the primary route in
 * the cascade ladder.
 */
export async function smartRoute(
  adapters: PaymentAdapter[],
  session: OrchestrationIISession,
): Promise<AxisStep<OrchestrationIIState>> {
  if (session.state === 'cascade-exhausted' || session.state === 'terminated') {
    throw new Error(`smartRoute: session is ${session.state}`);
  }
  const providerName = session.config.providers[session.currentIndex];
  if (providerName === undefined) {
    throw new Error('smartRoute: currentIndex out of range');
  }
  const adapter = adapters.find((a) => a.provider === providerName);
  if (!adapter) {
    throw new Error(`smartRoute: no adapter for ${providerName}`);
  }
  session.attemptCount += 1;
  session.state = 'smart-routed';
  return emit(adapter, session, 'po2.smart_routed', {
    provider: providerName,
    attemptCount: session.attemptCount,
  });
}

/**
 * Run ML scoring on the current route. Score below `minMlScore` triggers
 * fallback on the next `smartRoute` call.
 */
export async function scoreMl(
  adapters: PaymentAdapter[],
  session: OrchestrationIISession,
  input: { score: number; features: Record<string, string | number> },
): Promise<AxisStep<OrchestrationIIState>> {
  if (!session.config.mlScoringEnabled) {
    throw new Error('scoreMl: ML scoring disabled in config');
  }
  if (input.score < 0 || input.score > 1) {
    throw new Error('scoreMl: score must be between 0 and 1');
  }
  session.mlScore = input.score;
  session.state = 'ml-scored';
  const providerName = session.config.providers[session.currentIndex];
  const adapter = adapters.find((a) => a.provider === providerName);
  if (!adapter) {
    throw new Error(`scoreMl: no adapter for ${providerName}`);
  }
  return emit(adapter, session, 'po2.ml_scored', {
    score: input.score,
    passed: input.score >= session.config.minMlScore,
    featureCount: Object.keys(input.features).length,
  });
}

/**
 * Trigger a fallback to the next provider in the ladder. Increments the
 * current index; exhausts the cascade when no more providers remain.
 */
export async function triggerFallback(
  adapters: PaymentAdapter[],
  session: OrchestrationIISession,
): Promise<AxisStep<OrchestrationIIState>> {
  if (session.state === 'cascade-exhausted') {
    throw new Error('triggerFallback: cascade already exhausted');
  }
  session.currentIndex += 1;
  session.attemptCount += 1;
  if (
    session.currentIndex >= session.config.providers.length ||
    session.attemptCount >= session.config.maxAttempts
  ) {
    session.state = 'cascade-exhausted';
    const lastProvider =
      session.config.providers[Math.min(session.currentIndex - 1, session.config.providers.length - 1)];
    const lastAdapter = adapters.find((a) => a.provider === lastProvider);
    if (!lastAdapter) {
      throw new Error(`triggerFallback: no adapter for ${lastProvider}`);
    }
    return emit(lastAdapter, session, 'po2.cascade_exhausted', {
      attemptCount: session.attemptCount,
      providersTried: session.currentIndex,
    });
  }
  session.state = 'fallback-triggered';
  const providerName = session.config.providers[session.currentIndex];
  if (providerName === undefined) {
    throw new Error('triggerFallback: currentIndex out of range');
  }
  const adapter = adapters.find((a) => a.provider === providerName);
  if (!adapter) {
    throw new Error(`triggerFallback: no adapter for ${providerName}`);
  }
  return emit(adapter, session, 'po2.fallback_triggered', {
    fromProviderIndex: session.currentIndex - 1,
    toProvider: providerName,
    attemptCount: session.attemptCount,
  });
}

async function emit(
  adapter: PaymentAdapter,
  session: OrchestrationIISession,
  neutral:
    | 'po2.smart_routed'
    | 'po2.ml_scored'
    | 'po2.fallback_triggered'
    | 'po2.cascade_exhausted',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<OrchestrationIIState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<OrchestrationIIState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: session.amountCents,
    metadata: {
      intentId: session.intentId,
      currentIndex: session.currentIndex,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
