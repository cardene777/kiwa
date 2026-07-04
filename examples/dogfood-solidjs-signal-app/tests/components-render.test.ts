import { describe, expect, it } from 'vitest';
import { renderSolid, stringify } from '@kiwa-test/solidjs';
import { Counter } from '../src/components/Counter.js';
import { TodoList } from '../src/components/TodoList.js';
import { UserProfile } from '../src/components/UserProfile.js';
import { createCounterStore } from '../src/store/counter.js';
import { createTodosStore } from '../src/store/todos.js';
import {
  createUserProfileStore,
  makeDefaultFetcher,
  makeErroringFetcher,
} from '../src/store/user-profile.js';

describe('components render (Signal-driven)', () => {
  it('T-DSSA-CR-001 Counter renders initial value + label', () => {
    const store = createCounterStore(0);
    const rendered = renderSolid<{ store: typeof store; label: string }>({
      component: Counter,
      props: { store, label: 'clicks' },
    });
    const markup = stringify(rendered.tree);
    expect(markup).toContain('data-testid="counter"');
    expect(markup).toContain('clicks');
    expect(markup).toContain('data-testid="counter-value">0<');
    expect(markup).toContain('data-testid="counter-increment"');
    rendered.dispose();
    store.dispose();
  });

  it('T-DSSA-CR-002 Counter re-renders reflect post-increment value', () => {
    const store = createCounterStore(0);
    store.increment(1);
    store.increment(1);
    const rendered = renderSolid<{ store: typeof store }>({
      component: Counter,
      props: { store },
    });
    const markup = stringify(rendered.tree);
    expect(markup).toContain('data-testid="counter-value">2<');
    rendered.dispose();
    store.dispose();
  });

  it('T-DSSA-CR-003 TodoList renders summary + N li rows', () => {
    const store = createTodosStore([]);
    store.add('a');
    store.add('b');
    const rendered = renderSolid<{ store: typeof store }>({
      component: TodoList,
      props: { store },
    });
    const markup = stringify(rendered.tree);
    expect(markup).toContain('data-testid="todos"');
    expect(markup).toContain('0/2 completed');
    // Each item rendered as a li with kebab id.
    const items = store.todos();
    for (const item of items) {
      expect(markup).toContain(`data-testid="todo-item-${item.id}"`);
    }
    rendered.dispose();
    store.dispose();
  });

  it('T-DSSA-CR-004 TodoList applies completed class + markAll count', () => {
    const store = createTodosStore([]);
    store.add('a');
    store.add('b');
    store.markAll(true);
    const rendered = renderSolid<{ store: typeof store }>({
      component: TodoList,
      props: { store },
    });
    const markup = stringify(rendered.tree);
    expect(markup).toContain('2/2 completed');
    expect(markup).toContain('data-completed="true"');
    rendered.dispose();
    store.dispose();
  });

  it('T-DSSA-CR-005 UserProfile renders loading before await', () => {
    const store = createUserProfileStore(makeDefaultFetcher({ id: 'u1', displayName: 'X', email: 'x@ex.com' }));
    const rendered = renderSolid<{ store: typeof store }>({
      component: UserProfile,
      props: { store },
    });
    const markup = stringify(rendered.tree);
    // Before awaiting, state is still `pending` so loading skeleton renders.
    expect(markup).toContain('data-testid="user-profile-loading"');
    rendered.dispose();
  });

  it('T-DSSA-CR-006 UserProfile renders ready card after await', async () => {
    const profile = { id: 'u42', displayName: 'Grace', email: 'grace@ex.com' };
    const store = createUserProfileStore(makeDefaultFetcher(profile));
    await store.handle.initialFetch;
    const rendered = renderSolid<{ store: typeof store }>({
      component: UserProfile,
      props: { store },
    });
    const markup = stringify(rendered.tree);
    expect(markup).toContain('data-testid="user-profile-ready"');
    expect(markup).toContain('Grace');
    expect(markup).toContain('grace@ex.com');
    expect(markup).toContain('id=u42');
    rendered.dispose();
  });

  it('T-DSSA-CR-007 UserProfile renders error state on failing fetcher', async () => {
    const store = createUserProfileStore(makeErroringFetcher('boom'));
    await store.handle.initialFetch;
    const rendered = renderSolid<{ store: typeof store }>({
      component: UserProfile,
      props: { store },
    });
    const markup = stringify(rendered.tree);
    expect(markup).toContain('data-testid="user-profile-error"');
    expect(markup).toContain('Error: boom');
    rendered.dispose();
  });
});
