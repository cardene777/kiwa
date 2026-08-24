// coverage を測る skill が同じ目標を掲げていることを検査する (Issue #2184)。
//
// 4 skill のうち `kiwa-vitest` だけが 80% で止まる設計だった。 しかも同じ file の中で
// Step 5 は「production target 100%」 と書き、完了条件は「threshold 達成 (default 80%)」 と
// 書いていた。 **完了条件が gate になる**ので実効は 80% で、Step 5 の記述は読まれるだけだった。
//
// `kiwa-vitest` は TypeScript 単体テストを担う skill = packages/* の library 本体を覆う
// 唯一の経路で、100% を目指す仕組みがいちばん必要な場所にだけ入っていなかった。
//
// 揃っているかだけでなく **その値が 100 であること** も見る。 揃っていることだけを見ると、
// 4 つとも 50% に下げる変更が通る。
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SKILLS_DIR = resolve(REPO_ROOT, '.claude/skills');

/**
 * coverage を測る skill。
 *
 * `kiwa-e2e` / `kiwa-play` は coverage を測らないので入れない。 増えた時にここへ足す。
 * 一覧を人手で持つのは、「coverage を測る skill か」 を静的に判定する手が無いため
 * (`--coverage` の出現で拾うと、説明文で言及しただけの skill が入る)。 代わりに
 * T-SCT-004 が「一覧の外に `--coverage-threshold` を宣言する skill がいないか」 を見る。
 */
const COVERAGE_SKILLS = ['kiwa-api', 'kiwa-forge', 'kiwa-hardhat', 'kiwa-vitest'] as const;

/**
 * 4 metric すべてに metric 別 override を宣言することを要求する。
 *
 * 完了条件の文面で metric 名を要求する形にはしない。 `全 4 metric` と書く skill と
 * `Lines / Stmts / Branches / Funcs` と並べる skill があり、どちらも 4 つを見ている。
 * 文面の一致を要求すると、正しい skill を表記の違いだけで落とす。
 *
 * 代わりに **option の宣言** を見る。 これは metric ごとに 1 つずつ存在するかどうかで、
 * 表記の揺れが無く、かつ「4 つを判定の対象にしている」 ことの直接の証拠になる。
 * `kiwa-vitest` が Branches を落としていた時、この宣言も無かった。
 *
 * `funcs` と `functions` は skill によって綴りが違う (`solidity-coverage` は Functions、
 * vitest は Funcs) ので、どちらでも通す。
 */
const REQUIRED_METRIC_OPTIONS: readonly (readonly string[])[] = [
  ['--coverage-lines'],
  ['--coverage-statements'],
  ['--coverage-branches'],
  ['--coverage-funcs', '--coverage-functions'],
];

const REQUIRED_THRESHOLD = 100;

function skillBody(skill: string): string {
  return readFileSync(resolve(SKILLS_DIR, skill, 'SKILL.md'), 'utf8');
}

/**
 * `--coverage-threshold {N}` を宣言しているか。
 *
 * **値が読めるかとは別に判定する** (#2184 r1-f1)。 一体にしていた間、既定値を日本語で
 * 書いた skill が「宣言していない」 と扱われ、T-SCT-004 の一覧照合から静かに落ちていた =
 * その skill は T-SCT-002 / 003 / 003b のどれにも入らない。
 *
 * この repo は house style として日本語を混ぜる (option 宣言の `省略時` が 4 skill で
 * 26 回)。 英語の `default N%` を検出条件にすると、house style に従った skill ほど
 * 検査の外に落ちる。
 */
export function declaresThresholdIn(body: string): boolean {
  return body
    .split('\n')
    .some((line) => line.trimStart().startsWith('- `--') && line.includes('`--coverage-threshold {N}`'));
}

function declaresThreshold(skill: string): boolean {
  return declaresThresholdIn(skillBody(skill));
}

/**
 * 宣言行から既定値を取り出す。 読めなければ `null`。
 *
 * **全ての宣言行を見る**。 最初の 1 行で諦めると、宣言と既定値が 2 行に分かれた形で
 * 読めなくなる。 `null` は「宣言が無い」 ではなく「値を読めない」 を表し、その区別は
 * T-SCT-002 が落とす側で扱う。
 */
export function declaredDefaultIn(body: string): number | null {
  for (const line of body.split('\n')) {
    if (!line.includes('`--coverage-threshold {N}`')) continue;
    // 英語と日本語の両方を受ける。 `既定 100%` / `default 100%` / `省略時は 100%`。
    const [value] = statedDefaultsIn(line);
    if (value !== undefined) return value;
  }
  return null;
}

