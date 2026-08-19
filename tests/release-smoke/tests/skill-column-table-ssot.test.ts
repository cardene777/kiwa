import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { headingSectionIn, read, skillBody } from './skill-md.js';

/**
 * layer 専用 column 表の所在が 1 箇所に閉じているか (#2066)。
 *
 * 表は producer (`/kiwa-design`) が出力する形式そのもので、 consumer はそれを parse する。
 * 実測すると所在が 3 通りに割れていた = producer 側に 6 / 両方に写しが 3 / consumer 側だけに
 * 4 / どこにも無いのが 3。
 *
 * 写しがある間は「一致しているうちは実害が出ない」 が、 **片方だけ直すと気付けない**。
 * consumer 側だけにある形はもっと悪く、 producer は自分が何を出力すべきか知らないまま
 * 汎用表を出し、 consumer は 1 行も parse できない (#2062 で実際に踏んだ)。
 */

const DESIGN = skillBody('kiwa-design');

const LAYERS = (JSON.parse(read('docs/layers.json')) as {
  layers: {
    id: string;
    spec_path: string;
    consumer_skill: string | null;
    also_consumed_by?: string[];
    backing_package: string | null;
    providers: string[];
  }[];
}).layers;

/** 汎用 9 column 表 (`TC-`) をそのまま使う layer。 専用節を持たないのが正しい。 */
const GENERIC = ['contract', 'e2e', 'integration', 'unit'];

/**
 * 表がまだどこにも無い layer。 #2067 で `auth` / `job-queue` / `cache` の 3 件を埋めて空になった。
 *
 * 空のまま残すのは、 layer を足した時に **節を書き忘れた形をここへ落とす** ため。
 * 新 layer は宣言した時点でどの群にも属さないので、 下の網羅検査が落ちて気付ける。
 */
const KNOWN_GAPS: string[] = [];

/**
 * `#### {layer} layer 専用 column` 節の本文。
 *
 * 範囲の閉じ方は `headingSectionIn` に委ねる。 自前で `rest.slice(1).search(/^#{3,4} /m)` と
 * 書くと **自分の見出しを次の見出しとして拾う** (`#### x` から 1 文字落とすと `### x` に
 * なり `#{3,4} ` に一致する)。 実測で全 13 節が 1 行に潰れた。
 */
function sectionOf(layer: string): string | null {
  const heading = new RegExp(`^#### ${layer} layer 専用 column`, 'm');
  if (DESIGN.search(heading) < 0) return null;
  return headingSectionIn(DESIGN, heading);
}

/** 節が持つ最初の `| 項目 | 内容 |` 表の 1 列目の並び (見出し `項目` を除く)。 */
function columnsOf(section: string): string[] {
  const at = section.indexOf('| 項目 | 内容 |');
  if (at < 0) return [];
  const out: string[] = [];
  for (const line of section.slice(at).split('\n')) {
    if (!line.startsWith('|')) break;
    const cell = line.split('|')[1]!.trim();
    if (/^-+$/.test(cell)) continue;
    if (cell === '項目') continue;
    out.push(cell);
  }
  return out;
}

/** TypeScript entry point が明示的に export する名前。 comment や local declaration は含めない。 */
function exportedNamesIn(sourceText: string, fileName: string): Set<string> {
  const source = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
  const names = new Set<string>();
  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement)) {
      const clause = statement.exportClause;
      if (clause && ts.isNamedExports(clause)) {
        for (const element of clause.elements) names.add(element.name.text);
      }
      continue;
    }
    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
    if (!modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) continue;
    if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
      if (statement.name) names.add(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    }
  }
  return names;
}

