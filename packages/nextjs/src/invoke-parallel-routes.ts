// Next.js App Router Parallel Routes test helper for kiwa (Issue #523).
//
// Parallel Routes let an App Router layout render multiple async components in
// named slots: `layout({ children, @modal, @sidebar })`. Each slot may also
// provide a `default.tsx` fallback when no matching segment is present, and
// the URL pattern `(.)`/`(..)`/`(...)` enables Intercepting Routes that swap
// the slot rendering based on soft-vs-hard navigation.
//
// kiwa renders the layout in isolation with synthetic slot trees. The helper
// awaits all slot promises in parallel (mirroring the React parallel-render
// semantics), supplies optional Intercepting-Route resolution, and captures
// errors per slot so a single failing slot does not collapse the whole tree.
//
// Out of scope on purpose:
//   - real flight payload / React renderer (use `renderServerComponent` for
//     leaf-level RSC introspection)
//   - matcher / `loading.tsx` / `error.tsx` evaluation
//   - client component boundary (`'use client'`)

export const PARALLEL_INTERCEPTION_SYMBOL = Symbol.for('kiwa.next.parallel.interception');

export interface InterceptionMatch<TSlot extends string> {
  readonly [PARALLEL_INTERCEPTION_SYMBOL]: true;
  readonly slot: TSlot;
  readonly variant: 'intercepted' | 'default';
  readonly url: string;
  readonly distance: 'sibling' | 'parent' | 'root';
}

export type SlotComponent<TProps = Record<string, unknown>, TNode = unknown> = (
  props: TProps,
) => Promise<TNode> | TNode;

export type DefaultFallbackComponent<TNode = unknown> = () => Promise<TNode> | TNode;

export interface ParallelLayoutChildren<TSlots extends string, TNode = unknown> {
  readonly children: TNode;
  readonly slots: Readonly<Record<TSlots, TNode>>;
}

export type ParallelLayoutFunction<TSlots extends string, TLayoutProps, TNode = unknown> = (
  props: TLayoutProps & ParallelLayoutChildren<TSlots, TNode>,
) => Promise<TNode> | TNode;

export interface SlotInput<TSlots extends string, TNode = unknown> {
  readonly slot: TSlots;
  readonly component: SlotComponent<Record<string, unknown>, TNode> | null;
  readonly props?: Record<string, unknown>;
  readonly defaultFallback?: DefaultFallbackComponent<TNode>;
  readonly intercepting?: {
    readonly variant: 'intercepted' | 'default';
    readonly url: string;
    readonly distance?: 'sibling' | 'parent' | 'root';
  };
}

export interface InvokeParallelRoutesOptions<TSlots extends string, TLayoutProps, TNode = unknown> {
  readonly layout: ParallelLayoutFunction<TSlots, TLayoutProps, TNode>;
  readonly children: SlotComponent<Record<string, unknown>, TNode>;
  readonly childrenProps?: Record<string, unknown>;
  readonly slots: ReadonlyArray<SlotInput<TSlots, TNode>>;
  readonly layoutProps?: TLayoutProps;
}

export interface SlotRenderResult<TSlots extends string, TNode = unknown> {
  readonly slot: TSlots;
  readonly tree: TNode | null;
  readonly usedDefault: boolean;
  readonly interception: InterceptionMatch<TSlots> | null;
  readonly error: unknown;
}

export interface InvokeParallelRoutesResult<TSlots extends string, TNode = unknown> {
  readonly tree: TNode | null;
  readonly slotResults: ReadonlyArray<SlotRenderResult<TSlots, TNode>>;
  readonly childrenError: unknown;
  readonly layoutError: unknown;
}

async function renderSlot<TSlots extends string, TNode>(
  input: SlotInput<TSlots, TNode>,
): Promise<SlotRenderResult<TSlots, TNode>> {
  let tree: TNode | null = null;
  let usedDefault = false;
  let error: unknown;
  const interception: InterceptionMatch<TSlots> | null = input.intercepting
    ? {
        [PARALLEL_INTERCEPTION_SYMBOL]: true,
        slot: input.slot,
        variant: input.intercepting.variant,
        url: input.intercepting.url,
        distance: input.intercepting.distance ?? 'sibling',
      }
    : null;
  const useDefault =
    input.component === null ||
    interception?.variant === 'default';
  try {
    if (useDefault) {
      if (typeof input.defaultFallback !== 'function') {
        throw new Error(`slot ${input.slot}: no default.tsx fallback supplied`);
      }
      tree = await input.defaultFallback();
      usedDefault = true;
    } else if (input.component !== null) {
      tree = await input.component(input.props ?? {});
    }
  } catch (caught) {
    error = caught;
  }
  return { slot: input.slot, tree, usedDefault, interception, error };
}

/**
 * Invoke an App Router parallel-routes layout in isolation. All slot
 * components are rendered in parallel (Promise.all) so a slow slot cannot
 * block fast siblings; per-slot errors are captured into `slotResults`
 * without aborting the layout render.
 */
export async function invokeParallelRoutes<
  TSlots extends string,
  TLayoutProps = Record<string, unknown>,
  TNode = unknown,
>(
  opts: InvokeParallelRoutesOptions<TSlots, TLayoutProps, TNode>,
): Promise<InvokeParallelRoutesResult<TSlots, TNode>> {
  let childrenTree: TNode | null = null;
  let childrenError: unknown;
  let layoutError: unknown;
  try {
    childrenTree = await opts.children(opts.childrenProps ?? {});
  } catch (caught) {
    childrenError = caught;
  }
  const slotResults = await Promise.all(opts.slots.map((input) => renderSlot(input)));
  const slotMap: Record<string, TNode | null> = {};
  for (const result of slotResults) {
    slotMap[result.slot] = result.tree;
  }
  let tree: TNode | null = null;
  try {
    const props = {
      ...((opts.layoutProps ?? {}) as TLayoutProps),
      children: childrenTree as TNode,
      slots: slotMap as Readonly<Record<TSlots, TNode>>,
    } as TLayoutProps & ParallelLayoutChildren<TSlots, TNode>;
    tree = await opts.layout(props);
  } catch (caught) {
    layoutError = caught;
  }
  return { tree, slotResults, childrenError, layoutError };
}
