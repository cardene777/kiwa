import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('telemetry axis — mock adapter', () => {
  it.each(platforms)('%s: recordAttemptOp emits attempt event', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startTelemetryFlow({
      platform,
      userId: 'u-1',
      endpointId: '/login',
    });
    const step = await adapter.recordAttemptOp(s, { success: true, latencyMs: 100 });
    expect(step.metadata.neutralEvent).toBe('telemetry.attempt-recorded');
  });

  it('detectAbuseOp flags high failure rate', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startTelemetryFlow({
      platform: 'chromium',
      userId: 'u-1',
      endpointId: '/login',
    });
    await adapter.recordAttemptOp(s, { success: false, latencyMs: 100 });
    await adapter.recordAttemptOp(s, { success: false, latencyMs: 100 });
    const step = await adapter.detectAbuseOp(s, { failureRateThreshold: 0.5, ipAddress: '1.2.3.4' });
    expect(step.metadata.isAbuse).toBe(true);
  });

  it('detectAbuseOp does not flag low failure rate', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startTelemetryFlow({
      platform: 'webkit',
      userId: 'u-1',
      endpointId: '/login',
    });
    await adapter.recordAttemptOp(s, { success: true, latencyMs: 100 });
    await adapter.recordAttemptOp(s, { success: true, latencyMs: 100 });
    const step = await adapter.detectAbuseOp(s, { failureRateThreshold: 0.5, ipAddress: '1.2.3.4' });
    expect(step.metadata.isAbuse).toBe(false);
  });

  it('recordAttemptOp rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.recordAttemptOp(
        { sessionId: 'nope', platform: 'chromium', userId: 'u' },
        { success: true, latencyMs: 100 },
      ),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeTelemetry removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startTelemetryFlow({
      platform: 'firefox',
      userId: 'u-1',
      endpointId: '/login',
    });
    await adapter.closeTelemetry(s);
    await expect(
      adapter.recordAttemptOp(s, { success: true, latencyMs: 100 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('sessionId prefix is tel- for telemetry flow', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startTelemetryFlow({
      platform: 'chromium',
      userId: 'u-1',
      endpointId: '/x',
    });
    expect(s.sessionId).toMatch(/^tel-\d+$/);
  });
});

describe('telemetry axis — real adapter env-gate', () => {
  it.each(platforms)('%s: recordAttemptOp reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startTelemetryFlow({ platform, userId: 'u', endpointId: '/login' });
    const step = await adapter.recordAttemptOp(s, { success: true, latencyMs: 100 });
    expect(step.outcome).toBe('env-missing');
  });

  it('recordAttemptOp records latency and success in metadata', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startTelemetryFlow({
      platform: 'chromium',
      userId: 'u',
      endpointId: '/x',
    });
    const step = await adapter.recordAttemptOp(s, { success: false, latencyMs: 450 });
    expect(step.metadata.success).toBe(false);
    expect(step.metadata.latencyMs).toBe(450);
  });

  it('detectAbuseOp preserves neutral event across successes', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startTelemetryFlow({
      platform: 'webkit',
      userId: 'u',
      endpointId: '/x',
    });
    await adapter.recordAttemptOp(s, { success: true, latencyMs: 100 });
    await adapter.recordAttemptOp(s, { success: true, latencyMs: 100 });
    const step = await adapter.detectAbuseOp(s, {
      failureRateThreshold: 0.5,
      ipAddress: '1.2.3.4',
    });
    expect(step.metadata.neutralEvent).toBe('telemetry.abuse-detected');
  });

  it('detectAbuseOp reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startTelemetryFlow({
      platform: 'chromium',
      userId: 'u',
      endpointId: '/login',
    });
    const step = await adapter.detectAbuseOp(s, {
      failureRateThreshold: 0.5,
      ipAddress: '1.2.3.4',
    });
    expect(step.outcome).toBe('env-missing');
  });
});
