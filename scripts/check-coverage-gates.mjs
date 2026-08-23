#!/usr/bin/env node
/**
 * CI coverage gate.
 *
 * Reads each package's `coverage/coverage-summary.json` (vitest v8 output) and
 * fails the build when a package's total Lines / Branches / Functions / Statements
 * falls below the configured thresholds.
 *
 * Run with `node scripts/check-coverage-gates.mjs` from the repo root after
 * each `pnpm -F <pkg> run test:cov` has produced its coverage report.
 *
 * Nothing here regenerates that report, so a package whose `src/` moved on
 * after the last `test:cov` would be scored on code that is no longer there.
 * #2124 measured that gap on the neighbouring mutation gate: the stored value
 * said 83.33 while a re-run said 81.37, and the gate passed on the older one.
 * Each package's report is checked against when its implementation last
 * changed, and a report that predates it fails with the command to re-run.
 * `scripts/lib/artifact-freshness.mjs` carries why that comparison is not a
 * plain mtime check.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkArtifactFreshness, staleMessage } from './lib/artifact-freshness.mjs';
import { compareArtifactInputs } from './lib/input-fingerprint.mjs';
import { COVERAGE_INPUT_DIRS } from './lib/gate-inputs.mjs';

// Default to the repo containing this script, but allow CWD override for tests / CI.
// `fileURLToPath`, not `.pathname`: a `file:` URL keeps percent-encoding, so a
// checkout under a directory with a space resolves to `…/kiwa%20probe/…`, a path
// that does not exist. `scripts/lib/is-main-module.mjs` records the same trap.
const SCRIPT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const REPO_ROOT = process.env.KIWA_GATE_ROOT
  ? resolve(process.env.KIWA_GATE_ROOT)
  : process.cwd() !== '/' && existsSync(resolve(process.cwd(), 'packages'))
  ? process.cwd()
  : SCRIPT_ROOT;

const PACKAGES = [
  '@kiwa-lab/core',
  '@kiwa-lab/api',
  '@kiwa-lab/ui',
  '@kiwa-lab/data',
  '@kiwa-lab/cli-test',
  '@kiwa-lab/observability',
  '@kiwa-lab/e2e',
  '@kiwa-lab/cli',
  '@kiwa-lab/dapp',
  '@kiwa-lab/a11y',
  '@kiwa-lab/nextjs',
  '@kiwa-lab/edge',
  '@kiwa-lab/hono',
  '@kiwa-lab/auth',
  '@kiwa-lab/search',
  '@kiwa-lab/security',
  '@kiwa-lab/realtime',
  '@kiwa-lab/cache',
  '@kiwa-lab/ai-llm',
  '@kiwa-lab/component',
  '@kiwa-lab/perf-harness',
  '@kiwa-lab/quality-metrics',
  '@kiwa-lab/lean',
  '@kiwa-lab/queue',
  '@kiwa-lab/orm',
  '@kiwa-lab/skill-test',
];

const PKG_DIRS = {
  '@kiwa-lab/core': 'packages/core',
  '@kiwa-lab/api': 'packages/api',
  '@kiwa-lab/ui': 'packages/ui',
  '@kiwa-lab/data': 'packages/data',
  '@kiwa-lab/cli-test': 'packages/cli-test',
  '@kiwa-lab/observability': 'packages/observability',
  '@kiwa-lab/e2e': 'packages/e2e',
  '@kiwa-lab/cli': 'packages/cli',
  '@kiwa-lab/dapp': 'packages/dapp',
  '@kiwa-lab/a11y': 'packages/a11y',
  '@kiwa-lab/nextjs': 'packages/nextjs',
  '@kiwa-lab/edge': 'packages/edge',
  '@kiwa-lab/hono': 'packages/hono',
  '@kiwa-lab/auth': 'packages/auth',
  '@kiwa-lab/search': 'packages/search',
  '@kiwa-lab/security': 'packages/security',
  '@kiwa-lab/realtime': 'packages/realtime',
  '@kiwa-lab/cache': 'packages/cache',
  '@kiwa-lab/ai-llm': 'packages/ai-llm',
  '@kiwa-lab/component': 'packages/component',
  '@kiwa-lab/perf-harness': 'packages/perf-harness',
  '@kiwa-lab/quality-metrics': 'packages/quality-metrics',
  '@kiwa-lab/lean': 'packages/lean',
  '@kiwa-lab/queue': 'packages/queue',
  '@kiwa-lab/orm': 'packages/orm',
  '@kiwa-lab/skill-test': 'packages/skill-test',
};

// Lines / functions / statements stay at 90. Branches stay at 80 because the
// dynamic-import error paths in optional-peer-dep wrappers (msw / pixelmatch
// / pngjs / @testing-library/* / @vue/test-utils / @solidjs/testing-library
// / lit / @noma.to/qwik-testing-library / @testing-library/angular) cannot
// be exercised inside the package-local tests when the peer is installed.
// The mutation gate (check-mutation-gates.mjs) catches regressions on the
// non-branch logic that coverage cannot.
//
// That hand-off does NOT hold everywhere, so do not reach for
// `--coverage.exclude` as a way to "let mutation testing cover it" (Issue
// #1939). The mutation configs of `orm` and `queue` list a single file each
// (`expectations.ts` / `sandbox-queue.ts`), i.e. 3.1% and 8.2% of those
// packages. Excluding a path from coverage there removes it from every gate at
// once rather than moving it to another one.
//
// The peer-dependency wrappers those packages own are reachable without a real
// backend: `cache/src/testcontainers-cache.ts` has the same shape (dynamic
// `await import` behind a duck-typed module interface) and sits at 98.91% via
// in-process fakes in `cache/tests/semantics/coverage-fill.test.ts`. The queue
// side follows that shape in
// `queue/tests/semantics/testcontainers-queue-coverage.test.ts`.
const THRESHOLDS = {
  lines: 90,
  statements: 90,
  branches: 80,
  functions: 90,
};

/**
 * 到達した最高値の記録先。
 *
 * 固定閾値だけでは、実測との間にある余白がそのまま「静かに下がってよい幅」 になる
 * (#2177)。 kiwa の line は 99.65% だが閾値は 90% なので、10 point 落ちても gate は緑だった。
 *
 * library として様々な環境で使われる以上、この repo で 100% を出すこと自体に意味は薄い。
 * 意味があるのは **覆った範囲が静かに剥がれないこと**で、それを守るのが高水位。
 *
 * 3 つ知っておくこと。
 *
 * 1. **更新は上げる方向にしか効かない**。 `--update-high-water` は高い方を採るので、
 *    実測が下がっても記録は動かない。 意図的に下げる (code を消した等) 場合は file を手で直す。
 *    自動で下げると「下がった値を baseline にして常に緑」 になる。
 * 2. **鮮度ゲートで落ちた package は記録されない**。 判定より前に `continue` するため。
 *    初回の記録は全 package が fresh な状態で取る。
 * 3. **記録が無い package は固定閾値だけで判定する**。 新規 package が gate を素通りしない
 *    ように、固定閾値の側は残してある。
 */
