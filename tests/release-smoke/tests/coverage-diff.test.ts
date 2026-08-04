import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 つ親 = repo root
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

async function loadModule() {
  return (await import(`${REPO_ROOT}/scripts/post-coverage-diff.mjs`)) as {
    buildDeltaRows: (cur: Record<string, unknown>, base: Record<string, unknown>) => unknown[];
    renderMarkdown: (rows: unknown[]) => string;
    captureBaseline: (cur: Record<string, unknown>) => string;
  };
}

const FULL = {
  '@kiwa-lab/core': { lines: 96, branches: 82, functions: 100, statements: 96 },
  '@kiwa-lab/api': { lines: 98, branches: 91, functions: 100, statements: 98 },
  '@kiwa-lab/ui': { lines: 93, branches: 81, functions: 100, statements: 93 },
  '@kiwa-lab/data': { lines: 99, branches: 90, functions: 95, statements: 99 },
  '@kiwa-lab/cli-test': { lines: 100, branches: 88, functions: 100, statements: 100 },
  '@kiwa-lab/observability': { lines: 99, branches: 81, functions: 100, statements: 99 },
  '@kiwa-lab/e2e': { lines: 100, branches: 85, functions: 100, statements: 100 },
  '@kiwa-lab/cli': { lines: 94, branches: 82, functions: 100, statements: 94 },
  '@kiwa-lab/dapp': { lines: 98, branches: 90, functions: 100, statements: 98 },
  '@kiwa-lab/a11y': { lines: 100, branches: 95, functions: 100, statements: 100 },
  '@kiwa-lab/visual': { lines: 100, branches: 85, functions: 100, statements: 100 },
  '@kiwa-lab/nextjs': { lines: 98, branches: 94, functions: 87, statements: 98 },
  '@kiwa-lab/solidstart': { lines: 100, branches: 97, functions: 100, statements: 100 },
  '@kiwa-lab/edge': { lines: 100, branches: 100, functions: 100, statements: 100 },
};

describe('scripts/post-coverage-diff.mjs', () => {
  it('captures the current snapshot as JSON', async () => {
    const mod = await loadModule();
    const out = mod.captureBaseline(FULL);
    const parsed = JSON.parse(out);
    expect(parsed['@kiwa-lab/core'].lines).toBe(96);
  });

  it('annotates regressions with 🔻 and improvements with 🔺', async () => {
    const mod = await loadModule();
    const baseline = { ...FULL, '@kiwa-lab/core': { lines: 99, branches: 85, functions: 100, statements: 99 } };
    const rows = mod.buildDeltaRows(FULL, baseline);
    const markdown = mod.renderMarkdown(rows);
    expect(markdown).toContain('## 📊 Coverage diff');
    expect(markdown).toContain('@kiwa-lab/core');
    expect(markdown).toContain('🔻'); // regression
  });

  it('renders ±0.0 when current matches baseline', async () => {
    const mod = await loadModule();
    const rows = mod.buildDeltaRows(FULL, FULL);
    const markdown = mod.renderMarkdown(rows);
    expect(markdown).toContain('±0.0');
    expect(markdown).not.toContain('🔻');
    expect(markdown).not.toContain('🔺');
  });

  it('marks missing coverage rows as n/a', async () => {
    const mod = await loadModule();
    const partial = { ...FULL };
    delete (partial as Record<string, unknown>)['@kiwa-lab/dapp'];
    const rows = mod.buildDeltaRows(partial, FULL);
    const markdown = mod.renderMarkdown(rows);
    expect(markdown).toMatch(/@kiwa-lab\/dapp.*n\/a/);
  });
});
