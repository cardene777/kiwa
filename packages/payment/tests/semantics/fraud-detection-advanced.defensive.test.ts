import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  flagVelocity,
  providerEventName,
  scoreDevice,
  scoreMlBlock,
  startFraudDetection,
  verifyBiometric,
} from '../../src/index.js';

describe('Fraud detection advanced — defensive branch closure', () => {
  it('startFraudDetection stores currency when provided', () => {
    const s = startFraudDetection({
      transactionId: 't1',
      customerId: 'c',
      amountCents: 1000,
      currency: 'USD',
    });
    expect(s.currency).toBe('USD');
    expect(s.state).toBe('initial');
    expect(s.verdict).toBe('review');
  });

  it('startFraudDetection uses default config when none provided', () => {
    const s = startFraudDetection({
      transactionId: 't2',
      customerId: 'c',
      amountCents: 1000,
    });
    expect(s.config.minDeviceScore).toBe(40);
    expect(s.config.maxVelocityPerHour).toBe(5);
    expect(s.config.mlBlockThreshold).toBe(0.85);
  });

  it('startFraudDetection merges partial config with defaults', () => {
    const s = startFraudDetection({
      transactionId: 't3',
      customerId: 'c',
      amountCents: 1000,
      config: { minDeviceScore: 90 },
    });
    expect(s.config.minDeviceScore).toBe(90);
    expect(s.config.mlBlockThreshold).toBe(0.85);
  });

  it('scoreDevice throws when score below 0', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't', customerId: 'c', amountCents: 100 });
    await expect(
      scoreDevice(adapter, s, { score: -1, fingerprint: 'fp' }),
    ).rejects.toThrow(/between 0 and 100/);
  });

  it('scoreDevice throws when score above 100', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't', customerId: 'c', amountCents: 100 });
    await expect(
      scoreDevice(adapter, s, { score: 101, fingerprint: 'fp' }),
    ).rejects.toThrow(/between 0 and 100/);
  });

  it('scoreDevice passes when score >= minDeviceScore threshold', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 't_pass',
      customerId: 'c',
      amountCents: 100,
      config: { minDeviceScore: 50 },
    });
    const step = await scoreDevice(adapter, s, { score: 75, fingerprint: 'fp' });
    expect(step.metadata.passed).toBe(true);
    expect(step.metadata.score).toBe(75);
  });

  it('scoreDevice fails when score below minDeviceScore', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 't_fail',
      customerId: 'c',
      amountCents: 100,
      config: { minDeviceScore: 50 },
    });
    const step = await scoreDevice(adapter, s, { score: 20, fingerprint: 'fp' });
    expect(step.metadata.passed).toBe(false);
  });

  it('scoreDevice records ipAddress when supplied', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't_ip', customerId: 'c', amountCents: 100 });
    const step = await scoreDevice(adapter, s, {
      score: 50,
      fingerprint: 'fp',
      ipAddress: '203.0.113.5',
    });
    expect(step.metadata.ipAddress).toBe('203.0.113.5');
  });

  it('scoreDevice records empty ipAddress when omitted', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't_noip', customerId: 'c', amountCents: 100 });
    const step = await scoreDevice(adapter, s, { score: 50, fingerprint: 'fp' });
    expect(step.metadata.ipAddress).toBe('');
  });

  it('verifyBiometric throws when confidence below 0', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't', customerId: 'c', amountCents: 100 });
    await expect(
      verifyBiometric(adapter, s, { passed: true, confidence: -0.1, signals: [] }),
    ).rejects.toThrow(/between 0 and 1/);
  });

  it('verifyBiometric throws when confidence above 1', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't', customerId: 'c', amountCents: 100 });
    await expect(
      verifyBiometric(adapter, s, { passed: true, confidence: 1.5, signals: [] }),
    ).rejects.toThrow(/between 0 and 1/);
  });

  it('verifyBiometric passed:true records passed', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't', customerId: 'c', amountCents: 100 });
    const step = await verifyBiometric(adapter, s, {
      passed: true,
      confidence: 0.9,
      signals: ['typing', 'mouse'],
    });
    expect(step.metadata.passed).toBe(true);
    expect(step.metadata.signalCount).toBe(2);
    expect(s.biometricPassed).toBe(true);
  });

  it('verifyBiometric passed:false records failed', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't', customerId: 'c', amountCents: 100 });
    const step = await verifyBiometric(adapter, s, {
      passed: false,
      confidence: 0.1,
      signals: [],
    });
    expect(step.metadata.passed).toBe(false);
    expect(s.biometricPassed).toBe(false);
  });

  it('flagVelocity throws when attemptsInWindow negative', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't', customerId: 'c', amountCents: 100 });
    await expect(
      flagVelocity(adapter, s, { attemptsInWindow: -1, windowMs: 3600_000 }),
    ).rejects.toThrow(/non-negative/);
  });

  it('flagVelocity below threshold does not set velocity-flagged state', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 't_under',
      customerId: 'c',
      amountCents: 100,
      config: { maxVelocityPerHour: 5 },
    });
    const step = await flagVelocity(adapter, s, { attemptsInWindow: 3, windowMs: 3600_000 });
    expect(step.metadata.overLimit).toBe(false);
    expect(s.state).not.toBe('velocity-flagged');
  });

  it('flagVelocity above threshold sets velocity-flagged state', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 't_over',
      customerId: 'c',
      amountCents: 100,
      config: { maxVelocityPerHour: 5 },
    });
    const step = await flagVelocity(adapter, s, { attemptsInWindow: 10, windowMs: 3600_000 });
    expect(step.metadata.overLimit).toBe(true);
    expect(s.state).toBe('velocity-flagged');
  });

  it('scoreMlBlock throws when score below 0', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't', customerId: 'c', amountCents: 100 });
    await expect(
      scoreMlBlock(adapter, s, { score: -0.1, modelVersion: 'v1', features: {} }),
    ).rejects.toThrow(/between 0 and 1/);
  });

  it('scoreMlBlock throws when score above 1', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't', customerId: 'c', amountCents: 100 });
    await expect(
      scoreMlBlock(adapter, s, { score: 1.1, modelVersion: 'v1', features: {} }),
    ).rejects.toThrow(/between 0 and 1/);
  });

  it('scoreMlBlock at threshold blocks (verdict block)', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 't_block',
      customerId: 'c',
      amountCents: 100,
      config: { mlBlockThreshold: 0.5 },
    });
    const step = await scoreMlBlock(adapter, s, {
      score: 0.5,
      modelVersion: 'v1',
      features: { a: 1 },
    });
    expect(s.verdict).toBe('block');
    expect(s.state).toBe('ml-blocked');
    expect(step.metadata.verdict).toBe('block');
  });

  it('scoreMlBlock well below half-threshold accepts (verdict accept)', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 't_accept',
      customerId: 'c',
      amountCents: 100,
      config: { mlBlockThreshold: 0.8 },
    });
    const step = await scoreMlBlock(adapter, s, {
      score: 0.1,
      modelVersion: 'v1',
      features: { a: 1 },
    });
    expect(s.verdict).toBe('accept');
    expect(s.state).toBe('accepted');
    expect(step.metadata.verdict).toBe('accept');
  });

  it('scoreMlBlock between half-threshold and threshold triggers review', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({
      transactionId: 't_review',
      customerId: 'c',
      amountCents: 100,
      config: { mlBlockThreshold: 0.8 },
    });
    const step = await scoreMlBlock(adapter, s, {
      score: 0.6,
      modelVersion: 'v1',
      features: { a: 1 },
    });
    expect(s.verdict).toBe('review');
    expect(s.state).toBe('reviewing');
    expect(step.metadata.verdict).toBe('review');
  });

  it('scoreDevice propagates currency to signed webhook', async () => {
    const adapter = createStripeMock();
    const received: Array<{ type: string; currency?: string }> = [];
    adapter.onWebhook((e) => { received.push({ type: e.type, currency: e.currency }); });
    const s = startFraudDetection({
      transactionId: 't_cur',
      customerId: 'c',
      amountCents: 100,
      currency: 'GBP',
    });
    await scoreDevice(adapter, s, { score: 50, fingerprint: 'fp' });
    const scoredEvent = received.find(
      (r) => r.type === providerEventName(adapter.provider, 'fraud.device_scored'),
    );
    expect(scoredEvent?.currency).toBe('GBP');
  });

  it('scoreMlBlock feature count reflects features record size', async () => {
    const adapter = createStripeMock();
    const s = startFraudDetection({ transactionId: 't_feat', customerId: 'c', amountCents: 100 });
    const step = await scoreMlBlock(adapter, s, {
      score: 0.9,
      modelVersion: 'v2.1',
      features: { a: 1, b: 2, c: 3 },
    });
    expect(step.metadata.featureCount).toBe(3);
    expect(step.metadata.modelVersion).toBe('v2.1');
  });
});
