/**
 * Advanced Next.js semantics — target-neutral axis SSOT.
 *
 * The helpers model App Router, Pages Router, and Edge Runtime behavior as
 * pure state machines. Tests can assert the neutral event while still seeing
 * a target-specific dialect through providerEventName.
 */
export type NextTarget = 'app-router' | 'pages-router' | 'edge-runtime';

export type NextAxis =
  | 'server-action-advanced'
  | 'partial-prerendering'
  | 'interception-routes'
  | 'parallel-routes-advanced';

export type NeutralEventName =
  | 'action.form_submitted'
  | 'action.revalidate_path'
  | 'action.revalidate_tag'
  | 'action.redirected'
  | 'ppr.static_shell_rendered'
  | 'ppr.dynamic_hole_opened'
  | 'ppr.streaming_boundary_flushed'
  | 'ppr.completed'
  | 'intercept.current_segment'
  | 'intercept.parent_segment'
  | 'intercept.root_catchall'
  | 'intercept.modal_opened'
  | 'parallel.default_rendered'
  | 'parallel.loading_rendered'
  | 'parallel.error_boundary_captured'
  | 'parallel.slot_navigated';

export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  amountCents: number;
  metadata: Record<string, string | number | boolean>;
}

const dialect: Record<NextTarget, Partial<Record<NeutralEventName, string>>> = {
  'app-router': {
    'action.form_submitted': 'app.server-action.form.submit',
    'action.revalidate_path': 'app.cache.revalidatePath',
    'action.revalidate_tag': 'app.cache.revalidateTag',
    'action.redirected': 'app.navigation.redirect',
    'ppr.static_shell_rendered': 'app.ppr.static-shell',
    'ppr.dynamic_hole_opened': 'app.ppr.dynamic-hole',
    'ppr.streaming_boundary_flushed': 'app.ppr.stream-boundary',
    'ppr.completed': 'app.ppr.complete',
    'intercept.current_segment': 'app.intercept.current',
    'intercept.parent_segment': 'app.intercept.parent',
    'intercept.root_catchall': 'app.intercept.root',
    'intercept.modal_opened': 'app.intercept.modal',
    'parallel.default_rendered': 'app.parallel.default',
    'parallel.loading_rendered': 'app.parallel.loading',
    'parallel.error_boundary_captured': 'app.parallel.error',
    'parallel.slot_navigated': 'app.parallel.navigate',
  },
  'pages-router': {
    'action.form_submitted': 'pages.api.form.submit',
    'action.revalidate_path': 'pages.isr.revalidate',
    'action.revalidate_tag': 'pages.cache.tag.noop',
    'action.redirected': 'pages.router.redirect',
    'ppr.static_shell_rendered': 'pages.ssg.shell',
    'ppr.dynamic_hole_opened': 'pages.ssr.dynamic-hole',
    'ppr.streaming_boundary_flushed': 'pages.stream.boundary',
    'ppr.completed': 'pages.render.complete',
    'intercept.current_segment': 'pages.intercept.current',
    'intercept.parent_segment': 'pages.intercept.parent',
    'intercept.root_catchall': 'pages.intercept.root',
    'intercept.modal_opened': 'pages.modal.open',
    'parallel.default_rendered': 'pages.slot.default',
    'parallel.loading_rendered': 'pages.slot.loading',
    'parallel.error_boundary_captured': 'pages.slot.error',
    'parallel.slot_navigated': 'pages.slot.navigate',
  },
  'edge-runtime': {
    'action.form_submitted': 'edge.action.form.submit',
    'action.revalidate_path': 'edge.cache.revalidatePath',
    'action.revalidate_tag': 'edge.cache.revalidateTag',
    'action.redirected': 'edge.response.redirect',
    'ppr.static_shell_rendered': 'edge.ppr.static-shell',
    'ppr.dynamic_hole_opened': 'edge.ppr.dynamic-hole',
    'ppr.streaming_boundary_flushed': 'edge.stream.boundary',
    'ppr.completed': 'edge.ppr.complete',
    'intercept.current_segment': 'edge.intercept.current',
    'intercept.parent_segment': 'edge.intercept.parent',
    'intercept.root_catchall': 'edge.intercept.root',
    'intercept.modal_opened': 'edge.modal.open',
    'parallel.default_rendered': 'edge.parallel.default',
    'parallel.loading_rendered': 'edge.parallel.loading',
    'parallel.error_boundary_captured': 'edge.parallel.error',
    'parallel.slot_navigated': 'edge.parallel.navigate',
  },
};

export function providerEventName(target: NextTarget, neutral: NeutralEventName): string {
  return dialect[target][neutral] ?? neutral;
}
