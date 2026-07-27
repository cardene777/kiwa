import { expect, it } from 'vitest';
import { classify, splitSpec, type SpecDoc } from '../src/index.js';

it('validates the Quickstart classification and split', () => {
  const spec: SpecDoc = {
    title: 'Signup',
    items: [
      { id: 'AC-001', statement: 'session transitions follow the documented states', layer: 'formal', verifyBy: 'Session' },
      { id: 'AC-002', statement: 'signup persists the account', layer: 'runtime', verifyBy: 'tests/integration/signup.test.ts' },
    ],
  };
  expect(classify(spec).ok).toBe(true);
  expect(splitSpec(spec).specFormal).toContain('formal');
  expect(splitSpec(spec).specRuntime).toContain('runtime');
});

it('validates the how-to collision and human-review split', () => {
  const collision = classify({
    title: 'Signup',
    items: [
      { id: 'AC-001', statement: 'state transition is valid', layer: 'formal', verifyBy: 'tests/signup.test.ts' },
      { id: 'AC-002', statement: 'request is persisted', layer: 'runtime', verifyBy: 'tests/signup.test.ts' },
    ],
  });
  expect(collision.issues).toContainEqual(expect.objectContaining({ reason: 'both-layers-touch-same-artifact' }));

  const output = splitSpec({
    title: 'Signup',
    issueRef: 'KIWA-42',
    items: [
      { id: 'AC-001', statement: 'session transitions follow the documented states', layer: 'formal', verifyBy: 'Session' },
      { id: 'AC-002', statement: 'signup persists the account', layer: 'runtime', verifyBy: 'tests/integration/signup.test.ts' },
      { id: 'AC-003', statement: 'the approval screen is reviewed by product', layer: 'human', verifyBy: 'Product approval' },
    ],
  });
  expect(output.summary).toEqual({ total: 3, formalCount: 1, runtimeCount: 1, humanCount: 1 });
  expect(output.specRuntime).toContain('AC-003');
});
