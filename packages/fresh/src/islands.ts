// Deno Fresh Islands partial-hydration test helpers for kiwa (Issue #814, v1.19-1b).
//
// Fresh's core rendering model is "islands architecture" — the server ships
// mostly static HTML, but any component whose file lives in `islands/` gets
// hydrated on the client with its `props`. kiwa reproduces the observable
// contract without spinning up Deno / esbuild / preact:
//
//   - `defineIsland({ name, component, props })` — registers an island with a
//     brand + name + component + serialized props snapshot
//   - `mountIsland(island, props)` — synchronously calls the component fn
//     with the given props and captures the returned virtual tree + any
//     `useState` / `useEffect` reads that the component pretends to make
//   - `hydrateIslands({ ssrTree, islands })` — walks the SSR tree, finds
//     placeholders for each registered island (`<div data-island="Name">`),
//     mounts the island component, and replaces the placeholder with the
//     mounted tree. Returns a diff describing which islands hydrated cleanly
//     vs. mismatched.
//   - `simulateInteraction({ mounted, event, target })` — dispatches a
//     synthetic click / input event against a mounted island and records the
//     handler invocations so tests can assert on interaction traces.
//
// Out of scope on purpose:
//   - real esbuild / islands bundle compilation
//   - real DOM (synthetic events are captured verbatim, no bubbling)
//   - Signal-based reactive graph (see @kiwa-test/solidjs for that shape)

import type { FreshChild, FreshVNode } from './route.js';
import { findNodes, h, isFreshVNode, stringify } from './route.js';

export const ISLAND_SYMBOL = Symbol.for('kiwa.fresh.island');
export const ISLAND_MOUNT_SYMBOL = Symbol.for('kiwa.fresh.island.mount');

export type IslandProps = Record<string, unknown>;

export type IslandComponent<P extends IslandProps = IslandProps> = (props: P) => FreshChild;

export interface IslandDefinition<P extends IslandProps = IslandProps> {
  readonly [ISLAND_SYMBOL]: true;
  readonly name: string;
  readonly component: IslandComponent<P>;
  readonly defaultProps: P | undefined;
}

/**
 * Register a Fresh island. `name` is the placeholder attribute
 * (`<div data-island="Name">`) that `hydrateIslands` looks for.
 */
export function defineIsland<P extends IslandProps = IslandProps>(opts: {
  readonly name: string;
  readonly component: IslandComponent<P>;
  readonly defaultProps?: P;
}): IslandDefinition<P> {
  if (!opts.name) throw new Error('defineIsland: name is required');
  return {
    [ISLAND_SYMBOL]: true,
    name: opts.name,
    component: opts.component,
    defaultProps: opts.defaultProps,
  };
}

/** Type guard: recognize an island definition. */
export function isIslandDefinition(value: unknown): value is IslandDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [ISLAND_SYMBOL]?: true })[ISLAND_SYMBOL] === true
  );
}

/**
 * Render a Fresh island placeholder. Server-side output contains only the
 * `<div data-island="Name" data-props="...">` marker — no children — so
 * hydration can find it and expand it into the real tree.
 */
export function islandPlaceholder<P extends IslandProps = IslandProps>(
  island: IslandDefinition<P>,
  props?: Partial<P>,
): FreshVNode {
  const merged = { ...(island.defaultProps ?? {}), ...(props ?? {}) };
  return h('div', {
    'data-island': island.name,
    'data-props': encodeProps(merged as IslandProps),
  });
}

function encodeProps(props: IslandProps): string {
  return JSON.stringify(props);
}

function decodeProps(encoded: string | undefined): IslandProps {
  if (!encoded) return {};
  try {
    const parsed = JSON.parse(encoded);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as IslandProps;
  } catch {
    return {};
  }
}

export interface IslandMount<P extends IslandProps = IslandProps> {
  readonly [ISLAND_MOUNT_SYMBOL]: true;
  readonly island: IslandDefinition<P>;
  readonly props: P;
  readonly tree: FreshChild;
  readonly html: string;
  handlers: Map<string, Array<(event: SyntheticEvent) => void>>;
}

/**
 * Mount an island synchronously — invokes the component fn with the merged
 * props and captures the returned virtual tree. Collects any event handlers
 * present in the tree so `simulateInteraction` can dispatch against them.
 */
export function mountIsland<P extends IslandProps = IslandProps>(
  island: IslandDefinition<P>,
  props?: Partial<P>,
): IslandMount<P> {
  const merged = { ...(island.defaultProps ?? {}), ...(props ?? {}) } as P;
  const tree = island.component(merged);
  const handlers = collectHandlers(tree);
  return {
    [ISLAND_MOUNT_SYMBOL]: true,
    island,
    props: merged,
    tree,
    html: stringify(tree),
    handlers,
  };
}

/** Type guard: recognize a mounted island. */
export function isIslandMount(value: unknown): value is IslandMount {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [ISLAND_MOUNT_SYMBOL]?: true })[ISLAND_MOUNT_SYMBOL] === true
  );
}

