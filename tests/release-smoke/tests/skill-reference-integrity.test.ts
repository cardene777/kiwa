// skill が指す reference が実在することを検査する (Issue #2182)。
//
// skill は手順の途中で「`references/{name}.md` を Read せよ」 と指示する。 その path が
// 無い時に何をするかは書かれていないので、読み手は分類 rule 無しで先へ進むか、その場で
// 止まる。 どちらも「指示どおりに動いた」 とは言えない状態で、しかも **静かに起きる**。
//
// 実測で 6 件が実在しない先を指していた。 いずれも「共用 SSOT」 と自分の references 一覧に
// 書きながら、その dir に file も symlink も置いていない形だった。
//
// 共用は symlink で実現されている (実体 1 本 + symlink)。 この形は「読めば分かる」 が
// **shasum では分からない** = shasum は symlink を辿るので、実体と symlink が同じ値を返す。
// 本 Issue の調査でも最初これを「同じ中身の物理 copy が 6 個」 と誤読した。 したがって
// T-SRI-005 は symlink を辿らずに種別を見る。
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SKILLS_DIR = resolve(REPO_ROOT, '.claude/skills');

/**
 * SKILL.md 本文に現れる reference は 2 通りの書かれ方をする。
 *
 *   1. `references/{name}.md`                          — skill 自身の dir 起点
 *   2. `.claude/skills/{skill}/references/{name}.md`   — repo root 起点
 *
 * 起点が違うので、同じ正規表現でまとめて拾って同じ扱いにすると片方を必ず外す。
 * 2 を先に試し、当たらなければ 1 として読む (2 は 1 を部分文字列として含むため、
 * 順序を逆にすると repo root 起点の path を skill dir 起点として解決してしまう)。
 */
// 名前の文字種を絞らない。 小文字だけを拾う形にしていた時、`coverage-classifyX.md` の
// ように大文字を含む誤りは **抽出されず検査対象にすら入らなかった** (変異試験で実測)。
// 「壊れた参照を見つける」 検査が、壊れ方によって黙って見逃す形になっていた。
const REPO_ROOTED = /`(\.claude\/skills\/[A-Za-z0-9-]+\/references\/[A-Za-z0-9._-]+\.md)`/g;
const SKILL_ROOTED = /`(references\/[A-Za-z0-9._-]+\.md)`/g;

type Form = 'repo-rooted' | 'skill-rooted';
type Reference = { skill: string; raw: string; resolved: string; line: number; form: Form };
type Entry = { rel: string; name: string; isSymlink: boolean };

/** symlink は辿り、参照先が通常 file の時だけ true。 壊れた link も false に畳む。 */
function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function skillDirs(): string[] {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .filter((name) => existsSync(resolve(SKILLS_DIR, name, 'SKILL.md')))
    .sort();
}

/**
 * 1 つの本文から reference を取り出す。
 *
 * 実 skill を走査する `collectReferences()` と、fixture を通す T-SRI-008 が同じ経路を使う =
 * 検査の識別力を実 file の内容に依存させない。
 */
export function extractReferences(skill: string, body: string): Reference[] {
  const found: Reference[] = [];

  // **二重計上は起きないので dedup を置かない**。 `SKILL_ROOTED` は `references/` の
  // 直前に backtick を要求するので、repo root 起点の literal の内側には決して当たらない
  // (実測 = repo 全体で dedup 有り 86 件 / 無し 86 件、抑制は 0 件)。
  //
  // 置いていた dedup が実際にしていたのは逆のこと = 同じ行に repo root 起点の参照と、
  // その suffix に一致する skill dir 起点の参照が並ぶと、**後者が `existsSync` に届く前に
  // 落ちていた**。 「共用 SSOT は `.claude/skills/kiwa-forge/references/x.md`、自 skill の
  // `references/x.md` を Read する」 と書いて local file を置かない形は、本 PR が直した
  // `kiwa-api` / `kiwa-vitest` の欠陥そのもので、それを見逃していた (#2182 r1-f1)。
  body.split('\n').forEach((text, index) => {
    for (const match of text.matchAll(REPO_ROOTED)) {
      const raw = match[1];
      if (raw === undefined) continue;
      found.push({ skill, raw, resolved: resolve(REPO_ROOT, raw), line: index + 1, form: 'repo-rooted' });
    }
    for (const match of text.matchAll(SKILL_ROOTED)) {
      const raw = match[1];
      if (raw === undefined) continue;
      found.push({ skill, raw, resolved: resolve(SKILLS_DIR, skill, raw), line: index + 1, form: 'skill-rooted' });
    }
  });
  return found;
}

