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
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
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
    const forms: Form[] = ['repo-rooted', 'skill-rooted'];
    const empty = forms.filter((form) => (byForm.get(form) ?? 0) === 0);
    expect(empty, 'この書かれ方の reference を 1 件も抽出できていない').toEqual([]);
  });

  it('T-SRI-003 全ての reference が実在する file を指す', () => {
    const missing = collectReferences()
      .filter((ref) => !isFile(ref.resolved))
      .map((ref) => `${ref.skill}/SKILL.md:${ref.line} -> ${ref.raw}`)
      .sort();
    expect(missing, '参照先が実在しない reference がある').toEqual([]);
  });

  it('T-SRI-009 .md という名前の directory を reference file として扱わない', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'kiwa-skill-reference-'));
    try {
      const directory = resolve(root, 'not-a-file.md');
      mkdirSync(directory);
      expect(isFile(directory), 'directory が通常 file として判定されている').toBe(false);
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
    // 壊れた symlink は readdir には現れるので、一覧を見ただけでは気付けない。
    // 実体が skill dir の外を指す形も止める = 配布した先で必ず切れる。
    const root = `${realpathSync(SKILLS_DIR)}/`;
    const broken: string[] = [];
    for (const entry of referenceEntries()) {
      if (!entry.isSymlink) continue;
      const path = resolve(REPO_ROOT, entry.rel);
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
      }
    }
    expect(broken.sort(), '壊れた symlink がある').toEqual([]);
  });

  it('T-SRI-007 symlink を 1 本以上見つけられている', () => {
    // T-SRI-006 は symlink が 0 本でも通る。 共用の実現手段が消えていないことを見る。
    const links = referenceEntries().filter((entry) => entry.isSymlink);
    expect(links.length, 'symlink を 1 本も見つけられていない (共用の形が変わった)').toBeGreaterThan(
      0,
    );
  });
});
