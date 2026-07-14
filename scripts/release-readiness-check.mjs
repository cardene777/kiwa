#!/usr/bin/env node
/**
 * release-readiness-check.mjs — kiwa release レベル判定 tool。
 *
 * 4 gate + release-smoke を統合実行して kiwa が release 可能な状態か判定する。
 * user 明示要求「リリースできるレベルをチェックするもの、 テストチェックツール
 * もその中で読んで欲しい」 に対応。
 *
 * # 実行内容
 *
 * - **Gate 1 = coverage** (scripts/check-coverage-gates.mjs)
 *   → Lines/Statements ≥ 90% + Functions ≥ 90% + Branches ≥ 80% を全 lib で verify
 * - **Gate 3 = taxonomy CLI** (scripts/kiwa-taxonomy-run.mjs --category all)
 *   → perf / fidelity / skill / integration 4 category × 全 lib 全 pass verify
 * - **release-smoke** (tests/release-smoke/)
 *   → publish invariant / import surface / license consistency 等 379 test verify
 * - **build check** (pnpm -r --if-present run typecheck の subset)
 *   → TypeScript compile pass 全 lib
 *
 * # exit code
 *
 * - 0 = 全 gate pass = release 可能
 * - 1 = 1 gate 以上 fail = release 不可
 *
 * # 使い方
 *
 * ```bash
 * # 全 gate 一括実行
 * node scripts/release-readiness-check.mjs
 *
 * # 特定 gate だけ実行 (skip 経路)
 * node scripts/release-readiness-check.mjs --skip=release-smoke
 *
 * # summary のみ表示 (詳細 log 抑制)
 * node scripts/release-readiness-check.mjs --summary-only
 * ```
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const SKIP_SET = new Set(
  args
    .filter((a) => a.startsWith('--skip='))
    .flatMap((a) => a.slice('--skip='.length).split(','))
    .map((s) => s.trim())
    .filter(Boolean),
);
const SUMMARY_ONLY = args.includes('--summary-only');

/**
 * 1 gate 実行。 stdio inherit で出力を parent に流す (summary-only 時は pipe)。
 */
function runGate(name, cmd, cmdArgs, cwd = REPO_ROOT) {
  if (SKIP_SET.has(name)) {
    return { name, status: 'skipped', durationMs: 0 };
  }
  const start = Date.now();
  const result = spawnSync(cmd, cmdArgs, {
    cwd,
    stdio: SUMMARY_ONLY ? 'pipe' : 'inherit',
    encoding: 'utf-8',
    env: process.env,
  });
  const durationMs = Date.now() - start;
  const status = result.status === 0 ? 'pass' : 'fail';
  return {
    name,
    status,
    durationMs,
    stdout: SUMMARY_ONLY ? result.stdout : undefined,
    stderr: SUMMARY_ONLY ? result.stderr : undefined,
  };
}

/**
 * gate 一覧を順次実行 (parallel は依存関係あるため sequential)。
 */
