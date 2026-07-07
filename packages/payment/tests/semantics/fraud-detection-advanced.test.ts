import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  flagVelocity,
  type PaymentAdapter,
  scoreDevice,
  scoreMlBlock,
  startFraudDetection,
  verifyBiometric,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('fraud-detection-advanced axis — device + biometric + velocity + ML', () => {
  it('startFraudDetection loads defaults', () => {
    const s = startFraudDetection({
      transactionId: 'tx_1',
      customerId: 'cus_1',
      amountCents: 100,
    });
    expect(s.config.minDeviceScore).toBe(40);
    expect(s.config.maxVelocityPerHour).toBe(5);
    expect(s.config.mlBlockThreshold).toBe(0.85);
    expect(s.state).toBe('initial');
    expect(s.verdict).toBe('review');
  });

  it.each(providers)('$name: scoreDevice records score', async ({ make }) => {
    const adapter = make();
    const s = startFraudDetection({
      transactionId: 'tx_2',
      customerId: 'cus_2',
      amountCents: 200,
    });
    const step = await scoreDevice(adapter, s, {
      score: 80,
      fingerprint: 'fp_abc',
      ipAddress: '192.0.2.1',
      userAgent: 'chrome',
    });
    expect(step.neutralEvent).toBe('fraud.device_scored');
    expect(step.metadata.passed).toBe(true);
    expect(step.metadata.fingerprint).toBe('fp_abc');
    expect(s.deviceScore).toBe(80);
    expect(s.state).toBe('device-scored');
  });

  it('scoreDevice fails below threshold', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_3',
      customerId: 'cus',
      amountCents: 100,
    });
    const step = await scoreDevice(adapter, s, {
      score: 20,
      fingerprint: 'fp_low',
    });
    expect(step.metadata.passed).toBe(false);
  });

  it('scoreDevice rejects out-of-range score', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_4',
      customerId: 'cus',
      amountCents: 100,
    });
    await expect(
      scoreDevice(adapter, s, { score: -1, fingerprint: 'x' }),
    ).rejects.toThrow(/between 0 and 100/);
    await expect(
      scoreDevice(adapter, s, { score: 101, fingerprint: 'x' }),
    ).rejects.toThrow(/between 0 and 100/);
  });

  it('scoreDevice ipAddress defaults to empty', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_ip',
      customerId: 'cus',
      amountCents: 100,
    });
    const step = await scoreDevice(adapter, s, {
      score: 60,
      fingerprint: 'f',
    });
    expect(step.metadata.ipAddress).toBe('');
  });

  it.each(providers)('$name: verifyBiometric emits biometric_verified', async ({ make }) => {
    const adapter = make();
    const s = startFraudDetection({
      transactionId: 'tx_b',
      customerId: 'cus',
      amountCents: 100,
    });
    const step = await verifyBiometric(adapter, s, {
      passed: true,
      confidence: 0.95,
      signals: ['typing-rhythm', 'mouse-motion'],
    });
    expect(step.neutralEvent).toBe('fraud.biometric_verified');
    expect(step.metadata.passed).toBe(true);
    expect(step.metadata.confidence).toBe(0.95);
    expect(step.metadata.signalCount).toBe(2);
    expect(s.biometricPassed).toBe(true);
    expect(s.state).toBe('biometric-verified');
  });

  it('verifyBiometric rejects confidence outside 0-1', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_c',
      customerId: 'cus',
      amountCents: 100,
    });
    await expect(
      verifyBiometric(adapter, s, { passed: false, confidence: -0.1, signals: [] }),
    ).rejects.toThrow(/between 0 and 1/);
    await expect(
      verifyBiometric(adapter, s, { passed: true, confidence: 1.5, signals: [] }),
    ).rejects.toThrow(/between 0 and 1/);
  });

  it.each(providers)('$name: flagVelocity records overLimit', async ({ make }) => {
    const adapter = make();
    const s = startFraudDetection({
      transactionId: 'tx_v',
      customerId: 'cus',
      amountCents: 100,
    });
    const step = await flagVelocity(adapter, s, {
      attemptsInWindow: 10,
      windowMs: 3_600_000,
    });
    expect(step.neutralEvent).toBe('fraud.velocity_flagged');
    expect(step.metadata.overLimit).toBe(true);
    expect(s.state).toBe('velocity-flagged');
    expect(s.velocityCount).toBe(10);
  });

  it('flagVelocity below threshold does not change state', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_v2',
      customerId: 'cus',
      amountCents: 100,
    });
    const step = await flagVelocity(adapter, s, {
      attemptsInWindow: 2,
      windowMs: 3_600_000,
    });
    expect(step.metadata.overLimit).toBe(false);
    expect(s.state).toBe('initial');
  });

  it('flagVelocity rejects negative attempts', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_v3',
      customerId: 'cus',
      amountCents: 100,
    });
    await expect(
      flagVelocity(adapter, s, { attemptsInWindow: -1, windowMs: 1000 }),
    ).rejects.toThrow(/non-negative/);
  });

  it.each(providers)('$name: scoreMlBlock blocks above threshold', async ({ make }) => {
    const adapter = make();
    const s = startFraudDetection({
      transactionId: 'tx_ml',
      customerId: 'cus',
      amountCents: 100,
    });
    const step = await scoreMlBlock(adapter, s, {
      score: 0.9,
      modelVersion: 'v1',
      features: { d: 1 },
    });
    expect(step.neutralEvent).toBe('fraud.ml_blocked');
    expect(step.metadata.verdict).toBe('block');
    expect(s.verdict).toBe('block');
    expect(s.state).toBe('ml-blocked');
  });

  it('scoreMlBlock accepts below half of threshold', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_ml2',
      customerId: 'cus',
      amountCents: 100,
    });
    const step = await scoreMlBlock(adapter, s, {
      score: 0.1,
      modelVersion: 'v1',
      features: {},
    });
    expect(step.metadata.verdict).toBe('accept');
    expect(s.verdict).toBe('accept');
    expect(s.state).toBe('accepted');
  });

  it('scoreMlBlock reviews in middle band', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_ml3',
      customerId: 'cus',
      amountCents: 100,
    });
    const step = await scoreMlBlock(adapter, s, {
      score: 0.6,
      modelVersion: 'v1',
      features: {},
    });
    expect(step.metadata.verdict).toBe('review');
    expect(s.verdict).toBe('review');
    expect(s.state).toBe('reviewing');
  });

  it('scoreMlBlock respects custom threshold', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_mlt',
      customerId: 'cus',
      amountCents: 100,
      config: { mlBlockThreshold: 0.5 },
    });
    const step = await scoreMlBlock(adapter, s, {
      score: 0.6,
      modelVersion: 'custom',
      features: {},
    });
    expect(step.metadata.verdict).toBe('block');
  });

  it('scoreMlBlock rejects score outside 0-1', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_mlb',
      customerId: 'cus',
      amountCents: 100,
    });
    await expect(
      scoreMlBlock(adapter, s, { score: -0.1, modelVersion: 'v', features: {} }),
    ).rejects.toThrow(/between 0 and 1/);
    await expect(
      scoreMlBlock(adapter, s, { score: 1.1, modelVersion: 'v', features: {} }),
    ).rejects.toThrow(/between 0 and 1/);
  });

  it('scoreMlBlock featureCount reflects passed features', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_fc',
      customerId: 'cus',
      amountCents: 100,
    });
    const step = await scoreMlBlock(adapter, s, {
      score: 0.5,
      modelVersion: 'v1',
      features: { a: 1, b: 2, c: 3 },
    });
    expect(step.metadata.featureCount).toBe(3);
  });

  it('history captures full fraud pipeline', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 'tx_hist',
      customerId: 'cus_hist',
      amountCents: 100,
    });
    await scoreDevice(adapter, s, { score: 60, fingerprint: 'f' });
    await verifyBiometric(adapter, s, { passed: true, confidence: 0.9, signals: ['a'] });
    await flagVelocity(adapter, s, { attemptsInWindow: 3, windowMs: 3600000 });
    await scoreMlBlock(adapter, s, { score: 0.4, modelVersion: 'v', features: {} });
    expect(s.history).toHaveLength(4);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'fraud.device_scored',
      'fraud.biometric_verified',
      'fraud.velocity_flagged',
      'fraud.ml_blocked',
    ]);
  });
});
