import { createCanvas } from './dom.js';
import type {
  A11yViolation,
  CanvasElement,
  ComponentRender,
  MockNode,
  PlayContext,
  StoryEntry,
  StoryObj,
  StoryParameters,
} from './types.js';

/**
 * Storybook 8 の CSF3 と互換な最小 mock。 real Storybook (SB8) は Meta +
 * StoryObj 単位で `.stories.tsx` を書き、 storybook が collect して registry
 * を作る。 mock はその registry 相当を in-memory Map で表現する。
 *
 * 使い方 ...
 * ```ts
 * const registry = createStoryRegistry();
 * registry.register({
 *   title: 'Button',
 *   render: (args) => createNode('button', { text: args.label }),
 *   stories: {
 *     Primary: { args: { label: 'Click me' } },
 *     Disabled: { args: { label: 'nope', disabled: true } },
 *   },
 * });
 * const canvas = await registry.mount('Button', 'Primary');
 * await registry.play('Button', 'Primary', canvas);
 * ```
 *
 * SB8 の実 API 互換で意識するのは (1) StoryObj.args の merge (2) play の
 * step wrapper (3) parameters.chromatic / parameters.a11y の透過保持
 * の 3 点。 実 SB8 の docs mode / decorators / loaders / addons は mock 対象外
 * (テストが吸収する semantic は絞る)。
 */

export interface StoryMeta<TArgs = Record<string, unknown>> {
  /** Storybook の title (e.g. 'Components/Button')。 */
  title: string;
  /** args → MockNode の render 関数、 framework agnostic。 */
  render: ComponentRender<TArgs>;
  /** meta 単位の default args (story 単位で override 可)。 */
  args?: Partial<TArgs>;
  /** meta 単位の default parameters (story 単位で shallow merge)。 */
  parameters?: StoryParameters;
  /** 登録する story 群、 key が story 名になる。 */
  stories: Record<string, StoryObj<TArgs>>;
}

export interface StoryMountResult {
  canvas: CanvasElement;
  entry: StoryEntry<Record<string, unknown>>;
}

export interface StoryPlayResult {
  steps: Array<{ label: string; ok: boolean; error?: string }>;
  ok: boolean;
}

export interface StoryRegistry {
  register<TArgs>(meta: StoryMeta<TArgs>): void;
  list(): StoryEntry[];
  get(title: string, storyName: string): StoryEntry;
  mount(title: string, storyName: string, overrideArgs?: Record<string, unknown>): StoryMountResult;
  play(title: string, storyName: string, canvas: CanvasElement, args?: Record<string, unknown>): Promise<StoryPlayResult>;
  runA11y(title: string, storyName: string, canvas: CanvasElement): { violations: A11yViolation[] };
}

/**
 * Registry を新規作成する。 内部は `Map<storyId, StoryEntry>`、 story id は
 * `title--storyName` (Storybook 8 の SB URL param 互換 lowercase / kebab-case)。
 */
