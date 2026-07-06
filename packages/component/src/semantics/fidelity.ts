import { providerEventName, type ComponentAxis, type ComponentTarget, type NeutralEventName } from './types.js';

export interface FidelityRow {
  provider: ComponentTarget;
  axis: ComponentAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}

export interface FidelityCoverage {
  providers: ComponentTarget[];
  axes: ComponentAxis[];
  rows: FidelityRow[];
}

export const COMPONENT_AXIS_TO_EVENTS: Record<ComponentAxis, NeutralEventName[]> = {
  'rsc-harness': [
    'rsc.render_started',
    'rsc.suspense_boundary',
    'rsc.html_chunk_streamed',
    'rsc.render_completed',
  ],
  'streaming-ssr': [
    'ssr.suspense_pending',
    'ssr.error_boundary_captured',
    'ssr.progressive_hydration_started',
    'ssr.selective_hydration_completed',
  ],
  'view-transitions': [
    'transition.element_started',
    'transition.element_finished',
    'transition.document_started',
    'transition.animation_asserted',
  ],
  'form-action-advanced': [
    'form.status_pending',
    'form.optimistic_applied',
    'form.progressive_enhanced',
    'form.action_resolved',
  ],
};

export function collectFidelityCoverage(
  providers: ComponentTarget[] = ['storybook8', 'playwright-ct', 'chromatic'],
): FidelityCoverage {
  const axes = Object.keys(COMPONENT_AXIS_TO_EVENTS) as ComponentAxis[];
  const rows: FidelityRow[] = [];
  for (const provider of providers) {
    for (const axis of axes) {
      const neutralEvents = COMPONENT_AXIS_TO_EVENTS[axis];
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
