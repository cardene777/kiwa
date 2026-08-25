/**
 * `scripts/check-plugin-version-bump.mjs` の検査。
 *
 * 判定 (`decide`) は git に触らないので、 4 通りの組合せを直接固定できる。
 * 実 repo に対する走査 (`skillNamesAt`) は、 数え方が生成器の `readSkills()` と
 * 同じ基準 (`SKILL.md` を持つ dir だけ) であることを確かめる。
 *
 * 空振りへの備えとして、 実 repo を走査する検査は件数が 1 件以上あることを先に assert する。
 * 集合が空だと以降の assert に到達せず、 検査の件数だけが並ぶため。
 */
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { REPO_ROOT, decide, skillNamesAt, versionAt } from './check-plugin-version-bump.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-plugin-version-bump.mjs');

test('skill が増えて version が据え置きなら落とす', () => {
  const result = decide({
    baseSkills: new Set(['a', 'b']),
    headSkills: new Set(['a', 'b', 'c']),
    baseVersion: '2.19.0',
    headVersion: '2.19.0',
  });
  assert.equal(result.verdict, 'stale-version');
  assert.deepEqual(result.added, ['c']);
  assert.match(result.reason, /2\.19\.0 のまま/);
});

test('skill が増えて version も上がっていれば通す', () => {
  const result = decide({
    baseSkills: new Set(['a', 'b']),
    headSkills: new Set(['a', 'b', 'c']),
    baseVersion: '2.19.0',
    headVersion: '2.20.0',
  });
  assert.equal(result.verdict, 'ok');
  assert.deepEqual(result.added, ['c']);
});

test('skill が増えていなければ version 据え置きでも通す', () => {
  const result = decide({
    baseSkills: new Set(['a', 'b']),
    headSkills: new Set(['a', 'b']),
    baseVersion: '2.19.0',
    headVersion: '2.19.0',
  });
  assert.equal(result.verdict, 'ok');
  assert.deepEqual(result.added, []);
});

test('skill が減っただけなら version 据え置きでも通す', () => {
  const result = decide({
    baseSkills: new Set(['a', 'b', 'c']),
    headSkills: new Set(['a', 'b']),
    baseVersion: '2.19.0',
    headVersion: '2.19.0',
  });
  assert.equal(result.verdict, 'ok');
});

test('入れ替わり (同数で別名) は増加として扱い、据え置きなら落とす', () => {
  // 件数だけを見ると差が無い形。 名前で見ないと、新しい skill が届かない状態を見逃す。
  const result = decide({
    baseSkills: new Set(['a', 'b']),
    headSkills: new Set(['a', 'c']),
    baseVersion: '2.19.0',
    headVersion: '2.19.0',
  });
  assert.equal(result.verdict, 'stale-version');
  assert.deepEqual(result.added, ['c']);
});

test('読めなかった値を 問題なし に倒さない', () => {
  for (const missing of ['baseSkills', 'headSkills', 'baseVersion', 'headVersion']) {
    const input = {
      baseSkills: new Set(['a']),
      headSkills: new Set(['a', 'b']),
      baseVersion: '2.19.0',
      headVersion: '2.19.0',
      [missing]: null,
    };
    assert.equal(
      decide(input).verdict,
      'undecidable',
      `${missing} が null でも判定を返している (読めなかったことを値に潰している)`,
    );
  }
});

test('skillNamesAt は SKILL.md を持つ dir だけを数える', () => {
  const names = skillNamesAt('HEAD');
  assert.notEqual(names, null, 'HEAD の skill 一覧を読めない');
  assert.ok(names.size > 0, 'skill を 1 件も数えていない (検査が空振りしている)');

  // 生成器の readSkills() と同じ基準であることを、実 dir と突き合わせて確かめる。
  const onDisk = readdirSync(path.join(REPO_ROOT, '.claude/skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => existsSync(path.join(REPO_ROOT, '.claude/skills', name, 'SKILL.md')))
    .sort();

  assert.ok(onDisk.length > 0, '実 dir 側で skill を 1 件も数えていない (検査が空振りしている)');
  assert.deepEqual([...names].sort(), onDisk, 'git 側と実 dir 側で skill の数え方が食い違う');
});

test('versionAt が HEAD の配布物 version を読める', () => {
  const version = versionAt('HEAD');
  assert.notEqual(version, null, 'HEAD の version を読めない');
  assert.match(version, /^\d+\.\d+\.\d+/, `version の形が想定外: ${version}`);
});

test('存在しない ref は 判定できない として exit 2 で止まる', () => {
  const result = spawnSync(process.execPath, [SCRIPT, '--base', 'refs/heads/no-such-ref-for-test'], {
    encoding: 'utf-8',
    cwd: REPO_ROOT,
  });
  assert.equal(result.status, 2, '解決できない ref を 問題なし に倒している');
  assert.match(result.stderr, /解決できません/);
});

test('--base に値が無い呼出は exit 2 で止まる', () => {
  const result = spawnSync(process.execPath, [SCRIPT, '--base'], {
    encoding: 'utf-8',
    cwd: REPO_ROOT,
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--base に ref を渡してください/);
});
