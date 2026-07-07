import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { EdgePlatform } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];
const baseInput = { fromVersion: 1, toVersion: 2, instanceIds: ['do-a', 'do-b'] };

describe('rollout axis — mock adapter', () => {
  it.each(platforms)('%s: startRollout starts with all instances migrated', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRollout({ sessionId: '', platform, ...baseInput });
    expect(s.sessionId).toMatch(/^rollout-\d+$/);
  });

  it.each(platforms)('%s: completeRolloutOp emits rolled-out event', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRollout({ sessionId: '', platform, ...baseInput });
    const step = await adapter.completeRolloutOp(s);
    expect(step.op).toBe('completeRolloutOp');
    expect(step.metadata.neutralEvent).toBe('do-migration.rolled-out');
  });

  it('rollbackRollout returns to fromVersion', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRollout({ sessionId: '', platform: 'cloudflare', ...baseInput });
    const step = await adapter.rollbackRollout(s);
    expect(step.op).toBe('rollbackRollout');
    expect(step.metadata.fromVersion).toBe(1);
  });

  it('completeRolloutOp then rollbackRollout is legal', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRollout({ sessionId: '', platform: 'vercel', ...baseInput });
    await adapter.completeRolloutOp(s);
    const step = await adapter.rollbackRollout(s);
    expect(step.outcome).toBe('success');
  });

  it('closeRollout removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRollout({ sessionId: '', platform: 'deno', ...baseInput });
    await adapter.closeRollout(s);
    await expect(adapter.completeRolloutOp(s)).rejects.toThrow(/unknown sessionId/);
  });

  it('startRollout with 3 instances migrates all before rollout', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRollout({
      sessionId: '',
      platform: 'cloudflare',
      fromVersion: 1,
      toVersion: 3,
      instanceIds: ['a', 'b', 'c'],
    });
    const step = await adapter.completeRolloutOp(s);
    expect(step.metadata.toVersion).toBe(3);
  });
});

describe('rollout axis — real adapter env-gate', () => {
  it.each(platforms)('%s: completeRolloutOp reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startRollout({ sessionId: '', platform, ...baseInput });
    const step = await adapter.completeRolloutOp(s);
    expect(step.outcome).toBe('env-missing');
  });

  it('rollbackRollout reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startRollout({ sessionId: '', platform: 'cloudflare', ...baseInput });
    const step = await adapter.rollbackRollout(s);
    expect(step.outcome).toBe('env-missing');
  });
});
