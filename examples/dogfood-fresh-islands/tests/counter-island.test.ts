import { describe, expect, it } from 'vitest';
import {
  h,
  hydrateIslands,
  islandPlaceholder,
  mountIsland,
  simulateInteraction,
  type IslandDefinition,
  type IslandMount,
  type IslandProps,
} from '@kiwa/fresh';
import {
  CounterIsland,
  getCounterState,
  resetCounterState,
} from '../src/islands/counter-island.js';

// Cast the island definition down to the erased IslandProps shape so the
// simulateInteraction + hydrateIslands helpers accept it. The runtime shape is
// unchanged — CounterIsland's component still reads props.label / props.start
// through the JSON-encoded props roundtrip.
const CounterErased = CounterIsland as unknown as IslandDefinition<IslandProps>;

describe('Counter island (partial hydration + interaction)', () => {
  it('T-DFI-CI-001 mount renders <section> tree with start value', () => {
    resetCounterState();
    const mount = mountIsland(CounterErased, { label: 'counter', start: 5 });
    expect(mount.html).toContain('n=5');
    expect(mount.html).toContain('counter-island-increment');
    expect(getCounterState()).toBe(5);
  });

  it('T-DFI-CI-002 hydrateIslands turns placeholder into mounted tree', () => {
    resetCounterState();
    const ssr = h(
      'main',
      null,
      islandPlaceholder(CounterErased, { label: 'counter', start: 3 }),
    );
    const outcome = hydrateIslands({ ssrTree: ssr, islands: [CounterErased] });
    expect(outcome.hydrated.length).toBe(1);
    expect(outcome.hydrated[0]?.name).toBe('Counter');
    expect(outcome.missing).toEqual([]);
    expect(outcome.unregistered).toEqual([]);
    expect(outcome.html).toContain('n=3');
  });

  it('T-DFI-CI-003 simulateInteraction click increments state', () => {
    resetCounterState();
    const mount: IslandMount = mountIsland(CounterErased, { label: 'counter', start: 0 });
    const result = simulateInteraction({ mount, event: 'click' });
    expect(result.invoked).toBe(1);
    expect(getCounterState()).toBe(1);
  });

  it('T-DFI-CI-004 3 clicks in sequence produce state=3', () => {
    resetCounterState();
    const mount: IslandMount = mountIsland(CounterErased, { label: 'counter', start: 0 });
    for (let i = 0; i < 3; i += 1) {
      simulateInteraction({ mount, event: 'click' });
    }
    expect(getCounterState()).toBe(3);
  });

  it('T-DFI-CI-005 unknown event name invokes 0 handlers', () => {
    resetCounterState();
    const mount: IslandMount = mountIsland(CounterErased, { label: 'counter', start: 0 });
    const result = simulateInteraction({ mount, event: 'input' });
    expect(result.invoked).toBe(0);
    expect(getCounterState()).toBe(0);
  });

  it('T-DFI-CI-006 island name in placeholder matches definition', () => {
    resetCounterState();
    const placeholder = islandPlaceholder(CounterErased, { label: 'x', start: 0 });
    expect(placeholder.props['data-island']).toBe('Counter');
    expect(placeholder.props['data-props']).toContain('"label":"x"');
  });
});
