import { expect, it } from 'vitest';
import { checkConformance, formatConformance, generateLeanSpec } from '../src/index.js';

const checkout = {
  moduleName: 'Checkout', namespace: 'Checkout',
  states: ['draft', 'paid', 'cancelled'], events: ['pay', 'cancel'],
  transitions: [
    { from: 'draft', event: 'pay', to: 'paid' },
    { from: 'draft', event: 'cancel', to: 'cancelled' },
    { from: 'paid', event: 'pay', invalid: true },
    { from: 'paid', event: 'cancel', invalid: true },
    { from: 'cancelled', event: 'pay', invalid: true },
    { from: 'cancelled', event: 'cancel', invalid: true },
  ],
  initial: 'draft', terminal: ['paid', 'cancelled'],
} as const;

it('validates the Quickstart and how-to state-machine contract', () => {
  const generated = generateLeanSpec(checkout);
  expect(generated.meta).toMatchObject({ cellCount: 6, validTransitionCount: 2, invalidTransitionCount: 4 });
  const report = checkConformance(checkout, (state, event) => {
    if (state === 'draft' && event === 'pay') return { kind: 'to', state: 'paid' } as const;
    if (state === 'draft' && event === 'cancel') return { kind: 'to', state: 'cancelled' } as const;
    return { kind: 'rejected' } as const;
  });
  expect(report).toMatchObject({ ok: true, checked: 6 });
  expect(formatConformance(checkout, report)).toContain('Checkout: 6 cells agree');
});
