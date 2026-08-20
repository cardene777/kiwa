import { describe, expect, it } from 'vitest';

import { headingSectionIn, skillBody } from './skill-md.js';

/**
 * `/kiwa-review` の記述が writer / 宣言と一致するか (#2080).
 *
 * `/kiwa-review` は自分では何も生成せず、 **他が書いたものを読んで判定する**。 読む先を
 * 手で書いている限り、 writer が変わるたびにずれる。
 *
 * 実測で 3 件ずれていた。 統合 report の path が writer と食い違い (#2077 で writer だけ
 * 直した)、 layer 別観点の件数が実際と合わず、 `e2e-generic` の column 名が宣言に
 * 存在しないものだった。
 *
 * 検査は **相手側から導く**。 kiwa-review の文字列を固定値と比べると、 相手が変わった時に
 * 検査ごと古くなる。
 */

const REVIEW = skillBody('kiwa-review');
const TEST = skillBody('kiwa-test');
const DESIGN = skillBody('kiwa-design');

/** `tests/reports/integrated/...` の雛形を skill から集める。 */
function integratedTemplates(body: string): string[] {
  return [
    ...new Set(
      [...body.matchAll(/tests\/reports\/integrated\/[A-Za-z0-9{}$_.\-/]+\.md/g)].map((m) =>
        // lang の書き方 (`{lang}` / `${DOC_LANG}`) は両 skill で揃っていないので正規化する。
        m[0]!.replace(/\$\{DOC_LANG\}|\{\$DOC_LANG\}|\{lang\}/g, 'LANG'),
      ),
    ),
  ];
}

/** `#### {layer} layer 専用 column` 節が宣言する列。 */
function declaredColumns(layer: string): string[] {
  const section = headingSectionIn(DESIGN, new RegExp(`^#### ${layer} layer 専用 column`, 'm'));
  const at = section.indexOf('| 項目 | 内容 |');
  const out: string[] = [];
  for (const line of section.slice(at).split('\n')) {
    if (!line.startsWith('|')) break;
    const cell = line.split('|')[1]!.trim();
    if (/^-+$/.test(cell) || cell === '項目') continue;
    out.push(cell);
  }
  return out;
}

describe('読む先が writer と一致する', () => {
  it('writer 側の雛形を拾えている (空振り防止)', () => {
    // writer から 0 件しか取れないと、 下の handoff 検査が空集合に対して常に成立する。
    expect(integratedTemplates(TEST).length).toBeGreaterThan(0);
  });

  it('writer が result-review に渡す exact path が Step 5 の書き先と一致する', () => {
    // **突き合わせ先を Step 5 に限る**。 file 全体から集めると handoff 行自身が集合に
    // 入り、 handoff を書き換えても「宣言に含まれる」 が成立して素通りする (実測 = 変異 m6)。
    const write = headingSectionIn(TEST, /^### Step 5: 統合 report Write$/m);
    const declared = integratedTemplates(write).filter((t) => !t.includes('-round-'));
    expect(declared.length, 'Step 5 が統合 report の書き先を宣言していない').toBe(1);

    const invoke = headingSectionIn(
      TEST,
      /^### Step 5b: kiwa-review 自動呼出 \(result-review mode\)$/m,
    );
    const handedOff = /--integrated-report\s+(tests\/reports\/integrated\/\S+\.md)/.exec(
      invoke,
    )?.[1];
    expect(handedOff, 'result-review に統合 report の exact path を渡していない').toBeTruthy();
    expect(
      integratedTemplates(handedOff!)[0],
      `handoff が Step 5 の書き先と違う (Step 5: ${declared[0]})`,
    ).toBe(declared[0]);
  });

  it('reader は統合 report の path を再構築せず exact path を要求する', () => {
    const section = headingSectionIn(REVIEW, /^#### 1C: result-review mode$/m);
    expect(section, 'result-review が exact path の引数を読んでいない').toContain(
      '`--integrated-report`',
    );
    expect(integratedTemplates(section), 'reader に統合 report の path の写しが残っている').toEqual(
      [],
    );
  });
});

describe('layer 別観点の記述が宣言と一致する', () => {
  /** kiwa-review が layer 別観点として挙げる行。 */
  const lines = REVIEW.split('\n').filter((l) => /^\s+- `[a-z0-9-]+`: 9 column /.test(l));

  it('layer 別観点の行を拾えている (空振り防止)', () => {
    expect(lines.length).toBeGreaterThan(0);
  });

  it('挙げた件数と実際の行数が一致する', () => {
    // 「新 3 layer」 と書いて 2 件しか挙げていなかった。 件数を本文から取り出して数と比べる。
    const claim = /layer 別の専用観点を持つ (\d+) layer/.exec(REVIEW);
    expect(claim, '件数を主張する文が無い').toBeTruthy();
    expect(Number(claim![1]), '主張した件数と行数が違う').toBe(lines.length);
  });

  it.each(
    // 行から layer 名と、 backtick で囲まれていない語 (= 列名として挙げた語) を取り出す。
    lines.map((line) => {
      const layer = /- `([a-z0-9-]+)`:/.exec(line)![1]!;
      const inside = /9 column \(([^)]*)\)/.exec(line)?.[1] ?? '';
      // `Mode` の enum 値は backtick 付きで書かれる。 列名は素の語で並ぶ。
      const named = inside
        .replace(/`[^`]*`/g, ' ')
        .split(/[+/]/)
        .map((s) => s.trim())
        .filter((s) => /^[A-Za-z][A-Za-z-]*$/.test(s));
      return [layer, named] as const;
    }),
  )('%s が挙げる列がすべて宣言に実在する', (layer, named) => {
    const declared = declaredColumns(layer);
    expect(declared.length, `${layer}: 宣言を読めていない`).toBeGreaterThan(0);
    expect(named.length, `${layer}: 列を 1 つも挙げていない (検査が空振りしている)`).toBeGreaterThan(
      0,
    );
    const missing = named.filter((n) => !declared.includes(n));
    expect(missing, `${layer}: 宣言に無い列を挙げている (宣言: ${declared.join(' / ')})`).toEqual(
      [],
    );
  });

  it('宣言に無い列名を混ぜると落ちる (陽性対照)', () => {
    // 上の検査は「挙げた列が実在する」 を主張する。 抽出が空を返せば恒真になるため、
    // 実在しない列を混ぜた行を同じ抽出に通して落ちることを示す。
    const fake = '  - `e2e-generic`: 9 column (Mode `static` + Route + Action + Expected) を照合';
    const inside = /9 column \(([^)]*)\)/.exec(fake)![1]!;
    const named = inside
      .replace(/`[^`]*`/g, ' ')
      .split(/[+/]/)
      .map((s) => s.trim())
      .filter((s) => /^[A-Za-z][A-Za-z-]*$/.test(s));
    const declared = declaredColumns('e2e-generic');
    expect(named.filter((n) => !declared.includes(n)), '実在しない列を検出できない').not.toEqual(
      [],
    );
  });
});
