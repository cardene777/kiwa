// Q-release-precheck = pnpm release lifecycle prehook (`prerelease` script) の
// 実装 chk。 scripts/release-precheck.mjs の存在 + argv flag 認識 + bypass marker 検出 +
// dry-run mode の 4 shape を release-smoke 経路で verify する。
//
// SSOT = scripts/release-precheck.mjs、 root package.json § scripts.prerelease、
// 判断根拠 = vault decisions/personal/decision-log/2026-07-14-release-precheck-prehook-input-confirmed.md
//
// 実 gate 全走 (taxonomy + coverage + mutation の 3 gate) の behavior verify は
// 各 gate script (scripts/kiwa-taxonomy-run.mjs / check-coverage-gates.mjs /
// check-mutation-gates.mjs) 側で cover 済、 本 test は release-precheck.mjs の
// 統合 wrapper 挙動 (bypass marker / dry-run / --skip-mutation) に絞る。

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..');
const SCRIPT_PATH = join(ROOT, 'scripts/release-precheck.mjs');

describe('Q-release-precheck script shape', () => {
  it('SCRIPT_PATH が実在する', () => {
    expect(existsSync(SCRIPT_PATH)).toBe(true);
  });

  it('root package.json の prerelease script に配線されている', async () => {
    const pkgPath = join(ROOT, 'package.json');
    const raw = await import('node:fs/promises').then((fs) => fs.readFile(pkgPath, 'utf-8'));
    const pkg = JSON.parse(raw);
    expect(pkg.scripts).toHaveProperty('prerelease');
    expect(pkg.scripts.prerelease).toContain('scripts/release-precheck.mjs');
  });
});

describe('Q-release-precheck --dry-run mode', () => {
  it('--dry-run で 3 gate 全て skip、 exit 0', () => {
    const result = spawnSync('node', [SCRIPT_PATH, '--dry-run'], {
      encoding: 'utf-8',
      env: { ...process.env, KIWA_RELEASE_PRECHECK_ROOT: ROOT },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Gate 3 (taxonomy CLI)');
    expect(result.stdout).toContain('DRY-RUN skip');
    expect(result.stdout).toContain('全 gate 通過');
  });
});

describe('Q-release-precheck bypass marker 検出', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'release-precheck-test-'));
    mkdirSync(join(tempRoot, '.context/markers'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('bypass marker なし = warn 出力なし', () => {
    const result = spawnSync('node', [SCRIPT_PATH, '--dry-run'], {
      encoding: 'utf-8',
      env: { ...process.env, KIWA_RELEASE_PRECHECK_ROOT: tempRoot },
    });
    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain('bypass marker 検出');
  });

  it('bypass marker あり = warn 出力に lib 名列挙', () => {
    writeFileSync(
      join(tempRoot, '.context/markers/release-precheck-bypass-testlib.md'),
      '---\nlib: testlib\n---\ntest bypass\n',
    );
    const result = spawnSync('node', [SCRIPT_PATH, '--dry-run'], {
      encoding: 'utf-8',
      env: { ...process.env, KIWA_RELEASE_PRECHECK_ROOT: tempRoot },
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('bypass marker 検出');
    expect(result.stderr).toContain('testlib');
  });

  it('bypass marker 複数 = 全 lib 名を列挙', () => {
    writeFileSync(
      join(tempRoot, '.context/markers/release-precheck-bypass-alpha.md'),
      '---\nlib: alpha\n---\n',
    );
    writeFileSync(
      join(tempRoot, '.context/markers/release-precheck-bypass-beta.md'),
      '---\nlib: beta\n---\n',
    );
    const result = spawnSync('node', [SCRIPT_PATH, '--dry-run'], {
      encoding: 'utf-8',
      env: { ...process.env, KIWA_RELEASE_PRECHECK_ROOT: tempRoot },
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('alpha');
    expect(result.stderr).toContain('beta');
    expect(result.stderr).toContain('2 lib');
  });
});

describe('Q-release-precheck --skip-mutation flag', () => {
  it('--skip-mutation + --dry-run で Gate 2 が skip 明示される', () => {
    const result = spawnSync('node', [SCRIPT_PATH, '--dry-run', '--skip-mutation'], {
      encoding: 'utf-8',
      env: { ...process.env, KIWA_RELEASE_PRECHECK_ROOT: ROOT },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Gate 2 (mutation) skip (--skip-mutation)');
    expect(result.stdout).not.toContain('Gate 2 pass');
  });
});
