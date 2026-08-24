// 共通 skill (/kiwa-gap / /kiwa-loop / /kiwa-verdict) が実在し、test を生成する skill が
// そこへ配線されていることを検査する (Issue #2193)。
//
// **散文だけの規約は守られていないことすら分からない**。 Issue #2184 で `kiwa-vitest` の
// threshold が 80% で止まっていたのは、同じ file の Step 5 に「production target 100%」 と
// 書いてあったのに完了条件が 80% だったから = 完了条件が gate で、Step の記述は読まれるだけ
// だった。 だから完了条件の側を機械で見る。
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, statSync } from 'node:fs';
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

/**
 * contract に従う skill。
 *
 * **生成 skill だけでは足りない** (codex review r1-f2)。 `kiwa-test` は chain を一括実行し、
 * `kiwa-design` は何を test するかを決める = どちらも `## 既存 test の再利用` を持たないため
 * `generatorSkills()` から漏れる。 漏れたまま配線すると、その 1 行を消しても検査が通る。
 *
 * 導出できる集合 (生成 skill) に、導出できない 2 件を明示的に足す。 名前を書くのは
 * 「chain を回す側 / 設計する側」 という役割が file 内の見出しからは導けないため。
 */
const EXTRA_CONSUMERS = ['kiwa-design', 'kiwa-test'] as const;

