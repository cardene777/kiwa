#!/usr/bin/env node
/**
 * kiwa-taxonomy-run.mjs — test-taxonomy 5 分類の分類別実行 chk CLI。
 *
 * meta lint (tests/release-smoke/tests/test-taxonomy-existence.test.ts) は「file 存在」
 * のみ chk。 本 CLI は「実行して pass するか」 を lib × category matrix で確認する。
 * 存在 chk と実行 chk の 2 軸で test-taxonomy meta 経路が完成する (docs/concepts/test-taxonomy.md)。
 *
 * Usage.
 *   node scripts/kiwa-taxonomy-run.mjs --category fidelity
 *   node scripts/kiwa-taxonomy-run.mjs --category skill --format json
 *   node scripts/kiwa-taxonomy-run.mjs --category integration --lib dapp
 *
 * 引数.
 *   --category <name>   perf / fidelity / skill / integration のいずれか (必須)
 *   --lib <name>        単一 lib で実行 (省略 = 該当 lib 全走査)
 *   --format <fmt>      table (default) or json
 *
 * 出力 = lib × 該当 category の matrix (table or JSON)、 exit code 0 = 全 pass、 1 = 1 件でも fail。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(ROOT, 'tests/release-smoke/test-taxonomy.config.json');
const PACKAGES_DIR = join(ROOT, 'packages');

const CATEGORY_SUFFIX = {
  perf: '.perf.ts',
  fidelity: '.fidelity.test.ts',
  skill: '.skill.test.ts',
  integration: '.integration.test.ts',
};

/**
 * Q6-5 real driver suffix map = category × real の 2 軸で file を絞る。
 * 例 = fidelity real driver test = `*.real.fidelity.test.ts` (2 段 suffix)。
 * default では実行対象外 (KIWA_MODE=real env 経路)、 --include-real で明示 opt-in。
 */
const CATEGORY_REAL_SUFFIX = {
  perf: '.real.perf.ts',
  fidelity: '.real.fidelity.test.ts',
  skill: '.real.skill.test.ts',
  integration: '.real.integration.test.ts',
};

const VALID_CATEGORIES = Object.keys(CATEGORY_SUFFIX);

function parseArgs(argv) {
  const args = { category: null, lib: null, format: 'table', includeReal: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--category') args.category = argv[++i];
    else if (a === '--lib') args.lib = argv[++i];
    else if (a === '--format') args.format = argv[++i];
    else if (a === '--include-real') args.includeReal = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  process.stdout.write(`kiwa-taxonomy-run — test-taxonomy 分類別実行 chk\n\n`);
  process.stdout.write(`Usage:\n`);
  process.stdout.write(`  node scripts/kiwa-taxonomy-run.mjs --category <perf|fidelity|skill|integration|all> [--lib <name>] [--format <table|json>] [--include-real]\n\n`);
  process.stdout.write(`Examples:\n`);
  process.stdout.write(`  node scripts/kiwa-taxonomy-run.mjs --category fidelity\n`);
  process.stdout.write(`  node scripts/kiwa-taxonomy-run.mjs --category skill --lib agent\n`);
  process.stdout.write(`  node scripts/kiwa-taxonomy-run.mjs --category integration --format json\n`);
  process.stdout.write(`  node scripts/kiwa-taxonomy-run.mjs --category fidelity --include-real  # KIWA_MODE=real real driver test 含む\n`);
  process.stdout.write(`  node scripts/kiwa-taxonomy-run.mjs --category all  # 4 分類 (perf/fidelity/skill/integration) 一括実行 + 統合 matrix\n`);
}

function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

function listPackages() {
  return readdirSync(PACKAGES_DIR).filter((name) => {
    const pkgPath = join(PACKAGES_DIR, name);
    if (!statSync(pkgPath).isDirectory()) return false;
    return existsSync(join(pkgPath, 'package.json'));
  });
}

function libsForCategory(category, config, allPackages) {
  if (category === 'perf') {
    return allPackages.filter((p) => !config.requirePerf.exempt.includes(p));
  }
  if (category === 'fidelity') {
    return config.requireFidelity.mockAdapterLibs.filter((p) => allPackages.includes(p));
  }
  if (category === 'skill') {
    return config.requireSkill.skillLibs.filter((p) => allPackages.includes(p));
  }
  if (category === 'integration') {
    return config.requireIntegration.integrationLibs.filter((p) => allPackages.includes(p));
  }
  throw new Error(`unknown category: ${category}`);
}

function collectFiles(dir, suffix) {
  if (!existsSync(dir)) return [];
  // .ts と .tsx 両方を accept (JSX を含む component test も対象)。 SSOT = meta lint
  // 側 (test-taxonomy-existence.test.ts) の `[baseSuffix, `${baseSuffix}x`]` と整合。
  const tsxSuffix = suffix.endsWith('.ts') ? `${suffix}x` : suffix;
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isFile() && (entry.endsWith(suffix) || entry.endsWith(tsxSuffix))) out.push(p);
    else if (s.isDirectory()) out.push(...collectFiles(p, suffix));
  }
  return out;
}

