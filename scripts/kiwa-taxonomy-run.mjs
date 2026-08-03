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
 *   --packages-dir <p>  lib を探す root を差し替える (default = <repo>/packages)
 *                       絶対 path 必須、 実在する dir かつ package を 1 件以上含むこと
 *
 * 出力 = lib × 該当 category の matrix (table or JSON)、 exit code 0 = 全 pass、 1 = 1 件でも fail。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
// readFileSync is used by analyzeTestFile
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(ROOT, 'tests/release-smoke/test-taxonomy.config.json');
/**
 * lib を探す既定の root。 `--packages-dir` で差し替えられる。
 *
 * 差し替えを持つのは、 中身 chk 層 (minCases / expect 未呼出 / trivial) を確かめる側が
 * 「その形をした lib」 を用意する必要があるため。 実 workspace の `packages/` に置くと、
 * `packages/*` を走査する他の検査 (license / taxonomy meta lint / publish guard /
 * release script filter 等) がそれを実 package と誤認する。 `packages/` 直下を列挙する
 * 検査は 8 file あり、 どれが反応するかは置いた lib の属性 (private か / workspace: 依存を
 * 持つか) で入れ替わるため、 走査側に除外を配る形では塞ぎ切れない (#1780)。
 *
 * 渡す path は信頼済であることが前提。 本 CLI は root 配下を cwd として `pnpm exec tsc` と
 * `pnpm exec vitest` を起動し、 `process.env` をそのまま継承する (`--include-real` では
 * `KIWA_MODE=real` も注入する)。 未信頼の path を外部入力から組み立てて渡してはいけない。
 * 現在の呼出元 (`package.json` の `test:taxonomy` / `test:taxonomy:all`、
 * `scripts/release-readiness-check.mjs` の Gate 3) はいずれも引数を hardcode しており、
 * 外部入力が到達する経路は無い。
 */
