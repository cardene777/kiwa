// test を生む skill が実行時間を完了条件に持つことを検査する (Issue #2186)。
//
// `durationMs` は全 record が持っていたのに dashboard が出しておらず、skill の完了条件も
// 時間に 1 度も触れていなかった。 結果として test は増える一方で、遅くなる方向にしか進まない。
//
// dashboard 側 (`## Execution time` section が出ること) は
// `packages/observability/tests/slowest.test.ts` が見る。 こちらは **skill が読むと決めたか**
// を見る = section を出しても、誰も読まないなら遅さは止まらない。
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SKILLS_DIR = resolve(REPO_ROOT, '.claude/skills');

/**
 * test を生む skill。 いずれも実行時間の確認を完了条件に持つ。
 *
 * `kiwa-observe` は test を生まないが dashboard を出す側なので、別の要求
 * (section を一覧に含めること) を T-SET-003 で見る。
 */
const TEST_PRODUCING_SKILLS = [
  'kiwa-a11y',
  'kiwa-api',
  'kiwa-auth',
  'kiwa-cache',
  'kiwa-cli-test',
  'kiwa-data',
  'kiwa-e2e',
  'kiwa-edge',
  'kiwa-forge',
  'kiwa-hardhat',
  'kiwa-nextjs',
  'kiwa-orm',
  'kiwa-play',
  'kiwa-queue',
  'kiwa-ui',
  'kiwa-vitest',
] as const;

const OBSERVER_SKILL = 'kiwa-observe';

function skillBody(skill: string): string {
  return readFileSync(resolve(SKILLS_DIR, skill, 'SKILL.md'), 'utf8');
}

/** YAML parser を増やさず、先頭 frontmatter の範囲だけを返す。 */
function skillFrontmatter(skill: string): string {
  const body = skillBody(skill);
  if (!body.startsWith('---\n')) return '';
  const end = body.indexOf('\n---\n', 4);
  return end === -1 ? '' : body.slice(4, end);
}

/** `## 完了条件` section を取り出す (次の `## ` 見出しまで)。 */
function completionSection(skill: string): string | null {
  const lines = skillBody(skill).split('\n');
  const start = lines.findIndex((line) => line.trim() === '## 完了条件');
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
}

describe('test を生む skill が実行時間を見る (#2186)', () => {
  it('T-SET-001 対象 skill を全件読めている', () => {
    // 走査対象が 0 件なら以下は全て素通りする。
    const missing = [...TEST_PRODUCING_SKILLS, OBSERVER_SKILL].filter(
      (skill) => !existsSync(resolve(SKILLS_DIR, skill, 'SKILL.md')),
    );
    expect(missing, 'SKILL.md を読めない skill がある').toEqual([]);
    expect(TEST_PRODUCING_SKILLS.length, '対象 skill が 0 件 (検査が空振りしている)').toBeGreaterThan(
      0,
    );
  });

  it('T-SET-002 全 skill の完了条件が実行時間の確認に触れる', () => {
    // 「遅い test を見た」 だけでは足りない。 **対処したか、対処しない理由を書いたか**まで
    // 要求する = 本質的に遅い test (実 anvil / 実 browser) を毎回「直せ」 と言わないため。
    const problems: string[] = [];
    for (const skill of TEST_PRODUCING_SKILLS) {
      const criteria = completionSection(skill);
      if (criteria === null) {
        problems.push(`${skill}: ## 完了条件 section が無い`);
        continue;
      }
      const timeLines = criteria
        .split('\n')
        .filter((line) => /Execution time|実行時間|遅い test/.test(line));
      if (timeLines.length === 0) {
        problems.push(`${skill}: 完了条件が実行時間に触れない`);
        continue;
      }
      const text = timeLines.join('\n');
      if (!/理由/.test(text)) {
        problems.push(`${skill}: 対処しない場合に理由を書く要求が無い`);
      }
    }
    expect(problems.sort(), '完了条件が実行時間を見ない skill がある').toEqual([]);
  });

  it('T-SET-003 kiwa-observe が Execution time を一覧と完了条件の両方に持つ', () => {
    const body = skillBody(OBSERVER_SKILL);
    const criteria = completionSection(OBSERVER_SKILL);
    expect(criteria, `${OBSERVER_SKILL}: ## 完了条件 section が無い`).not.toBeNull();
    // 一覧に無いと user に提示されず、完了条件に無いと出したかを誰も確かめない。
    // 片方だけでは経路が閉じないので両方を見る。
    expect(body, 'Step 2 の一覧に Execution time が無い').toContain(
      '`Summary` / `Flaky tests` / `Execution time` / `Spec coverage gaps`',
    );
    expect(criteria ?? '', '完了条件が Execution time に触れない').toContain('Execution time');
  });

  it('T-SET-004 一覧の外に test を生む skill がいない', () => {
    // 一覧を人手で持つ以上、漏れた skill が検査の外に落ちる。
    // 実物から数え直して突き合わせる (`rules/quality.md § 導出可能記述は人手で書かない`)。
    //
    // 完了条件を代理指標にしない。完了条件そのものが無い `kiwa-edge` / `kiwa-nextjs` /
    // `kiwa-orm` が検査対象から消えていたため、skill 自身が宣言する責務から導く。
    const PRODUCER_DESCRIPTION =
      /(?:test|テスト)[^。]*(?:変換|生成|実装)[^。]*skill|(?:test|テスト)[^。]*Write[^。]*Layer 2[^。]*test skill/i;
    const producing = readdirSkills().filter((skill) =>
      PRODUCER_DESCRIPTION.test(skillFrontmatter(skill)),
    );
    expect(producing.sort(), 'test を生む skill の一覧が実物とずれている').toEqual(
      [...TEST_PRODUCING_SKILLS].sort(),
    );
  });
});

function readdirSkills(): string[] {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .filter((name) => existsSync(resolve(SKILLS_DIR, name, 'SKILL.md')))
    .sort();
}
