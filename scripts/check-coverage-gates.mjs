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
import { COVERAGE_INPUT_DIRS, COVERAGE_PACKAGES, COVERAGE_PKG_DIRS } from './lib/gate-inputs.mjs';

const PACKAGES = COVERAGE_PACKAGES;
const PKG_DIRS = COVERAGE_PKG_DIRS;

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

/** 記録に必ず要る metric。 欠けていると判定がその分だけ消える。 */
const REQUIRED_METRICS = ['lines', 'branches', 'functions', 'statements'];

/**
 * 記録を読む。 **「file が無い」 と「file はあるが読めない」 を分ける**。
 *
 * 前者は正当な初期状態なので `{}` に倒す。 後者は誰かが壊した状態で、 coverage の劣化と
 * 同じく人が見るべき事象なので落とす (#2181 r1-f1)。
 *
 * 分けないと迂回できる。 fail-open にしていた間、 **file を壊す / 中身を配列にする /
 * 値を文字列にする** のいずれでも高水位判定が消え、 固定閾値までの低下がそのまま通った。
 * 3 形のうち 2 形は警告すら出ない。
 *
 * file を消す経路だけは script では止められない。 「記録なし = 固定閾値のみ」 は
 * 新規 package のための正当な経路と同じ形だから。 **そこは git 追跡と review が守る** =
 * 記録が追跡下にあれば削除も破損も値の書き換えも diff に出る。
 */
function loadHighWater() {
  if (!existsSync(HIGH_WATER_PATH)) return {};

  let raw;
  try {
    raw = JSON.parse(readFileSync(HIGH_WATER_PATH, 'utf8'));
  } catch (err) {
    fatal(`${HIGH_WATER_PATH} を JSON として読めません: ${err.message}`);
  }
  // 配列も `typeof === 'object'` を通る。 通すと全 package の記録が undefined になり、
  // 高水位判定が丸ごと消える。
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    fatal(`${HIGH_WATER_PATH} は package 名を key に持つ object でなければなりません`);
  }

  for (const [pkg, marks] of Object.entries(raw)) {
    if (marks === null || typeof marks !== 'object' || Array.isArray(marks)) {
      fatal(`${HIGH_WATER_PATH} の "${pkg}" が object ではありません`);
    }
    // **存在する値だけを見ると素通りする** (#2181 r2-f1)。 空 object は loop が 0 回で
    // 通り、 metric key を消せばその metric だけ判定から外れる。 その後
    // `--update-high-water` を回すと、今の低い実測値で作り直される = 「下がった値を
    // baseline にしない」 という設計の要点が key を消す経路で成立しなくなる。
    // だから **4 metric が揃っていること** を必須にする。
    for (const metric of REQUIRED_METRICS) {
      if (!(metric in marks)) {
        fatal(`${HIGH_WATER_PATH} の "${pkg}" に "${metric}" がありません`);
      }
    }
    for (const [metric, value] of Object.entries(marks)) {
      // 1 文字の書き換え (`99.65` → `"99.65"`) で 1 metric だけ無効化できた形を塞ぐ。
      // 未知の metric は将来の拡張なので、数値であれば通す。
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        fatal(`${HIGH_WATER_PATH} の "${pkg}.${metric}" が数値ではありません (${JSON.stringify(value)})`);
      }
      if (value < 0 || value > 100) {
        fatal(`${HIGH_WATER_PATH} の "${pkg}.${metric}" が 0-100 の範囲外です (${value})`);
      }
    }
  }
  return raw;
}

/** 記録が壊れている時に落とす。 coverage の劣化と同じく人が見るべき事象。 */
function fatal(message) {
  process.stderr.write(`\n高水位の記録が壊れています。\n  ${message}\n`);
  process.stderr.write(`  記録を直すか、初期化するなら file を削除してから\n`);
  process.stderr.write(`  node scripts/check-coverage-gates.mjs --update-high-water\n`);
  process.exit(2);
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
        //
        // **両方割った時は両方を出す** (#2181 r1-f3)。 固定閾値だけを出すと、
        // そこまで直して再実行して初めて高水位不足が現れ、2 往復になる。
        const hitThreshold = f.belowThreshold?.includes(m);
        const hitHighWater = f.belowHighWater?.includes(m);
        const reasons = [];
        if (hitThreshold) reasons.push(`閾値 ${THRESHOLDS[m]}%`);
        if (hitHighWater) reasons.push(`高水位 ${f.marks[m]}%`);
        return `${m}=${pct}% (下限を割った: ${reasons.join(' / ')})`;
      })
      .join(', ');
    process.stderr.write(`  - ${f.pkg}: ${detail}\n`);
  } else {
    process.stderr.write(`  - ${f.pkg}: ${f.reason}\n`);
  }
}
process.exit(1);