const DEFAULT_PACKAGES_DIR = join(ROOT, 'packages');

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
  const args = {
    category: null,
    lib: null,
    format: 'table',
    includeReal: false,
    packagesDir: DEFAULT_PACKAGES_DIR,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--category') args.category = argv[++i];
    else if (a === '--lib') args.lib = argv[++i];
    // 値を取り損ねた形を default と混ぜない。 `resolve(undefined)` も `resolve('')` も cwd に
    // なるため、 黙って別 root を見に行く。 次 token が別 flag の形 (`--packages-dir --format`)
    // も値の取り違えなので同じ扱いにする (main で弾く)。
    else if (a === '--packages-dir') {
      const value = argv[++i];
      args.packagesDir = value === undefined || value === '' || value.startsWith('-') ? null : value;
    }
    else if (a === '--format') args.format = argv[++i];
    else if (a === '--include-real') args.includeReal = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  process.stdout.write(`kiwa-taxonomy-run — test-taxonomy 分類別実行 chk\n\n`);
  process.stdout.write(`Usage:\n`);
  process.stdout.write(`  node scripts/kiwa-taxonomy-run.mjs --category <perf|fidelity|skill|integration|all> [--lib <name>] [--packages-dir <path>] [--format <table|json>] [--include-real]\n\n`);
  process.stdout.write(`Options:\n`);
  process.stdout.write(`  --category <name>   perf / fidelity / skill / integration / all のいずれか (必須)\n`);
  process.stdout.write(`  --lib <name>        単一 lib で実行 (省略 = 該当 lib 全走査)\n`);
  process.stdout.write(`  --packages-dir <p>  lib を探す root (default = <repo>/packages)、 絶対 path 必須\n`);
  process.stdout.write(`  --format <fmt>      table (default) or json\n`);
  process.stdout.write(`  --include-real      real driver test (*.real.<category>.test.ts) を実行対象に含める\n\n`);
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

function listPackages(packagesDir = DEFAULT_PACKAGES_DIR) {
  return readdirSync(packagesDir).filter((name) => {
    const pkgPath = join(packagesDir, name);
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

// export するのは、 拡張子の accept を単体で確かめるため (#1751)。
// 以前は release-smoke から実 perf を起動して間接的に見ていたが、 perf は時間そのものを
// 測るので機械の空き具合で落ちる。 見たいのは「`.tsx` を拾うか」 だけなので、 その 1 点を
// 直接見る。
export function collectFiles(dir, suffix) {
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

/**
 * source code の中身 chk = 3 軸。
 * (1) it() block 数 = category 別 minCases 下限を満たすか
 * (2) 各 it() block に expect(...) が 1 件以上あるか (assertion 保証)
 * (3) trivial pattern 検出 = `expect(true).toBe(true)` / `expect(1).toBe(1)` / `expect(null).toBeNull()` 等の詐称 assertion
 *
 * 返り値 = { itCount, itsWithoutExpect, trivialCount, violations: string[] }
 */
function analyzeTestFile(filePath) {
  const src = readFileSync(filePath, 'utf-8');
  const lines = src.split('\n');

  // it( / it.each( / it.skip( / it.only( / test( を検出、 コメント行 (// or /* / *) は除外
  const itPattern = /^(?!\s*(\/\/|\*|\/\*))\s*(it|test)(\.each|\.skip|\.only|\.skipIf|\.runIf)?\s*\(/;
  const itLines = [];
  lines.forEach((line, idx) => {
    if (itPattern.test(line)) itLines.push(idx);
  });

  // trivial assertion pattern
  const trivialPatterns = [
    /expect\(true\)\.toBe\(true\)/,
    /expect\(false\)\.toBe\(false\)/,
    /expect\(1\)\.toBe\(1\)/,
    /expect\(0\)\.toBe\(0\)/,
    /expect\(null\)\.toBeNull\(\)/,
    /expect\(undefined\)\.toBeUndefined\(\)/,
    /expect\('a'\)\.toBe\('a'\)/,
    /expect\("a"\)\.toBe\("a"\)/,
    /expect\(\[\]\)\.toEqual\(\[\]\)/,
    /expect\(\{\}\)\.toEqual\(\{\}\)/,
  ];

  const violations = [];
  let itsWithoutExpect = 0;
  let trivialCount = 0;

  // 各 it block の範囲 (次 it or ファイル末尾まで) を確認
  for (let i = 0; i < itLines.length; i += 1) {
    const start = itLines[i];
    const end = i + 1 < itLines.length ? itLines[i + 1] : lines.length;
    const body = lines.slice(start, end).join('\n');

    // expect( 検索 (assertToolCalled 等の primitive 系も assertion とみなす)
    const hasExpect = /\b(expect|assertToolCalled|assertToolNotCalled|assertToolCalledWith|assertToolCallOrder|assertFidelity|assertThrows|assert\.)\s*\(/.test(body);
    if (!hasExpect) {
      itsWithoutExpect += 1;
      violations.push(`${filePath}:${start + 1} — it() block に expect/assert 呼出なし`);
    }

    // trivial pattern chk
    for (const pat of trivialPatterns) {
      if (pat.test(body)) {
        trivialCount += 1;
        violations.push(`${filePath}:${start + 1} — trivial assertion (${pat.source})`);
        break;
      }
    }
  }

  return {
    itCount: itLines.length,
    itsWithoutExpect,
    trivialCount,
    violations,
  };
}

/**
 * category 別 minCases default。 config で override 可能 (test-taxonomy.config.json)。
 * fidelity / skill / integration = domain-specific test で最低 5 case、
 * perf = harness 分担があるため最低 3 case、
 * unit は本 CLI 対象外。
 */
const DEFAULT_MIN_CASES = {
  perf: 3,
  fidelity: 5,
  skill: 5,
  integration: 5,
};

function runOneCell(lib, category, includeReal = false, config = null, packagesDir = DEFAULT_PACKAGES_DIR) {
  const libDir = join(packagesDir, lib);
  const testDir = join(libDir, 'tests', category);
  const suffix = CATEGORY_SUFFIX[category];
  const realSuffix = CATEGORY_REAL_SUFFIX[category];
  const files = collectFiles(testDir, suffix);
  if (files.length === 0) {
    return { status: 'no-files', passed: 0, failed: 0, total: 0 };
  }

  // === 中身 chk 層 (Q7、 3 軸) ===
  // (1) minCases 下限 (2) 各 it に expect 呼出 (3) trivial pattern 検出
  const minCases = config?.minCases?.[category] ?? DEFAULT_MIN_CASES[category] ?? 0;
  const perLibMinCases = config?.perLibMinCases?.[category]?.[lib];
  const effectiveMin = perLibMinCases ?? minCases;

  let totalIt = 0;
  let totalItsWithoutExpect = 0;
  let totalTrivial = 0;
  const allViolations = [];
  for (const f of files) {
    const analysis = analyzeTestFile(f);
    totalIt += analysis.itCount;
    totalItsWithoutExpect += analysis.itsWithoutExpect;
    totalTrivial += analysis.trivialCount;
    allViolations.push(...analysis.violations);
  }

  if (totalIt < effectiveMin) {
    return {
      status: 'insufficient-cases',
      passed: 0,
      failed: 0,
      total: totalIt,
      violations: [`${lib} × ${category}: it 数 ${totalIt} < 下限 ${effectiveMin}`],
    };
  }
  if (totalItsWithoutExpect > 0) {
    return {
      status: 'missing-assertion',
      passed: 0,
      failed: totalItsWithoutExpect,
      total: totalIt,
      violations: allViolations.slice(0, 5),
    };
  }
  if (totalTrivial > 0) {
    return {
      status: 'trivial-assertion',
      passed: 0,
      failed: totalTrivial,
      total: totalIt,
      violations: allViolations.slice(0, 5),
    };
  }
  // === /中身 chk 層 ===

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

/**
 * perf 1 cell を実行して結果に変換する。
 *
 * `runner` を差し替えられるのは、 command の組立てと JSON の解釈を実 perf 計測なしで
 * 確かめるため (#1751)。 perf は時間そのものを測るので、 実行を伴う test は機械の
 * 空き具合で落ちる。 一方この関数が担うのは「何を起動し、 返ってきた JSON をどう
 * 読むか」 で、 そこは時間に依存しない。
 *
 * `pnpm test:perf` は各 package の `test:perf` を直接叩くため、 この経路を通らない。
 * ここが壊れても実 perf は緑のままになる。
 */
export function runPerfCell(libDir, includeReal, runner = spawnSync) {
  const configPath = join(libDir, 'vitest.perf.config.ts');
  if (!existsSync(configPath)) {
    return { status: 'no-files', passed: 0, failed: 0, total: 0 };
  }
  const runEnv = { ...process.env };
  if (includeReal && !runEnv.KIWA_MODE) {
    runEnv.KIWA_MODE = 'real';
  }
  const vitest = runner(
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
  if (r.status === 'insufficient-cases') return `FAIL (min-cases ${r.total})`;
  if (r.status === 'missing-assertion') return `FAIL (no-expect ${r.failed})`;
  if (r.status === 'trivial-assertion') return `FAIL (trivial ${r.failed})`;
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
  // 中身 chk 3 軸 (insufficient-cases / missing-assertion / trivial-assertion) も fail 判定に統合。
  // CLI 単独で release-worthy 判定完結する強度に引き上げ (Q7)。
  const failed = Object.values(results).filter((r) =>
    [
      'fail',
      'compile-fail',
      'parse-fail',
      'no-files',
      'no-tests',
      'insufficient-cases',
      'missing-assertion',
      'trivial-assertion',
    ].includes(r.status),
  ).length;
  const noFiles = Object.values(results).filter((r) => r.status === 'no-files').length;
  return { passed, failed, noFiles, total: Object.keys(results).length };
}

/**
 * category 単位の合否。 対象 0 件は pass ではなく fail。
 *
 * `libsForCategory` は config 記載 lib を root の実在 package と交差させるため、 root に
 * 該当 lib が 1 つも無いと scope が空になり、 `failed` が 0 のまま exit 0 に落ちる。
 * 出力上は「全 pass」 と見分けが付かないので、 検査が 1 件も走らなかった形を fail に倒す。
 * no-files を fail と判定しているのと同じ理由で、 対象不在を「通った」 と読ませない (#1780)。
 */
function categoryFailed(summary) {
  return summary.failed > 0 || summary.total === 0;
}

/**
 * 対象 0 件を stderr に名指しする。
 *
 * 0 件は表の上では `pass=0 fail=0 total=0` が並ぶだけで、 root の指定ミスなのか実際に
 * 通ったのかを読み手が判別できない。 exit code を fail に倒すだけでは「見分けさせる」
 * 目的が半分しか達成できないため、 単一 category と `--category all` の両経路で出す。
 */
function warnEmptyScope(category, summary) {
  if (summary.total === 0) {
    process.stderr.write(
      `[taxonomy-run] ${category}: 対象 lib が 0 件。 検査が 1 件も走っていない\n`,
    );
  }
}

function runSingleCategory(category, args, config, allPackages) {
  const scope = args.lib ? [args.lib] : libsForCategory(category, config, allPackages);
  const results = {};
  const realTag = args.includeReal ? ' [+real]' : '';
  for (const lib of scope) {
    process.stderr.write(`[taxonomy-run] ${lib} × ${category}${realTag} ...`);
    const r = runOneCell(lib, category, args.includeReal, config, args.packagesDir);
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

  // root の差し替えは検査対象そのものを決めるため、 曖昧な形を 1 つも通さない。
  // 「対象が 0 件」 と「全 pass」 は出力上で区別が付かないので、 0 件になり得る形は
  // すべてここで exit 1 に倒す (#1780 review)。
  if (args.packagesDir === null) {
    process.stderr.write(`--packages-dir requires a non-empty path\n`);
    process.exit(1);
  }
  if (!isAbsolute(args.packagesDir)) {
    // 相対 path は呼んだ場所で指す先が変わる。 script 位置基準と cwd 基準のどちらに
    // 寄せても取り違えが残るため、 絶対 path だけを受ける。
    process.stderr.write(`--packages-dir must be an absolute path: "${args.packagesDir}"\n`);
    process.exit(1);
  }
  if (!existsSync(args.packagesDir) || !statSync(args.packagesDir).isDirectory()) {
    process.stderr.write(`--packages-dir not found or not a directory: "${args.packagesDir}"\n`);
    process.exit(1);
  }

  const config = loadConfig();
  const allPackages = listPackages(args.packagesDir);
  if (allPackages.length === 0) {
    process.stderr.write(`--packages-dir has no package: "${args.packagesDir}"\n`);
    process.exit(1);
  }

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
      warnEmptyScope(category, summaries[category]);
      if (categoryFailed(summaries[category])) anyFail = true;
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

  warnEmptyScope(args.category, summary);
  process.exit(categoryFailed(summary) ? 1 : 0);
}

const isEntry = pathToFileURL(process.argv[1] ?? '').href === import.meta.url;
if (isEntry) {
  main().catch((err) => {
    process.stderr.write(`[taxonomy-run] ${err.stack ?? err.message ?? err}\n`);
    process.exit(1);
  });
}
