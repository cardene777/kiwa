import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  headingSectionIn,
  read,
  REPO_ROOT,
  skillBody,
  skillsWithSkillMd,
} from './skill-md.js';

/**
 * report の path 雛形が 1 箇所にしか無いか (#2082).
 *
 * #2081 が 5 round (上限) を要した原因は、 「path を写しで持つ」 形が 6 skill / 9 箇所に
 * 散っていたのに 1 round で 1 箇所ずつ潰したこと。 掃き直したところ **writer と reader が
 * 別の値を持つ** 形が 2 件残っていた。
 *
 * | 種別 | SSOT | 写しが起こしたずれ |
 * |---|---|---|
 * | observe dashboard | `/kiwa-test` Step 5a の `--out` | reader が `{module}` を落とす (#2077 の取りこぼし) |
 * | coverage report | 各 skill の Step 0 (lang 別 path) | 11 箇所が lang suffix を落とす |
 *
 * 検査は **写しが 0 件であること** を見る。 値の一致を見る形にすると、 写しを保ったまま
 * 揃えるだけで通り、 次に SSOT が変わった時にまたずれる。
 */

const SKILLS = [...skillsWithSkillMd()].sort();

/** skill の SKILL.md から、 与えた形に一致する行を集める。 */
function occurrences(pattern: RegExp): { skill: string; line: string }[] {
  const out: { skill: string; line: string }[] = [];
  for (const skill of SKILLS) {
    for (const line of skillBody(skill).split('\n')) {
      if (pattern.test(line)) out.push({ skill, line: line.trim() });
    }
  }
  return out;
}

/** skill の references 直下にある Markdown を全件読む (symlink も参照先を読む)。 */
function referenceMarkdown(skill: string): { file: string; body: string }[] {
  const dir = `.claude/skills/${skill}/references`;
  return readdirSync(resolve(REPO_ROOT, dir), { withFileTypes: true })
    .filter((entry) =>
      (entry.isFile() || entry.isSymbolicLink()) && entry.name.endsWith('.md'),
    )
    .map((entry) => ({ file: `${dir}/${entry.name}`, body: read(`${dir}/${entry.name}`) }));
}