/** SKILL.md 本文から reference を全件取り出し、それぞれの起点で解決する。 */
function collectReferences(): Reference[] {
  return skillDirs().flatMap((skill) =>
    extractReferences(skill, readFileSync(resolve(SKILLS_DIR, skill, 'SKILL.md'), 'utf8')),
  );
}

// 各 skill の references dir 配下の entry を全件集める。
// (path に glob を書くと block comment が閉じるため行 comment で書く)
//
// 種別は lstat で見る。 stat は symlink を辿るので、実体と symlink の区別が消える。
function referenceEntries(): Entry[] {
  const entries: Entry[] = [];
  for (const skill of skillDirs()) {
    const dir = resolve(SKILLS_DIR, skill, 'references');
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      const path = resolve(dir, name);
      const stat = lstatSync(path);
      if (!stat.isFile() && !stat.isSymbolicLink()) continue;
      entries.push({
        rel: path.slice(REPO_ROOT.length + 1),
        name,
        isSymlink: stat.isSymbolicLink(),
      });
    }
  }
  return entries;
}

/**
 * symlink の entry から、実体を指していないものを理由付きで返す。
 *
 * 実 skill を走査する T-SRI-006 と、fixture を通す T-SRI-010 が同じ経路を使う =
 * 実 skill に無い形 (dir を指す symlink 等) でも識別力が残る。
 */
function brokenSymlinks(entries: readonly Entry[], repoRootPath: string, skillsRealPath: string): string[] {
  const root = `${skillsRealPath}/`;
  const broken: string[] = [];
  for (const entry of entries) {
    if (!entry.isSymlink) continue;
    const path = resolve(repoRootPath, entry.rel);
    if (!existsSync(path)) {
      broken.push(`${entry.rel} (参照先が無い)`);
      continue;
    }
    if (!isFile(path)) {
      broken.push(`${entry.rel} (参照先が通常 file ではない)`);
      continue;
    }
    const real = realpathSync(path);
    if (!real.startsWith(root)) {
      broken.push(`${entry.rel} (skill dir の外を指す: ${real})`);
      continue;
    }
    // **名前の一致まで見る** (#2189)。 共用 reference は「同じ名前の file を 1 本の実体に
    // 集める」 形で運用しており、 別名の先を指す symlink はその前提が破れた状態を指す。
    //
    // 参照は解決するので、 名前を見ない限り T-SRI-003 も T-SRI-006 も通る。 読み手は
    // `coverage-classify.md` を Read して分類 rule を期待するのに、 届くのが言語選択の
    // 説明になる形が素通りする。
    const target = basename(real);
    if (target !== entry.name) {
      broken.push(`${entry.rel} (別名の実体を指す: ${target})`);
    }
  }
  return broken.sort();
}

