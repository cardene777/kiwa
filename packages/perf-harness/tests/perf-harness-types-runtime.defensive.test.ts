import { describe, expect, it } from 'vitest';
import * as perfTypes from '../src/types.js';

describe('perf-harness/types module load', () => {
  it('module loads without exported runtime values (interfaces only)', () => {
    expect(perfTypes).toBeDefined();
    expect(typeof perfTypes).toBe('object');
  });
});
