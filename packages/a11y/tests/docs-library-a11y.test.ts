import { afterEach, expect, test } from 'vitest';
import { expectNoViolations, reportViolations, runAxe, runLayerHarness } from '../src/index.js';

const originalBody = document.body.innerHTML;

afterEach(() => {
  document.body.innerHTML = originalBody;
});

test('the quickstart gates a labelled button at the chosen impact threshold', async () => {
  document.body.innerHTML = '<div id="root"><button type="button" aria-label="increment">+</button></div>';
  const root = document.getElementById('root');
  const results = await runAxe({ context: root as Element });
  expectNoViolations(results, expect, { maxImpact: 'serious' });
});

test('the how-to records applicable and absent layers separately', async () => {
  document.body.innerHTML = `
    <main id="checkout">
      <label for="email">Email</label>
      <input id="email" type="email" />
      <button type="submit">Pay</button>
    </main>
  `;
  const root = document.getElementById('checkout') as Element;
  const results = await runAxe({ context: root });
  const violations = reportViolations(results, { maxImpact: 'serious' });
  expect(violations.blocking, violations.summary).toEqual([]);
  expectNoViolations(results, expect, { maxImpact: 'serious' });

  document.body.innerHTML = '<button type="button" aria-label="close">×</button>';
  const report = await runLayerHarness('@acme/checkout', { jsdom: { context: document.body } });
  expect(report.layers.jsdom.applicable).toBe(true);
  expect(report.layers.playwright).toMatchObject({ applicable: false });
  expect(report.totals.critical).toBe(0);
  expect(report.ok).toBe(true);
});