describe('skill の reference が実在する (#2182)', () => {
  it('T-SRI-001 skill を 1 つ以上走査できている', () => {
    // 走査対象が 0 件なら以下の検査は全て素通りする (`rules/quality.md` の
    // 「対象を走査する検査は 1 件以上あったことを併記する」)。 dir を移した時に
    // 「壊れていない」 ではなく「見ていない」 で通る形を先に止める。
    expect(
      skillDirs().length,
      'SKILL.md を 1 つも見つけられていない (検査が空振りしている)',
    ).toBeGreaterThan(0);
  });

  it('T-SRI-002 2 つの書かれ方それぞれを 1 件以上抽出できている', () => {
    // 正規表現が実物と噛み合わなくなった時、抽出 0 件でも T-SRI-003 は
    // toEqual([]) で通ってしまう。 抽出そのものが生きていることを別に見る。
    //
    // **合計件数の下限では足りない** (変異試験で実測)。 2 つの正規表現のうち
    // repo root 起点の側だけを壊しても、skill dir 起点の側が数十件を返すので
    // 合計は下限を超え、壊れた側が黙って検査対象から消える。 形ごとに数える。
    const byForm = new Map<Form, number>();
    for (const ref of collectReferences()) {
      byForm.set(ref.form, (byForm.get(ref.form) ?? 0) + 1);
    }

    // `skill-rooted` (`` `references/x.md` ``) が抽出できていることを見る。
    expect(
      byForm.get('skill-rooted') ?? 0,
      'skill dir 起点の reference を 1 件も抽出できていない',
    ).toBeGreaterThan(0);

    // **`repo-rooted` は 0 件が正しい** (Issue #2199)。 `.claude/skills/<skill>/references/...`
    // の書き方は、実体を `_shared/` へ移した後に全廃した = その path が動くのは
    // 名指しした skill に symlink が残っているからで、その skill を消すと全 consumer の
    // 指示が壊れる。
    //
    // 0 件を許すと抽出が壊れた時に気付けないので、**書かれていないこと自体を assert する**。
    // 抽出の生死は `skill-rooted` の件数が担う。
    expect(byForm.get('repo-rooted') ?? 0, 'repo root 起点の reference が復活している').toBe(0);
  });

  it('T-SRI-003 全ての reference が実在する file を指す', () => {
    const missing = collectReferences()
      .filter((ref) => !isFile(ref.resolved))
      .map((ref) => `${ref.skill}/SKILL.md:${ref.line} -> ${ref.raw}`)
      .sort();
    expect(missing, '参照先が実在しない reference がある').toEqual([]);
  });

  it('T-SRI-009 .md という名前の directory を reference file として扱わない', () => {
    // `existsSync` は dir にも true を返すので、`references/x.md` という **dir** を置くと
    // 参照が「実在する」 と判定されていた (#2182 r1-f1)。
    //
    // symlink 越しの形も別に固定する = T-SRI-006 は `realpathSync` の前に種別を見ておらず、
    // dir を指す symlink が「skill dir 内を指している」 として通っていた (#2182 r2-f1)。
    // 直接の dir だけを試すと、symlink 側で `isFile` を呼ばない実装が通る。
    const root = mkdtempSync(resolve(tmpdir(), 'kiwa-skill-reference-'));
    try {
      const directory = resolve(root, 'not-a-file.md');
      mkdirSync(directory);
      expect(isFile(directory), 'directory が通常 file として判定されている').toBe(false);

      const link = resolve(root, 'link-to-dir.md');
      symlinkSync(directory, link);
      expect(isFile(link), 'directory を指す symlink が通常 file として判定されている').toBe(false);

      // 壊れた link も false に畳む (例外を投げない)。
      const broken = resolve(root, 'broken.md');
      symlinkSync(resolve(root, 'nope.md'), broken);
      expect(isFile(broken), '壊れた symlink で例外を投げている').toBe(false);

      // 通常 file は true。 3 つとも false になる実装 (常に false) を落とす。
      const real = resolve(root, 'real.md');
      writeFileSync(real, '# real\n');
      expect(isFile(real), '通常 file を false にしている').toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('T-SRI-008 同じ行に 2 形式が並んでも両方を対象にする', () => {
    // **この形が本 PR の直した欠陥そのもの**。 「共用 SSOT は <repo root 起点>、自 skill の
    // <skill dir 起点> を Read する」 と書いて local file を置かないのが `kiwa-api` /
    // `kiwa-vitest` の状態で、dedup を置いていた間は後者が `existsSync` に届く前に落ちていた。
    //
    // 実 file ではなく fixture を通す = 実 skill から該当の行が消えても識別力が残る。
    const body = [
      '# probe',
      '',
      '共用 SSOT は `.claude/skills/kiwa-forge/references/coverage-classify.md`、',
      '自 skill の `references/coverage-classify.md` を Read する。',
      '',
      '1 行に両方を書く形も同じ = `.claude/skills/kiwa-forge/references/x.md` と `references/x.md`。',
    ].join('\n');

    const found = extractReferences('zz-fixture', body);
    const byForm = found.reduce<Record<string, number>>((acc, ref) => {
      acc[ref.form] = (acc[ref.form] ?? 0) + 1;
      return acc;
    }, {});
    expect(byForm, '2 形式のどちらかを取りこぼしている').toEqual({
      'repo-rooted': 2,
      'skill-rooted': 2,
    });

    // skill dir 起点は **その skill の dir** を起点に解決する。 repo root 起点の値を
    // 使い回すと、local file の不在を検出できない。
    const local = found.filter((ref) => ref.form === 'skill-rooted');
    for (const ref of local) {
      expect(ref.resolved, 'skill dir 起点の解決先が自 skill の dir を向いていない').toBe(
        resolve(SKILLS_DIR, 'zz-fixture', ref.raw),
      );
    }
  });

  it('T-SRI-004 reference dir の entry を 1 件以上見つけられている', () => {
    // T-SRI-005 / 006 はどちらも集合が空なら通る。 実 file 側の走査が生きていることを見る。
    expect(
      referenceEntries().length,
      'reference file を 1 件も見つけられていない (検査が空振りしている)',
    ).toBeGreaterThan(0);
  });

  it('T-SRI-005 共用している reference の実体が 2 箇所以上に無い', () => {
    // 共用は symlink で実現されている前提を固定する。 同じ名前の**実体**が 2 つあれば、
    // それは symlink の張り忘れか copy であって、一致を保つ仕組みが無い状態になる。
    // symlink は何本あってもよい (実体を指しているかは T-SRI-006 が見る)。
    //
    // **対象は「共用している名前」 に限る** (#2182 r1-f2)。 全 skill 横断で basename の
    // 一意性を課すと、`troubleshooting.md` のような一般名を 2 skill が **別の中身で**
    // 正当に持つ形を落とす。 それは symlink にできない = 中身が違うのだから。
    //
    // 共用しているかは実物から導く = その名前の symlink が 1 本でもあれば共用している。
    // 一覧を人手で持つと、共用を始めた reference が検査の外に落ちる。
    const entries = referenceEntries();
    const sharedNames = new Set(entries.filter((e) => e.isSymlink).map((e) => e.name));
    expect(sharedNames.size, '共用している reference が 1 つも無い (検査が空振りしている)')
      .toBeGreaterThan(0);

    const byName = new Map<string, string[]>();
    for (const entry of entries) {
      if (entry.isSymlink || !sharedNames.has(entry.name)) continue;
      const paths = byName.get(entry.name) ?? [];
      paths.push(entry.rel);
      byName.set(entry.name, paths);
    }
    const duplicated = [...byName.entries()]
      .filter(([, paths]) => paths.length > 1)
      .map(([name, paths]) => `${name}: ${paths.sort().join(' / ')}`)
      .sort();
    expect(duplicated, '共用している basename の実体が複数箇所にある (symlink にすべき)').toEqual([]);
  });

  it('T-SRI-006 symlink が実在する実体を指し、その実体が skill dir 内にある', () => {
    expect(brokenSymlinks(referenceEntries(), REPO_ROOT, realpathSync(SKILLS_DIR)), '壊れた symlink がある').toEqual(
      [],
    );
  });

  it('T-SRI-010 dir を指す symlink を「実体を指している」 と読まない', () => {
    // 実 skill に dir を指す symlink は無いので、**判定を実 file で測れない**。
    // 検査を外しても実 file では落ちないため、fixture で 5 形を通して固定する
    // (#2182 r2-f1)。
    const root = mkdtempSync(resolve(tmpdir(), 'kiwa-skill-symlink-'));
    try {
      const skills = resolve(root, 'skills');
      const refs = resolve(skills, 'zz/references');
      mkdirSync(refs, { recursive: true });

      writeFileSync(resolve(refs, 'real.md'), '# real\n');
      // **同名の実体を別 dir に置く** (#2189)。 共用 reference の実運用と同じ形で、
      // 名前の判定を足しても落ちない 1 本を fixture に残す。
      const shared = resolve(skills, 'yy/references');
      mkdirSync(shared, { recursive: true });
      writeFileSync(resolve(shared, 'to-file.md'), '# shared\n');
      const dir = resolve(refs, 'a-dir.md');
      mkdirSync(dir);

      symlinkSync(resolve(shared, 'to-file.md'), resolve(refs, 'to-file.md'));
      symlinkSync(dir, resolve(refs, 'to-dir.md'));
      symlinkSync(resolve(refs, 'nope.md'), resolve(refs, 'to-nothing.md'));
      // **skill dir の外の「通常 file」 を指す**。 dir を指す形にすると `isFile` の側で
      // 先に落ち、範囲外の判定を 1 度も通らない (変異試験で実測)。
      const outside = resolve(root, 'outside.md');
      writeFileSync(outside, '# outside\n');
      symlinkSync(outside, resolve(refs, 'to-outside.md'));
      // **skill dir の中の、名前が違う通常 file を指す** (#2189)。 範囲内なので範囲外の判定は
      // 通り、 実体もあるので存在と種別の判定も通る = 名前を見る判定だけが落とせる形。
      symlinkSync(resolve(refs, 'real.md'), resolve(refs, 'to-renamed.md'));

      const entries: Entry[] = [
        'to-file.md',
        'to-dir.md',
        'to-nothing.md',
        'to-outside.md',
        'to-renamed.md',
      ].map((name) => ({ rel: `skills/zz/references/${name}`, name, isSymlink: true }));
      const broken = brokenSymlinks(entries, root, realpathSync(skills));

      // 同名の実体を指す 1 本だけが残り、他 4 本は理由付きで拒否される。
      expect(broken.map((b) => b.split(' ')[0]).sort(), '拒否する symlink の種類が違う').toEqual([
        'skills/zz/references/to-dir.md',
        'skills/zz/references/to-nothing.md',
        'skills/zz/references/to-outside.md',
        'skills/zz/references/to-renamed.md',
      ]);
      expect(
        broken.find((b) => b.includes('to-dir.md')),
        'dir を指す symlink を「通常 file ではない」 として拒否していない',
      ).toContain('通常 file ではない');

      // 理由まで見る = 3 本が同じ理由で落ちると、どの判定が効いているか分からない。
      expect(
        broken.find((b) => b.includes('to-outside.md')),
        'skill dir の外を指す symlink を範囲外として拒否していない',
      ).toContain('skill dir の外を指す');
      expect(
        broken.find((b) => b.includes('to-nothing.md')),
        '壊れた symlink を「参照先が無い」 として拒否していない',
      ).toContain('参照先が無い');
      expect(
        broken.find((b) => b.includes('to-renamed.md')),
        '別名の実体を指す symlink を名前不一致として拒否していない',
      ).toContain('別名の実体を指す');

      // 同名を指す 1 本は落とさない (陰性対照)。 名前の判定を「常に落とす」 形にすると、
      // 正しい共用 reference 11 本が全て拒否される。
      expect(
        broken.find((b) => b.includes('to-file.md')),
        '同名の実体を指す symlink まで拒否している',
      ).toBeUndefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('T-SRI-007 symlink を 1 本以上見つけられている', () => {
    // T-SRI-006 は symlink が 0 本でも通る。 共用の実現手段が消えていないことを見る。
    const links = referenceEntries().filter((entry) => entry.isSymlink);
    expect(links.length, 'symlink を 1 本も見つけられていない (共用の形が変わった)').toBeGreaterThan(
      0,
    );
  });
});
