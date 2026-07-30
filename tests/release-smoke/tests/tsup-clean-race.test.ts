import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 共有依存の build が `dist/` を空にしないことを固定する (#1741)。
 *
 * 169 package が自身の `test` script の中で `pnpm -F <name> build` を実行して
 * 共有依存を再 build する。 `pnpm -r test` は package を並列に走らせるため、
 * その再 build と、 別 package の `tsc` が同じ `dist/` を読む瞬間が重なる。
 *
 * tsup の `clean` は build のたびに `dist/` を空にするので、 重なった側は型定義を
 * 解決できず落ちる。 実測では `packages/api` が `TS7016` を起点に 12 件の型エラーで
 * 落ち、 単体実行では 90/90 通った。
 *
 * clean を外すと `dist/` が空になる瞬間が消える。 外せるのは「出力する **実 file** の
 * 集合が固定されている package」 に限る = 毎回すべて上書きされるので古い生成物が
 * 残らない。 hash 名の chunk を出す package では、 clean を外すと古い chunk が残る。
 *
 * ## 判定を静的な一覧で持つ理由
 *
 * 対象を `dist/` の中身から動的に判定すると、 未 build の package が「判定不能」 として
 * 検査を素通りする。 release-smoke を clean clone で走らせると build 済なのは一部だけで、
 * 残りに `clean` が戻っても検知できない (review 実測 = 36 件中 16 件が検査外)。
 *
 * そのため対象を一覧で固定し、 **一覧の全件を必ず検査する**。 一覧の妥当性は別 test で
 * 実際の出力と突き合わせる (build 済のものだけを対象にする = そちらは判定不能を許す)。
 */

// compile 後は `.vitest-dist/tests/` から走るため 4 階層上が repo root
// (`.vitest-dist/tests` → `.vitest-dist` → `release-smoke` → `tests` → root)。
//
// `import.meta.dirname` は Node 20.11.0 追加で、 repo の下限 (>=20) を下回る
// 20.0-20.10 では undefined になり module 読込時に落ちる。 既存 24 件と同じ形にする。
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

/** tsup が単一 entry で出す実 file の集合。 */
const FIXED_OUTPUT = new Set([
  'index.cjs',
  'index.cjs.map',
  'index.d.cts',
  'index.d.ts',
  'index.js',
  'index.js.map',
]);

/**
 * 他 package の `test` / `pretest` から build され、 かつ出力が固定 6 file の package。
 * この一覧の全件で `clean` が無効でなければならない。
 *
 * 追加/削除する時は § 判定を静的な一覧で持つ理由 の前提 (実 file が固定 6 件) を
 * 実測で確かめてから触る。 下の「一覧が実際の出力と一致する」 test が守る。
 */
const FIXED_OUTPUT_TARGETS = [
  'a11y', 'ai-llm', 'api', 'astro', 'auth', 'cache', 'cli-test', 'component',
  'core', 'data', 'desktop', 'e2e', 'edge', 'fresh', 'hono', 'lean', 'mcp',
  'mobile', 'nextjs', 'nuxt', 'observability', 'orm', 'payment',
  'quality-metrics', 'queue', 'qwikcity', 'realtime', 'remix', 'search',
  'security', 'security-devsecops', 'solidjs', 'solidstart', 'streaming',
  'sveltekit', 'ui', 'visual',
] as const;

/**
 * 出力が固定でない package。 clean を外すと古い chunk が残るため clean が要る。
 * `cli` は追加 entry (`bin.ts`) と chunk、 `dapp` は追加 entry (`vitest`) と chunk。
 */
const CLEAN_REQUIRED_TARGETS = ['cli', 'dapp'] as const;

/** dir を降りて実 file の相対 path だけを集める。 空 dir は出力に数えない。 */
function listFiles(dir: string, base = ''): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = base === '' ? entry.name : `${base}/${entry.name}`;
    if (entry.isDirectory()) out.push(...listFiles(join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

/**
 * clean が有効かを 3 経路で見る。 判定できない形は「有効かもしれない」 側に倒す。
 *
 * - tsup 設定の `clean:` — `true` / 配列 / 式のいずれも有効扱い (tsup は truthy な
 *   配列でも `removeFiles` を実行する)。 `false` だけが無効
 * - `package.json` の build script の `--clean` — `cli` はこの経路で clean する
 * - 設定 file 不在 — 判定不能。 build script 側だけで決める
 */
function cleanState(name: string): 'enabled' | 'disabled' | 'unknown' {
  const script = readBuildScript(name);
  if (script !== null && /(^|\s)--clean(\s|$|=)/.test(script)) return 'enabled';
  // 別 config を指す build script は、 その file を読まないと判定できない。
  // 読める形に限定するより「判定不能」 に倒して呼出側で fail させる。
  if (script !== null && /(^|\s)(--config|-c)(\s|=)/.test(script)) return 'unknown';

  const config = join(PACKAGES_DIR, name, 'tsup.config.ts');
  if (!existsSync(config)) return script === null ? 'unknown' : 'disabled';

  // block comment を落としてから見る。 外した理由を comment に書くと、 その本文に
  // `clean: true` の字面が入って設定と区別が付かなくなる (実際に誤検知した)。
  const source = readFileSync(config, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  // spread は展開元の値が見えない。 中に clean があれば有効になり得る。
  if (/\.\.\./.test(source)) return 'unknown';
  // `defineConfig([...])` の配列形は entry ごとに別の clean を持てる。
  // 1 つ目だけを見る形にすると 2 つ目の clean を取り落とす。
  if (/defineConfig\(\s*\[/.test(source)) return 'unknown';

  // 同 file 内の clean 指定を全件見る。 1 つでも false 以外があれば有効扱い。
  const values = [...source.matchAll(/^\s*clean:\s*(.+?),?\s*$/gm)].map((m) => m[1]!.trim());
  if (values.length === 0) return 'disabled';
  if (values.every((value) => value === 'false')) return 'disabled';
  // `true` / 配列 / 変数 / 式 はいずれも clean が走り得る。
  return 'enabled';
}

function readBuildScript(name: string): string | null {
  const manifest = join(PACKAGES_DIR, name, 'package.json');
  if (!existsSync(manifest)) return null;
  const scripts = (JSON.parse(readFileSync(manifest, 'utf8')) as {
    scripts?: Record<string, string>;
  }).scripts;
  return scripts?.build ?? null;
}

/**
 * dist の実 file が固定 6 件と**完全一致**するか。 未 build は判定不能で null。
 *
 * `every` だけだと「余分が無い」 しか見ず、 6 件のうち 1 件が欠けても通る。
 * format を減らして `index.cjs` が消えた状態は、 clean を外した前提
 * (毎回すべて上書きされる) が崩れているので検知したい。
 */
function hasFixedOutput(name: string): boolean | null {
  const dist = join(PACKAGES_DIR, name, 'dist');
  if (!existsSync(dist)) return null;
  const files = listFiles(dist);
  if (files.length === 0) return null;
  if (files.length !== FIXED_OUTPUT.size) return false;
  return files.every((file) => FIXED_OUTPUT.has(file));
}

/**
 * 「出力が固定 6 file になる」 前提が config から読み取れるかを静的に判定する。
 * 成り立たない理由を返す (空配列 = 成立)。
 *
 * dist を見る判定は build 済のものしか検査できず、 clean clone では 37 件中 16 件が
 * 素通りする。 出力の顔ぶれを決めるのは設定値なので、 build しなくても判定できる。
 *
 * 6 file は `entry` 1 件 × (`format` 2 種 + `dts` 2 種 + `sourcemap` 2 種) の内訳。
 * どれか 1 つでも変われば件数が変わる。
 */
function fixedOutputViolations(name: string): string[] {
  const script = readBuildScript(name);
  // entry / format を CLI 引数で渡す形は config だけでは決まらない。
  if (script !== null && script.trim() !== 'tsup') {
    return [`${name}: build script が素の \`tsup\` でない (${script})`];
  }

  const config = join(PACKAGES_DIR, name, 'tsup.config.ts');
  if (!existsSync(config)) return [`${name}: tsup.config.ts が無い`];
  const source = readFileSync(config, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  const out: string[] = [];
  const entry = source.match(/entry:\s*\[([^\]]*)\]/);
  if (entry === null) out.push(`${name}: entry を読めない`);
  else {
    const count = entry[1]!.split(',').filter((part) => part.trim() !== '').length;
    if (count !== 1) out.push(`${name}: entry が ${count} 件 (1 件でないと出力が増える)`);
  }

  const format = source.match(/format:\s*\[([^\]]*)\]/);
  if (format === null) out.push(`${name}: format を読めない`);
  else {
    const kinds = [...format[1]!.matchAll(/['"]([a-z]+)['"]/g)].map((m) => m[1]!).sort();
    if (kinds.join(',') !== 'cjs,esm') out.push(`${name}: format が ${kinds.join(',')}`);
  }

  if (!/dts:\s*true/.test(source)) out.push(`${name}: dts が true でない`);
  if (!/sourcemap:\s*true/.test(source)) out.push(`${name}: sourcemap が true でない`);

  out.push(...runtimeDynamicImports(name).map((rel) => `${name}: 実行時の相対 dynamic import (${rel})`));
  return out;
}

/**
 * src 配下の**実行時**の相対 dynamic import を集める。 chunk file を生む。
 *
 * `import('./x.js').Type` の型位置の形は compile 時に消えるので chunk を生まない
 * (37 件中 5 package に計 7 箇所ある)。 `.` + 識別子が続く形を型位置とみなし、
 * `await` 付き / `.then` 等が続く形は実行時として拾う。
 */
function runtimeDynamicImports(name: string): string[] {
  const src = join(PACKAGES_DIR, name, 'src');
  if (!existsSync(src)) return [];
  const out: string[] = [];
  for (const rel of listFiles(src)) {
    if (!rel.endsWith('.ts') && !rel.endsWith('.tsx')) continue;
    const text = readFileSync(join(src, rel), 'utf8');
    const pattern = /(await\s+)?\bimport\(\s*['"](\.[^'"]*)['"]\s*\)(\s*\.\s*(\w+))?/g;
    for (const match of text.matchAll(pattern)) {
      const awaited = match[1] !== undefined;
      const suffix = match[4];
      const isTypePosition = !awaited && suffix !== undefined
        && !['then', 'catch', 'finally'].includes(suffix);
      if (!isTypePosition) out.push(rel);
    }
  }
  return out;
}

/** 他 package の `test` / `pretest` から build される package 名。 */
function collectSharedBuildTargets(): Set<string> {
  const targets = new Set<string>();
  for (const root of ['packages', 'examples', 'tests']) {
    const dir = join(REPO_ROOT, root);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      const manifest = join(dir, entry, 'package.json');
      if (!existsSync(manifest)) continue;
      const scripts = (JSON.parse(readFileSync(manifest, 'utf8')) as {
        scripts?: Record<string, string>;
      }).scripts;
      if (scripts === undefined) continue;
      for (const key of ['pretest', 'test']) {
        const script = scripts[key];
        if (script === undefined) continue;
        // pnpm は `-F <pkg>` / `--filter <pkg>` / `--filter=<pkg>` を受ける。
        // 区切りを空白 1 つに決め打つと、 `=` 形式や空白 2 つの記述を取り落とす。
        for (const match of script.matchAll(/(?:-F|--filter)[=\s]+@kiwa-lab\/([a-z0-9-]+)/g)) {
          targets.add(match[1]!);
        }
      }
    }
  }
  return targets;
}

describe('tsup clean と並列 test の race (#1741)', () => {
  it('固定出力の共有依存は全件 clean が無効', () => {
    // 一覧の全件を必ず検査する。 dist の有無で skip しない。
    const offenders = FIXED_OUTPUT_TARGETS.filter((name) => cleanState(name) !== 'disabled');
    expect(
      offenders,
      'clean が有効だと build 中に dist が空になり、並列実行中の別 package が型定義を' +
        ` 解決できない (#1741)。 該当: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('chunk を出す共有依存は全件 clean が有効', () => {
    // 除外側も全件見る。 `some` にすると 1 件 clean があれば残りが無検査になる。
    const missing = CLEAN_REQUIRED_TARGETS.filter((name) => cleanState(name) !== 'enabled');
    expect(
      missing,
      `chunk を出す package で clean を外すと古い chunk が残る。 該当: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('固定出力の前提が全件で設定から成り立つ (build 不要)', () => {
    // build 済かどうかに依らず全 37 件を検査する。 出力の顔ぶれを決めるのは設定値
    // なので、 clean clone でも一覧が古くなったことを検知できる。
    const violations = FIXED_OUTPUT_TARGETS.flatMap((name) => fixedOutputViolations(name));
    expect(
      violations,
      '出力が固定 6 file でなくなると、 clean を外したままでは古い生成物が残る。' +
        ` CLEAN_REQUIRED_TARGETS へ移して clean を戻す: ${violations.join(' / ')}`,
    ).toEqual([]);
  });

  it('除外側は固定出力の前提を満たさない', () => {
    // `cli` / `dapp` を惰性で除外し続けないための逆向きの検査。 前提を満たすように
    // なったら固定側へ移して clean を外せる。
    const nowFixed = CLEAN_REQUIRED_TARGETS.filter((name) => fixedOutputViolations(name).length === 0);
    expect(
      nowFixed,
      `固定出力になったので FIXED_OUTPUT_TARGETS へ移して clean を外せる: ${nowFixed.join(', ')}`,
    ).toEqual([]);
  });

  it('一覧が実際の出力と一致する (build 済のものだけ照合)', () => {
    // 静的検査を実測で裏打ちする。 設定からの導出が誤っていれば、 build 済のものが
    // 6 file 完全一致にならない形で表に出る。
    const wrongSide: string[] = [];
    for (const name of FIXED_OUTPUT_TARGETS) {
      if (hasFixedOutput(name) === false) wrongSide.push(`${name} は固定 6 file でない`);
    }
    for (const name of CLEAN_REQUIRED_TARGETS) {
      if (hasFixedOutput(name) === true) wrongSide.push(`${name} は固定出力になっている`);
    }
    expect(wrongSide).toEqual([]);
  });

  it('共有 build 対象が一覧から漏れていない', () => {
    // 新しい共有依存が増えた時に、 どちらの一覧にも入らないまま無検査になるのを防ぐ。
    const known = new Set<string>([...FIXED_OUTPUT_TARGETS, ...CLEAN_REQUIRED_TARGETS]);
    const unclassified = [...collectSharedBuildTargets()]
      .filter((name) => existsSync(join(PACKAGES_DIR, name)))
      .filter((name) => !known.has(name))
      .sort();
    expect(
      unclassified,
      `他 package の test から build されるのに分類されていない。 該当: ${unclassified.join(', ')}`,
    ).toEqual([]);
  });
});
