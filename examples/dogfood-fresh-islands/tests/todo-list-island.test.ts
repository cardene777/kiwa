import { describe, expect, it } from 'vitest';
import {
  hydrateIslands,
  islandPlaceholder,
  mountIsland,
  simulateInteraction,
  h,
  type IslandDefinition,
  type IslandMount,
  type IslandProps,
} from '@kiwa-lab/fresh';
import {
  TodoListIsland,
  getTodoListState,
  resetTodoListState,
} from '../src/islands/todo-list-island.js';

// Same rationale as counter-island.test.ts — the island definition is downcast
// to the erased IslandProps shape so hydrateIslands + simulateInteraction can
// consume it uniformly.
const TodoErased = TodoListIsland as unknown as IslandDefinition<IslandProps>;

describe('TodoList island (partial hydration + input + submit)', () => {
  it('T-DFI-TI-001 mount renders seed titles as <li>', () => {
    resetTodoListState();
    const mount = mountIsland(TodoErased, { seedTitles: ['a', 'b'] });
    expect(mount.html).toContain('<li');
    expect(mount.html).toContain('>a<');
    expect(mount.html).toContain('>b<');
    expect(getTodoListState().list).toEqual(['a', 'b']);
  });

  it('T-DFI-TI-002 input event updates draft state', () => {
    resetTodoListState();
    const mount: IslandMount = mountIsland(TodoErased, { seedTitles: [] });
    const result = simulateInteraction({ mount, event: 'input', value: 'walk dog' });
    expect(result.invoked).toBe(1);
    expect(getTodoListState().draft).toBe('walk dog');
  });

  it('T-DFI-TI-003 submit appends draft into list + resets draft', () => {
    resetTodoListState();
    const mount: IslandMount = mountIsland(TodoErased, { seedTitles: [] });
    simulateInteraction({ mount, event: 'input', value: 'walk dog' });
    const result = simulateInteraction({ mount, event: 'submit' });
    expect(result.invoked).toBe(1);
    expect(result.defaultPrevented).toBe(true);
    expect(getTodoListState().list).toEqual(['walk dog']);
    expect(getTodoListState().draft).toBe('');
  });

  it('T-DFI-TI-004 submit with empty draft is a no-op', () => {
    resetTodoListState();
    const mount: IslandMount = mountIsland(TodoErased, { seedTitles: ['seed'] });
    const result = simulateInteraction({ mount, event: 'submit' });
    expect(result.defaultPrevented).toBe(true);
    expect(getTodoListState().list).toEqual(['seed']);
  });

  it('T-DFI-TI-005 hydrateIslands finds TodoList placeholder in SSR tree', () => {
    resetTodoListState();
    const ssr = h(
      'main',
      null,
      islandPlaceholder(TodoErased, { seedTitles: ['x'] }),
    );
    const outcome = hydrateIslands({ ssrTree: ssr, islands: [TodoErased] });
    expect(outcome.hydrated.length).toBe(1);
    expect(outcome.hydrated[0]?.name).toBe('TodoList');
    expect(outcome.html).toContain('>x<');
  });

  it('T-DFI-TI-006 unregistered island name is reported', () => {
    resetTodoListState();
    const ssr = h('main', null, h('div', { 'data-island': 'Unknown' }));
    const outcome = hydrateIslands({ ssrTree: ssr, islands: [TodoErased] });
    expect(outcome.hydrated).toEqual([]);
    expect(outcome.unregistered).toEqual(['Unknown']);
    expect(outcome.missing).toContain('TodoList');
  });
});
