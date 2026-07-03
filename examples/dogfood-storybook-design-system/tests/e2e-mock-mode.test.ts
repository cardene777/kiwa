import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookAdapter } from '../src/adapters/interface.js';
import {
  registerAndDiscoverStories,
  resolveArgsForAll,
  runA11yForAll,
  runPlayFunctionsForAll,
} from '../src/flows/story-flows.js';
import { countStories } from '../src/components/stories.js';

let adapter: StorybookAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-design-system — end-to-end flows (mock mode)', () => {
  it('T-DFSB-E2E-001 registerAndDiscoverStories returns countStories() descriptors', async () => {
    const stories = await registerAndDiscoverStories(adapter);
    expect(stories).toHaveLength(countStories());
  });

  it('T-DFSB-E2E-002 resolveArgsForAll resolves args for every story (no throws)', async () => {
    await registerAndDiscoverStories(adapter);
    const resolved = await resolveArgsForAll(adapter);
    expect(resolved.length).toBe(countStories());
    for (const r of resolved) {
      expect(r.argsKeyCount).toBeGreaterThan(0);
    }
  });

  it('T-DFSB-E2E-003 runPlayFunctionsForAll executes every play story with ok=true', async () => {
    await registerAndDiscoverStories(adapter);
    const reports = await runPlayFunctionsForAll(adapter);
    expect(reports.length).toBeGreaterThanOrEqual(6);
    for (const r of reports) {
      expect(r.ok).toBe(true);
      expect(r.stepCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('T-DFSB-E2E-004 runA11yForAll returns 0 violations for every primitive story (no injected violations)', async () => {
    await registerAndDiscoverStories(adapter);
    const reports = await runA11yForAll(adapter);
    for (const report of reports) {
      expect(report.violationCount).toBe(0);
    }
  });

  it('T-DFSB-E2E-005 mount trace count aligns with mount metric after runPlayFunctionsForAll', async () => {
    await registerAndDiscoverStories(adapter);
    await runPlayFunctionsForAll(adapter);
    const mountTraces = adapter.traces().filter((t) => t.op === 'mount');
    expect(adapter.metrics().mountInvocations).toBe(mountTraces.length);
  });

  it('T-DFSB-E2E-006 4 core flows produce a coherent trace stream with no failed ops', async () => {
    await registerAndDiscoverStories(adapter);
    await resolveArgsForAll(adapter);
    await runPlayFunctionsForAll(adapter);
    await runA11yForAll(adapter);
    const traces = adapter.traces();
    const failures = traces.filter((t) => !t.ok);
    expect(failures).toHaveLength(0);
    // Op distribution — every AC-required op must appear at least once.
    const opsSeen = new Set(traces.map((t) => t.op));
    for (const required of [
      'registerAll',
      'listStories',
      'resolveArgs',
      'mount',
      'play',
      'runA11y',
    ]) {
      expect(opsSeen.has(required)).toBe(true);
    }
  });

  it('T-DFSB-E2E-007 reset drops the trace + metrics without breaking subsequent runs', async () => {
    await registerAndDiscoverStories(adapter);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().mountInvocations).toBe(0);
    // After reset the adapter should still function.
    const stories = await registerAndDiscoverStories(adapter);
    expect(stories).toHaveLength(countStories());
  });
});
