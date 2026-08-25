/**
 * `scripts/rebuild-plugin-metadata.mjs --check` の検査。
 *
 * この検査が居る理由は、検知の有無ではなく検知が走る経路にある。
 *
 * 生成物の古さは `tests/release-smoke/tests/plugin-metadata-names.test.ts` が既に見ている。
 * ところがその test は入力を `readdirSync` で読む (`.claude/skills/` の dir 一覧) 一方、
 * `test:fast` は影響する test を import graph から決める。 fs で読む依存は import graph に
 * 現れないため、 `.claude/skills/<name>/SKILL.md` を足しても対象外と判定され、 全 166 target の
 * sweep まで 1 度も走らなかった (#2229 / #2233 が merge 後まで気付かれなかった経路)。
 *
 * `test:scripts` は `node --test` が file を名指しするので、 import graph の判定を通らない。
 * ここに置けば skill を足した PR でも必ず走る。
 *
 * 識別力の確認は一時 root で行う。 追跡下の file を書き換えて戻す形は採らない
 * (`scripts/test-all.mjs` は test が追跡 file を汚したことを失敗として扱うため、
 * 書き換えている最中に走った sweep が別 package を犯人として報告する)。
 */
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPTS_DIR, '..');
const SCRIPT = path.join(SCRIPTS_DIR, 'rebuild-plugin-metadata.mjs');

/** script を走らせる。 終了 code と出力を返す (非 0 でも throw しない)。 */
function runCheck(scriptPath) {
  return spawnSync(process.execPath, [scriptPath, '--check'], {
    encoding: 'utf-8',
    cwd: REPO_ROOT,
  });
}

/**
 * script が `REPO_ROOT` を自身の位置から導く (`resolve(HERE, '..')`) ため、
 * 一時 root に同じ配置を作れば、 そこの `.claude-plugin/` を対象にできる。
 *
 * 生成物だけを実 copy にし、 入力側 (skill 一覧 / package 一覧 / 依存表) は symlink で
 * 実物を指す。 入力を copy すると実物との差が生まれ、 検査が実 repo を見なくなる。
 */
function withMirrorRoot(fn) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'plugin-metadata-'));
  try {
    for (const name of ['docs', 'packages', 'kiwa-py', '.claude']) {
      symlinkSync(path.join(REPO_ROOT, name), path.join(root, name));
    }

    mkdirSync(path.join(root, 'scripts'));
    copyFileSync(SCRIPT, path.join(root, 'scripts', 'rebuild-plugin-metadata.mjs'));
    symlinkSync(path.join(SCRIPTS_DIR, 'lib'), path.join(root, 'scripts', 'lib'));

    mkdirSync(path.join(root, '.claude-plugin'));
    for (const name of ['plugin.json', 'marketplace.json']) {
      copyFileSync(
        path.join(REPO_ROOT, '.claude-plugin', name),
        path.join(root, '.claude-plugin', name),
      );
    }

    return fn({ root, script: path.join(root, 'scripts', 'rebuild-plugin-metadata.mjs') });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('commit 済の生成物は実 skill 一覧と一致する', () => {
  const result = runCheck(SCRIPT);
  assert.equal(
    result.status,
    0,
    `生成物が古い。 node scripts/rebuild-plugin-metadata.mjs を実行して commit する\n${result.stdout}${result.stderr}`,
  );
  assert.match(result.stdout, /metadata up to date/);
});

test('一時 root の生成物を古くすると --check が落ちる', () => {
  withMirrorRoot(({ root, script }) => {
    // 実 repo と同じ内容から始まるので、 まず通ることを確かめる。
    // ここが落ちるなら以降の 1 は「古くしたから」 ではなく mirror の作り方の欠陥になる。
    assert.equal(runCheck(script).status, 0, '一時 root が実 repo と同じ状態で通らない');

    const pluginPath = path.join(root, '.claude-plugin', 'plugin.json');
    const plugin = JSON.parse(readFileSync(pluginPath, 'utf-8'));
    // 生成物側の件数だけを 1 つずらす。 入力 (`.claude/skills/`) は symlink の実物のまま
    // なので、 script は「実体と生成物が食い違う」 状態を見る。
    plugin.description = plugin.description.replace(/\b(\d+)( Claude Code)? skills\b/, (_, n) => `${Number(n) - 1} skills`);
    writeFileSync(pluginPath, `${JSON.stringify(plugin, null, 2)}\n`);

    const result = runCheck(script);
    assert.equal(result.status, 1, '生成物を古くしても --check が落ちない');
    assert.match(result.stderr, /plugin\.json is out of date/);
  });
});

test('一時 root の marketplace 側を古くしても --check が落ちる', () => {
  withMirrorRoot(({ root, script }) => {
    const marketPath = path.join(root, '.claude-plugin', 'marketplace.json');
    const market = JSON.parse(readFileSync(marketPath, 'utf-8'));
    market.plugins[0].description = market.plugins[0].description.replace(
      /\b(\d+)( Claude Code)? skills\b/,
      (_, n) => `${Number(n) - 1} skills`,
    );
    writeFileSync(marketPath, `${JSON.stringify(market, null, 2)}\n`);

    const result = runCheck(script);
    assert.equal(result.status, 1, 'marketplace 側を古くしても --check が落ちない');
    assert.match(result.stderr, /marketplace\.json is out of date/);
  });
});

test('--check は生成物を書き換えない', () => {
  withMirrorRoot(({ root, script }) => {
    const pluginPath = path.join(root, '.claude-plugin', 'plugin.json');
    const before = readFileSync(pluginPath, 'utf-8');
    const plugin = JSON.parse(before);
    plugin.description = plugin.description.replace(/\b(\d+)( Claude Code)? skills\b/, (_, n) => `${Number(n) - 1} skills`);
    const stale = `${JSON.stringify(plugin, null, 2)}\n`;
    writeFileSync(pluginPath, stale);

    runCheck(script);

    assert.equal(
      readFileSync(pluginPath, 'utf-8'),
      stale,
      '--check が生成物を書き戻している (読むだけのはず)',
    );
  });
});