/**
 * 本文に書かれた coverage 既定値を、英語 / 日本語の両表記から全件取り出す。
 *
 * **英語の語に日本語の助詞が続く形も受ける** (#2184 r2-f1)。 実 skill は
 * `default は 100%` を 4 箇所で使っており、`default(?:\s+is)?` だけでは 1 件も拾えなかった。
 * house style は語を混ぜるので、語幹と助詞を別々に受ける。
 *
 * 語幹 = `default` / `既定` / `省略時`。 助詞 = `は` / `値は` / `is` のいずれか任意。
 */
export function statedDefaultsIn(body: string): number[] {
  return [...body.matchAll(/(?:default|既定|省略時)(?:\s+is|\s*値?は)?\s*(\d+)\s*%/g)].map(
    (match) => Number(match[1]),
  );
}

function declaredDefault(skill: string): number | null {
  return declaredDefaultIn(skillBody(skill));
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

/** 完了条件の中で coverage について述べている行だけを返す。 */
function coverageCriteria(skill: string): string {
  const section = completionSection(skill);
  if (section === null) return '';
  return section
    .split('\n')
    .filter((line) => /coverage|カバレッジ/i.test(line))
    .join('\n');
}

/**
 * `--coverage-threshold` を宣言する skill を数える。
 *
 * 本文の取得を引数にするのは、fixture を通して識別力を測るため
 * (実 skill は全て既定値を読める形で書いているので、判定を狭めても実 file では落ちない)。
 */
export function listDeclaringSkills(bodyOf: (skill: string) => string, skills = readdirSkills()): string[] {
  return skills.filter((skill) => declaresThresholdIn(bodyOf(skill))).sort();
}

/** 完了条件の文面が 4 metric を見ると読み取れるか。 */
export function seesAllMetrics(criteria: string): boolean {
  const spellings: readonly (readonly string[])[] = [
    ['Lines'],
    ['Stmts', 'Statements'],
    ['Branches'],
    ['Funcs', 'Functions'],
  ];
  const namesAll = spellings.every((names) => names.some((n) => criteria.includes(n)));
  return /全\s*4\s*metric/.test(criteria) || namesAll;
}

describe('coverage を測る skill が同じ目標を掲げる (#2184)', () => {
  it('T-SCT-001 対象 skill を全件読めている', () => {
    // 走査対象が 0 件なら以下は全て素通りする。 skill dir を移した時に
    // 「揃っている」 ではなく「見ていない」 で通る形を先に止める。
    const missing = COVERAGE_SKILLS.filter(
      (skill) => !existsSync(resolve(SKILLS_DIR, skill, 'SKILL.md')),
    );
    expect(missing, 'SKILL.md を読めない skill がある').toEqual([]);
    expect(COVERAGE_SKILLS.length, '対象 skill が 0 件 (検査が空振りしている)').toBeGreaterThan(0);
  });

  it('T-SCT-002 全 skill が `--coverage-threshold` の既定を 100% と宣言する', () => {
    // 「揃っている」 だけを見ると 4 つとも 50% に下げる変更が通る。 値そのものを固定する。
    const wrong = COVERAGE_SKILLS.map((skill) => ({ skill, value: declaredDefault(skill) }))
      .filter((entry) => entry.value !== REQUIRED_THRESHOLD)
      .map((entry) => `${entry.skill}: ${entry.value ?? '既定値を読み取れない'}`)
      .sort();
    expect(wrong, `--coverage-threshold の既定が ${REQUIRED_THRESHOLD}% でない skill がある`).toEqual(
      [],
    );
  });

  it('T-SCT-003 全 skill が 4 metric すべての override を宣言する', () => {
    // 本 Issue の主眼。 `kiwa-vitest` は Branches を完了条件から落としており、
    // metric 別 override の宣言も持っていなかった。 分岐は短絡評価や防御的分岐で
    // 100% に届かないことが最も起きやすい metric で、見ない設計にすると
    // 「不可能」分類で判断する場ごと消える。
    // **option 宣言の行に限って探す**。 file 全体を grep する形にしていた時、
    // Step 5 の threshold 表にも同じ文字列が出るため、宣言を丸ごと消しても表が
    // 残っていれば通った (変異試験で実測)。 宣言と説明は別物で、守りたいのは前者。
    const problems: string[] = [];
    for (const skill of COVERAGE_SKILLS) {
      const declarations = skillBody(skill)
        .split('\n')
        .filter((line) => line.trimStart().startsWith('- `--'))
        .join('\n');
      for (const spellings of REQUIRED_METRIC_OPTIONS) {
        if (!spellings.some((option) => declarations.includes(`\`${option} {N}\``))) {
          problems.push(`${skill}: ${spellings[0]} の宣言が無い`);
        }
      }
    }
    expect(problems.sort(), 'metric 別 override を宣言していない skill がある').toEqual([]);
  });

  it('T-SCT-003b 全 skill の完了条件が 4 metric と逃げ道の両方に触れる', () => {
    // 目標を上げるだけだと、届かない package で loop が終わらない。 kiwa-forge が
    // 既に持っている「残 uncovered が全て不可能分類なら可」 の逃げ道を全 skill に要求する。
    //
    // metric の書き方は「全 4 metric」 と列挙の 2 通りを許す (T-SCT-003 が宣言側で
    // 4 つを固定しているので、こちらは「4 つを見ると書いてあるか」 だけを見る)。
    const problems: string[] = [];
    for (const skill of COVERAGE_SKILLS) {
      const criteria = coverageCriteria(skill);
      if (criteria === '') {
        problems.push(`${skill}: 完了条件に coverage の行が無い`);
        continue;
      }
      // 書き方は 2 通りある。 「全 4 metric」 と書くか、4 つを並べるか。
      //
      // **並べる側も 4 つ要求する** (#2184 r1-f3)。 `Lines` と `Branches` の 2 名だけを
      // 見ていたが、その形は「Lines / Branches だけ並べて Stmts / Funcs を落とす」 完了条件を
      // 通す。 4 skill が全て「全 4 metric」 と書くため短絡で結果を決めておらず、
      // 判定として一度も効いていなかった (実測 = 4 skill 中 3 件で false)。
      //
      // 綴りの揺れは受ける (`Stmts` / `Statements`、`Funcs` / `Functions`)。
      if (!seesAllMetrics(criteria)) {
        problems.push(`${skill}: 完了条件が 4 metric を見ると読み取れない`);
      }
      if (!/不可能/.test(criteria)) {
        problems.push(`${skill}: 完了条件に「不可能」分類の逃げ道が無い`);
      }
    }
    expect(problems.sort(), '完了条件の形が揃っていない skill がある').toEqual([]);
  });

  it('T-SCT-004 一覧の外に `--coverage-threshold` を宣言する skill がいない', () => {
    // 一覧を人手で持つ以上、一覧から漏れた skill が検査の外に落ちる。
    // 宣言を持つ skill を実物から数え直して突き合わせる
    // (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。
    // **値が読めるかではなく、宣言の有無で数える**。 値を読めない skill を一覧から
    // 落とすと、その skill は他の全 gate からも消える (T-SCT-007 が固定する)。
    const declaring = listDeclaringSkills((skill) => skillBody(skill));
    expect(declaring.sort(), '`--coverage-threshold` を宣言する skill の一覧が実物とずれている').toEqual(
      [...COVERAGE_SKILLS].sort(),
    );
  });

  it('T-SCT-006 判定が house style の書き方を取りこぼさない', () => {
    // **実 skill を母集団にすると識別力が測れない** (#2184 r1-f1 / r1-f3)。 4 skill が
    // たまたま全て英語の `default N%` と「全 4 metric」 で書いているため、判定を狭めても
    // 落ちない = 次に日本語で書いた skill が来た時に初めて穴が開く。
    //
    // この repo は option 宣言で `省略時` を 4 skill で 26 回使う house style を持つ。
    // fixture で書き方の幅を通す。
    const declarations: [string, number | null][] = [
      ['- `--coverage-threshold {N}` — 共通 threshold (default 100%)', 100],
      ['- `--coverage-threshold {N}` — 共通 threshold (既定 100%)', 100],
      ['- `--coverage-threshold {N}` — 共通 threshold (既定は 100%)', 100],
      ['- `--coverage-threshold {N}` — 共通 threshold (省略時 100%)', 100],
      ['- `--coverage-threshold {N}` — 共通 threshold (省略時は 100%)', 100],
      ['- `--coverage-threshold {N}` — 共通 threshold (既定 50%)', 50],
      ['- `--coverage-threshold {N}` — 共通 threshold', null],
    ];
    for (const [line, want] of declarations) {
      expect(declaresThresholdIn(line), `宣言として検出できない: ${line}`).toBe(true);
      expect(declaredDefaultIn(line), `既定値の読み取りが違う: ${line}`).toBe(want);
    }

    // 宣言と既定値が 2 行に分かれる形。 最初の 1 行で諦めると読めない。
    const split = [
      '- `--coverage-threshold {N}` — 共通 threshold',
      '- `--coverage-threshold {N}` の既定は 100% で、production target のみ評価する',
    ].join('\n');
    expect(declaredDefaultIn(split), '2 行に分かれた既定値を読めていない').toBe(100);

    // 4 metric の判定。 綴りの揺れを受け、2 名だけの形は通さない。
    expect(seesAllMetrics('全 4 metric が threshold 達成'), '「全 4 metric」 を読めない').toBe(true);
    expect(
      seesAllMetrics('Lines / Stmts / Branches / Funcs が threshold 達成'),
      '4 つ並べた形を読めない',
    ).toBe(true);
    expect(
      seesAllMetrics('Lines / Statements / Branches / Functions が threshold 達成'),
      '別綴りを読めない',
    ).toBe(true);
    expect(
      seesAllMetrics('Lines / Branches が threshold 達成'),
      '2 名だけの形を通している',
    ).toBe(false);

    // 本文内の矛盾検出も house style を受ける。 宣言の parser だけを多言語化しても、
    // 完了条件側の `既定 80%` を見逃すなら元の矛盾が再発する。
    expect(statedDefaultsIn('threshold (default 100%) / 既定は 80% / 省略時 50%')).toEqual([
      100,
      80,
      50,
    ]);
  });

  it('T-SCT-007 既定値を読めない skill も一覧に数える', () => {
    // **検出と値の取得を分ける** (#2184 r1-f1)。 一体にしていた間、既定値を読み取れない
    // skill は「宣言していない」 と扱われて一覧照合から落ち、その skill は T-SCT-002 /
    // 003 / 003b のどれにも入らなかった = 50% を掲げた skill が全 gate を素通りする。
    //
    // 実 skill は全て既定値を読める形で書いているので、fixture で分離する。
    const bodies: Record<string, string> = {
      'zz-readable': '- `--coverage-threshold {N}` — 共通 threshold (既定 100%)',
      'zz-unreadable': '- `--coverage-threshold {N}` — 共通 threshold',
      'zz-none': '- `--lang {ja|en}` — 出力言語',
    };
    const listed = listDeclaringSkills((skill) => bodies[skill] ?? '', Object.keys(bodies));
    expect(listed, '既定値を読めない skill が一覧から落ちている').toEqual([
      'zz-readable',
      'zz-unreadable',
    ]);
  });

  it('T-SCT-005b 1 行に複数の既定値が書かれても全件を拾う', () => {
    // **最初の 1 件で打ち切らない** (#2184 r1-f1)。 1 行に 2 つ以上の既定値が並ぶ形
    // (`threshold (default 100%) だが coverage は 既定 80%`) で先頭だけを見ると、
    // 先頭が 100 なら後続の矛盾が黙って通る。
    //
    // 実 skill の本文は 1 行 1 値なので、**実 file では判定を狭めても落ちない**。
    // fixture で固定する。
    const line = '- `--coverage-threshold {N}` — threshold (default 100%)、 完了条件は 既定 80%';
    const values = statedDefaultsIn(line);
    expect(values, '1 行の複数値を全件拾えていない').toEqual([100, 80]);

    const offending = values.filter((v) => v !== 100);
    expect(offending, '先頭が 100 なら後続の矛盾を見逃している').toEqual([80]);

    // **実 skill が実際に使っている表記を通す** (#2184 r2-f1)。 4 skill が
    // `default は 100%` の形で書いており、英語の語に日本語の助詞が続く。
    // `default(?:\s+is)?` だけを受ける形では 1 件も拾えていなかった。
    for (const written of [
      'threshold は **production target に対してのみ** 適用。 default は 80%:',
      'threshold は default 80% で運用する',
      'threshold の default 値は 80% とする',
      'threshold は 既定 80%',
      'threshold は 省略時 80%',
      'threshold default is 80%',
    ]) {
      expect(statedDefaultsIn(written), `この表記の既定値を拾えていない: ${written}`).toEqual([80]);
    }
  });

  it('T-SCT-005 完了条件と Step 5 の目標値が矛盾しない', () => {
    // 同じ file の中で Step 5 が 100% を書き、完了条件が 80% を書いていた
    // (完了条件が gate なので実効は 80%)。 本文が別の threshold を名指ししていないか見る。
    const conflicts: string[] = [];
    for (const skill of COVERAGE_SKILLS) {
      for (const [index, line] of skillBody(skill).split('\n').entries()) {
        // 英語 / 日本語どちらでも REQUIRED_THRESHOLD 以外を書いた行を拾う。
        // metric 別 override の説明 (`--coverage-lines {N}`) は値を書かないので当たらない。
        for (const value of statedDefaultsIn(line)) {
          if (value !== REQUIRED_THRESHOLD) {
            conflicts.push(`${skill}/SKILL.md:${index + 1} -> default ${value}%`);
          }
        }
      }
    }
    expect(conflicts.sort(), '本文が別の既定値を名指ししている').toEqual([]);
  });
});

function readdirSkills(): string[] {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .filter((name) => existsSync(resolve(SKILLS_DIR, name, 'SKILL.md')))
    .sort();
}
