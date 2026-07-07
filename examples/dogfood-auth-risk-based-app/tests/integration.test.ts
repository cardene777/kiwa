import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

const HIGH = {
  deviceScore: 20,
  ipReputation: 20,
  geoAnomaly: 20,
  velocityScore: 15,
  behavioralScore: 15,
};

describe('integration — risk-based cross-axis scenarios', () => {
  it.each(platforms)('%s: high score → block + telemetry → abuse detected', async (platform) => {
    const adapter = makeMockAdapter();
    const risk = await adapter.startRiskFlow({ platform, userId: 'u-1' });
    await adapter.evaluateScoreOp(risk, HIGH);
    const block = await adapter.applyPolicyOp(risk);
    expect(block.metadata.blocked).toBe(true);
    const tel = await adapter.startTelemetryFlow({ platform, userId: 'u-1', endpointId: '/login' });
    await adapter.recordAttemptOp(tel, { success: false, latencyMs: 100 });
    await adapter.recordAttemptOp(tel, { success: false, latencyMs: 200 });
    const abuse = await adapter.detectAbuseOp(tel, {
      failureRateThreshold: 0.5,
      ipAddress: '1.2.3.4',
    });
    expect(abuse.metadata.isAbuse).toBe(true);
  });

  it('concurrent + geo anomaly signal chain works', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConcurrentWatch({
      platform: 'chromium',
      userId: 'u-1',
      baselineRegion: 'JP',
    });
    await adapter.reportGeoAnomalyOp(s, { observedRegion: 'US', km: 10_000, withinMinutes: 5 });
    const concurrent = await adapter.reportConcurrentOp(s, { concurrentSessionCount: 4 });
    expect(concurrent.metadata.concurrentSessionCount).toBe(4);
  });

  it('score is capped at 100', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRiskFlow({ platform: 'chromium', userId: 'u' });
    const step = await adapter.evaluateScoreOp(s, {
      deviceScore: 50,
      ipReputation: 50,
      geoAnomaly: 50,
      velocityScore: 50,
      behavioralScore: 50,
    });
    expect(step.metadata.score).toBe(100);
  });

  it('multiple attempts affect success rate', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startTelemetryFlow({
      platform: 'chromium',
      userId: 'u',
      endpointId: '/x',
    });
    for (let i = 0; i < 10; i++) {
      await adapter.recordAttemptOp(s, { success: i % 2 === 0, latencyMs: 100 });
    }
    const abuse = await adapter.detectAbuseOp(s, {
      failureRateThreshold: 0.6,
      ipAddress: '1.2.3.4',
    });
    expect(abuse.metadata.isAbuse).toBe(false);
  });

  it('concurrent sessions across axes are independent', async () => {
    const adapter = makeMockAdapter();
    const risk = await adapter.startRiskFlow({ platform: 'chromium', userId: 'u-A' });
    const tel = await adapter.startTelemetryFlow({
      platform: 'webkit',
      userId: 'u-B',
      endpointId: '/x',
    });
    const hj = await adapter.startConcurrentWatch({
      platform: 'firefox',
      userId: 'u-C',
      baselineRegion: 'DE',
    });
    expect(risk.sessionId).not.toBe(tel.sessionId);
    expect(tel.sessionId).not.toBe(hj.sessionId);
  });

  it('mid-score signals result in evaluated state', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRiskFlow({ platform: 'chromium', userId: 'u' });
    const step = await adapter.evaluateScoreOp(s, {
      deviceScore: 10,
      ipReputation: 10,
      geoAnomaly: 10,
      velocityScore: 10,
      behavioralScore: 10,
    });
    expect(step.metadata.score).toBe(50);
  });

  it('close cycle on all axes is clean', async () => {
    const adapter = makeMockAdapter();
    const risk = await adapter.startRiskFlow({ platform: 'chromium', userId: 'u' });
    await adapter.closeRisk(risk);
    const tel = await adapter.startTelemetryFlow({
      platform: 'chromium',
      userId: 'u',
      endpointId: '/x',
    });
    await adapter.closeTelemetry(tel);
    const hj = await adapter.startConcurrentWatch({
      platform: 'chromium',
      userId: 'u',
      baselineRegion: 'JP',
    });
    await adapter.closeConcurrentWatch(hj);
    // All closes succeed without error
  });
});
