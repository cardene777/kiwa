#!/usr/bin/env node
/**
 * Posts a coverage delta report as a PR comment.
 *
 * Reads each package's `coverage/coverage-summary.json` (vitest v8 output) plus
 * a baseline JSON captured from `main`, computes the per-metric delta, and
 * renders a markdown table that the workflow can paste into the PR via the
 * GitHub API.
 *
 * Usage (CI):
 *   node scripts/post-coverage-diff.mjs \
 *     --baseline coverage-baseline.json \
 *     --pr-number 123 \
 *     --repo cardene777/kiwa
 *
 * The baseline file is a flat object `{ "<package>": { lines, branches, ... } }`
 * captured by `node scripts/post-coverage-diff.mjs --capture > baseline.json`
 * on the `main` branch and uploaded as a workflow artifact.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PACKAGES = [
  { name: '@kiwa-test/spec', dir: 'packages/spec' },
  { name: '@kiwa-test/api', dir: 'packages/api' },
  { name: '@kiwa-test/ui', dir: 'packages/ui' },
  { name: '@kiwa-test/data', dir: 'packages/data' },
  { name: '@kiwa-test/cli-test', dir: 'packages/cli-test' },
  { name: '@kiwa-test/observability', dir: 'packages/observability' },
  { name: '@kiwa-test/e2e', dir: 'packages/e2e' },
  { name: '@kiwa-test/cli', dir: 'packages/cli' },
  { name: '@kiwa-test/core', dir: 'packages/core' },
  { name: '@kiwa-test/a11y', dir: 'packages/a11y' },
];

const METRICS = ['lines', 'branches', 'functions', 'statements'];

export function loadCurrentSummary(repoRoot) {
  const out = {};
  for (const pkg of PACKAGES) {
    const summaryPath = resolve(repoRoot, pkg.dir, 'coverage/coverage-summary.json');
    if (!existsSync(summaryPath)) {
      out[pkg.name] = null;
      continue;
    }
    const raw = JSON.parse(readFileSync(summaryPath, 'utf8'));
    const total = raw.total ?? null;
    if (!total) {
      out[pkg.name] = null;
      continue;
    }
    const metrics = {};
    for (const m of METRICS) {
      metrics[m] = total[m]?.pct ?? 0;
    }
    out[pkg.name] = metrics;
  }
  return out;
}

export function loadBaseline(baselinePath) {
  if (!existsSync(baselinePath)) return {};
  return JSON.parse(readFileSync(baselinePath, 'utf8'));
}

export function buildDeltaRows(current, baseline) {
  const rows = [];
  for (const pkg of PACKAGES) {
    const cur = current[pkg.name];
    const base = baseline[pkg.name] ?? null;
    if (!cur) {
      rows.push({
        name: pkg.name,
        missing: true,
        cur: null,
        base,
        deltas: null,
        worstDelta: 0,
      });
      continue;
    }
    const deltas = {};
    let worst = 0;
    for (const m of METRICS) {
      const c = cur[m] ?? 0;
      const b = base?.[m] ?? c;
      const d = c - b;
      deltas[m] = d;
      if (d < worst) worst = d;
    }
    rows.push({
      name: pkg.name,
      missing: false,
      cur,
      base,
      deltas,
      worstDelta: worst,
    });
  }
  return rows;
}

function formatPct(value) {
  return `${value.toFixed(1)}%`;
}

function formatDelta(value) {
  if (value === 0) return '±0.0';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}`;
}

export function renderMarkdown(rows) {
  const lines = [];
  lines.push('## 📊 Coverage diff');
  lines.push('');
  lines.push('| package | lines | branches | functions | statements | worst Δ |');
  lines.push('|---|---|---|---|---|---|');
  for (const row of rows) {
    if (row.missing) {
      lines.push(`| ${row.name} | — | — | — | — | n/a |`);
      continue;
    }
    const cells = METRICS.map((m) => {
      const cur = row.cur[m];
      const delta = row.deltas[m];
      const marker = delta < -0.05 ? ' 🔻' : delta > 0.05 ? ' 🔺' : '';
      return `${formatPct(cur)} (${formatDelta(delta)})${marker}`;
    });
    const worst = row.worstDelta;
    const worstFmt = formatDelta(worst);
    lines.push(`| ${row.name} | ${cells.join(' | ')} | ${worstFmt} |`);
  }
  lines.push('');
  return lines.join('\n');
}

export function captureBaseline(current) {
  return JSON.stringify(current, null, 2);
}

async function main() {
  const args = process.argv.slice(2);
  const repoRoot = process.cwd();

  if (args.includes('--capture')) {
    const current = loadCurrentSummary(repoRoot);
    process.stdout.write(captureBaseline(current));
    return;
  }

  let baselinePath = null;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--baseline') {
      baselinePath = args[i + 1];
      break;
    }
  }

  const current = loadCurrentSummary(repoRoot);
  const baseline = baselinePath ? loadBaseline(resolve(repoRoot, baselinePath)) : {};
  const rows = buildDeltaRows(current, baseline);
  process.stdout.write(renderMarkdown(rows));
}

const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
  await main();
}