const HIGH_WATER_PATH = resolve(REPO_ROOT, 'coverage-high-water.json');

/** 実測が高水位を上回った時に記録を更新する。 gate の実行では更新しない。 */
const UPDATE_HIGH_WATER = process.argv.includes('--update-high-water');

/**
 * 端数の許容。 固定閾値側と同じ値を使う。
 *
 * 揃えないと、同じ丸め差が片方だけで落ちる。
 */
const EPSILON = 0.0001;

function loadHighWater() {
  if (!existsSync(HIGH_WATER_PATH)) return {};
  try {
    const raw = JSON.parse(readFileSync(HIGH_WATER_PATH, 'utf8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    // 壊れた記録は「記録なし」 に倒す。 gate を止めるのは coverage の劣化だけにしたい。
    process.stderr.write(`warning: ${HIGH_WATER_PATH} を読めないため高水位判定を行いません\n`);
    return {};
  }
}

function loadSummary(pkgDir) {
  const summaryPath = resolve(REPO_ROOT, pkgDir, 'coverage/coverage-summary.json');
  if (!existsSync(summaryPath)) {
    return { ok: false, reason: `no coverage-summary.json at ${summaryPath}` };
  }
  const raw = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const total = raw.total;
  if (!total) return { ok: false, reason: `coverage-summary.json missing "total"` };
  return { ok: true, total };
}

const SUMMARY_REL = 'coverage/coverage-summary.json';

/**
 * Whether this package's report still describes its `src/`.
 *
 * `missing` is left to `loadSummary`, which names the path it looked for; a
 * freshness failure would replace that with a vaguer message. Anything the
 * check cannot work out fails here — a gate that does not know whether its
 * input is current must not report a pass.
 */
function freshnessProblem(pkg, pkgDir) {
  const artifactRel = `${pkgDir}/${SUMMARY_REL}`;
  const inputRels = COVERAGE_INPUT_DIRS.map((suffix) => `${pkgDir}/${suffix}`);

  // Content first. A fingerprint recorded beside the artefact settles the
  // question outright: same inputs, same artefact, whenever either was
  // written. Timestamps cannot say that — a squash merge stamps the commit
  // after the branch measured, and checking out older content moves the
  // commit backwards under an artefact that stays put (#2135).
  const byContent = compareArtifactInputs({
    repoRoot: REPO_ROOT,
    inputRels,
    artifactAbs: resolve(REPO_ROOT, artifactRel),
  });
  if (byContent.state === 'match') return null;
  if (byContent.state === 'mismatch') {
    return `${artifactRel} was measured against different content (${byContent.reason}). Re-run \`pnpm -F ${pkg} test:cov\`.`;
  }
  if (byContent.state === 'unusable') {
    return `cannot tell whether ${artifactRel} is current (${byContent.reason}). Re-run \`pnpm -F ${pkg} test:cov\`.`;
  }

  // No sidecar: an artefact from before #2135, or one whose recorder could
  // not reach git. Fall back to the timestamp comparison #2125 put in.
  const result = checkArtifactFreshness({
    repoRoot: REPO_ROOT,
    srcRel: `${pkgDir}/src`,
    artifactRel,
    inputRels,
  });
  if (result.state === 'fresh' || result.state === 'missing') return null;
  return staleMessage({
    pkg,
    artifactRel,
    regenerateCommand: `pnpm -F ${pkg} test:cov`,
    result,
  });
}

const highWater = loadHighWater();
const nextHighWater = { ...highWater };
const METRICS = ['lines', 'branches', 'functions', 'statements'];

const failures = [];
const rows = [];
for (const pkg of PACKAGES) {
  const dir = PKG_DIRS[pkg];
  const stale = freshnessProblem(pkg, dir);
  if (stale) {
    failures.push({ pkg, reason: stale });
    rows.push(`| ${pkg} | n/a | n/a | n/a | n/a | ❌ stale report |`);
    continue;
  }
  const result = loadSummary(dir);
  if (!result.ok) {
    failures.push({ pkg, reason: result.reason });
    rows.push(`| ${pkg} | n/a | n/a | n/a | n/a | ❌ ${result.reason} |`);
    continue;
  }
  const t = result.total;
  // 固定閾値は新規 package の下限として残す。 高水位は「一度到達した値」 を守る。
  const belowThreshold = METRICS.filter((m) => (t[m]?.pct ?? 0) + EPSILON < THRESHOLDS[m]);

  // 高水位を持たない package は固定閾値だけで判定する。 初回の記録は
  // `--update-high-water` で作る。
  const marks = highWater[pkg] ?? null;
  const belowHighWater = marks
    ? METRICS.filter((m) => typeof marks[m] === 'number' && (t[m]?.pct ?? 0) + EPSILON < marks[m])
    : [];

  // 上回った分だけ記録を更新する。 **下回った値は焼き付けない** = 更新は明示 command でのみ
  // 走り、その時も高い方だけを採る。 これが無いと「下がった値を baseline にして常に緑」 になる。
  if (UPDATE_HIGH_WATER) {
    const updated = { ...(marks ?? {}) };
    for (const m of METRICS) {
      const pct = t[m]?.pct;
      if (typeof pct !== 'number') continue;
      if (typeof updated[m] !== 'number' || pct > updated[m]) updated[m] = pct;
    }
    nextHighWater[pkg] = updated;
  }

  const failed = [...belowThreshold, ...belowHighWater.filter((m) => !belowThreshold.includes(m))];
  const mark = marks ? '' : ' (高水位なし)';
  rows.push(
    `| ${pkg} | ${t.lines.pct.toFixed(1)} | ${t.branches.pct.toFixed(1)} | ${t.functions.pct.toFixed(1)} | ${t.statements.pct.toFixed(1)} | ${failed.length === 0 ? '✅' + mark : '❌ ' + failed.join(',')} |`,
  );
  if (failed.length > 0) {
    failures.push({ pkg, failed, totals: t, belowThreshold, belowHighWater, marks });
  }
}

if (UPDATE_HIGH_WATER) {
  const sorted = Object.fromEntries(Object.entries(nextHighWater).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(HIGH_WATER_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
  process.stderr.write(`\n高水位を更新しました: ${HIGH_WATER_PATH}\n`);
}

const header = [
  '| package | lines | branches | functions | statements | status |',
  '|---|---|---|---|---|---|',
];
const report = [
  `# Coverage gate report`,
  '',
  `Thresholds: lines >= ${THRESHOLDS.lines}%, branches >= ${THRESHOLDS.branches}%, functions >= ${THRESHOLDS.functions}%, statements >= ${THRESHOLDS.statements}%`,
  '',
  `High-water: ${HIGH_WATER_PATH.replace(REPO_ROOT + '/', '')} に記録した最高値を下回っても落とす。`,
  `更新は \`node scripts/check-coverage-gates.mjs --update-high-water\` のみ (gate の実行では更新しない)。`,
  '',
  ...header,
  ...rows,
  '',
];
process.stdout.write(report.join('\n'));

if (failures.length === 0) {
  process.stderr.write('\nAll packages passed coverage thresholds.\n');
  process.exit(0);
}

process.stderr.write('\nCoverage gate failed for:\n');
for (const f of failures) {
  if (f.failed) {
    const detail = f.failed
      .map((m) => {
        const pct = f.totals[m].pct.toFixed(2);
        // どちらの下限を割ったかを書き分ける。 「閾値は満たすが下がった」 と
        // 「閾値そのものを割った」 は直し方が違う。
        if (f.belowHighWater?.includes(m) && !f.belowThreshold?.includes(m)) {
          return `${m}=${pct}% (下がった: 高水位 ${f.marks[m]}%)`;
        }
        return `${m}=${pct}% (need ${THRESHOLDS[m]}%)`;
      })
      .join(', ');
    process.stderr.write(`  - ${f.pkg}: ${detail}\n`);
  } else {
    process.stderr.write(`  - ${f.pkg}: ${f.reason}\n`);
  }
}
process.exit(1);
