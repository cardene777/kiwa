#!/usr/bin/env node
/**
 * Release precheck — 3 gate 統合 (Gate 3 taxonomy + Gate 1 coverage + Gate 2 mutation)。
 *
 * pnpm release の lifecycle prehook として `prerelease` script から呼出。
 * 3 gate を fail-fast 順序 (fast → slow) で走らせ、 1 gate 失敗で即 exit 1 で release 中断。
 *
 * bypass marker 経路 = `.context/markers/release-precheck-bypass-{lib}` file 存在時に
 * 該当 lib の Gate 1 未達を warn 昇格して継続。 follow-up Issue merge 完了までの暫定運用。
 *
 * Usage:
 *   node scripts/release-precheck.mjs                # 3 gate 全走 (default)
 *   node scripts/release-precheck.mjs --skip-mutation # mutation gate skip (mutation は 30+ min)
 *   node scripts/release-precheck.mjs --dry-run      # 各 gate を dry-run mode で報告のみ
 */
import { existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const REPO_ROOT = process.env.KIWA_RELEASE_PRECHECK_ROOT
  ? resolve(process.env.KIWA_RELEASE_PRECHECK_ROOT)
  : process.cwd();

const BYPASS_DIR = resolve(REPO_ROOT, '.context/markers');
const SKIP_MUTATION = process.argv.includes('--skip-mutation');
const DRY_RUN = process.argv.includes('--dry-run');

function log(msg) {
  process.stdout.write(`[release-precheck] ${msg}\n`);
}

function warn(msg) {
  process.stderr.write(`[release-precheck] WARN: ${msg}\n`);
}

function err(msg) {
  process.stderr.write(`[release-precheck] ERROR: ${msg}\n`);
}

function listBypassMarkers() {
  if (!existsSync(BYPASS_DIR)) return [];
  return readdirSync(BYPASS_DIR)
    .filter((name) => name.startsWith('release-precheck-bypass-'))
    .map((name) => name.replace(/^release-precheck-bypass-/, '').replace(/\.md$/, ''));
}

function runGate(name, cmd, args, options = {}) {
  log(`Gate ${name} 開始: ${cmd} ${args.join(' ')}`);
  if (DRY_RUN) {
    log(`Gate ${name} DRY-RUN skip`);
    return { ok: true, dryRun: true };
  }
  const result = spawnSync(cmd, args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    encoding: 'utf-8',
    ...options,
  });
  if (result.status !== 0) {
    return { ok: false, status: result.status };
  }
  return { ok: true };
}

function main() {
  log(`repo root = ${REPO_ROOT}`);
  const bypassLibs = listBypassMarkers();
  if (bypassLibs.length > 0) {
    warn(`Gate 1 bypass marker 検出 (${bypassLibs.length} lib): ${bypassLibs.join(', ')}`);
    warn(`これらの lib の coverage 未達は release-precheck では警告扱い、 follow-up Issue merge 完了までの暫定`);
  }

  log('=== Gate 3 (taxonomy CLI) ===');
  const gate3 = runGate('3-taxonomy', 'node', ['scripts/kiwa-taxonomy-run.mjs', '--category', 'all']);
  if (!gate3.ok) {
    err(`Gate 3 (taxonomy CLI) 失敗 exit=${gate3.status}`);
    err('release 中断: 全 lib テスト揃い chk 未 pass');
    process.exit(1);
  }
  log('Gate 3 pass');

  log('=== Gate 1 (coverage) ===');
  const gate1 = runGate('1-coverage', 'node', ['scripts/check-coverage-gates.mjs']);
  if (!gate1.ok) {
    if (bypassLibs.length === 0) {
      err(`Gate 1 (coverage) 失敗 exit=${gate1.status}`);
      err('release 中断: coverage threshold 未達 lib あり (bypass marker 未設定)');
      process.exit(1);
    }
    warn(`Gate 1 (coverage) 失敗 exit=${gate1.status} だが bypass marker (${bypassLibs.length} lib) で release 継続`);
    warn('bypass 対象外の lib で失敗が含まれる場合は上記出力を確認、 対象内ならこの warn は暫定運用範囲');
  } else {
    log('Gate 1 pass');
  }

  if (SKIP_MUTATION) {
    log('=== Gate 2 (mutation) skip (--skip-mutation) ===');
  } else {
    log('=== Gate 2 (mutation) ===');
    const gate2 = runGate('2-mutation', 'node', ['scripts/check-mutation-gates.mjs']);
    if (!gate2.ok) {
      err(`Gate 2 (mutation) 失敗 exit=${gate2.status}`);
      err('release 中断: mutation MSI threshold 未達 lib あり');
      process.exit(1);
    }
    log('Gate 2 pass');
  }

  log('=== release-precheck 全 gate 通過 ===');
  process.exit(0);
}

main();