const WITH_SECTION = LAYERS.filter((l) => sectionOf(l.id) !== null).map((l) => l.id);
// ID 文法で先に絞ると、 大文字や underscore を含む typo 見出しほど列挙から消える。
// 専用節らしい見出しをすべて拾い、 manifest との比較側で不正な ID として落とす。
const DECLARED_SECTIONS = [
  ...DESIGN.matchAll(/^#### (.+?) layer 専用 column(?: |$)/gm),
].map((m) => m[1]!);

describe('layer 専用 column 表は kiwa-design に 1 つだけ置く', () => {
  it('全 layer が 3 群のいずれかに属する', () => {
    // 完成度そのものを検査する。 節を足しても roster を直さないと落ちるので、
    // 「宣言だけ増えて実物が無い」 状態が残らない。
    expect(LAYERS.length, 'layer を 1 つも読めていない (検査が空振りしている)').toBeGreaterThan(0);
    const covered = [...WITH_SECTION, ...GENERIC, ...KNOWN_GAPS].sort();
    expect(covered).toEqual(LAYERS.map((l) => l.id).sort());
  });

  it('汎用表を使う layer は専用節を持たない', () => {
    // 専用節を足したら GENERIC から外す = 2 つの規則が同時に成立する状態を作らない。
    const stray = GENERIC.filter((id) => sectionOf(id) !== null);
    expect(stray, '汎用表の layer に専用節がある').toEqual([]);
  });

  it('欠落の一覧が実物と一致する', () => {
    // 宣言を実物から導く。 `KNOWN_GAPS` を手で持つだけだと、 節を足した後も欠落として
    // 残り続ける / 節を消しても気付けない、 の両方向に外れる。
    const derived = LAYERS.map((l) => l.id)
      .filter((id) => !GENERIC.includes(id))
      .filter((id) => sectionOf(id) === null);
    expect(
      derived.sort(),
      '欠落が変わっている。 節を足したなら KNOWN_GAPS から外し、 layer を足したなら節を書く',
    ).toEqual([...KNOWN_GAPS].sort());
  });

  it('専用節は 1 layer につき 1 つだけ', () => {
    const dup: string[] = [];
    for (const id of WITH_SECTION) {
      const n = [...DESIGN.matchAll(new RegExp(`^#### ${id} layer 専用 column`, 'gm'))].length;
      if (n !== 1) dup.push(`${id}: ${n} 節`);
    }
    expect(dup, '同じ layer の節が複数ある').toEqual([]);
  });

  it('専用節は manifest に存在する layer だけを持つ', () => {
    // manifest から消した layer や typo の見出しが残ると、 producer に到達不能な表が残る。
    // layer → 節だけでなく節 → layer も照合し、 SSOT の残骸を見逃さない。
    expect(DECLARED_SECTIONS.sort(), 'manifest に無い専用節がある').toEqual(
      [...WITH_SECTION].sort(),
    );
  });
});

describe.each(WITH_SECTION)('%s の節', (layer) => {
  const section = sectionOf(layer)!;

  it('9 column を持つ', () => {
    const cols = columnsOf(section);
    expect(cols.length, `${layer}: 列数が 9 でない (${cols.join(' / ')})`).toBe(9);
  });

  it('1 列目が ID で連番の prefix を示す', () => {
    const cols = columnsOf(section);
    expect(cols[0], `${layer}: 1 列目が ID でない`).toBe('ID');
    // prefix は Layer 2 が関数名に変換する鍵なので、 節に必ず現れる。
    expect(section, `${layer}: ID prefix の例が無い`).toMatch(/\|\s*ID\s*\|\s*`T-[A-Z0-9]+-\d+`/);
  });

  it('出力 path が docs/layers.json の宣言と一致する', () => {
    // 手で書いた path は必ずずれるので、 宣言に問い直す。
    const declared = LAYERS.find((l) => l.id === layer)!.spec_path;
    const m = /出力 path 規約 は `([^`]+)`/.exec(section);
    expect(m, `${layer}: 出力 path の行が無い`).toBeTruthy();
    expect(m![1], `${layer}: 宣言と食い違う`).toBe(declared);
  });
});

describe.each([
  ['auth', ['Provider', 'Flow']],
  ['job-queue', ['Provider', 'Mode']],
  ['cache', ['Provider', 'Mode']],
] as const)('%s の selector column', (layer, selectors) => {
  const section = sectionOf(layer)!;

  it('末尾 2 列が consumer の読む selector と一致する', () => {
    expect(columnsOf(section).slice(-2)).toEqual(selectors);
  });

  it('Provider の列挙が manifest と一致する', () => {
    const providerRow = section.split('\n').find((line) => line.startsWith('| Provider |'));
    const enumText = /\(([^)]*)\)/.exec(providerRow ?? '')?.[1] ?? '';
    const values = [...enumText.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
    const declared = LAYERS.find((l) => l.id === layer)!.providers;
    expect(values.sort(), `${layer}: Provider が docs/layers.json と食い違う`).toEqual(
      [...declared].sort(),
    );
  });
});

describe('節が名指しする helper が実在する', () => {
  // 節の冒頭は「どの helper と mapping するか」 を書く。 手で並べた名前は package の
  // 改名に追随しないので、 **backing package の export に問い直す**。
  //
  // 実測でも 1 件外していた = `@kiwa-lab/auth` の export は複数行の block 形式で、
  // 1 行 grep では `setupAuth0Env` と `setupBetterAuthEnv` が見えず「4 種 + 等」 と
  // 書きかけた。 検査に載せれば書き手の grep 精度に依存しない。
  const NAMED = LAYERS.filter((l) => l.backing_package && sectionOf(l.id) !== null).map((l) => ({
    id: l.id,
    pkg: l.backing_package!,
    names: [...new Set([...sectionOf(l.id)!.matchAll(/`(setup[A-Za-z0-9]+Env)`/g)].map((m) => m[1]!))],
  }));

  const HELPER_CASES = NAMED.filter((n) => n.names.length > 0).map(
    (n) => [n.id, n.pkg, n.names] as const,
  );

  it('helper を名指しする節が 1 つ以上ある (空振り防止)', () => {
    expect(HELPER_CASES.length).toBeGreaterThan(0);
  });

  it.each(HELPER_CASES)(
    '%s の節が名指しする helper を @kiwa-lab/%s が export している',
    (layer, pkg, names) => {
      const path = `packages/${pkg}/src/index.ts`;
      const exported = exportedNamesIn(read(path), path);
      const missing = names.filter((n) => !exported.has(n));
      expect(missing, `${layer}: package が export していない helper がある`).toEqual([]);
    },
  );

  it('comment や local declaration に名前があるだけでは export とみなさない', () => {
    const names = exportedNamesIn(
      '// setupCommentEnv\nconst setupLocalEnv = () => {};\nexport default function setupDefaultEnv() {}\nexport { setupRealEnv } from "./real.js";',
      'fixture.ts',
    );
    expect([...names]).toEqual(['setupRealEnv']);
  });
});

describe('consumer は表の写しを持たない', () => {
  const CONSUMERS = [
    ...new Set(
      LAYERS.flatMap((l) => [l.consumer_skill, ...(l.also_consumed_by ?? [])]).filter(
        (s): s is string => Boolean(s),
      ),
    ),
  ];

  it('ID prefix つきの表が consumer に 1 件も無い', () => {
    // 写しは「一致しているうちは実害が出ない」 が、 片方だけ直った時に気付けない。
    // 実測では nextjs 3 layer が producer と consumer の両方に同じ表を持っていた。
    expect(CONSUMERS.length, 'consumer を 1 つも読めていない (検査が空振りしている)').toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const skill of CONSUMERS) {
      const body = skillBody(skill);
      const hits = [...body.matchAll(/^\|\s*ID\s*\|\s*`(T-[A-Z0-9]+-|TC-)\d+`/gm)];
      if (hits.length) offenders.push(`${skill}: ${hits.length} 件`);
    }
    expect(offenders, '表の写しが consumer に残っている').toEqual([]);
  });

  it('producer 側には表がある (陰性対照)', () => {
    // 上の検査は「無いこと」 を主張するので、 同じ probe が **有る側で当たる** ことを
    // 確かめないと恒真と区別が付かない。 probe を壊せば両方落ちる。
    const hits = [...DESIGN.matchAll(/^\|\s*ID\s*\|\s*`(T-[A-Z0-9]+-|TC-)\d+`/gm)];
    expect(hits.length, 'producer 側で probe が当たらない (probe が壊れている)').toBe(
      WITH_SECTION.length,
    );
  });

  it('表を移した consumer が producer への参照を持つ', () => {
    // 表を消すだけでは読み手が行き先を失う。
    const missing: string[] = [];
    for (const skill of ['kiwa-nextjs', 'kiwa-orm', 'kiwa-edge']) {
      const body = skillBody(skill);
      if (!body.includes('layer 専用 column')) missing.push(skill);
    }
    expect(missing, '参照が無い').toEqual([]);
  });
});