function contractConsumers(): string[] {
  return [...new Set([...generatorSkills(), ...EXTRA_CONSUMERS])].sort();
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

  it('T-SKG-008 完了条件が contract を参照する', () => {
    // **判定基準を各 skill に書き写さない**。 以前は 2 行 × 18 skill = 34 行の複製で、
    // 相異なる行は 4 種しか無かった = 1 箇所直して 17 箇所が古いまま残る形だった。
    //
    // 参照 1 行に置き換え、判定基準は `_shared/references/coverage-contract.md` に一本化する。
    const missing = contractConsumers().filter(
      (s) => !completion(read(s)).includes('references/coverage-contract.md'),
    );
    expect(missing, 'contract 参照が完了条件に無い skill').toEqual([]);

    // 導出できない 2 件が母集団に入っていることまで見る = 足し忘れると全部通る。
    //
    // **`for` で回さない** (変異試験で実測)。 `EXTRA_CONSUMERS` を空にすると loop が
    // 0 周して assert に到達せず、母集団を空にする変異が素通りした。
    // 集合そのものを比較する形にすると、空にした時点で落ちる。
    expect(
      [...EXTRA_CONSUMERS].sort(),
      '導出できない consumer の一覧が空になっている',
    ).toEqual(['kiwa-design', 'kiwa-test']);
    for (const extra of EXTRA_CONSUMERS) {
      expect(contractConsumers(), `${extra} が母集団に無い`).toContain(extra);
    }
  });

  it('T-SKG-009 判定基準を完了条件に書き写していない', () => {
    // 陰性対照。 参照を書いた上で判定基準も並べると、複製が復活する。
    const offenders = contractConsumers().filter((s) => {
      const c = completion(read(s));
      return c.includes('/kiwa-gap --metric') || c.includes('/kiwa-verdict');
    });
    expect(offenders, '完了条件に判定基準が書き写されている skill').toEqual([]);
  });

  it('T-SKG-010 contract が 4 分類と 100% 目標を持つ', () => {
    // 参照先が空でないことを見る = 参照 1 行だけを固定すると、中身が消えても通る。
    const contract = readFileSync(
      resolve(SKILLS_DIR, '_shared/references/coverage-contract.md'),
      'utf8',
    );
    expect(contract).toMatch(/カバレッジは 100% を目指す/);
    for (const label of [
      '別の gate が覆っている',
      '実装が到達不能',
      '入力を組めない',
      '単に書いていない',
    ]) {
      expect(contract, `分類「${label}」 が無い`).toContain(label);
    }
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


  /**
   * `## 手順` 節の fenced block から、**command として書かれた行**を取り出す。
   *
   * 3 つの正規化を行う。
   *
   * | 正規化 | なぜ要るか |
   * |---|---|
   * | 行末の `←` 以降を落とす | 落とさないと `--package` の値が消えても次の語を値と読む |
   * | 先頭の序数 (`1.` / `2.`) を落とす | 番号は手順の順序で、command の一部ではない |
   * | 節内の fence を全部見る | 1 つ目だけ見ると、手順を 2 block に分ける形で漏れる |
   *
   * fence は **language tag と 3 空白までの字下げを許す** (codex review r3-f2)。
   * この repo は `” ```bash ”` を多用しており、tag を付けただけで検査が落ちると
   * 手順を変えていないのに release が止まる。
   */
  function procedureBlock(contract: string): string[] {
    // `## 手順` から次の level-2 見出しまでを節とする。
    //
    // **正規表現で節を切らない**。 `\Z` は JavaScript に無く、`$` は `m` flag の下で
    // 行末に当たるため `(?=^## |$)` は最初の行末で止まり、節が常に空になる。
    // 実測で「tag なし」 の fixture が 0 件を返した = 検査が空振りしていた。
    const head = contract.indexOf('## 手順');
    if (head < 0) return [];
    const rest = contract.slice(head + '## 手順'.length);
    const next = rest.search(/^## /m);
    const section = next === -1 ? rest : rest.slice(0, next);
    const lines: string[] = [];
    let inFence = false;
    for (const raw of section.split('\n')) {
      // 開始も終了も、字下げ 3 まで + 任意の info string を許す。
      if (/^ {0,3}```/.test(raw)) {
        inFence = !inFence;
        continue;
      }
      if (!inFence) continue;
      const body = (raw.split('←')[0] ?? '').trim().replace(/^\d+[.)]\s*/, '');
      if (body !== '') lines.push(body);
    }
    return lines;
  }

  /** 手順の 1 行が、その command の呼出そのものかを見る。 */
  function invokes(line: string, skill: string, extra: RegExp): boolean {
    // **行頭から見る** (codex review r3-f1)。 部分一致だと `echo /kiwa-loop …` や
    // `# /kiwa-loop …` のような、実行しない形が契約を満たしてしまう。
    const m = new RegExp(`^/${skill}\\s+(.*)$`).exec(line);
    return m !== null && extra.test(m[1] ?? '');
  }

  it('T-SKG-024 contract の手順が実際に動く形になっている', () => {
    // **codex review r1-f1**。 `/kiwa-loop --metric coverage` を `--package` 無しで
    // 書いていた。 `/kiwa-loop` は coverage で `--package` が無いと止まるので、
    // 契約に従っても remediation loop に入れない。
    //
    // **説明文を拾わない** (r2-f1)。 前版は contract 全体から最初の `/kiwa-loop` を
    // 取っていたため、手順の直後の説明段落が両方の語を含み、手順を丸ごと消しても通った。
    //
    // **行頭から見る** (r3-f1)。 部分一致だと `echo /kiwa-loop …` が通る。
    const contract = readFileSync(
      resolve(SKILLS_DIR, '_shared/references/coverage-contract.md'),
      'utf8',
    );
    const steps = procedureBlock(contract);
    expect(steps.length, '## 手順 の fenced block を取り出せない (検査が空振りしている)')
      .toBeGreaterThan(0);

    // 値まで見る = `--package` だけ書いて値が無い形を通さない。
    const wanted: [string, RegExp][] = [
      ['kiwa-gap', /^--metric\s+coverage\s+--package\s+\S+/],
      ['kiwa-loop', /^--metric\s+coverage\s+--package\s+\S+/],
      ['kiwa-verdict', /^--metric\s+coverage\b/],
    ];
    for (const [skill, extra] of wanted) {
      const hit = steps.filter((l) => invokes(l, skill, extra));
      expect(hit.length, `手順に /${skill} の呼出が 1 件だけ無い`).toBe(1);
    }
  });

  it('T-SKG-024b 通してはいけない形を通さない (陰性対照)', () => {
    // 判定関数に直接、壊した contract を与える。 実 file を汚さずに確かめる。
    const extra = /^--metric\s+coverage\s+--package\s+\S+/;
    const broken: [string, string][] = [
      ['Step 2 が無い', '## 手順\n\n```\n1. /kiwa-gap  --metric coverage --package {pkg}\n```\n'],
      ['--package の値が無い', '## 手順\n\n```\n2. /kiwa-loop --metric coverage --package    ← 説明\n```\n'],
      ['手順が空', '## 手順\n\n```\n(手順なし)\n```\n'],
      ['echo を前置', '## 手順\n\n```\n2. echo /kiwa-loop --metric coverage --package {pkg}\n```\n'],
      ['comment 化', '## 手順\n\n```\n2. # /kiwa-loop --metric coverage --package {pkg}\n```\n'],
      ['散文の前置', '## 手順\n\n```\n2. まず /kiwa-loop --metric coverage --package {pkg} を実行\n```\n'],
    ];
    for (const [label, src] of broken) {
      const hit = procedureBlock(src).filter((l) => invokes(l, 'kiwa-loop', extra));
      expect(hit.length, `通してはいけない形: ${label}`).toBe(0);
    }
  });

  it('T-SKG-024c 正しい書き方の変化形を落とさない (陽性対照)', () => {
    // **落とし過ぎない**ことを反対側から見る (codex review r3-f2)。
    // この repo は language tag 付きの fence を多用する。
    const extra = /^--metric\s+coverage\s+--package\s+\S+/;
    const ok: [string, string][] = [
      ['tag なし', '## 手順\n\n```\n2. /kiwa-loop --metric coverage --package {pkg}\n```\n'],
      ['bash tag', '## 手順\n\n```bash\n2. /kiwa-loop --metric coverage --package {pkg}\n```\n'],
      ['text tag', '## 手順\n\n```text\n/kiwa-loop --metric coverage --package {pkg}\n```\n'],
      ['字下げ 3', '## 手順\n\n   ```\n   2. /kiwa-loop --metric coverage --package {pkg}\n   ```\n'],
      ['序数なし', '## 手順\n\n```\n/kiwa-loop --metric coverage --package {pkg}\n```\n'],
      [
        '前置きの散文あり',
        '## 手順\n\n次を順に実行する。\n\n```\n2. /kiwa-loop --metric coverage --package {pkg}\n```\n',
      ],
      [
        'fence が 2 つ',
        '## 手順\n\n```\n1. /kiwa-gap --metric coverage --package {pkg}\n```\n\n続けて。\n\n```\n2. /kiwa-loop --metric coverage --package {pkg}\n```\n',
      ],
    ];
    for (const [label, src] of ok) {
      const hit = procedureBlock(src).filter((l) => invokes(l, 'kiwa-loop', extra));
      expect(hit.length, `落としてはいけない形: ${label}`).toBe(1);
    }
  });

  it('T-SKG-025 consumer が別 consumer の references を名指ししない', () => {
    // **codex review r1-f3**。 移設後も 16 skill が
    // `.claude/skills/kiwa-design/references/existing-test-reuse.md` を名指ししていた。
    // kiwa-design に symlink が残っているので動くだけで、その skill を消すと全部壊れる。
    const offenders: string[] = [];
    for (const skill of readdirSync(SKILLS_DIR)) {
      const p = resolve(SKILLS_DIR, skill, 'SKILL.md');
      if (!existsSync(p)) continue;
      for (const m of readFileSync(p, 'utf8').matchAll(
        /\.claude\/skills\/(kiwa-[a-z-]+)\/references\/([a-z0-9-]+\.md)/g,
      )) {
        offenders.push(`${skill}: ${m[1]}/references/${m[2]}`);
      }
    }
    expect(offenders, 'consumer skill の references を名指ししている').toEqual([]);
  });

describe('共有 component の置き場所', () => {
  const SHARED = resolve(SKILLS_DIR, '_shared/references');

  it('T-SKG-019 _shared は SKILL.md を持たない', () => {
    // 持つと skill として数えられ、`/` から起動できる空の skill が現れる。
    // skill の列挙は SKILL.md の有無で判定する (rebuild-plugin-metadata.mjs と同じ形)。
    expect(existsSync(resolve(SKILLS_DIR, '_shared/SKILL.md'))).toBe(false);
  });

  it('T-SKG-020 2 skill 以上が参照する reference の実体は _shared にある', () => {
    // **消費者の 1 つに実体を置かない**。 実際 `doc-language-selection.md` は 8 skill が
    // 使うのに実体が `kiwa-forge` (Solidity の test skill) の中にあった。
    const bodies = new Map<string, string[]>();
    for (const skill of readdirSync(SKILLS_DIR)) {
      const dir = resolve(SKILLS_DIR, skill, 'references');
      if (!existsSync(dir)) continue;
      for (const name of readdirSync(dir)) {
        if (!name.endsWith('.md')) continue;
        if (lstatSync(resolve(dir, name)).isSymbolicLink()) continue;
        bodies.set(name, [...(bodies.get(name) ?? []), skill]);
      }
    }
    const offenders: string[] = [];
    for (const [name, owners] of bodies) {
      if (owners.includes('_shared')) continue;
      const refs = readdirSync(SKILLS_DIR).filter((s) =>
        existsSync(resolve(SKILLS_DIR, s, 'references', name)),
      );
      if (refs.length > 1) offenders.push(`${name}: ${owners.join(',')} に実体、${refs.length} skill が参照`);
    }
    expect(offenders, '2 skill 以上が参照するのに実体が _shared に無い').toEqual([]);
  });

  it('T-SKG-021 symlink は _shared を直接指す', () => {
    // 別の skill を経由させない。 中間の skill を消すと全部壊れる。
    const offenders: string[] = [];
    for (const skill of readdirSync(SKILLS_DIR)) {
      const dir = resolve(SKILLS_DIR, skill, 'references');
      if (!existsSync(dir)) continue;
      for (const name of readdirSync(dir)) {
        const p = resolve(dir, name);
        if (!lstatSync(p).isSymbolicLink()) continue;
        const target = readlinkSync(p);
        if (!target.includes('_shared')) offenders.push(`${skill}/${name} -> ${target}`);
      }
    }
    expect(offenders, '_shared を経由しない symlink がある').toEqual([]);
  });

  it('T-SKG-022 実体が 1 つずつしか無い', () => {
    // 空振り防止も兼ねる = _shared が空なら 0 件になって気付ける。
    const names = readdirSync(SHARED).filter((n) => n.endsWith('.md'));
    expect(names.length, '_shared に reference が 1 件も無い').toBeGreaterThan(0);
    for (const name of names) {
      const bodies = readdirSync(SKILLS_DIR).filter((s) => {
        const p = resolve(SKILLS_DIR, s, 'references', name);
        return s !== '_shared' && existsSync(p) && !lstatSync(p).isSymbolicLink();
      });
      expect(bodies, `${name} の実体が _shared の外にもある`).toEqual([]);
    }
  });

  it('T-SKG-023 切り出しの判別ルールが component-boundary に書かれている', () => {
    const src = readFileSync(resolve(SHARED, 'component-boundary.md'), 'utf8');
    expect(src).toMatch(/動くのか、決めるのか/);
    expect(src).toMatch(/2 件目が現れた時点で `_shared\/` へ移す/);
  });
});
