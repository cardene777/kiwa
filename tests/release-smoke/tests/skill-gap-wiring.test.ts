// 共通 skill (/kiwa-gap / /kiwa-loop / /kiwa-verdict) が実在し、test を生成する skill が
// そこへ配線されていることを検査する (Issue #2193)。
//
// **散文だけの規約は守られていないことすら分からない**。 Issue #2184 で `kiwa-vitest` の
// threshold が 80% で止まっていたのは、同じ file の Step 5 に「production target 100%」 と
// 書いてあったのに完了条件が 80% だったから = 完了条件が gate で、Step の記述は読まれるだけ
// だった。 だから完了条件の側を機械で見る。
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SKILLS_DIR = resolve(REPO_ROOT, '.claude/skills');

/** 共通 skill 3 つ。 責務が 1 対 1 で分かれていることが設計の芯。 */
const COMMON_SKILLS = ['kiwa-gap', 'kiwa-loop', 'kiwa-verdict'] as const;

function read(skill: string): string {
  return readFileSync(resolve(SKILLS_DIR, skill, 'SKILL.md'), 'utf8');
}

/** `## 完了条件` の本文だけを取り出す。 */
function completion(src: string): string {
  const m = /^## 完了条件\n([\s\S]*?)(?=^## |\Z)/m.exec(src);
  return m?.[1] ?? '';
}

/**
 * test を生成する skill。
 *
 * 一覧を人手で持たず **実物から導く**。 `## 既存 test の再利用` を持つことが
 * 「test を生成する skill」 の定義で、`kiwa-design/references/existing-test-reuse.md` が
 * その契約の SSOT になっている。 一覧を literal で書くと skill が増えた時に取り残される
 * (`rules/quality.md § 導出可能記述は人手で書かない`)。
 */
function generatorSkills(): string[] {
  return readdirSync(SKILLS_DIR)
    .filter((name) => {
      const p = resolve(SKILLS_DIR, name, 'SKILL.md');
      if (!existsSync(p) || !statSync(resolve(SKILLS_DIR, name)).isDirectory()) return false;
      return /^## 既存 test の再利用$/m.test(readFileSync(p, 'utf8'));
    })
    .sort();
}

