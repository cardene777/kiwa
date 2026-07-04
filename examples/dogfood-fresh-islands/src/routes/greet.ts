import {
  defineRoute,
  h,
  type DefinedRoute,
  type FreshChild,
  type FreshHandlers,
  type FreshPageProps,
} from '@kiwa-test/fresh';

/**
 * Greet route + handler — the smallest Fresh route the dogfood ships. The
 * handler responds to GET / POST with a JSON-shaped body and the defineRoute
 * page renders a `<main>` tree with the params interpolated.
 *
 * Both live in the same module so the fidelity harness can drive them
 * side-by-side through the adapter's `mountRoute` (defineRoute path) and
 * `driveHandler` (Handlers path) ops.
 */

export interface GreetPageData {
  readonly name: string;
  readonly at: number;
}

/**
 * Deno Fresh `Handlers` — GET returns JSON, POST accepts a JSON body with
 * `{ name }` and echoes the payload back through `ctx.render(data)` so the
 * dogfood can also assert on the captured render data path.
 */
export const greetHandlers: FreshHandlers<GreetPageData> = {
  GET: (_req, ctx) => {
    const query = ctx.url.searchParams.get('name') ?? 'world';
    return ctx.render({ name: query, at: 0 });
  },
  POST: async (req, ctx) => {
    let name = 'world';
    try {
      const body = (await req.json()) as { name?: unknown };
      if (typeof body?.name === 'string') name = body.name;
    } catch {
      // Body may be empty or non-JSON — fall back to the default.
    }
    return ctx.render({ name, at: 0 });
  },
};

/** Page component used by both defineRoute and invokeFreshHandler paths. */
export function greetPage(props: FreshPageProps<GreetPageData>): FreshChild {
  const data = props.data ?? { name: 'world', at: 0 };
  return h(
    'main',
    { class: 'greet', 'data-testid': 'greet-page' },
    h('h1', { class: 'greet-title' }, `hello ${data.name}`),
    h(
      'p',
      { class: 'greet-route', 'data-testid': 'greet-route' },
      `route=${props.route}`,
    ),
  );
}

/**
 * Wrap the same page in a Fresh `defineRoute` for the `mountRoute` path.
 * The defineRoute body reads `ctx.params.name` first, then falls back to
 * the search-param default so tests can exercise both parameter sources.
 */
export const greetDefineRoute: DefinedRoute<GreetPageData, Record<string, unknown>> = defineRoute(
  (_req, ctx) => {
    const paramName = ctx.params.name;
    const queryName = ctx.url.searchParams.get('name');
    const data: GreetPageData = {
      name: paramName ?? queryName ?? 'world',
      at: 0,
    };
    return greetPage({
      url: ctx.url,
      route: ctx.route,
      params: ctx.params,
      state: ctx.state,
      data,
    });
  },
);
