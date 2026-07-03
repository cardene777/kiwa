// SolidJS component render test helper for kiwa (Issue #813, v1.19-1a).
//
// Real Solid components compile to a JSX runtime that materializes DOM nodes
// through `template()` + `_$insert()`. kiwa treats a Solid component as
// `(props) => JSX-shaped virtual node` and materializes it into a lightweight
// tree that mirrors the SSR string-based output, with hydration + createRoot
// wrappers modeling the two most common test seams:
//
//   - `renderSolid(Component, { props })` — synchronous mount, returns
//     virtual DOM tree + effect tracker + dispose handle
//   - `hydrate(Component, { props, ssrMarkup })` — pretend the SSR markup was
//     rendered on the server, mount the component client-side, and diff which
//     nodes hydrated cleanly vs. mismatched
//   - `createRoot(fn)` — Solid's `createRoot` returns a dispose fn scoped to
//     child effects; the mock version runs `fn(dispose)` and captures the
//     dispose call so tests can assert cleanup
//
// Out of scope on purpose:
//   - real JSX compilation (tests pass pre-shaped virtual nodes or use the
//     `h()` helper below)
//   - full DOM API (attributes / event listeners are captured verbatim, no
//     real synthetic events)
//   - portal / Show / For / Switch control flow — those are implemented as
//     virtual-node types the walker understands, not full runtime primitives

import type { EffectHandle } from './signal.js';

export const SOLID_ELEMENT_SYMBOL = Symbol.for('kiwa.solidjs.element');
export const SOLID_ROOT_SYMBOL = Symbol.for('kiwa.solidjs.root');

export type SolidChild = SolidElement | string | number | boolean | null | undefined | SolidChild[];

export interface SolidElement {
  readonly [SOLID_ELEMENT_SYMBOL]: true;
  readonly type: string;
  readonly props: Record<string, unknown>;
  readonly children: SolidChild[];
}

export type SolidComponent<TProps = Record<string, unknown>> = (props: TProps) => SolidChild;

export interface RenderSolidOptions<TProps> {
  readonly component: SolidComponent<TProps>;
  readonly props?: TProps;
}

export interface RenderSolidResult {
  readonly tree: SolidChild;
  readonly effects: EffectHandle<unknown>[];
  readonly dispose: () => void;
  readonly html: () => string;
}

export interface HydrateOptions<TProps> extends RenderSolidOptions<TProps> {
  readonly ssrMarkup: string;
}

export interface HydrateResult extends RenderSolidResult {
  readonly hydrated: boolean;
  readonly mismatch: string | null;
}

export interface RootScope {
  readonly disposed: () => boolean;
}

const effectStack: EffectHandle<unknown>[][] = [];

/**
 * Push a fresh effect-collection scope onto the stack. Used internally by
 * `renderSolid` / `createRoot` so any effects registered during the callback
 * are attributed to that scope.
 */
export function pushEffectScope(): void {
  effectStack.push([]);
}

/** Pop the current effect-collection scope and return the collected handles. */
export function popEffectScope(): EffectHandle<unknown>[] {
  return effectStack.pop() ?? [];
}

/**
 * Register an effect handle with the innermost active scope (if any). Skill
 * tests call this directly after `mockEffect(...)` when they want the effect
 * cleaned up on `dispose()`.
 */
export function registerEffect(handle: EffectHandle<unknown>): void {
  const top = effectStack[effectStack.length - 1];
  if (top) top.push(handle);
}

/**
 * Lightweight JSX-shaped element factory. Callers can write `h('div', {
 * class: 'x' }, 'hello')` in tests and pass the result to `renderSolid` or
 * return it from a component body.
 */
export function h(type: string, props: Record<string, unknown> | null, ...children: SolidChild[]): SolidElement {
  return {
    [SOLID_ELEMENT_SYMBOL]: true,
    type,
    props: props ?? {},
    children,
  };
}

/**
 * Mount a Solid component synchronously, capture effects registered during
 * the mount, and expose a `dispose()` handle that tears down every effect.
 */
export function renderSolid<TProps>(opts: RenderSolidOptions<TProps>): RenderSolidResult {
  pushEffectScope();
  const props = (opts.props ?? ({} as TProps));
  const tree = opts.component(props);
  const effects = popEffectScope();
  let torn = false;
  const dispose = (): void => {
    if (torn) return;
    torn = true;
    for (const eff of effects) eff.dispose();
  };
  return {
    tree,
    effects,
    dispose,
    html: () => stringify(tree),
  };
}

/**
 * Mount a component in "hydration" mode. Compares the freshly-rendered HTML
 * against `ssrMarkup` and reports whether hydration matched (mirrors Solid's
 * `hydrate()` mismatch warning path).
 */
export function hydrate<TProps>(opts: HydrateOptions<TProps>): HydrateResult {
  const rendered = renderSolid(opts);
  const clientHtml = rendered.html();
  const mismatch = clientHtml === opts.ssrMarkup ? null : `mismatch: server=${opts.ssrMarkup} client=${clientHtml}`;
  return {
    ...rendered,
    hydrated: mismatch === null,
    mismatch,
  };
}

/**
 * Emulate Solid's `createRoot(fn)` — runs `fn(dispose)` inside a fresh effect
 * scope and returns the accumulated dispose handle plus a scope object so
 * tests can assert on `scope.disposed()`.
 */
export function createRoot<T>(fn: (dispose: () => void) => T): { result: T; scope: RootScope; dispose: () => void } {
  pushEffectScope();
  let torn = false;
  const collected: EffectHandle<unknown>[] = [];
  const dispose = (): void => {
    if (torn) return;
    torn = true;
    for (const eff of collected) eff.dispose();
  };
  const result = fn(dispose);
  const scoped = popEffectScope();
  collected.push(...scoped);
  const scope: RootScope = {
    disposed: () => torn,
  };
  return { result, scope, dispose };
}

/**
 * Recursively serialize a Solid virtual tree into an SSR-shaped HTML string.
 * Boolean attributes are elided, `class` maps to the `class` attribute
 * (Solid convention, not React's `className`), and children are stringified
 * without any XSS escaping — tests assert on shape, not on production output.
 */
export function stringify(node: SolidChild): string {
  if (node === null || node === undefined || node === false || node === true) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(stringify).join('');
  const element = node as SolidElement;
  const attrs = renderAttrs(element.props);
  const inner = element.children.map(stringify).join('');
  return `<${element.type}${attrs}>${inner}</${element.type}>`;
}

function renderAttrs(props: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;
    if (value === null || value === undefined || value === false) continue;
    if (value === true) {
      parts.push(` ${key}`);
      continue;
    }
    parts.push(` ${key}="${String(value)}"`);
  }
  return parts.join('');
}

/** Type guard: recognize a Solid virtual element (used by walkers + tests). */
export function isSolidElement(value: unknown): value is SolidElement {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [SOLID_ELEMENT_SYMBOL]?: true })[SOLID_ELEMENT_SYMBOL] === true
  );
}

/**
 * Depth-first traversal of a Solid virtual tree. Collects every element whose
 * `type` matches the predicate; strings / numbers / nulls are skipped.
 */
export function findElements(tree: SolidChild, predicate: (el: SolidElement) => boolean): SolidElement[] {
  const out: SolidElement[] = [];
  const visit = (node: SolidChild): void => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!isSolidElement(node)) return;
    if (predicate(node)) out.push(node);
    for (const child of node.children) visit(child);
  };
  visit(tree);
  return out;
}