function runOneCell(lib, category, includeReal = false) {
  const libDir = join(PACKAGES_DIR, lib);
  const testDir = join(libDir, 'tests', category);
  const suffix = CATEGORY_SUFFIX[category];
  const realSuffix = CATEGORY_REAL_SUFFIX[category];
  const files = collectFiles(testDir, suffix);
  if (files.length === 0) {
    return { status: 'no-files', passed: 0, failed: 0, total: 0 };
  }

  // perf は独自 config (vitest.perf.config.ts) + tsc compile 対象外 (tests/perf/**/* が
  // tsconfig.vitest.json の exclude)、 直接 vitest.perf.config.ts で実行する経路。
  if (category === 'perf') {
    return runPerfCell(libDir, includeReal);
  }

  const build = spawnSync('pnpm', ['exec', '--', 'tsc', '-p', 'tsconfig.vitest.json'], {
    cwd: libDir,
    stdio: 'pipe',
    encoding: 'utf-8',
    env: process.env,
  });
  if (build.status !== 0) {
    return { status: 'compile-fail', passed: 0, failed: 0, total: 0, stderr: build.stderr };
  }

  const distDir = `.vitest-dist/tests/${category}`;
  // includeReal=false 時 (default) = real driver test を exclude、
  // includeReal=true 時 = real driver test を含めて実行、 KIWA_MODE=real env 併用が前提。
  const vitestArgs = ['exec', '--', 'vitest', 'run', distDir];
  if (!includeReal) {
    const realJsSuffix = realSuffix.replace(/\.ts$/, '.js');
    vitestArgs.push('--exclude', `**/*${realJsSuffix}`);
  }
  vitestArgs.push('--reporter=json');
  const runEnv = { ...process.env };
  if (includeReal && !runEnv.KIWA_MODE) {
    runEnv.KIWA_MODE = 'real';
  }
  const vitest = spawnSync('pnpm', vitestArgs, {
    cwd: libDir,
    stdio: 'pipe',
    encoding: 'utf-8',
    env: runEnv,
  });
  let report;
  try {
    report = JSON.parse(vitest.stdout);
  } catch {
    return { status: 'parse-fail', passed: 0, failed: 0, total: 0, stderr: vitest.stderr };
  }
  const passed = report.numPassedTests ?? 0;
  const failed = report.numFailedTests ?? 0;
  const total = report.numTotalTests ?? passed + failed;
  const status = failed === 0 && total > 0 ? 'pass' : failed > 0 ? 'fail' : 'no-tests';
  return { status, passed, failed, total, realIncluded: includeReal };
}

function runPerfCell(libDir, includeReal) {
  const configPath = join(libDir, 'vitest.perf.config.ts');
  if (!existsSync(configPath)) {
    return { status: 'no-files', passed: 0, failed: 0, total: 0 };
  }
  const runEnv = { ...process.env };
  if (includeReal && !runEnv.KIWA_MODE) {
    runEnv.KIWA_MODE = 'real';
  }
  const vitest = spawnSync(
    'pnpm',
    ['exec', '--', 'vitest', 'run', '-c', 'vitest.perf.config.ts', '--reporter=json'],
    {
      cwd: libDir,
      stdio: 'pipe',
      encoding: 'utf-8',
      env: runEnv,
    },
  );
  let report;
  try {
    report = JSON.parse(vitest.stdout);
  } catch {
    return { status: 'parse-fail', passed: 0, failed: 0, total: 0, stderr: vitest.stderr };
  }
  const passed = report.numPassedTests ?? 0;
  const failed = report.numFailedTests ?? 0;
  const total = report.numTotalTests ?? passed + failed;
  const status = failed === 0 && total > 0 ? 'pass' : failed > 0 ? 'fail' : 'no-tests';
  return { status, passed, failed, total, realIncluded: includeReal };
}

function statusLabel(r) {
  if (!r) return '—';
  if (r.status === 'no-files') return 'FAIL (no-files)';
  if (r.status === 'no-tests') return 'FAIL (no-tests)';
  if (r.status === 'compile-fail') return 'FAIL (compile)';
  if (r.status === 'parse-fail') return 'FAIL (parse)';
  return r.status === 'pass' ? `pass ${r.passed}/${r.total}` : `FAIL ${r.failed}/${r.total}`;
}

function emitTable(results, category) {
  process.stdout.write(`\n## test-taxonomy matrix — category=${category}\n\n`);
  process.stdout.write(`| lib | status |\n`);
  process.stdout.write(`| --- | ------ |\n`);
  for (const [lib, r] of Object.entries(results)) {
    process.stdout.write(`| ${lib} | ${statusLabel(r)} |\n`);
  }
}

