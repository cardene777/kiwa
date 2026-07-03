import { ALL_METAS } from '../components/stories.js';
import type { StorybookAdapter, StoryDescriptor } from '../adapters/interface.js';

/**
 * User-facing flow implementations — the "what the app actually does" that
 * both mock and real adapters must satisfy. Each flow drives 1 or more
 * adapter ops end-to-end and returns a light summary so tests + fidelity
 * harness can assert on the outcome without re-implementing the adapter
 * contract in-line.
 *
 * The 4 flows selected are enough to exercise the full v1.16-2 AC set —
 * story registration + args resolution + play function + a11y — and are the
 * inputs the fidelity harness uses to drive both adapter modes.
 */

/**
 * Flow 1 — register the 12 primitive metas and enumerate every story.
 * Returns the descriptors so callers can assert `countStories()` equality.
 */
export async function registerAndDiscoverStories(
  adapter: StorybookAdapter,
): Promise<StoryDescriptor[]> {
  await adapter.registerAll(ALL_METAS);
  return adapter.listStories();
}

/**
 * Flow 2 — for every story with a play function, run resolveArgs + mount +
 * play and collect the play reports. The mock invokes each step synchronously;
 * the real adapter would forward each call to the preview iframe channel.
 */
export async function runPlayFunctionsForAll(
  adapter: StorybookAdapter,
): Promise<
  Array<{
    storyId: string;
    stepCount: number;
    ok: boolean;
    handlersInvoked: number;
  }>
> {
  const stories = await adapter.listStories();
  const playStories = stories.filter((s) => s.hasPlay);
  const reports: Array<{
    storyId: string;
    stepCount: number;
    ok: boolean;
    handlersInvoked: number;
  }> = [];
  for (const story of playStories) {
    await adapter.resolveArgs(story.title, story.storyName);
    await adapter.mount(story.title, story.storyName);
    const report = await adapter.play(story.title, story.storyName);
    reports.push({
      storyId: report.storyId,
      stepCount: report.steps.length,
      ok: report.ok,
      handlersInvoked: report.handlersInvoked,
    });
  }
  return reports;
}

/**
 * Flow 3 — mount + a11y check every story, collect violation counts. The
 * fidelity harness uses this to compare a11y results between adapters (mock
 * heuristic vs real axe-core), and downstream tests assert on Icon /
 * Modal / Form / etc. all being violation-free by design.
 */
export async function runA11yForAll(
  adapter: StorybookAdapter,
): Promise<Array<{ storyId: string; violationCount: number }>> {
  const stories = await adapter.listStories();
  const reports: Array<{ storyId: string; violationCount: number }> = [];
  for (const story of stories) {
    await adapter.mount(story.title, story.storyName);
    const a11y = await adapter.runA11y(story.title, story.storyName);
    reports.push({
      storyId: a11y.storyId,
      violationCount: a11y.violations.length,
    });
  }
  return reports;
}

/**
 * Flow 4 — resolveArgs on every story to force the meta + story merge
 * semantics through the adapter surface. Used by the fidelity harness to
 * count "surface coverage" (how many stories the mock touched vs real total),
 * which feeds fidelity.ratio in the release gate.
 */
export async function resolveArgsForAll(
  adapter: StorybookAdapter,
): Promise<Array<{ storyId: string; argsKeyCount: number }>> {
  const stories = await adapter.listStories();
  const reports: Array<{ storyId: string; argsKeyCount: number }> = [];
  for (const story of stories) {
    const resolved = await adapter.resolveArgs(story.title, story.storyName);
    reports.push({
      storyId: resolved.storyId,
      argsKeyCount: Object.keys(resolved.args).length,
    });
  }
  return reports;
}
