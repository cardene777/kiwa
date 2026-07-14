#!/usr/bin/env node
/**
 * check-dogfood-gate.mjs — Gate 5 = dogfood test 実施状態 verify tool。
 *
 * kiwa 設計思想 = 「各 lib の性能担保は複数 dogfood application で lib を実 use して verify」。
 * 本 tool は各 dogfood-* project で:
 * - tests/perf/ dir 存在
 * - package.json scripts.test:perf 存在
 * - kiwa lib 依存 (@kiwa-lab/*) を実 usage している
 * の 3 条件を structural chk する。
 *
 * 実 test:perf 実行は --run flag opt-in (default = structural only)、 実 exec は
 * 117 dogfood project = 数十分〜1 時間 相当のため。
 *
 * # exit code
 * - 0 = 全 dogfood project で 3 条件 pass
 * - 1 = 1 project 以上 fail
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const EXAMPLES_DIR = path.join(REPO_ROOT, 'examples');

const args = process.argv.slice(2);
const RUN_MODE = args.includes('--run');
const SUMMARY_ONLY = args.includes('--summary-only');

function listDogfoodProjects() {
  return readdirSync(EXAMPLES_DIR)
    .filter((name) => name.startsWith('dogfood-'))
    .filter((name) => existsSync(path.join(EXAMPLES_DIR, name, 'package.json')));
}

function checkStructure(project) {
  const projectDir = path.join(EXAMPLES_DIR, project);
  const pkgPath = path.join(projectDir, 'package.json');
  const perfDir = path.join(projectDir, 'tests', 'perf');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  const hasPerfDir = existsSync(perfDir);
  const hasTestPerfScript = Boolean(pkg.scripts?.['test:perf']);
  const kiwaDeps = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ].filter((d) => d.startsWith('@kiwa-lab/'));
  const hasKiwaDeps = kiwaDeps.length > 0;

  const violations = [];
  if (!hasPerfDir) violations.push('missing tests/perf/ dir');
  if (!hasTestPerfScript) violations.push('missing scripts.test:perf');
  if (!hasKiwaDeps) violations.push('no @kiwa-lab/* dependency');

  return {
    project,
    pass: violations.length === 0,
    violations,
    kiwaDeps,
  };
}

function runTestPerf(project) {
  const projectDir = path.join(EXAMPLES_DIR, project);
  const start = Date.now();
  const result = spawnSync('pnpm', ['run', 'test:perf'], {
    cwd: projectDir,
    stdio: SUMMARY_ONLY ? 'pipe' : 'inherit',
    encoding: 'utf-8',
    env: process.env,
  });
  return {
    project,
    pass: result.status === 0,
    durationMs: Date.now() - start,
  };
}

function main() {
  console.log('=== dogfood gate check ===');
  const dogfoods = listDogfoodProjects();
  console.log(`found ${dogfoods.length} dogfood project(s)`);
  console.log('');

  // Phase 1 — structural check
  const structResults = dogfoods.map(checkStructure);
  const structPassed = structResults.filter((r) => r.pass);
  const structFailed = structResults.filter((r) => !r.pass);

  console.log(`structural check: ${structPassed.length}/${structResults.length} pass`);
  if (structFailed.length > 0) {
    console.log('\nfailed projects (structural):');
    for (const r of structFailed.slice(0, 20)) {
      console.log(`  - ${r.project}: ${r.violations.join(', ')}`);
    }
    if (structFailed.length > 20) {
      console.log(`  ... and ${structFailed.length - 20} more`);
    }
  }

  // Phase 2 — actual test:perf execution (opt-in)
  if (RUN_MODE) {
    console.log('\n=== dogfood test:perf execution (--run mode) ===');
    console.log(`running test:perf for ${structPassed.length} projects...`);
    const runResults = structPassed.map(({ project }) => runTestPerf(project));
    const runPassed = runResults.filter((r) => r.pass);
    const runFailed = runResults.filter((r) => !r.pass);
    console.log(`\ntest:perf execution: ${runPassed.length}/${runResults.length} pass`);
    if (runFailed.length > 0) {
      console.log('\nfailed projects (test:perf):');
      for (const r of runFailed.slice(0, 20)) {
        console.log(`  - ${r.project}: ${(r.durationMs / 1000).toFixed(1)}s`);
      }
    }
    if (runFailed.length > 0 || structFailed.length > 0) {
      process.exit(1);
    }
  } else if (structFailed.length > 0) {
    console.log('\n❌ dogfood gate FAIL (structural)');
    console.log('use --run to also execute test:perf on all valid projects');
    process.exit(1);
  }

  console.log('\n✅ dogfood gate PASS');
  console.log(`(structural: ${structPassed.length} project、 test:perf 実行 = ${RUN_MODE ? 'done' : 'skipped, opt-in with --run'})`);
  process.exit(0);
}

main();
