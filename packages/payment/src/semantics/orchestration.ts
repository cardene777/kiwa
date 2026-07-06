import type { PaymentAdapter, PaymentProvider } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Orchestration axis — multi-provider routing + failover + retry ladder +
 * circuit breaker. Real merchants split traffic across 2-3 providers to
 * hedge against outages and to fine-tune per-BIN authorisation rates.
 * The mock reproduces the observable envelope: a router that picks the
 * primary provider, retries on failure, fails over to a secondary, and
 * opens a circuit after a configurable failure threshold.
 */
export type OrchestrationState =
  | 'routing'
  | 'failed-over'
  | 'circuit-open'
  | 'circuit-closed'
  | 'terminated';

export interface OrchestrationConfig {
  /** ordered provider list — index 0 = primary, rest = failover cascade */
  providers: PaymentProvider[];
  /** consecutive failures that open the breaker */
  circuitBreakerThreshold?: number;
  /** ms the breaker stays open before we probe again */
  circuitOpenDurationMs?: number;
  /** retry attempts against the current provider before failover */
  maxRetriesPerProvider?: number;
}

export interface OrchestrationSession {
  intentId: string;
  amountCents: number;
  currency?: string;
  config: Required<OrchestrationConfig>;
  currentProviderIndex: number;
  currentProviderFailures: number;
  totalFailures: number;
  state: OrchestrationState;
  history: AxisStep<OrchestrationState>[];
  circuitOpenedAt: number | null;
}

const ORCHESTRATION_DEFAULTS: Omit<Required<OrchestrationConfig>, 'providers'> = {
  circuitBreakerThreshold: 5,
  circuitOpenDurationMs: 30_000,
  maxRetriesPerProvider: 2,
};

/**
 * Start an orchestration session. `adapters` supplies one adapter per
 * provider in the same order as `config.providers`.
 */
export function startOrchestration(input: {
  intentId: string;
  amountCents: number;
  currency?: string;
  config: OrchestrationConfig;
}): OrchestrationSession {
  const config: Required<OrchestrationConfig> = {
    ...ORCHESTRATION_DEFAULTS,
    ...input.config,
  };
  if (config.providers.length === 0) {
    throw new Error('startOrchestration: providers must not be empty');
  }
  const session: OrchestrationSession = {
    intentId: input.intentId,
    amountCents: input.amountCents,
    config,
    currentProviderIndex: 0,
    currentProviderFailures: 0,
    totalFailures: 0,
    state: 'routing',
    history: [],
    circuitOpenedAt: null,
  };
  if (input.currency !== undefined) session.currency = input.currency;
  return session;
}

/**
 * Route a single charge attempt through the current provider adapter.
 * `succeed=true` emits `orchestration.routed` and leaves the router on
 * the same provider. `succeed=false` increments the failure counter and
 * either triggers a failover, opens the breaker, or terminates.
 */
export async function routeCharge(
  adapters: PaymentAdapter[],
  session: OrchestrationSession,
  input: { succeed: boolean; customerId: string },
): Promise<AxisStep<OrchestrationState>> {
  if (session.state === 'terminated') {
    throw new Error('routeCharge: session already terminated');
  }
  if (session.state === 'circuit-open') {
    throw new Error('routeCharge: circuit is open, call probeCircuit first');
  }
  const provider = session.config.providers[session.currentProviderIndex];
  const adapter = adapters.find((a) => a.provider === provider);
  if (!adapter) {
    throw new Error(`routeCharge: no adapter registered for ${provider}`);
  }
  if (input.succeed) {
    return emit(adapter, session, 'orchestration.routed', input.customerId);
  }
  session.currentProviderFailures += 1;
  session.totalFailures += 1;
  const overRetryLimit =
    session.currentProviderFailures >= session.config.maxRetriesPerProvider;
  const hasNextProvider =
    session.currentProviderIndex + 1 < session.config.providers.length;
  const overBreakerLimit = session.totalFailures >= session.config.circuitBreakerThreshold;
  if (overBreakerLimit) {
    session.state = 'circuit-open';
    session.circuitOpenedAt = Date.now();
    return emit(adapter, session, 'orchestration.circuit_opened', input.customerId);
  }
  if (overRetryLimit && hasNextProvider) {
    session.currentProviderIndex += 1;
    session.currentProviderFailures = 0;
    session.state = 'failed-over';
    const failoverAdapter = adapters.find(
      (a) => a.provider === session.config.providers[session.currentProviderIndex],
    );
    if (!failoverAdapter) {
      throw new Error(
        `routeCharge: no adapter for failover ${session.config.providers[session.currentProviderIndex]}`,
      );
    }
    return emit(failoverAdapter, session, 'orchestration.failed_over', input.customerId);
  }
  // Stay on current provider, session still routing.
  session.state = 'routing';
  return emit(adapter, session, 'orchestration.routed', input.customerId);
}

/**
 * Probe the circuit breaker — closes the breaker if the outage window has
 * elapsed, otherwise stays open. Emits `orchestration.circuit_closed` when
 * the breaker closes.
 */
export async function probeCircuit(
  adapters: PaymentAdapter[],
  session: OrchestrationSession,
): Promise<AxisStep<OrchestrationState>> {
  if (session.state !== 'circuit-open') {
    throw new Error(`probeCircuit: session is ${session.state}, not circuit-open`);
  }
  const openedAt = session.circuitOpenedAt ?? 0;
  const elapsed = Date.now() - openedAt;
  const currentProvider = session.config.providers[session.currentProviderIndex];
  if (currentProvider === undefined) {
    throw new Error('probeCircuit: currentProviderIndex out of range');
  }
  if (elapsed < session.config.circuitOpenDurationMs) {
    // Still open — return synthetic step without emit.
    return {
      neutralEvent: 'orchestration.circuit_opened',
      providerEvent: providerEventName(currentProvider, 'orchestration.circuit_opened'),
      state: session.state,
      amountCents: session.amountCents,
      metadata: {
        intentId: session.intentId,
        elapsedMs: elapsed,
        remainingMs: session.config.circuitOpenDurationMs - elapsed,
      },
    };
  }
  const provider = session.config.providers[session.currentProviderIndex];
  const adapter = adapters.find((a) => a.provider === provider);
  if (!adapter) {
    throw new Error(`probeCircuit: no adapter for ${provider}`);
  }
  session.state = 'circuit-closed';
  session.currentProviderFailures = 0;
  return emit(adapter, session, 'orchestration.circuit_closed', 'system');
}

async function emit(
  adapter: PaymentAdapter,
  session: OrchestrationSession,
  neutral:
    | 'orchestration.routed'
    | 'orchestration.failed_over'
    | 'orchestration.circuit_opened'
    | 'orchestration.circuit_closed',
  customerId: string,
): Promise<AxisStep<OrchestrationState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<OrchestrationState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: session.amountCents,
    metadata: {
      intentId: session.intentId,
      provider: adapter.provider,
      providerIndex: session.currentProviderIndex,
      totalFailures: session.totalFailures,
    },
  };
  session.history.push(step);
  return step;
}
