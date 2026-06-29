// Next.js async React Server Component (RSC) test helper for kiwa (Issue #494).
//
// Real RSC rendering involves a streaming runtime + a flight payload format
// that requires `vitest-environment-rsc` or a Next.js dev server. kiwa takes
// a lighter approach: treat the async server component as `async (props) =>
// JSX.Element` and await it directly. The returned React element tree is
// inspected with a small finder API instead of a full DOM.
//
// Out of scope:
//   - flight payload serialization
//   - client component boundary (`'use client'`)
//   - suspense streaming (synchronous resolution only)
//   - dangerous HTML rendering — tests assert on element shape, not strings

export const NOT_FOUND_SYMBOL = Symbol.for('kiwa.next.rsc.notFound');
export const FORBIDDEN_SYMBOL = Symbol.for('kiwa.next.rsc.forbidden');
export const RSC_REDIRECT_SYMBOL = Symbol.for('kiwa.next.rsc.redirect');

export interface NotFoundSignal {
  readonly [NOT_FOUND_SYMBOL]: true;
}
export interface ForbiddenSignal {
  readonly [FORBIDDEN_SYMBOL]: true;
}
export interface RscRedirectSignal {
  readonly [RSC_REDIRECT_SYMBOL]: true;
  readonly url: string;
  readonly type: 'replace' | 'push';
}

export type RscSignal = NotFoundSignal | ForbiddenSignal | RscRedirectSignal;

export interface RscElement {
  readonly type: string | symbol | ((props: Record<string, unknown>) => unknown);
  readonly props: Record<string, unknown>;
  readonly key: string | null;
}

export type RscNode = RscElement | string | number | boolean | null | undefined | RscNode[];

export interface RenderServerComponentOptions<TProps> {
  readonly component: (props: TProps) => Promise<RscNode> | RscNode;
  readonly props?: TProps;
}

export interface RenderServerComponentResult {
  readonly tree: RscNode;
  readonly signal: RscSignal | null;
  readonly error: unknown;
}

function isRscElement(node: unknown): node is RscElement {
  if (typeof node !== 'object' || node === null) return false;
  const candidate = node as { type?: unknown; props?: unknown };
  return (
    typeof candidate.type !== 'undefined' &&
    typeof candidate.props === 'object' &&
    candidate.props !== null
  );
}

function isNotFound(value: unknown): value is NotFoundSignal {
  return typeof value === 'object' && value !== null && (value as { [NOT_FOUND_SYMBOL]?: true })[NOT_FOUND_SYMBOL] === true;
}
function isForbidden(value: unknown): value is ForbiddenSignal {
  return typeof value === 'object' && value !== null && (value as { [FORBIDDEN_SYMBOL]?: true })[FORBIDDEN_SYMBOL] === true;
}
function isRscRedirect(value: unknown): value is RscRedirectSignal {
  return typeof value === 'object' && value !== null && (value as { [RSC_REDIRECT_SYMBOL]?: true })[RSC_REDIRECT_SYMBOL] === true;
}

/**
 * Recursively walk an RSC tree and collect every node that satisfies the
 * predicate. Children are read from `props.children` and are normalized to a
 * flat array regardless of how the component spelled them.
 */
export function findAll(tree: RscNode, predicate: (node: RscElement) => boolean): RscElement[] {
  const out: RscElement[] = [];
  function visit(node: RscNode): void {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!isRscElement(node)) return;
    if (predicate(node)) out.push(node);
    const children = node.props.children;
    if (typeof children !== 'undefined') {
      visit(children as RscNode);
    }
  }
  visit(tree);
  return out;
}

/**
 * Concatenate every string/number leaf of an RSC tree, joined by a single
 * space. Useful for `expect(textContent(tree)).toContain('hello')` style
 * assertions where the exact element structure does not matter.
 */
export function textContent(tree: RscNode): string {
  const parts: string[] = [];
  function visit(node: RscNode): void {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node === 'string' || typeof node === 'number') {
      parts.push(String(node));
      return;
    }
    if (isRscElement(node)) {
      const children = node.props.children;
      if (typeof children !== 'undefined') visit(children as RscNode);
    }
  }
  visit(tree);
  return parts.filter((p) => p.length > 0).join(' ');
}

/**
 * Invoke an async server component in isolation and capture its return tree.
 * Throws of `notFound() / forbidden() / redirect()` from `next/navigation`
 * should be replaced with the kiwa signals below (Pattern A from the
 * server-action seam doc); the helper normalizes them into `result.signal`
 * instead of leaving them as `result.error`.
 */
export async function renderServerComponent<TProps = Record<string, unknown>>(
  opts: RenderServerComponentOptions<TProps>,
): Promise<RenderServerComponentResult> {
  let tree: RscNode = null;
  let signal: RscSignal | null = null;
  let error: unknown;
  const props = (opts.props ?? ({} as TProps)) as TProps;
  try {
    const result = await opts.component(props);
    tree = result;
  } catch (caught) {
    if (isNotFound(caught) || isForbidden(caught) || isRscRedirect(caught)) {
      signal = caught;
    } else {
      error = caught;
    }
  }
  return { tree, signal, error };
}
