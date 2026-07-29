/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { reportViolations, runAxe } from '../../src/index.js';

const MODULE = 'a11y-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

const LOGIN_FORM = `<form>
  <label>Email <input type="email" name="email" /></label>
  <label>Password <input type="password" name="password" /></label>
  <button type="submit">Sign in</button>
</form>`;

const DASHBOARD = `<nav aria-label="main">
  <a href="/home">Home</a><a href="/reports">Reports</a><a href="/settings">Settings</a>
</nav>
<main>
  <h1>Dashboard</h1>
  <ul>${'<li>row</li>'.repeat(10)}</ul>
</main>`;

const CHECKOUT_FORM = `<form>
  <label>Card number <input type="text" name="card" /></label>
  <label>Expiry <input type="text" name="expiry" /></label>
  <label>CVC <input type="text" name="cvc" /></label>
  <button type="submit">Pay</button>
</form>`;

const DIRTY_TABLE = `<table>
  <tr><th></th><th></th></tr>
  ${'<tr><td>a</td><td>b</td></tr>'.repeat(5)}
</table>
<button></button>
<img src="a.png" />`;

function withScope(markup: string): Element {
  const root = document.createElement('div');
  root.innerHTML = markup;
  document.body.appendChild(root);
  return root;
}

function cleanup(root: Element): void {
  root.remove();
}

let axeChain: Promise<unknown> = Promise.resolve();
async function serializeAxe<T>(op: () => Promise<T>): Promise<T> {
  const previous = axeChain;
  let release!: () => void;
  axeChain = new Promise<void>((resolve) => { release = resolve; });
  try {
    await previous;
    return await op();
  } finally {
    release();
  }
}

describe('a11y app scenario perf (real workload)', () => {
  it('3-layer perf: multi-fixture audit workflow / violation report batch / error handling', async () => {
    const fixtures = [LOGIN_FORM, DASHBOARD, CHECKOUT_FORM];
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'audit_workflow (3 fixture runAxe cycle)',
          regressionGateWaived: 'p10 の実行間の振れ幅が 11-44% で、測る時期によって閾値を跨ぐ (#1718)',
          fn: () =>
            serializeAxe(async () => {
              for (const markup of fixtures) {
                const root = withScope(markup);
                try {
                  await runAxe({ context: root });
                } finally {
                  cleanup(root);
                }
              }
            }),
          serialP95CapMs: 1200,
        },
        {
          name: 'violation_report_batch (2 dirty runAxe + reportViolations)',
          regressionGateWaived: 'p10 の実行間の振れ幅が 21-29% で閾値 20% を超える (#1718)',
          fn: () =>
            serializeAxe(async () => {
              for (let i = 0; i < 2; i++) {
                const root = withScope(DIRTY_TABLE);
                try {
                  const results = await runAxe({ context: root });
                  reportViolations(results, { maxImpact: 'moderate' });
                } finally {
                  cleanup(root);
                }
              }
            }),
          serialP95CapMs: 900,
        },
        {
          name: 'audit_error_handling (3 invalid-context throw + catch)',
          fn: () =>
            serializeAxe(async () => {
              for (let i = 0; i < 3; i++) {
                try {
                  await runAxe({ context: null as unknown as Element });
                } catch { /* handled */ }
              }
            }),
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
