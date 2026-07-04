import { defineIsland, h, type IslandDefinition } from '@kiwa-test/fresh';

/**
 * Counter island — the smallest interactive island the dogfood ships. The
 * onClick handler mutates an external counter so tests can assert on both
 * the invocation trace (via `simulateInteraction`) and the numeric side
 * effect (via `getCounterState`).
 *
 * The counter state lives outside the island so the fidelity harness can
 * observe it after `simulateInteraction` without needing to reach into the
 * mounted tree.
 */

export interface CounterIslandProps {
  readonly label: string;
  readonly start: number;
  // Index signature is required by @kiwa-test/fresh `IslandProps` constraint so
  // the JSON-serialized props round-trip through hydrateIslands without losing
  // typing at the island boundary.
  readonly [key: string]: unknown;
}

const counterState: { value: number } = { value: 0 };

export function getCounterState(): number {
  return counterState.value;
}

export function resetCounterState(): void {
  counterState.value = 0;
}

export const CounterIsland: IslandDefinition<CounterIslandProps> = defineIsland<CounterIslandProps>({
  name: 'Counter',
  component: (props) => {
    counterState.value = props.start;
    return h(
      'section',
      { class: 'counter-island', 'data-testid': 'counter-island' },
      h('h2', { class: 'counter-island-label' }, props.label),
      h(
        'p',
        { class: 'counter-island-value', 'data-testid': 'counter-island-value' },
        `n=${props.start}`,
      ),
      h(
        'button',
        {
          type: 'button',
          'data-testid': 'counter-island-increment',
          onClick: () => {
            counterState.value += 1;
          },
        },
        '+1',
      ),
    );
  },
  defaultProps: { label: 'counter', start: 0 },
});
