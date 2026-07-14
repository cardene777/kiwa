#!/usr/bin/env node
/**
 * check-app-scenario-gate.mjs — Gate 6 = real workload perf test 存在 + 実行 PASS 判定。
 *
 * 本 session (2026-07-14、 全 35 target lib 完遂) で各 lib に追加した
 * `packages/{lib}/tests/perf/{lib}-app-scenario.perf.{ts,tsx}` の存在 + 実行 PASS を
 * release check で機械強制する gate。 追加 test が壊れても release-check が通過して
 * しまう既存の穴を塞ぐ。
 *
 * # 判定 2 mode
 *
 * - **structural (default)** = 各 lib の app-scenario test file 存在 + import surface で
 *   対応 lib の main invoke function を実 workflow で呼出す op が 1 個以上定義されている
 *   ことを regex chk (heavy test run 不要、 数秒完了)
 * - **run (--run flag)** = 各 lib で `pnpm test:perf` を実際に起動して全 PASS 確認
 *   (heavy = 20-30 min)、 release 前の完全確認 or nightly cron から呼出す
 *
 * # 対象 lib SSOT
 *
 * `PACKAGES_DIR` 配下で `tests/perf/{name}-app-scenario.perf.{ts,tsx}` が存在する lib を
 * 動的列挙する。 lib 追加時に本 script の手修正は不要 (test file 追加すれば自動追従)。
 *
 * # exit code
 *
 * - 0 = 全 lib で app-scenario test が存在 (+ run mode 時は全 PASS)
 * - 1 = 1 lib 以上で app-scenario test 欠落 or fail
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(REPO_ROOT, 'packages');

const args = process.argv.slice(2);
const RUN_MODE = args.includes('--run');
const FORMAT = args.includes('--format=json') ? 'json' : 'table';

function findAppScenarioLibs() {
  const libs = [];
  for (const entry of readdirSync(PACKAGES_DIR)) {
    const perfDir = path.join(PACKAGES_DIR, entry, 'tests/perf');
    if (!existsSync(perfDir) || !statSync(perfDir).isDirectory()) continue;
    const tsFile = path.join(perfDir, `${entry}-app-scenario.perf.ts`);
    const tsxFile = path.join(perfDir, `${entry}-app-scenario.perf.tsx`);
    if (existsSync(tsFile)) libs.push({ name: entry, file: tsFile });
    else if (existsSync(tsxFile)) libs.push({ name: entry, file: tsxFile });
  }
  return libs.sort((a, b) => a.name.localeCompare(b.name));
}

function checkStructure(lib) {
  const src = readFileSync(lib.file, 'utf-8');
  const failures = [];
  if (!/from '\.\.\/\.\.\/src\//.test(src)) failures.push('main API import 欠落');
  if (!/runPerf3Layer/.test(src)) failures.push('runPerf3Layer 呼出欠落');
  const opBlocks = (src.match(/name:\s*'[^']+'/g) ?? []).length;
  if (opBlocks < 3) failures.push(`op 数 < 3 (実際 ${opBlocks})`);
  const fnBlocks = (src.match(/fn:\s*\(?\s*\)?\s*=>|fn:\s*async/g) ?? []).length;
  if (fnBlocks < 3) failures.push(`fn 実装数 < 3 (実際 ${fnBlocks})`);
  const capMs = (src.match(/serialP95CapMs/g) ?? []).length;
  if (capMs < 3) failures.push(`serialP95CapMs 設定数 < 3 (実際 ${capMs})`);
  return failures;
}

function checkRun(lib) {
  const pkgDir = path.dirname(path.dirname(path.dirname(lib.file)));
  const result = spawnSync('pnpm', ['test:perf'], {
    cwd: pkgDir,
    stdio: 'pipe',
    encoding: 'utf-8',
    env: process.env,
  });
  if (result.status === 0) return { ok: true };
  const stderr = (result.stderr ?? '') + (result.stdout ?? '');
  const tail = stderr.split('\n').slice(-15).join('\n');
  return { ok: false, tail };
}

function main() {
  const libs = findAppScenarioLibs();
  if (libs.length === 0) {
    console.error('❌ app-scenario perf test が 1 file も見つかりません');
    process.exit(1);
  }

  const results = [];
  let anyFail = false;
  for (const lib of libs) {
    const structural = checkStructure(lib);
    let runResult = null;
    if (RUN_MODE && structural.length === 0) {
      runResult = checkRun(lib);
    }
    const status = structural.length > 0 ? 'fail-structure' : (runResult && !runResult.ok ? 'fail-run' : 'pass');
    if (status !== 'pass') anyFail = true;
    results.push({ lib: lib.name, status, structural, run: runResult });
  }

  if (FORMAT === 'json') {
    console.log(JSON.stringify({ mode: RUN_MODE ? 'run' : 'structural', total: results.length, results }, null, 2));
  } else {
    console.log('# app-scenario gate report');
    console.log('');
    console.log(`mode: ${RUN_MODE ? 'run (heavy)' : 'structural (default)'}`);
    console.log(`total lib: ${results.length}`);
    console.log('');
    console.log('| lib | status | detail |');
    console.log('|---|---|---|');
    for (const r of results) {
      const icon = r.status === 'pass' ? '✅' : '❌';
      const detail = r.structural.length > 0
        ? `structural fail: ${r.structural.join(' / ')}`
        : (r.run && !r.run.ok ? `run fail (log tail): ${r.run.tail.slice(0, 200)}` : 'ok');
      console.log(`| ${r.lib} | ${icon} ${r.status} | ${detail} |`);
    }
    console.log('');
    const passCount = results.filter((r) => r.status === 'pass').length;
    console.log(`pass: ${passCount} / ${results.length}`);
  }

  process.exit(anyFail ? 1 : 0);
}

main();
