import { defineIsland, h, type IslandDefinition, type SyntheticEvent } from '@kiwa-lab/fresh';

/**
 * TodoList island — hosts an input + a rendered list of seed titles. The
 * onInput handler mutates the shared draft state and the onSubmit handler
 * commits the draft into the persisted list. Tests can drive both events
 * through `simulateInteraction` and observe the trace + the mutated draft.
 */

export interface TodoListIslandProps {
  readonly seedTitles: readonly string[];
  // Index signature is required by @kiwa-lab/fresh `IslandProps` constraint so
  // the JSON-serialized props round-trip through hydrateIslands without losing
  // typing at the island boundary.
  readonly [key: string]: unknown;
}

const todoListState: { draft: string; list: string[] } = {
  draft: '',
  list: [],
};

export function getTodoListState(): { draft: string; list: readonly string[] } {
  return { draft: todoListState.draft, list: [...todoListState.list] };
}

export function resetTodoListState(): void {
  todoListState.draft = '';
  todoListState.list = [];
}

export const TodoListIsland: IslandDefinition<TodoListIslandProps> = defineIsland<TodoListIslandProps>({
  name: 'TodoList',
  component: (props) => {
    todoListState.list = [...props.seedTitles];
    return h(
      'section',
      { class: 'todo-island', 'data-testid': 'todo-island' },
      h(
        'ul',
        { class: 'todo-list', 'data-testid': 'todo-list' },
        ...todoListState.list.map((title, index) =>
          h(
            'li',
            {
              class: 'todo-item',
              'data-testid': `todo-item-${index}`,
              key: String(index),
            },
            title,
          ),
        ),
      ),
      h('input', {
        type: 'text',
        'data-testid': 'todo-input',
        onInput: (event: SyntheticEvent) => {
          if (event.value !== undefined) todoListState.draft = String(event.value);
        },
      }),
      h(
        'form',
        {
          'data-testid': 'todo-form',
          onSubmit: (event: SyntheticEvent) => {
            event.preventDefault();
            if (todoListState.draft.length > 0) {
              todoListState.list = [...todoListState.list, todoListState.draft];
              todoListState.draft = '';
            }
          },
        },
        h(
          'button',
          { type: 'submit', 'data-testid': 'todo-submit' },
          'add',
        ),
      ),
    );
  },
  defaultProps: { seedTitles: [] },
});
