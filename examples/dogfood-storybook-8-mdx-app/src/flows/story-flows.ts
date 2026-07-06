import { ALL_METAS, INTERACTION_FOCUS_STORIES } from '../components/stories.js';
import { ALL_DOCS } from '../mdx/docs.js';
import type {
  A11yReport,
  CoverageReport,
  InteractionRunReport,
  MdxRenderReport,
  StorybookMdxAdapter,
  StoryDescriptor,
} from '../adapters/interface.js';

/**
 * User-facing flow implementations — the "what the app actually does" that
 * both mock and real adapters must satisfy. Each flow drives 1 or more
 * adapter ops end-to-end and returns a light summary so tests + fidelity
 * harness can assert on the outcome.
 *
 * v1.34-4 (Issue #1051) — 6 flows: register + discover / resolve args / MDX
 * render / interaction run / a11y run / coverage compute.
 */

/**
 * Flow 1 — register all metas + MDX docs and enumerate every story.
 */
export async function registerAndDiscoverStories(
  adapter: StorybookMdxAdapter,
): Promise<StoryDescriptor[]> {
  await adapter.registerAll(ALL_METAS, ALL_DOCS);
  return adapter.listStories();
}

/**
 * Flow 2 — for every story, resolveArgs + mount to capture the base snapshot.
 * Feeds the fidelity trace with 1 mount op per story so the adapter surface
 * `mount` axis stays observable at the top level (renderMdx / runInteraction /
 * runA11y all mount internally but the outer trace records only their op name).
 */
export async function resolveArgsForAll(
  adapter: StorybookMdxAdapter,
): Promise<Array<{ storyId: string; argsCount: number; hash: string }>> {
  const stories = await adapter.listStories();
  const out: Array<{ storyId: string; argsCount: number; hash: string }> = [];
  for (const s of stories) {
    const resolved = await adapter.resolveArgs(s.title, s.storyName);
    const snapshot = await adapter.mount(s.title, s.storyName);
    out.push({
      storyId: resolved.storyId,
      argsCount: Object.keys(resolved.args).length,
      hash: snapshot.hash,
    });
  }
  return out;
}

/**
 * Flow 3 — render every MDX doc.
 */
export async function renderAllMdxDocs(
  adapter: StorybookMdxAdapter,
): Promise<MdxRenderReport[]> {
  const reports: MdxRenderReport[] = [];
  for (const doc of ALL_DOCS) {
    reports.push(await adapter.renderMdx(doc.docId));
  }
  return reports;
}

/**
 * Flow 4 — run interactions for the 5 focus stories (@storybook/test surface).
 */
export async function runInteractionFocusStories(
  adapter: StorybookMdxAdapter,
): Promise<InteractionRunReport[]> {
  const reports: InteractionRunReport[] = [];
  for (const target of INTERACTION_FOCUS_STORIES) {
    reports.push(await adapter.runInteraction(target.title, target.storyName));
  }
  return reports;
}

/**
 * Flow 5 — run a11y for every story.
 */
export async function runA11yForAll(
  adapter: StorybookMdxAdapter,
): Promise<A11yReport[]> {
  const stories = await adapter.listStories();
  const reports: A11yReport[] = [];
  for (const s of stories) {
    reports.push(await adapter.runA11y(s.title, s.storyName));
  }
  return reports;
}

/**
 * Flow 6 — compute the coverage report.
 */
export async function computeStoryCoverage(
  adapter: StorybookMdxAdapter,
): Promise<CoverageReport> {
  return adapter.computeCoverage();
}
