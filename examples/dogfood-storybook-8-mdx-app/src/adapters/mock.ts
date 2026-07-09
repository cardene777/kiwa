import {
  createStoryRegistry,
  hashMarkup,
  type MockNode,
  type StoryMeta,
  type StoryRegistry,
} from '@kiwa-lab/component';
import type {
  A11yReport,
  CoverageEntry,
  CoverageReport,
  InteractionRunReport,
  InteractionStep,
  MdxBlock,
  MdxDoc,
  MdxRenderReport,
  ResolvedArgs,
  StorybookMdxAdapter,
  StoryDescriptor,
  StoryMountSnapshot,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — spins up an in-process `@kiwa-lab/component` `StoryRegistry`
 * + in-memory MdxRegistry + InteractionRunner + CoverageReporter. Every op
 * records a trace event so the fidelity harness can diff mock vs real
 * behaviour without needing a live Storybook preview.
 *
 * v1.34-4 (Issue #1051) 新設。 v1.16-2 dogfood-storybook-design-system の
 * mock を base に、 (1) MDX registry + renderMdx op、 (2) interaction runner
 * + runInteraction op、 (3) coverage reporter + computeCoverage op、 の 3 op
 * を追加した拡張版。
 */
export function makeMockAdapter(): StorybookMdxAdapter {
  const trace: TraceEvent[] = [];
  let registry: StoryRegistry | null = null;
  const mdxRegistry = new Map<string, MdxDoc>();
  // Track which stories have MDX / interaction / a11y coverage.
  const mdxCovered = new Set<string>();
  const interactionCovered = new Set<string>();
  const a11yCovered = new Set<string>();
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    interactionInvocations: 0,
    a11yInvocations: 0,
    mountInvocations: 0,
    mdxRenderInvocations: 0,
    assertionsRun: 0,
  };

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function ensureRegistry(): StoryRegistry {
    if (registry) return registry;
    registry = createStoryRegistry();
    return registry;
  }

  async function timed<T>(op: string, run: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await run();
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      return result;
    } catch (err) {
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      record(op, false, {
        errorKind: 'STORYBOOK_MDX_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  function normStoryId(title: string, storyName: string): string {
    const norm = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${norm(title)}--${norm(storyName)}`;
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async registerAll(metas, docs): Promise<StoryDescriptor[]> {
      return timed('registerAll', () => {
        const reg = ensureRegistry();
        for (const meta of metas) {
          reg.register(meta as StoryMeta<Record<string, unknown>>);
        }
        // Register MDX docs and pre-compute association.
        for (const doc of docs) {
          mdxRegistry.set(doc.docId, doc);
          for (const storyId of doc.associatedStoryIds) {
            mdxCovered.add(storyId);
          }
        }
        const entries = reg.list();
        const descriptors: StoryDescriptor[] = entries.map((e) => ({
          id: e.id,
          title: e.title,
          storyName: e.storyName,
          args: { ...e.args },
          hasPlay: Boolean(e.play),
          hasMdx: mdxCovered.has(e.id),
        }));
        record('registerAll', true, {
          detail: {
            metaCount: metas.length,
            storyCount: descriptors.length,
            docCount: docs.length,
          },
        });
        return descriptors;
      });
    },

    async listStories(): Promise<StoryDescriptor[]> {
      return timed('listStories', () => {
        const reg = ensureRegistry();
        const entries = reg.list();
        const descriptors: StoryDescriptor[] = entries.map((e) => ({
          id: e.id,
          title: e.title,
          storyName: e.storyName,
          args: { ...e.args },
          hasPlay: Boolean(e.play),
          hasMdx: mdxCovered.has(e.id),
        }));
        record('listStories', true, { detail: { count: descriptors.length } });
        return descriptors;
      });
    },

    async resolveArgs(title, storyName): Promise<ResolvedArgs> {
      return timed('resolveArgs', () => {
        const reg = ensureRegistry();
        const entry = reg.get(title, storyName);
        record('resolveArgs', true, { detail: { storyId: entry.id } });
        return { storyId: entry.id, args: { ...entry.args } };
      });
    },

    async mount(title, storyName, overrideArgs): Promise<StoryMountSnapshot> {
      return timed('mount', () => {
        const reg = ensureRegistry();
        const { canvas, entry } = reg.mount(title, storyName, overrideArgs);
        const markup = canvas.toMarkup();
        metricsAgg.mountInvocations += 1;
        record('mount', true, { detail: { storyId: entry.id } });
        return {
          storyId: entry.id,
          markup,
          hash: hashMarkup(markup),
        };
      });
    },

    async renderMdx(docId): Promise<MdxRenderReport> {
      return timed('renderMdx', () => {
        const doc = mdxRegistry.get(docId);
        if (!doc) {
          throw new Error(`MdxRegistry — no doc for ${docId}`);
        }
        const reg = ensureRegistry();
        const blocks: MdxBlock[] = [];
        for (const authored of doc.blocks) {
          if (authored.kind === 'prose') {
            blocks.push({ kind: 'prose', text: authored.text ?? '' });
          } else if (authored.kind === 'code') {
            blocks.push({
              kind: 'code',
              language: authored.language ?? 'text',
              source: authored.source ?? '',
            });
          } else {
            // preview — mount the referenced story inline.
            const storyName = authored.storyName ?? '';
            const { canvas, entry } = reg.mount(doc.storyTitle, storyName);
            const markup = canvas.toMarkup();
            blocks.push({
              kind: 'preview',
              storyId: entry.id,
              markup,
              hash: hashMarkup(markup),
            });
          }
        }
        metricsAgg.mdxRenderInvocations += 1;
        record('renderMdx', true, {
          detail: { docId, blockCount: blocks.length },
        });
        return { docId, title: doc.title, blocks };
      });
    },

    async runInteraction(title, storyName): Promise<InteractionRunReport> {
      return timed('runInteraction', async () => {
        const reg = ensureRegistry();
        const entry = reg.get(title, storyName);
        const storyId = entry.id;
        if (!entry.play) {
          record('runInteraction', true, {
            detail: { storyId, skipped: true },
          });
          return {
            storyId,
            steps: [],
            ok: true,
            assertionsPassed: 0,
            assertionsFailed: 0,
          };
        }
        // Use play function under the hood but re-classify each step as an
        // interaction step for @storybook/test semantics.
        const { canvas } = reg.mount(title, storyName);
        const counter = { fires: 0 };
        instrumentHandlers(canvas.root, counter);
        const result = await reg.play(title, storyName, canvas);
        const steps: InteractionStep[] = [];
        let passed = 0;
        let failed = 0;
        for (const step of result.steps) {
          const op = classifyStep(step.label);
          const iStep: InteractionStep = {
            label: step.label,
            op,
            ok: step.ok,
            detail: { handlersInvoked: counter.fires },
          };
          if (step.error !== undefined) iStep.detail = { ...iStep.detail, error: step.error };
          steps.push(iStep);
        }
        // Post-interaction assertions — the mock ships 1 baked-in assertion
        // per interaction focus story (assert the trigger fired at least 1
        // handler). This is what @storybook/test's expect(target).toBeCalled
        // would look like in real Storybook 8.
        const assertOk = counter.fires >= 1;
        steps.push({
          label: 'assert at least 1 handler invocation',
          op: 'assert',
          ok: assertOk,
          detail: { handlersInvoked: counter.fires },
        });
        if (assertOk) passed += 1;
        else failed += 1;
        metricsAgg.interactionInvocations += 1;
        metricsAgg.assertionsRun += 1;
        interactionCovered.add(storyId);
        record('runInteraction', true, {
          detail: {
            storyId,
            stepCount: steps.length,
            ok: result.ok && assertOk,
            handlersInvoked: counter.fires,
            assertionsPassed: passed,
            assertionsFailed: failed,
          },
        });
        return {
          storyId,
          steps,
          ok: result.ok && assertOk,
          assertionsPassed: passed,
          assertionsFailed: failed,
        };
      });
    },

    async runA11y(title, storyName): Promise<A11yReport> {
      return timed('runA11y', () => {
        const reg = ensureRegistry();
        const entry = reg.get(title, storyName);
        const { canvas } = reg.mount(title, storyName);
        const result = reg.runA11y(title, storyName, canvas);
        metricsAgg.a11yInvocations += 1;
        a11yCovered.add(entry.id);
        record('runA11y', true, {
          detail: {
            storyId: entry.id,
            violationCount: result.violations.length,
          },
        });
        return {
          storyId: entry.id,
          violations: result.violations,
        };
      });
    },

    async computeCoverage(): Promise<CoverageReport> {
      return timed('computeCoverage', () => {
        const reg = ensureRegistry();
        const entries = reg.list();
        const coverageEntries: CoverageEntry[] = entries.map((e) => {
          const hasMdx = mdxCovered.has(e.id);
          const hasInteraction = interactionCovered.has(e.id);
          const hasA11y = a11yCovered.has(e.id);
          return {
            storyId: e.id,
            hasMdx,
            hasInteraction,
            hasA11y,
            covered: hasMdx && hasA11y, // MDX + a11y minimum for "covered".
          };
        });
        const totalStories = coverageEntries.length;
        const coveredStories = coverageEntries.filter((c) => c.covered).length;
        const coveragePct =
          totalStories === 0 ? 0 : Math.round((coveredStories / totalStories) * 100);
        record('computeCoverage', true, {
          detail: { totalStories, coveredStories, coveragePct },
        });
        return {
          entries: coverageEntries,
          totalStories,
          coveredStories,
          coveragePct,
        };
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        interactionInvocations: metricsAgg.interactionInvocations,
        a11yInvocations: metricsAgg.a11yInvocations,
        mountInvocations: metricsAgg.mountInvocations,
        mdxRenderInvocations: metricsAgg.mdxRenderInvocations,
        assertionsRun: metricsAgg.assertionsRun,
      };
    },

    async reset() {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.interactionInvocations = 0;
      metricsAgg.a11yInvocations = 0;
      metricsAgg.mountInvocations = 0;
      metricsAgg.mdxRenderInvocations = 0;
      metricsAgg.assertionsRun = 0;
      registry = null;
      mdxRegistry.clear();
      mdxCovered.clear();
      interactionCovered.clear();
      a11yCovered.clear();
    },
  };
}

// Classify a play step label as one of the InteractionStep op kinds.
function classifyStep(label: string): InteractionStep['op'] {
  const lower = label.toLowerCase();
  if (lower.includes('click')) return 'click';
  if (lower.includes('type') || lower.includes('input')) return 'type';
  if (lower.includes('assert')) return 'assert';
  if (lower.includes('wait')) return 'wait';
  // change / activate / dismiss / select / submit — all treated as clicks.
  return 'click';
}

// Tree walk that wraps every handler with an invocation counter so the play
// function's actual handler firings are counted. Same pattern as v1.16-2 mock.
function instrumentHandlers(node: MockNode, counter: { fires: number }): void {
  for (const [event, handlers] of Object.entries(node.handlers)) {
    node.handlers[event] = handlers.map((original) => (evt) => {
      counter.fires += 1;
      original(evt);
    });
  }
  for (const child of node.children) {
    instrumentHandlers(child, counter);
  }
}
