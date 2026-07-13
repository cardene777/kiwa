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

const VALID_CATEGORIES = Object.keys(CATEGORY_SUFFIX);

function parseArgs(argv) {
  const args = { category: null, lib: null, format: 'table' };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--category') args.category = argv[++i];
    else if (a === '--lib') args.lib = argv[++i];
    else if (a === '--format') args.format = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  process.stdout.write(`kiwa-taxonomy-run — test-taxonomy 分類別実行 chk\n\n`);
  process.stdout.write(`Usage:\n`);
  process.stdout.write(`  node scripts/kiwa-taxonomy-run.mjs --category <perf|fidelity|skill|integration> [--lib <name>] [--format <table|json>]\n\n`);
  process.stdout.write(`Examples:\n`);
  process.stdout.write(`  node scripts/kiwa-taxonomy-run.mjs --category fidelity\n`);
  process.stdout.write(`  node scripts/kiwa-taxonomy-run.mjs --category skill --lib agent\n`);
  process.stdout.write(`  node scripts/kiwa-taxonomy-run.mjs --category integration --format json\n`);
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
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isFile() && entry.endsWith(suffix)) out.push(p);
    else if (s.isDirectory()) out.push(...collectFiles(p, suffix));
  }
  return out;
}

function runOneCell(lib, category) {
  const libDir = join(PACKAGES_DIR, lib);
  const testDir = join(libDir, 'tests', category);
  const suffix = CATEGORY_SUFFIX[category];
  const files = collectFiles(testDir, suffix);
  if (files.length === 0) {
    return { status: 'no-files', passed: 0, failed: 0, total: 0 };
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
  const vitest = spawnSync(
    'pnpm',
    ['exec', '--', 'vitest', 'run', distDir, '--reporter=json'],
    {
      cwd: libDir,
      stdio: 'pipe',
      encoding: 'utf-8',
      env: process.env,
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
  return { status, passed, failed, total };
}

function statusLabel(r) {
  if (!r) return '—';
  if (r.status === 'no-files') return 'no-files';
  if (r.status === 'no-tests') return 'no-tests';
  if (r.status === 'compile-fail') return 'compile-fail';
  if (r.status === 'parse-fail') return 'parse-fail';
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
  const failed = Object.values(results).filter((r) =>
    ['fail', 'compile-fail', 'parse-fail'].includes(r.status),
  ).length;
  const noFiles = Object.values(results).filter((r) => r.status === 'no-files').length;
  return { passed, failed, noFiles, total: Object.keys(results).length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.category) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }
  if (!VALID_CATEGORIES.includes(args.category)) {
    process.stderr.write(`invalid --category "${args.category}". valid: ${VALID_CATEGORIES.join(', ')}\n`);
    process.exit(1);
  }

  const config = loadConfig();
  const allPackages = listPackages();
  const scope = args.lib ? [args.lib] : libsForCategory(args.category, config, allPackages);

  if (args.lib && !allPackages.includes(args.lib)) {
    process.stderr.write(`unknown --lib "${args.lib}"\n`);
    process.exit(1);
  }

  const results = {};
  for (const lib of scope) {
    process.stderr.write(`[taxonomy-run] ${lib} × ${args.category} ...`);
    const r = runOneCell(lib, args.category);
    results[lib] = r;
    process.stderr.write(` ${statusLabel(r)}\n`);
  }

  const summary = summarize(results);

  if (args.format === 'json') {
    process.stdout.write(`${JSON.stringify({ category: args.category, results, summary }, null, 2)}\n`);
  } else {
    emitTable(results, args.category);
    process.stdout.write(
      `\nsummary: pass=${summary.passed} fail=${summary.failed} no-files=${summary.noFiles} total=${summary.total}\n`,
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
