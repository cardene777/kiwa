import { describe, expect, it } from 'vitest';
import {
  bucketLatency,
  detectAbuse,
  platformEventName,
  recordAttempt,
  startAuthTelemetry,
  updateSuccessRate,
  type AuthPlatform,
} from '../../src/semantics/index.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('auth-telemetry axis — 3 platform', () => {
  it.each(platforms)('%s: recordAttempt increments counters', (platform) => {
    const s = startAuthTelemetry({ platform, endpointId: '/login' });
    const step = recordAttempt(s, { success: true, latencyMs: 200 });
    expect(step.platformEvent).toBe(platformEventName(platform, 'telemetry.attempt-recorded'));
    expect(s.attemptCount).toBe(1);
    expect(s.successCount).toBe(1);
  });

  it('updateSuccessRate returns aggregate', () => {
    const s = startAuthTelemetry({ platform: 'chromium', endpointId: '/login' });
    recordAttempt(s, { success: true, latencyMs: 100 });
    recordAttempt(s, { success: false, latencyMs: 200 });
    recordAttempt(s, { success: true, latencyMs: 150 });
    const step = updateSuccessRate(s);
    expect(step.metadata.successRate).toBeCloseTo(2 / 3);
  });

  it('updateSuccessRate rejects when no attempts', () => {
    const s = startAuthTelemetry({ platform: 'webkit', endpointId: '/x' });
    expect(() => updateSuccessRate(s)).toThrow(/no attempts/);
  });

  it('bucketLatency routes into correct bucket', () => {
    const s = startAuthTelemetry({ platform: 'firefox', endpointId: '/login' });
    bucketLatency(s, { latencyMs: 50 });
    bucketLatency(s, { latencyMs: 250 });
    bucketLatency(s, { latencyMs: 750 });
    bucketLatency(s, { latencyMs: 2000 });
    expect(s.buckets).toEqual({
      under100ms: 1,
      under500ms: 1,
      under1000ms: 1,
      over1000ms: 1,
    });
  });

  it('detectAbuse flags when failure rate above threshold', () => {
    const s = startAuthTelemetry({ platform: 'chromium', endpointId: '/login' });
    recordAttempt(s, { success: false, latencyMs: 100 });
    recordAttempt(s, { success: false, latencyMs: 100 });
    recordAttempt(s, { success: true, latencyMs: 100 });
    const step = detectAbuse(s, { failureRateThreshold: 0.5, ipAddress: '1.2.3.4' });
    expect(step.metadata.isAbuse).toBe(true);
    expect(s.state).toBe('abuse-detected');
  });

  it('detectAbuse leaves state when below threshold', () => {
    const s = startAuthTelemetry({ platform: 'webkit', endpointId: '/login' });
    recordAttempt(s, { success: true, latencyMs: 100 });
    recordAttempt(s, { success: true, latencyMs: 100 });
    const step = detectAbuse(s, { failureRateThreshold: 0.5, ipAddress: '1.2.3.4' });
    expect(step.metadata.isAbuse).toBe(false);
    expect(s.state).toBe('collecting');
  });

  it('detectAbuse rejects when no attempts', () => {
    const s = startAuthTelemetry({ platform: 'firefox', endpointId: '/x' });
    expect(() => detectAbuse(s, { failureRateThreshold: 0.5, ipAddress: '1.2.3.4' })).toThrow(
      /no attempts/,
    );
  });

  it('history accumulates in order', () => {
    const s = startAuthTelemetry({ platform: 'chromium', endpointId: '/login' });
    recordAttempt(s, { success: true, latencyMs: 100 });
    updateSuccessRate(s);
    bucketLatency(s, { latencyMs: 250 });
    expect(s.history.map((step) => step.neutralEvent)).toEqual([
      'telemetry.attempt-recorded',
      'telemetry.success-rate-updated',
      'telemetry.latency-bucketed',
    ]);
  });
});
