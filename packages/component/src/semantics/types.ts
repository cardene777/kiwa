/**
 * Advanced component semantics — target-neutral axis SSOT.
 *
 * The component package spans Storybook 8, Playwright Component Testing, and
 * Chromatic. These helpers model the observable semantics without importing
 * any of those runtimes, so the same axis can be replayed against each target.
 */
export type ComponentTarget = 'storybook8' | 'playwright-ct' | 'chromatic';

export type ComponentAxis =
  | 'rsc-harness'
  | 'streaming-ssr'
  | 'view-transitions'
  | 'form-action-advanced'
  // v1.49 advanced III (pair 第 6 pair 3 段拡張)
  | 'react-19-actions'
  | 'islands-architecture';

export type NeutralEventName =
  | 'rsc.render_started'
  | 'rsc.suspense_boundary'
  | 'rsc.html_chunk_streamed'
  | 'rsc.render_completed'
  | 'ssr.suspense_pending'
  | 'ssr.error_boundary_captured'
  | 'ssr.progressive_hydration_started'
  | 'ssr.selective_hydration_completed'
  | 'transition.element_started'
  | 'transition.element_finished'
  | 'transition.document_started'
  | 'transition.animation_asserted'
  | 'form.status_pending'
  | 'form.optimistic_applied'
  | 'form.progressive_enhanced'
  | 'form.action_resolved'
  // v1.49 react-19-actions (useActionState + useOptimistic + useFormStatus 統合)
  | 'action.state_initialized'
  | 'action.transition_pending'
  | 'action.optimistic_committed'
  | 'action.resolved'
  // v1.49 islands-architecture (partial hydration + selective interactivity)
  | 'islands.registered'
  | 'islands.hydration_started'
  | 'islands.interactive_ready'
  | 'islands.static_boundary_asserted';

export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  amountCents: number;
  metadata: Record<string, string | number | boolean>;
}

const dialect: Record<ComponentTarget, Partial<Record<NeutralEventName, string>>> = {
  storybook8: {
    'rsc.render_started': 'storybook.play.start',
    'rsc.suspense_boundary': 'storybook.suspense.fallback',
    'rsc.html_chunk_streamed': 'storybook.stream.chunk',
    'rsc.render_completed': 'storybook.play.done',
    'ssr.suspense_pending': 'storybook.suspense.pending',
    'ssr.error_boundary_captured': 'storybook.error.boundary',
    'ssr.progressive_hydration_started': 'storybook.hydration.progressive',
    'ssr.selective_hydration_completed': 'storybook.hydration.selective',
    'transition.element_started': 'storybook.transition.element.start',
    'transition.element_finished': 'storybook.transition.element.finish',
    'transition.document_started': 'storybook.transition.document.start',
    'transition.animation_asserted': 'storybook.animation.assert',
    'form.status_pending': 'storybook.form.pending',
    'form.optimistic_applied': 'storybook.form.optimistic',
    'form.progressive_enhanced': 'storybook.form.enhanced',
    'form.action_resolved': 'storybook.form.resolved',
  },
  'playwright-ct': {
    'rsc.render_started': 'pwct.mount.rsc.start',
    'rsc.suspense_boundary': 'pwct.locator.suspense.fallback',
    'rsc.html_chunk_streamed': 'pwct.response.chunk',
    'rsc.render_completed': 'pwct.mount.rsc.done',
    'ssr.suspense_pending': 'pwct.suspense.pending',
    'ssr.error_boundary_captured': 'pwct.error.boundary',
    'ssr.progressive_hydration_started': 'pwct.hydration.progressive',
    'ssr.selective_hydration_completed': 'pwct.hydration.selective',
    'transition.element_started': 'pwct.transition.element.start',
    'transition.element_finished': 'pwct.transition.element.finish',
    'transition.document_started': 'pwct.transition.document.start',
    'transition.animation_asserted': 'pwct.animation.assert',
    'form.status_pending': 'pwct.form.pending',
    'form.optimistic_applied': 'pwct.form.optimistic',
    'form.progressive_enhanced': 'pwct.form.enhanced',
    'form.action_resolved': 'pwct.form.resolved',
  },
  chromatic: {
    'rsc.render_started': 'chromatic.capture.rsc.start',
    'rsc.suspense_boundary': 'chromatic.capture.suspense',
    'rsc.html_chunk_streamed': 'chromatic.capture.chunk',
    'rsc.render_completed': 'chromatic.capture.rsc.done',
    'ssr.suspense_pending': 'chromatic.suspense.pending',
    'ssr.error_boundary_captured': 'chromatic.error.snapshot',
    'ssr.progressive_hydration_started': 'chromatic.hydration.progressive',
    'ssr.selective_hydration_completed': 'chromatic.hydration.selective',
    'transition.element_started': 'chromatic.transition.element.start',
    'transition.element_finished': 'chromatic.transition.element.finish',
    'transition.document_started': 'chromatic.transition.document.start',
    'transition.animation_asserted': 'chromatic.animation.assert',
    'form.status_pending': 'chromatic.form.pending',
    'form.optimistic_applied': 'chromatic.form.optimistic',
    'form.progressive_enhanced': 'chromatic.form.enhanced',
    'form.action_resolved': 'chromatic.form.resolved',
  },
};

export function providerEventName(target: ComponentTarget, neutral: NeutralEventName): string {
  return dialect[target][neutral] ?? neutral;
}