function summarize(results) {
  const passed = Object.values(results).filter((r) => r.status === 'pass').length;
  // no-files = config 記載 lib で該当分類の test file 不在 = fail 判定。
  // CLI の目的は「揃ってる + 実行 pass」 の完全 chk、 file 不在で pass 扱いは
  // 意味を持たない (--lib は config 外 lib も指定可能だが、 default で該当 lib 全走査時は
  // config 記載 lib のみが scope、 その scope 内で不在は必ず fail)。
  const failed = Object.values(results).filter((r) =>
    ['fail', 'compile-fail', 'parse-fail', 'no-files', 'no-tests'].includes(r.status),
  ).length;
  const noFiles = Object.values(results).filter((r) => r.status === 'no-files').length;
  return { passed, failed, noFiles, total: Object.keys(results).length };
}

function runSingleCategory(category, args, config, allPackages) {
  const scope = args.lib ? [args.lib] : libsForCategory(category, config, allPackages);
  const results = {};
  const realTag = args.includeReal ? ' [+real]' : '';
  for (const lib of scope) {
    process.stderr.write(`[taxonomy-run] ${lib} × ${category}${realTag} ...`);
    const r = runOneCell(lib, category, args.includeReal);
    results[lib] = r;
    process.stderr.write(` ${statusLabel(r)}\n`);
  }
  return results;
}

function emitAllMatrix(allResults, includeReal) {
  const categories = Object.keys(allResults);
  const allLibs = new Set();
  for (const cat of categories) {
    for (const lib of Object.keys(allResults[cat])) allLibs.add(lib);
  }
  const sortedLibs = Array.from(allLibs).sort();

  process.stdout.write(`\n## test-taxonomy matrix — all categories${includeReal ? ' [+real]' : ''}\n\n`);
  process.stdout.write(`| lib | ${categories.join(' | ')} |\n`);
  process.stdout.write(`| --- | ${categories.map(() => '---').join(' | ')} |\n`);
  for (const lib of sortedLibs) {
    const cells = categories.map((cat) => {
      const r = allResults[cat][lib];
      if (!r) return '—';  // config で該当 category 対象外の lib は空 cell
      return statusLabel(r);
    });
    process.stdout.write(`| ${lib} | ${cells.join(' | ')} |\n`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.category) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }
  const isAll = args.category === 'all';
  if (!isAll && !VALID_CATEGORIES.includes(args.category)) {
    process.stderr.write(`invalid --category "${args.category}". valid: ${VALID_CATEGORIES.join(', ')}, all\n`);
    process.exit(1);
  }

  const config = loadConfig();
  const allPackages = listPackages();

  if (args.lib && !allPackages.includes(args.lib)) {
    process.stderr.write(`unknown --lib "${args.lib}"\n`);
    process.exit(1);
  }

  if (isAll) {
    // 4 分類全実行 + 統合 matrix、 exit code = 1 分類でも fail で 1
    const allResults = {};
    const summaries = {};
    let anyFail = false;
    for (const category of VALID_CATEGORIES) {
      allResults[category] = runSingleCategory(category, args, config, allPackages);
      summaries[category] = summarize(allResults[category]);
      if (summaries[category].failed > 0) anyFail = true;
    }
    if (args.format === 'json') {
      process.stdout.write(
        `${JSON.stringify({ category: 'all', includeReal: args.includeReal, results: allResults, summaries }, null, 2)}\n`,
      );
    } else {
      emitAllMatrix(allResults, args.includeReal);
      process.stdout.write(`\nsummary per category:\n`);
      for (const category of VALID_CATEGORIES) {
        const s = summaries[category];
        process.stdout.write(
          `  ${category}: pass=${s.passed} fail=${s.failed} total=${s.total}\n`,
        );
      }
      if (args.includeReal) {
        process.stdout.write(`(real driver test 含む、 KIWA_MODE=real)\n`);
      }
    }
    process.exit(anyFail ? 1 : 0);
  }

  // 単一 category 経路
  const results = runSingleCategory(args.category, args, config, allPackages);
  const summary = summarize(results);

  if (args.format === 'json') {
    process.stdout.write(
      `${JSON.stringify({ category: args.category, includeReal: args.includeReal, results, summary }, null, 2)}\n`,
    );
  } else {
    emitTable(results, args.category);
    process.stdout.write(
      `\nsummary: pass=${summary.passed} fail=${summary.failed} no-files=${summary.noFiles} total=${summary.total}${
        args.includeReal ? ' (real driver test 含む、 KIWA_MODE=real)' : ''
      }\n`,
    );
  }

  process.exit(summary.failed > 0 ? 1 : 0);
}

const isEntry = pathToFileURL(process.argv[1] ?? '').href === import.meta.url;
if (isEntry) {
  main().catch((err) => {
    process.stderr.write(`[taxonomy-run] ${err.stack ?? err.message ?? err}\n`);
    process.exit(1);
  });
}
