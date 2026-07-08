import { providerEventName, type NeutralEventName, type NextAxis, type NextTarget } from './types.js';

export interface FidelityRow {
  provider: NextTarget;
  axis: NextAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}

export interface FidelityCoverage {
  providers: NextTarget[];
  axes: NextAxis[];
  rows: FidelityRow[];
}

export const NEXT_AXIS_TO_EVENTS: Record<NextAxis, NeutralEventName[]> = {
  'server-action-advanced': [
    'action.form_submitted',
    'action.revalidate_path',
    'action.revalidate_tag',
    'action.redirected',
  ],
  'partial-prerendering': [
    'ppr.static_shell_rendered',
    'ppr.dynamic_hole_opened',
    'ppr.streaming_boundary_flushed',
    'ppr.completed',
  ],
  'interception-routes': [
    'intercept.current_segment',
    'intercept.parent_segment',
    'intercept.root_catchall',
    'intercept.modal_opened',
  ],
  'parallel-routes-advanced': [
    'parallel.default_rendered',
    'parallel.loading_rendered',
    'parallel.error_boundary_captured',
    'parallel.slot_navigated',
  ],
  // v1.49 advanced III
  'turbopack-hmr': [
    'turbopack.module_updated',
    'turbopack.hmr_boundary_found',
    'turbopack.hmr_applied',
    'turbopack.fast_refresh_completed',
  ],
  'concurrent-transitions': [
    'transition.started',
    'transition.pending',
    'transition.interrupted',
    'transition.committed',
  ],
};

export function collectFidelityCoverage(
  providers: NextTarget[] = ['app-router', 'pages-router', 'edge-runtime'],
): FidelityCoverage {
  const axes = Object.keys(NEXT_AXIS_TO_EVENTS) as NextAxis[];
  const rows: FidelityRow[] = [];
  for (const provider of providers) {
    for (const axis of axes) {
      const neutralEvents = NEXT_AXIS_TO_EVENTS[axis];
      rows.push({
        provider,
        axis,
        neutralEvents,
        providerEvents: neutralEvents.map((event) => providerEventName(provider, event)),
      });
    }
  }
  return { providers, axes, rows };
}
