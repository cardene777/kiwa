import { h, type SolidChild, type SolidComponent } from '@kiwa/solidjs';
import type { TodosStore } from '../store/todos.js';

/**
 * TodoList component — reads `store.todos()` and renders 1 `<li>` per
 * item plus 2 batch controls (mark-all-complete / mark-all-active). Every
 * `<li>` carries a `data-testid="todo-item-{id}"` so tests can grep
 * individual rows without walking the tree by index.
 */
export interface TodoListProps {
  readonly store: TodosStore;
  readonly title?: string;
}

export const TodoList: SolidComponent<TodoListProps> = (props): SolidChild => {
  const title = props.title ?? 'todos';
  const list = props.store.todos();
  const completed = props.store.completedCount();
  return h(
    'section',
    { class: 'todos', 'data-testid': 'todos' },
    h('h2', { class: 'todos-title' }, title),
    h(
      'p',
      { class: 'todos-summary', 'data-testid': 'todos-summary' },
      `${completed}/${list.length} completed`,
    ),
    h(
      'ul',
      { class: 'todos-list' },
      ...list.map((item) =>
        h(
          'li',
          {
            class: item.completed ? 'todo-item completed' : 'todo-item',
            'data-testid': `todo-item-${item.id}`,
            'data-completed': item.completed ? 'true' : 'false',
            onClick: () => props.store.toggle(item.id),
          },
          item.title,
        ),
      ),
    ),
    h(
      'button',
      {
        type: 'button',
        'data-testid': 'todos-mark-all-complete',
        onClick: () => props.store.markAll(true),
      },
      'mark all complete',
    ),
    h(
      'button',
      {
        type: 'button',
        'data-testid': 'todos-mark-all-active',
        onClick: () => props.store.markAll(false),
      },
      'mark all active',
    ),
  );
};