describe('共通 skill が実在する', () => {
  it('T-SKG-001 3 skill の SKILL.md がある', () => {
    for (const s of COMMON_SKILLS) {
      expect(existsSync(resolve(SKILLS_DIR, s, 'SKILL.md')), `${s} が無い`).toBe(true);
    }
  });

  it('T-SKG-002 /kiwa-loop が停止条件 3 つを持つ', () => {
    // 停止条件が欠けると「回せば進む」 前提で無限に回る。 3 つとも要る。
    const src = read('kiwa-loop');
    expect(src).toMatch(/uncovered === 0/);
    expect(src).toMatch(/改善 0 が \*\*2 round 連続\*\*|改善 0 が 2 round 連続/);
    expect(src).toMatch(/上限 \(既定 5\)|round が上限/);
  });

  it('T-SKG-003b duration が達成条件を持たないと明記する', () => {
    // **Issue #2196**。 当初は `totalMs === 0` を達成にしていたが到達不能で、
    // 次に「回帰 0 件かつ未測定 0 件」 に変えたが、その回帰判定そのものが
    // 使えないと実測で分かった (同じ code で 6 倍振れる)。
    //
    // duration に達成条件は **持たない**。 持たないことを明記させる = 次に触る人が
    // 「条件が書いてないから足そう」 と考えて同じ道を戻らないようにする。
    for (const file of [
      read('kiwa-loop'),
      readFileSync(resolve(SKILLS_DIR, 'kiwa-loop/references/loop-stop-conditions.md'), 'utf8'),
    ]) {
      expect(file, '達成条件を持たないと明記していない').toMatch(/duration に達成条件は無い/);
      expect(file, '振れ幅の実測が書かれていない').toMatch(/6 倍振れる/);
    }
  });

  it('T-SKG-003d duration の ratchet 更新が残っていない', () => {
    // 陰性対照。 baseline を消したので `--update-baseline` の指示が残っていると
    // 存在しない flag を呼ぶ手順になる。
    for (const skill of COMMON_SKILLS) {
      expect(read(skill), `${skill} に --update-baseline が残っている`).not.toContain(
        '--update-baseline',
      );
    }
  });

  it('T-SKG-003c coverage の再測が測定 file を作り直すと明記する', () => {
    // `/kiwa-gap` は test を走らせないので、`coverage-final.json` を作り直さないと
    // 毎 round 同じ値を読み、進んだのに進んでいないと判定する。
    //
    // duration 側は Issue #2196 で 1 round 停止にしたため再測しない (T-SKG-003f)。
    const src = read('kiwa-loop');
    expect(src).toMatch(/`test:cov` を走らせて `coverage-final\.json` を更新/);
  });

  it('T-SKG-003 /kiwa-verdict が 4 分類を持つ', () => {
    const src = read('kiwa-verdict');
    for (const label of [
      '別の gate が覆っている',
      '実装が到達不能',
      '入力を組めない',
      '単に書いていない',
    ]) {
      expect(src, `分類「${label}」 が無い`).toContain(label);
    }
  });

  it('T-SKG-004 停止条件の SSOT が 1 file にある', () => {
    // 停止条件を 2 箇所に書くと片方だけ直って drift する。 実体は reference 側。
    const ref = resolve(SKILLS_DIR, 'kiwa-loop/references/loop-stop-conditions.md');
    expect(existsSync(ref), 'loop-stop-conditions.md が無い').toBe(true);
    const src = readFileSync(ref, 'utf8');
    expect(src).toMatch(/## 停止条件/);
    expect(src).toMatch(/## 4 分類 \(coverage\)/);
    expect(src).toMatch(/## 4 分類 \(duration\)/);
  });

  it('T-SKG-005 /kiwa-verdict が実装削除も除外宣言もしないと明記する', () => {
    // **これが外れると分類が実行に化ける**。 dead code と判定した瞬間に消す skill に
    // なると、後戻りできない判断を AI が単独で下すことになる。
    const src = read('kiwa-verdict');
    expect(src).toMatch(/実装を消さない/);
    expect(src).toMatch(/除外を宣言しない/);
  });

  it('T-SKG-006 3 skill とも責務外を明記する', () => {
    for (const s of COMMON_SKILLS) {
      expect(read(s), `${s} に責務外が無い`).toMatch(/^## 責務外$/m);
    }
  });
});

describe('test を生成する skill が共通 skill へ配線されている', () => {
  it('T-SKG-007 対象 skill が 1 件以上ある', () => {
    // 空振り防止。 導出が壊れて 0 件になると、以降の検査が全部通ってしまう。
    expect(generatorSkills().length, '対象 skill が 1 件も無い (導出が空振りしている)')
      .toBeGreaterThan(0);
  });

  it('T-SKG-008 完了条件が /kiwa-gap --metric coverage を要求する', () => {
    const missing = generatorSkills().filter(
      (s) => !completion(read(s)).includes('/kiwa-gap --metric coverage'),
    );
    expect(missing, 'coverage の gap 参照が完了条件に無い skill').toEqual([]);
  });

  it('T-SKG-009 完了条件が /kiwa-gap --metric duration を要求する', () => {
    const missing = generatorSkills().filter(
      (s) => !completion(read(s)).includes('/kiwa-gap --metric duration'),
    );
    expect(missing, 'duration の gap 参照が完了条件に無い skill').toEqual([]);
  });

  it('T-SKG-010 完了条件が残った未達の行き先を要求する', () => {
    // 「gap を見た」 だけでは、見て何もしなかった run と区別できない。
    // 0 件か、`/kiwa-verdict` の分類つきで記録することまでを条件にする。
    const missing = generatorSkills().filter(
      (s) => !completion(read(s)).includes('/kiwa-verdict'),
    );
    expect(missing, '残った未達の行き先が完了条件に無い skill').toEqual([]);
  });

  it('T-SKG-011 dashboard を直接読む古い経路が残っていない', () => {
    // 陰性対照。 差し替えたつもりで元の行が残ると、2 つの経路が併存して
    // どちらが正か読めなくなる。
    const stale = generatorSkills().filter((s) =>
      /`\/kiwa-observe` の dashboard `Execution time` section/.test(completion(read(s))),
    );
    expect(stale, '完了条件に古い dashboard 経路が残っている skill').toEqual([]);
  });

  it('T-SKG-012 共通 skill 自身は生成 skill に数えない', () => {
    // 3 skill は test を書かないので `## 既存 test の再利用` を持たない。
    // 持つと配線の検査が自分自身を対象にして循環する。
    const gens = generatorSkills();
    for (const s of COMMON_SKILLS) {
      expect(gens, `${s} が生成 skill に数えられている`).not.toContain(s);
    }
  });
});

describe('一括置換が他 skill の option を壊していない', () => {
  const COMMON = new Set<string>(COMMON_SKILLS);

  /**
   * `--metric` を書いてよい場所。
   *
   * **「宣言していない option を手順で使っていないか」 という広い検査にはしない**。
   * 実測で 30 件当たり、その大半が他 tool の flag への正当な言及だった
   * (`vitest --coverage` / `jq --json` / `forge --report-file` / `kiwa layers --layer`)。
   * 静的に「自分の option か他 tool の flag か」 を見分ける手が無く、
   * 広い検査は noise が勝って読まれなくなる。
   *
   * 代わりに **実際に壊れた形** を突く。 `--metric` は本 PR が足した option で、
   * 共通 skill 3 個か、それを名指しで呼ぶ行にしか現れないはず。
   */
  function offendingLines(skill: string, src: string): string[] {
    if (COMMON.has(skill)) return [];
    const offenders: string[] = [];
    for (const line of src.split('\n')) {
      if (!line.includes('--metric')) continue;
      // **共通 skill を「言及している」 だけでは免除しない** (codex review r2-f2)。
      // 行に `/kiwa-gap` が出ていれば通す形にすると、その行に自分の
      // `--metric` 宣言を混ぜるだけで検査を抜けられる。
      //
      // 免除するのは **共通 skill の呼出として `--metric` が並んでいる** 形だけ。
      // 呼出名と `--metric` の間に他の option は入ってよいが、別の `/` 始まりの
      // 語や文の区切りは挟めない。
      //
      // **呼出は 1 物理行に書く** (codex review r3-f2)。 折り返した形
      // (`` `/kiwa-gap` `` の次の行に `--metric coverage`) は offender になる。
      // 複数行にまたがる command span を解析する形は採らない = Markdown の
      // code span / fence / 表 cell / 箇条書きの継続行がそれぞれ違う畳まれ方をし、
      // 静的に「同じ呼出の続き」 を判定する手が定まらない。
      // 1 行に収める制約は SKILL.md 側で守れるので、判定を単純に保つ。
      const invocation = /\/kiwa-(?:gap|loop|verdict)((?:\s+--[a-z][a-z0-9-]*(?:[ =][^\s`]+)?)*)/g;
      let exempt = false;
      for (const m of line.matchAll(invocation)) {
        if ((m[1] ?? '').includes('--metric')) exempt = true;
      }
      if (exempt) {
        // 呼出の外にも `--metric` が残っていないかを見る。 呼出部分を消してから数える。
        const rest = line.replace(invocation, ' ');
        if (!rest.includes('--metric')) continue;
      }
      offenders.push(`${skill}: ${line.trim().slice(0, 70)}`);
    }
    return offenders;
  }

  it('T-SKG-013 --metric が共通 skill の外に漏れていない', () => {
    // **一括置換で踏んだ**。 `--target` を `--metric` へ機械的に置き換えた時、
    // `kiwa-api` / `kiwa-test` / `kiwa-vitest` が自分の option として持っていた
    // `--target` まで書き換わり、宣言と手順が食い違った。
    //
    // 配線の検査 (T-SKG-008..010) は完了条件に gap の呼出があるかしか見ないので、
    // この形を 1 件も検出しなかった。
    const offenders = readdirSync(SKILLS_DIR).flatMap((skill) => {
      const p = resolve(SKILLS_DIR, skill, 'SKILL.md');
      return existsSync(p) ? offendingLines(skill, readFileSync(p, 'utf8')) : [];
    });
    expect(offenders, '共通 skill 以外が --metric を使っている').toEqual([]);
  });

  it('T-SKG-014 --metric を含む行を 1 件以上見つけている', () => {
    // 空振り防止。 抽出が壊れて 0 件になると T-SKG-013 が常に通る。
    const total = readdirSync(SKILLS_DIR)
      .map((s) => resolve(SKILLS_DIR, s, 'SKILL.md'))
      .filter((p) => existsSync(p))
      .reduce(
        (n, p) => n + readFileSync(p, 'utf8').split('\n').filter((l) => l.includes('--metric')).length,
        0,
      );
    expect(total, '--metric を含む行が 1 件も無い (抽出が空振りしている)').toBeGreaterThan(0);
  });

  it('T-SKG-015 --target を持つ skill がその宣言を保っている', () => {
    // 陰性対照側。 置換の巻き添えで消えた 3 skill を名指しで固定する。
    // 名前を書くのは、これが「置換で消えた実例」 の記録だから (再発時に何が
    // 壊れたかが検査から読める)。
    for (const skill of ['kiwa-api', 'kiwa-test', 'kiwa-vitest']) {
      const src = readFileSync(resolve(SKILLS_DIR, skill, 'SKILL.md'), 'utf8');
      const m = /^## オプション\n([\s\S]*?)(?=^## |\Z)/m.exec(src);
      expect(m?.[1] ?? '', `${skill} が --target の宣言を失っている`).toContain('`--target');
    }
  });

  it('T-SKG-016 共通 skill を名前だけ添えた --metric は素通しにしない', () => {
    // **codex review r2-f2 の陰性対照側**。 免除条件が「行に `/kiwa-gap` があること」
    // だと、自分の `--metric` 宣言をその行に混ぜるだけで検査を抜けられる。
    //
    // 実 file を汚さず、判定関数そのものに敵対的な入力を与えて確かめる。
    const adversarial = [
      '- `--metric {a|b}` — 本 skill の option (`/kiwa-gap` とは無関係)',
      '`/kiwa-gap` を参照。 なお本 skill は `--metric` を独自に取る',
    ];
    for (const line of adversarial) {
      expect(
        offendingLines('kiwa-vitest', line),
        `免除条件を抜けられる: ${line}`,
      ).not.toEqual([]);
    }
  });

  it('T-SKG-017 正しい呼出行は素通しする', () => {
    // T-SKG-016 の対。 これが無いと、全ての `--metric` 行を offender にする実装が通る。
    const legit = [
      '- `/kiwa-gap --metric coverage --package {pkg}` を実行し、未達 0 件を確認',
      '`/kiwa-loop --metric duration --report {json}` を回す',
    ];
    for (const line of legit) {
      expect(offendingLines('kiwa-vitest', line), `正しい呼出を落としている: ${line}`).toEqual([]);
    }
  });


  it('T-SKG-018 折り返した呼出は offender になる (1 行制約)', () => {
    // 制約を検査で固定する。 **将来「折り返しも通したい」 と思った時、この検査が
    // 落ちて判断を求める**。 制約を code comment だけに書くと、次に触る人が
    // 気付かないまま折り返して release-smoke が落ちる理由が読めなくなる。
    expect(
      offendingLines('kiwa-vitest', '  --metric coverage --package {pkg}` を実行し'),
      '折り返し行が offender になっていない',
    ).not.toEqual([]);
  });


  /** `## 停止条件` / `### Step 4` の表本体だけを取り出す。 */
  function stopTable(src: string): string[] {
    const m = /\|\s*#\s*\|\s*条件\s*\|\s*適用\s*\|[\s\S]*?\n\n/.exec(src);
    return (m?.[0] ?? '').split('\n').filter((l) => /^\|\s*[23]\s*\|/.test(l));
  }

  /** Step 3 の差分表を、見出しを含めて丸ごと取り出す。 */
  function deltaTable(src: string): string[] {
    const m = /\|\s*差\s*\|[^\n]*\|\n(?:\|[^\n]*\|\n)+/.exec(src);
    return (m?.[0] ?? '').trim().split('\n');
  }

  it('T-SKG-003e 停止条件 2 / 3 の行そのものが coverage 限定になっている', () => {
    // **codex review r2-f1**。 前版は file 全体から `coverage のみ` を探すだけで、
    // 表の行を duration にも適用する形へ戻しても通ってしまった = 守るつもりのものを
    // 守っていなかった。
    //
    // 行を取り出して、その行に `coverage のみ` があることを見る。
    for (const [name, src] of [
      ['kiwa-loop/SKILL.md', read('kiwa-loop')],
      [
        'loop-stop-conditions.md',
        readFileSync(resolve(SKILLS_DIR, 'kiwa-loop/references/loop-stop-conditions.md'), 'utf8'),
      ],
    ] as const) {
      const rows = stopTable(src);
      expect(rows.length, `${name} の停止条件表から行 2 / 3 を取り出せない`).toBe(2);
      for (const row of rows) {
        expect(row, `${name}: ${row.trim().slice(0, 50)}`).toContain('coverage のみ');
      }
    }
  });

  it('T-SKG-003g Step 3 の差分表を丸ごと固定する', () => {
    // 差分表 (減った / 変わらない / 増えた) は改善の有無を判定する。 duration に
    // 当てると、負荷で動いた値を「改善」「悪化」 と読むことになる。
    //
    // **`duration` の語が無いことだけを見ない** (codex review r3-f1)。 適用範囲を
    // `両方` のような別の語に変えれば、`duration` を 1 文字も書かずに表を duration へ
    // 広げられる。 実測で前版はその形を素通しした。
    //
    // 表を丸ごと固定する = 適用範囲も行の中身も、1 文字変えれば落ちる。
    const table = deltaTable(read('kiwa-loop'));

    expect(table, '差分表を取り出せない (検査が空振りしている)').toEqual([
      '| 差 | 扱い (coverage のみ) |',
      '|---|---|',
      '| 減った | 1 歩進んだ。 round を進めて Step 2 へ |',
      '| 変わらない | 改善 0。 連続回数を +1 |',
      '| 増えた | 悪化。 その round の変更を見直す (test を消していないか確認する) |',
    ]);
    // 表の直後の説明も残っていることを見る。
    expect(read('kiwa-loop')).toMatch(/この表は coverage だけに適用する/);
  });

  it('T-SKG-003f duration の再測手順が coverage 限定になっている', () => {
    // 陰性対照側。 Step 3 が duration にも再測を求めると、1 round で止まる設計と
    // 食い違う (再測する相手が無い)。
    expect(read('kiwa-loop')).toMatch(/### Step 3 — 再測する \(coverage のみ\)/);
    expect(read('kiwa-loop')).toMatch(/duration では Step 3 を行わない/);
  });

});
