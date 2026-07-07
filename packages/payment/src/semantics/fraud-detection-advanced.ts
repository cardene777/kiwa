import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Fraud detection advanced axis — device fingerprint scoring + behavioral
 * biometrics verification + velocity checking + ML-driven block decision.
 * Real fraud engines (Stripe Radar / Sift / Signifyd) combine 4 signals
 * to score a transaction: device fingerprint (browser + OS + IP entropy),
 * behavioral biometrics (typing rhythm + mouse motion), velocity (attempts
 * per unit time), and an ML model that fuses everything into a final
 * accept / review / block verdict.
 */
export type FraudDetectionState =
  | 'initial'
  | 'device-scored'
  | 'biometric-verified'
  | 'velocity-flagged'
  | 'ml-blocked'
  | 'accepted'
  | 'reviewing';

export type FraudVerdict = 'accept' | 'review' | 'block';

export interface FraudDetectionConfig {
  /** device score threshold (0-100) below which the transaction is flagged */
  minDeviceScore?: number;
  /** max attempts per hour per customer before velocity flag fires */
  maxVelocityPerHour?: number;
  /** ML score threshold above which the transaction is blocked */
  mlBlockThreshold?: number;
}

export interface FraudDetectionSession {
  transactionId: string;
  customerId: string;
  amountCents: number;
  currency?: string;
  config: Required<FraudDetectionConfig>;
  deviceScore: number | null;
  biometricPassed: boolean | null;
  velocityCount: number;
  mlScore: number | null;
  verdict: FraudVerdict;
  state: FraudDetectionState;
  history: AxisStep<FraudDetectionState>[];
}

const FRAUD_DEFAULTS: Required<FraudDetectionConfig> = {
  minDeviceScore: 40,
  maxVelocityPerHour: 5,
  mlBlockThreshold: 0.85,
};

/**
 * Start a fresh fraud detection session for a transaction.
 */
export function startFraudDetection(input: {
  transactionId: string;
  customerId: string;
  amountCents: number;
  currency?: string;
  config?: FraudDetectionConfig;
}): FraudDetectionSession {
  const config: Required<FraudDetectionConfig> = {
    ...FRAUD_DEFAULTS,
    ...(input.config ?? {}),
  };
  const session: FraudDetectionSession = {
    transactionId: input.transactionId,
    customerId: input.customerId,
    amountCents: input.amountCents,
    config,
    deviceScore: null,
    biometricPassed: null,
    velocityCount: 0,
    mlScore: null,
    verdict: 'review',
    state: 'initial',
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  return session;
}

/**
 * Score device fingerprint — combines browser fingerprint, IP entropy, OS
 * signature, canvas fingerprint into a 0-100 score.
 */
export async function scoreDevice(
  adapter: PaymentAdapter,
  session: FraudDetectionSession,
  input: {
    score: number;
    fingerprint: string;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<AxisStep<FraudDetectionState>> {
  if (input.score < 0 || input.score > 100) {
    throw new Error('scoreDevice: score must be between 0 and 100');
  }
  session.deviceScore = input.score;
  session.state = 'device-scored';
  return emit(adapter, session, 'fraud.device_scored', {
    score: input.score,
    passed: input.score >= session.config.minDeviceScore,
    fingerprint: input.fingerprint,
    ipAddress: input.ipAddress ?? '',
  });
}

/**
 * Verify behavioral biometrics — typing rhythm + mouse motion + swipe
 * pattern. Returns whether the observed pattern matches the historical
 * profile.
 */
export async function verifyBiometric(
  adapter: PaymentAdapter,
  session: FraudDetectionSession,
  input: { passed: boolean; confidence: number; signals: string[] },
): Promise<AxisStep<FraudDetectionState>> {
  if (input.confidence < 0 || input.confidence > 1) {
    throw new Error('verifyBiometric: confidence must be between 0 and 1');
  }
  session.biometricPassed = input.passed;
  session.state = 'biometric-verified';
  return emit(adapter, session, 'fraud.biometric_verified', {
    passed: input.passed,
    confidence: input.confidence,
    signalCount: input.signals.length,
  });
}

/**
 * Flag velocity — records that this customer exceeded the allowed
 * transactions-per-hour threshold.
 */
export async function flagVelocity(
  adapter: PaymentAdapter,
  session: FraudDetectionSession,
  input: { attemptsInWindow: number; windowMs: number },
): Promise<AxisStep<FraudDetectionState>> {
  if (input.attemptsInWindow < 0) {
    throw new Error('flagVelocity: attemptsInWindow must be non-negative');
  }
  session.velocityCount = input.attemptsInWindow;
  const overLimit = input.attemptsInWindow > session.config.maxVelocityPerHour;
  if (overLimit) {
    session.state = 'velocity-flagged';
  }
  return emit(adapter, session, 'fraud.velocity_flagged', {
    attemptsInWindow: input.attemptsInWindow,
    windowMs: input.windowMs,
    overLimit,
  });
}

/**
 * Run the ML fusion model — combines device / biometric / velocity signals
 * plus features into a 0-1 score. Above `mlBlockThreshold` blocks the tx.
 */
export async function scoreMlBlock(
  adapter: PaymentAdapter,
  session: FraudDetectionSession,
  input: { score: number; modelVersion: string; features: Record<string, number> },
): Promise<AxisStep<FraudDetectionState>> {
  if (input.score < 0 || input.score > 1) {
    throw new Error('scoreMlBlock: score must be between 0 and 1');
  }
  session.mlScore = input.score;
  if (input.score >= session.config.mlBlockThreshold) {
    session.verdict = 'block';
    session.state = 'ml-blocked';
  } else if (input.score < session.config.mlBlockThreshold / 2) {
    session.verdict = 'accept';
    session.state = 'accepted';
  } else {
    session.verdict = 'review';
    session.state = 'reviewing';
  }
  return emit(adapter, session, 'fraud.ml_blocked', {
    score: input.score,
    verdict: session.verdict,
    modelVersion: input.modelVersion,
    featureCount: Object.keys(input.features).length,
  });
}

async function emit(
  adapter: PaymentAdapter,
  session: FraudDetectionSession,
  neutral:
    | 'fraud.device_scored'
    | 'fraud.biometric_verified'
    | 'fraud.velocity_flagged'
    | 'fraud.ml_blocked',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<FraudDetectionState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<FraudDetectionState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: session.amountCents,
    metadata: {
      transactionId: session.transactionId,
      customerId: session.customerId,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
