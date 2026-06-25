// Layer: unit (vitest --environment node)
import { describe, expect, it } from 'vitest';
import { normalizeTitle, summarize, validateTitle, type Todo } from '../src/todo.js';

describe('todo unit logic', () => {
  it('normalizeTitle trims + collapses whitespace', () => {
    expect(normalizeTitle('  hello   world  ')).toBe('hello world');
  });

  it('validateTitle rejects empty input', () => {
    expect(validateTitle('   ').ok).toBe(false);
  });

  it('validateTitle accepts within 100 chars', () => {
    const result = validateTitle('walk the dog');
    expect(result).toEqual({ ok: true, value: 'walk the dog' });
  });

  it('validateTitle rejects > 100 chars', () => {
    expect(validateTitle('x'.repeat(101)).ok).toBe(false);
  });

  it('summarize returns ratios', () => {
    const todos: Todo[] = [
      { id: 1, title: 'a', done: true },
      { id: 2, title: 'b', done: false },
      { id: 3, title: 'c', done: true },
    ];
    const summary = summarize(todos);
    expect(summary).toEqual({ total: 3, done: 2, pending: 1, doneRatio: 2 / 3 });
  });
});
