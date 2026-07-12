import { describe, expect, it } from 'vitest';
import { MESSAGE_ROLES, isMessageRole } from '../src/types.js';

describe('ai-llm/types runtime const', () => {
  it('MESSAGE_ROLES exports 4-element tuple', () => {
    expect(MESSAGE_ROLES).toEqual(['system', 'user', 'assistant', 'tool']);
  });

  it('isMessageRole returns true for valid role', () => {
    expect(isMessageRole('system')).toBe(true);
    expect(isMessageRole('user')).toBe(true);
    expect(isMessageRole('assistant')).toBe(true);
    expect(isMessageRole('tool')).toBe(true);
  });

  it('isMessageRole returns false for unknown value', () => {
    expect(isMessageRole('function')).toBe(false);
    expect(isMessageRole('')).toBe(false);
  });
});
