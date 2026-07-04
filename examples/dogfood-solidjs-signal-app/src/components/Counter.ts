import { h, type SolidChild, type SolidComponent } from '@kiwa-test/solidjs';
import type { CounterStore } from '../store/counter.js';

/**
 * Counter component — reads `store.count()` and renders 2 buttons wired to
 * `increment` / `reset`. Because the component reads the getter inside a
 * `mockEffect` (during renderSolid), the effect subscribes to the same
 * store as the observed trace. Tests assert on both the rendered markup
 * and the store's `observed()` sequence.
 *
 * The h() props are flat by design: `stringify()` serializes props as
 * attributes so `{ class: 'counter' }` maps to `class="counter"` in the
 * rendered markup. Event handlers are stored on the element but not
 * serialized (they are captured verbatim for tests that need to invoke
 * them directly).
 */
export interface CounterProps {
  readonly store: CounterStore;
  readonly label?: string;
}

export const Counter: SolidComponent<CounterProps> = (props): SolidChild => {
  const label = props.label ?? 'counter';
  const current = props.store.count();
  return h(
    'section',
    { class: 'counter', 'data-testid': 'counter' },
    h('h2', { class: 'counter-label' }, label),
    h(
      'p',
      { class: 'counter-value', 'data-testid': 'counter-value' },
      String(current),
    ),
    h(
      'button',
      {
        type: 'button',
        'data-testid': 'counter-increment',
        onClick: () => props.store.increment(1),
      },
      '+1',
    ),
    h(
      'button',
      {
        type: 'button',
        'data-testid': 'counter-reset',
        onClick: () => props.store.reset(),
      },
      'reset',
    ),
  );
};