describe('observe dashboard の雛形は writer だけが持つ', () => {
  const SHAPE = /tests\/reports\/observe\/dashboard-\{/;

  it('雛形を 1 件以上拾えている (空振り防止)', () => {
    // 形が変わって 0 件になると、 下の「writer だけ」 が空集合で成立する。
    expect(occurrences(SHAPE).length).toBeGreaterThan(0);
  });

  it('writer (kiwa-test / kiwa-observe) 以外が雛形を持たない', () => {
    // `/kiwa-observe` は既定名を自分で決める writer、 `/kiwa-test` は `--out` を渡す caller。
    // それ以外 (reader) が雛形を持つと、 writer が軸を足した時にずれる。
    const owners = new Set(['kiwa-test', 'kiwa-observe']);
    const stray = occurrences(SHAPE).filter((o) => !owners.has(o.skill));
    expect(stray, 'writer 以外が observe dashboard の雛形を持っている').toEqual([]);
  });

  it('reader が組み立てないことを明記している', () => {
    // 雛形が無いだけだと「書き忘れ」 と区別が付かない。 読み方を書いてあることまで見る。
    const review = skillBody('kiwa-review');
    const line = review.split('\n').find((l) => l.includes('observe dashboard'));
    expect(line, 'kiwa-review に observe dashboard の読み方が無い').toBeTruthy();
    expect(line!, '組み立てないことを書いていない').toContain('file 名を組み立てない');
  });
});

describe('coverage report の雛形は Step 0 だけが持つ', () => {
  const SHAPE = /tests\/reports\/contract\/coverage-report-\{/;
  const OWNERS = ['kiwa-forge', 'kiwa-hardhat'];

  it('雛形を 1 件以上拾えている (空振り防止)', () => {
    expect(occurrences(SHAPE).length).toBeGreaterThan(0);
  });

  it.each(OWNERS)('%s の雛形が Step 0 の中だけにある', (skill) => {
    // Step 0 が lang 別 path を定義する。 それ以外の step が雛形を持つと lang suffix を
    // 落とす (実測で forge / hardhat 合わせて 11 箇所が落としていた)。
    const body = skillBody(skill);
    const step0 = headingSectionIn(body, /^### Step 0: 文書生成言語の(?:選択|決定)/m);
    const inStep0 = step0.split('\n').filter((l) => SHAPE.test(l)).length;
    expect(inStep0, `${skill}: Step 0 が coverage path を定義していない`).toBeGreaterThan(0);

    const total = body.split('\n').filter((l) => SHAPE.test(l)).length;
    expect(total, `${skill}: Step 0 の外に coverage path の写しがある`).toBe(inStep0);
  });

  it('Step 0 の雛形が repo の実 coverage report と一致する', () => {
    // 宣言が実物とずれていないことを、 追跡済 file で確かめる。 `-hardhat` suffix は
    // 実際に使われている (2 / 4 件) が、 Step 0 に無いまま reference の括弧書きだけが
    // 支えていた = その括弧を消すと規約がどこにも残らない (#2082 の r3-f1)。
    const tracked = execFileSync('git', ['ls-files', 'tests/reports/contract'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
    })
      .split('\n')
      .filter((f) => f.endsWith('.md'));
    expect(tracked.length, 'coverage report を 1 件も読めていない').toBeGreaterThan(0);

    const hardhat = tracked.filter((f) => f.includes('-hardhat.'));
    const foundry = tracked.filter((f) => !f.includes('-hardhat.'));
    expect(hardhat.length, 'Hardhat 側の実 file が無い').toBeGreaterThan(0);
    expect(foundry.length, 'Foundry 側の実 file が無い').toBeGreaterThan(0);

    // 実物が 2 形あるので、 宣言も 2 形なければならない。
    const forgeStep0 = headingSectionIn(
      skillBody('kiwa-forge'),
      /^### Step 0: 文書生成言語の(?:選択|決定)/m,
    );
    const hardhatStep0 = headingSectionIn(
      skillBody('kiwa-hardhat'),
      /^### Step 0: 文書生成言語の(?:選択|決定)/m,
    );
    expect(hardhatStep0, 'Hardhat Step 0 が runner suffix を定めていない').toContain(
      'coverage-report-{module}-hardhat.',
    );
    expect(forgeStep0, 'Foundry Step 0 に runner suffix が混ざっている').not.toContain('-hardhat');
  });

  it.each(OWNERS)('%s の Step 0 が round 別の suffix 位置を定めている', (skill) => {
    // canonical と round 別で suffix の付き方が違うと、 どちらが正か決められない。
    const step0 = headingSectionIn(skillBody(skill), /^### Step 0: 文書生成言語の(?:選択|決定)/m);
    expect(step0, `${skill}: round 別 path の規約が無い`).toContain('-round-{N}');
    expect(step0, `${skill}: lang suffix の位置を書いていない`).toContain('lang suffix は常に末尾');
  });

  it.each(OWNERS)('%s の references に写しが無い', (skill) => {
    // 上の「Step 0 の中だけ」 は SKILL.md しか走査しない。 references も全件見る =
    // 1 file だけを名指しすると、 別 reference に残った写しを検出できない。
    expect(skillBody(skill), `${skill}: template の参照が消えている`).toContain(
      'coverage-report-template.md',
    );
    const references = referenceMarkdown(skill);
    const copies = references.flatMap(({ file, body }) =>
      body
        .split('\n')
        .filter((line) => SHAPE.test(line) || /`coverage-report-\{/.test(line))
        .map((line) => ({ file, line: line.trim() })),
    );
    expect(copies, `${skill}: references に coverage path の写しがある`).toEqual([]);

    const template = read(`.claude/skills/${skill}/references/coverage-report-template.md`);
    expect(template, `${skill}: 出力先の委譲先を書いていない`).toContain('Step 0');
  });
});