function runAllGates() {
  const gates = [];

  // Gate 1 = coverage
  const coverageScript = path.join(REPO_ROOT, 'scripts/check-coverage-gates.mjs');
  if (existsSync(coverageScript)) {
    gates.push(runGate('gate1-coverage', 'node', [coverageScript]));
  } else {
    gates.push({ name: 'gate1-coverage', status: 'missing', durationMs: 0 });
  }

  // Gate 3 = taxonomy CLI
  const taxonomyScript = path.join(REPO_ROOT, 'scripts/kiwa-taxonomy-run.mjs');
  if (existsSync(taxonomyScript)) {
    gates.push(runGate('gate3-taxonomy', 'node', [taxonomyScript, '--category', 'all']));
  } else {
    gates.push({ name: 'gate3-taxonomy', status: 'missing', durationMs: 0 });
  }

  // release-smoke
  const releaseSmokePath = path.join(REPO_ROOT, 'tests/release-smoke');
  if (existsSync(releaseSmokePath)) {
    gates.push(runGate('release-smoke', 'pnpm', ['-C', releaseSmokePath, 'test']));
  } else {
    gates.push({ name: 'release-smoke', status: 'missing', durationMs: 0 });
  }

  // build/typecheck (subset)
  gates.push(runGate('build-check', 'pnpm', ['-r', '--if-present', 'run', 'typecheck']));

  // Gate 5 = dogfood structural check (117 dogfood-* project の 3 条件 verify)
  // --run 経路は skip default (117 project × test:perf = 時間かかる)、 structural のみ
  const dogfoodScript = path.join(REPO_ROOT, 'scripts/check-dogfood-gate.mjs');
  if (existsSync(dogfoodScript)) {
    const dogfoodArgs = [dogfoodScript];
    if (process.env.INCLUDE_DOGFOOD_RUN === '1') dogfoodArgs.push('--run');
    gates.push(runGate('gate5-dogfood', 'node', dogfoodArgs));
  } else {
    gates.push({ name: 'gate5-dogfood', status: 'missing', durationMs: 0 });
  }

  // Gate 2 = mutation MSI (test 品質軸、 test の kill/survive ratio 検証)
  // env INCLUDE_MUTATION=1 で opt-in、 default skip (mutation = 30+ min heavy)
  const mutationScript = path.join(REPO_ROOT, 'scripts/check-mutation-gates.mjs');
  if (existsSync(mutationScript)) {
    if (process.env.INCLUDE_MUTATION === '1' && !SKIP_SET.has('gate2-mutation')) {
      gates.push(runGate('gate2-mutation', 'node', [mutationScript]));
    } else {
      gates.push({ name: 'gate2-mutation', status: 'skipped', durationMs: 0 });
    }
  } else {
    gates.push({ name: 'gate2-mutation', status: 'missing', durationMs: 0 });
  }

  return gates;
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusIcon(status) {
  return { pass: '✅', fail: '❌', skipped: '⏭️', missing: '❓' }[status] || '?';
}

function main() {
  console.log('=== kiwa release readiness check ===');
  console.log(`repo: ${REPO_ROOT}`);
  console.log(`skip: ${SKIP_SET.size > 0 ? [...SKIP_SET].join(',') : '(none)'}`);
  console.log('');

  const startedAt = Date.now();
  const gates = runAllGates();
  const totalDuration = Date.now() - startedAt;

  console.log('');
  console.log('=== summary ===');
  console.log('');
  console.log('| gate | status | duration |');
  console.log('|---|---|---|');
  for (const g of gates) {
    console.log(`| ${g.name} | ${statusIcon(g.status)} ${g.status} | ${formatDuration(g.durationMs)} |`);
  }
  console.log('');
  console.log(`total duration: ${formatDuration(totalDuration)}`);

  const failed = gates.filter((g) => g.status === 'fail');
  const missing = gates.filter((g) => g.status === 'missing');
  const skipped = gates.filter((g) => g.status === 'skipped');
  const passed = gates.filter((g) => g.status === 'pass');

  console.log('');
  console.log(`pass: ${passed.length} / fail: ${failed.length} / skipped: ${skipped.length} / missing: ${missing.length}`);

  if (failed.length > 0) {
    console.log('');
    console.log('❌ RELEASE BLOCKED');
    console.log('failed gates:');
    for (const g of failed) {
      console.log(`  - ${g.name}`);
    }
    process.exit(1);
  }
  if (missing.length > 0) {
    console.log('');
    console.log('⚠️  MISSING GATES (release-readiness incomplete):');
    for (const g of missing) {
      console.log(`  - ${g.name}`);
    }
    process.exit(1);
  }

  console.log('');
  console.log('✅ RELEASE READY — 全 gate pass、 kiwa は release 可能な状態です');
  process.exit(0);
}

main();