export interface SyntheticEvent {
  readonly type: string;
  readonly target: FreshVNode | undefined;
  readonly value: unknown;
  defaultPrevented: boolean;
  preventDefault(): void;
}

function collectHandlers(tree: FreshChild): Map<string, Array<(event: SyntheticEvent) => void>> {
  const map = new Map<string, Array<(event: SyntheticEvent) => void>>();
  const visit = (node: FreshChild): void => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!isFreshVNode(node)) return;
    for (const [key, value] of Object.entries(node.props)) {
      if (typeof value === 'function' && key.startsWith('on')) {
        const eventName = key.slice(2).toLowerCase();
        const arr = map.get(eventName) ?? [];
        arr.push(value as (event: SyntheticEvent) => void);
        map.set(eventName, arr);
      }
    }
    for (const child of node.children) visit(child);
  };
  visit(tree);
  return map;
}

// Erased IslandDefinition covers any props shape without forcing tests to widen.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyIslandDefinition = IslandDefinition<any>;

export interface HydrateIslandsOptions {
  readonly ssrTree: FreshChild;
  readonly islands: readonly AnyIslandDefinition[];
}

export interface HydratedIslandEntry {
  readonly name: string;
  readonly mount: IslandMount<IslandProps>;
  readonly placeholder: FreshVNode;
}

export interface HydrateIslandsResult {
  readonly hydrated: HydratedIslandEntry[];
  readonly missing: string[];
  readonly unregistered: string[];
  readonly html: string;
}

/**
 * Walk the SSR tree, find every `<div data-island="Name">` placeholder, mount
 * the matching island definition (decoding `data-props`), and produce a diff
 * describing which islands hydrated / which registered islands never
 * appeared in the SSR tree / which placeholders had no matching island.
 */
export function hydrateIslands(opts: HydrateIslandsOptions): HydrateIslandsResult {
  const byName = new Map<string, AnyIslandDefinition>();
  for (const island of opts.islands) byName.set(island.name, island);
  const placeholders = findNodes(opts.ssrTree, (n) => typeof n.props['data-island'] === 'string');
  const seen = new Set<string>();
  const hydrated: HydratedIslandEntry[] = [];
  const unregistered: string[] = [];
  for (const placeholder of placeholders) {
    const name = String(placeholder.props['data-island']);
    seen.add(name);
    const island = byName.get(name);
    if (!island) {
      unregistered.push(name);
      continue;
    }
    const encoded = placeholder.props['data-props'];
    const props = decodeProps(typeof encoded === 'string' ? encoded : undefined);
    const mount = mountIsland(island, props);
    hydrated.push({ name, mount: mount as IslandMount<IslandProps>, placeholder });
  }
  const missing: string[] = [];
  for (const name of byName.keys()) if (!seen.has(name)) missing.push(name);
  return {
    hydrated,
    missing,
    unregistered,
    html: renderHydrated(opts.ssrTree, hydrated),
  };
}

function renderHydrated(tree: FreshChild, hydrated: HydratedIslandEntry[]): string {
  const byPlaceholder = new Map<FreshVNode, IslandMount>();
  for (const entry of hydrated) byPlaceholder.set(entry.placeholder, entry.mount);
  const render = (node: FreshChild): string => {
    if (node === null || node === undefined || node === false || node === true) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(render).join('');
    const mount = byPlaceholder.get(node);
    if (mount) return mount.html;
    const attrs = renderAttrs(node.props);
    const inner = node.children.map(render).join('');
    return `<${node.type}${attrs}>${inner}</${node.type}>`;
  };
  return render(tree);
}

function renderAttrs(props: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;
    if (value === null || value === undefined || value === false) continue;
    if (typeof value === 'function') continue;
    if (value === true) {
      parts.push(` ${key}`);
      continue;
    }
    parts.push(` ${key}="${String(value)}"`);
  }
  return parts.join('');
}

export interface SimulateInteractionOptions {
  readonly mount: IslandMount;
  readonly event: string;
  readonly value?: unknown;
  readonly targetType?: string;
}

export interface SimulateInteractionResult {
  readonly invoked: number;
  readonly defaultPrevented: boolean;
}

/**
 * Dispatch a synthetic event against a mounted island. `event` is the DOM
 * event name (e.g. `click` / `input` / `submit`), `targetType` filters by
 * element tag (e.g. only fire against `button` elements), and `value` is
 * exposed on the event object for `input` handlers.
 */
export function simulateInteraction(opts: SimulateInteractionOptions): SimulateInteractionResult {
  const eventName = opts.event.toLowerCase();
  const handlers = opts.mount.handlers.get(eventName) ?? [];
  let target: FreshVNode | undefined;
  if (opts.targetType) {
    target = findNodes(opts.mount.tree, (n) => n.type === opts.targetType).at(0);
  }
  let defaultPrevented = false;
  const ev: SyntheticEvent = {
    type: eventName,
    target,
    value: opts.value,
    defaultPrevented: false,
    preventDefault(): void {
      defaultPrevented = true;
      ev.defaultPrevented = true;
    },
  };
  for (const handler of handlers) handler(ev);
  return { invoked: handlers.length, defaultPrevented };
}