export function createStoryRegistry(): StoryRegistry {
  const registry = new Map<string, StoryEntry>();

  const buildId = (title: string, storyName: string): string => {
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `${norm(title)}--${norm(storyName)}`;
  };

  const requireEntry = (title: string, storyName: string): StoryEntry => {
    const id = buildId(title, storyName);
    const entry = registry.get(id);
    if (!entry) {
      throw new Error(`StoryRegistry — no entry for ${id}`);
    }
    return entry;
  };

  return {
    register<TArgs>(meta: StoryMeta<TArgs>): void {
      for (const [storyName, story] of Object.entries(meta.stories)) {
        const id = buildId(meta.title, storyName);
        const mergedArgs = { ...(meta.args ?? {}), ...(story.args ?? {}) } as TArgs;
        const mergedParams: StoryParameters = {
          ...(meta.parameters ?? {}),
          ...(story.parameters ?? {}),
          ...(meta.parameters?.chromatic || story.parameters?.chromatic
            ? {
                chromatic: {
                  ...(meta.parameters?.chromatic ?? {}),
                  ...(story.parameters?.chromatic ?? {}),
                },
              }
            : {}),
          ...(meta.parameters?.a11y || story.parameters?.a11y
            ? {
                a11y: {
                  ...(meta.parameters?.a11y ?? {}),
                  ...(story.parameters?.a11y ?? {}),
                },
              }
            : {}),
        };
        const entry: StoryEntry = {
          id,
          title: meta.title,
          storyName,
          args: mergedArgs as Record<string, unknown>,
          render: meta.render as ComponentRender<Record<string, unknown>>,
          parameters: mergedParams,
          ...(story.play
            ? {
                play: story.play as (
                  context: PlayContext<Record<string, unknown>>,
                ) => Promise<void> | void,
              }
            : {}),
        };
        registry.set(id, entry);
      }
    },
    list(): StoryEntry[] {
      return Array.from(registry.values());
    },
    get(title, storyName): StoryEntry {
      return requireEntry(title, storyName);
    },
    mount(title, storyName, overrideArgs): StoryMountResult {
      const entry = requireEntry(title, storyName);
      const args = { ...entry.args, ...(overrideArgs ?? {}) };
      const root: MockNode = entry.render(args);
      const canvas = createCanvas(root);
      return { canvas, entry: { ...entry, args } };
    },
    async play(title, storyName, canvas, args): Promise<StoryPlayResult> {
      const entry = requireEntry(title, storyName);
      const mergedArgs = { ...entry.args, ...(args ?? {}) };
      const steps: StoryPlayResult['steps'] = [];
      const context: PlayContext<Record<string, unknown>> = {
        canvasElement: canvas,
        args: mergedArgs,
        step: async (label, fn) => {
          try {
            await fn();
            steps.push({ label, ok: true });
          } catch (error) {
            steps.push({ label, ok: false, error: (error as Error).message });
            throw error;
          }
        },
      };
      if (!entry.play) {
        return { steps: [], ok: true };
      }
      try {
        await entry.play(context);
        return { steps, ok: steps.every((s) => s.ok) };
      } catch {
        return { steps, ok: false };
      }
    },
    runA11y(title, storyName, canvas): { violations: A11yViolation[] } {
      const entry = requireEntry(title, storyName);
      if (entry.parameters.a11y?.disable) {
        return { violations: [] };
      }
      const injected = entry.parameters.a11y?.injectViolations ?? [];
      const detected = detectHeuristicViolations(canvas);
      return { violations: [...injected, ...detected] };
    },
  };
}

/**
 * 最小の a11y heuristic — 実 axe-core の代替として、 mock harness で意味のある
 * 3 rule だけ検出する。 (1) button に accessible name なし (2) img に alt なし
 * (3) form input に label なし。 テストで「a11y violations が検出される」 事を
 * assert できるようにする。
 */
function detectHeuristicViolations(canvas: CanvasElement): A11yViolation[] {
  const violations: A11yViolation[] = [];
  const buttons = canvas.querySelectorAll('button');
  for (const btn of buttons) {
    if (!hasAccessibleName(btn)) {
      violations.push({
        id: 'button-name',
        impact: 'critical',
        description: 'Buttons must have discernible text',
        nodes: [{ target: ['button'], html: '<button></button>' }],
      });
    }
  }
  const imgs = canvas.querySelectorAll('img');
  for (const img of imgs) {
    if (img.attrs['alt'] === undefined) {
      violations.push({
        id: 'image-alt',
        impact: 'serious',
        description: 'Images must have alternate text',
        nodes: [{ target: ['img'], html: '<img />' }],
      });
    }
  }
  const inputs = canvas.querySelectorAll('input');
  for (const input of inputs) {
    const type = input.attrs['type'] ?? 'text';
    if (type === 'hidden' || type === 'submit' || type === 'button') continue;
    if (!input.attrs['aria-label'] && !input.attrs['aria-labelledby'] && !hasAssociatedLabel(input, canvas)) {
      violations.push({
        id: 'label',
        impact: 'critical',
        description: 'Form elements must have labels',
        nodes: [{ target: ['input'], html: '<input />' }],
      });
    }
  }
  return violations;
}

function hasAccessibleName(node: MockNode): boolean {
  if (node.attrs['aria-label']) return true;
  const text = collectText(node).trim();
  return text.length > 0;
}

function collectText(node: MockNode): string {
  const parts: string[] = [];
  if (node.text) parts.push(node.text);
  for (const child of node.children) {
    parts.push(collectText(child));
  }
  return parts.join('');
}

function hasAssociatedLabel(input: MockNode, canvas: CanvasElement): boolean {
  const id = input.attrs['id'];
  if (!id) return false;
  const labels = canvas.querySelectorAll(`label[for=${JSON.stringify(id)}]`);
  return labels.length > 0;
}
