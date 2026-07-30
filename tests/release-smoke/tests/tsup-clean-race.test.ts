import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
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
 * ## clean を外せる条件
 *
 * clean は「古い生成物を消す」 ためにある。 外してよいのは、 それが不要である
 * ことを別の形で保証できる package に限る。 4 条件すべてが要る。
 *
 * 1. **出力する file 名の集合が固定** — entry 1 つ / format 2 種 / dts / sourcemap で
 *    6 file に決まる。 毎回すべて上書きされるので古い生成物が残らない
 * 2. **chunk を出さない** (`splitting: false`) — 内容から名前が決まる chunk が出ると、
 *    名前が変わるたびに古い file が残る
 * 3. **`dist/` に書くのが tsup だけ** (`tsconfig.json` の `noEmit`) — `tsc -p` が
 *    同じ `dist/` に emit すると、 clean が無い分そのまま残って npm tarball に載る
 *    (`files: ["dist"]`)。 実測では `tsc -p` 1 回で 6 file が 72 file になった
 * 4. **build が失敗した時に宣言を残さない** — tsup は js を先に、 宣言を後に書く。
 *    clean があった時は build 冒頭で宣言が消えるので、 宣言の生成だけ落ちた build は
 *    consumer 側で `TS7016` として現れた。 clean を外すと古い宣言が残り、 新しい js と
 *    食い違ったまま型検査が通る。 そのため build script が失敗時に宣言を消す
 *
 * ## 設定を文字列として読まない
 *
 * この検査は当初 `tsup.config.ts` を正規表現で読んでいた。 `clean: true` の字面、
 * 配列指定、 spread、 `defineConfig([...])`、 変数経由の export、 shorthand と、
 * 見落とす書き方が出るたびに分岐を足す形になり、 3 round かけても塞ぎ切れなかった
 * (`rules/quality.md` § 責務境界 と同じ、 静的 parser の非収束)。
 *
 * TypeScript を TypeScript で読むのをやめ、 tsup と同じように **設定を評価して
 * 解決値を見る**。 `defineConfig` は受け取った値を返すだけなので、 それを差し替えて
 * 実行すれば tsup が見るのと同じ object が得られる。 どの書き方でも同じ結果になる。
 */

// compile 後は `.vitest-dist/tests/` から走るため 4 階層上が repo root
// (`.vitest-dist/tests` → `.vitest-dist` → `release-smoke` → `tests` → root)。
//
// `import.meta.dirname` は Node 20.11.0 追加で、 repo の下限 (>=20) を下回る
// 20.0-20.10 では undefined になり module 読込時に落ちる。 既存 24 件と同じ形にする。
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

/**
 * 固定出力の package の `build`。 完全一致を要求する。
 *
 * `tsup` に引数を足す形 (`--clean` / `--config` / entry 追加) はすべて設定 file の
 * 解決値と食い違うため、 一致で縛って設定側だけを見れば済むようにする。
 * 後半は上の条件 4 (失敗時に宣言を残さない)。
 */
const EXPECTED_BUILD = 'tsup || { rm -f dist/index.d.ts dist/index.d.cts; exit 1; }';

/** tsup が単一 entry で出す実 file の集合。 */
const FIXED_OUTPUT = [
  'index.cjs',
  'index.cjs.map',
  'index.d.cts',
  'index.d.ts',
  'index.js',
  'index.js.map',
].sort();

/**
 * 他 package の `test` / `pretest` から build され、 かつ出力が固定 6 file の package。
 * この一覧の全件が上の 4 条件を満たさなければならない。
 *
 * 一覧で持つのは、 `dist/` の中身から判定すると未 build の package が「判定不能」 で
 * 素通りするため。 release-smoke を clean clone で走らせると build 済なのは 21 件だけで、
 * 残り 16 件に `clean` が戻っても検知できない。
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

/** tsup の設定 1 件のうち、 出力の顔ぶれを決める値だけ。 */
interface TsupOptions {
  entry?: unknown;
  format?: unknown;
  dts?: unknown;
  sourcemap?: unknown;
  clean?: unknown;
  splitting?: unknown;
  outExtension?: (context: { format: string }) => { js?: string };
}

/**
 * `tsup.config.ts` を tsup と同じように評価して解決値を返す。
 *
 * TypeScript を CommonJS に変換して評価する。 `defineConfig` は受け取った値を
 * そのまま返す関数なので、 差し替えても解決値は変わらない。 設定が関数を default
 * export する形なら呼び、 配列なら全件を返す。
 *
 * `tsup` 以外を読み込む設定は解釈できないので投げる。 検査を素通りさせない。
 */
function resolveTsupOptions(name: string): TsupOptions[] | null {
  const file = join(PACKAGES_DIR, name, 'tsup.config.ts');
  if (!existsSync(file)) return null;
  const js = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const container = { exports: {} as Record<string, unknown> };
  vm.runInNewContext(js, {
    module: container,
    exports: container.exports,
    require: (id: string) => {
      if (id === 'tsup') return { defineConfig: (value: unknown) => value };
      throw new Error(`tsup.config.ts が ${id} を読み込んでいる。解決値を確かめられない`);
    },
  });

  const exported = container.exports['default'];
  const resolved = typeof exported === 'function'
    ? (exported as (overrides: unknown) => unknown)({})
    : exported;
  return (Array.isArray(resolved) ? resolved : [resolved]) as TsupOptions[];
}

function readBuildScript(name: string): string | null {
  const manifest = join(PACKAGES_DIR, name, 'package.json');
  if (!existsSync(manifest)) return null;
  const scripts = (JSON.parse(readFileSync(manifest, 'utf8')) as {
    scripts?: Record<string, string>;
  }).scripts;
  return scripts?.build ?? null;
}

/** `clean` が有効になり得るか。 判定できない形は有効側に倒す。 */
function cleanEnabled(name: string): boolean {
  const script = readBuildScript(name);
  if (script !== null && /(^|\s)--clean(\s|$|=)/.test(script)) return true;
  let options: TsupOptions[] | null;
  try {
    options = resolveTsupOptions(name);
  } catch {
    // 解決できない設定は clean を持ち得る。
    return true;
  }
  // 設定 file が無ければ build script だけで決まる。
  if (options === null) return false;
  // `true` / 配列 / 式 のいずれも clean が走り得る。 `false` と未指定だけが無効。
  return options.some((option) => option.clean !== undefined && option.clean !== false);
}

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
 * 設定の解決値から出力 file 名を組み立てる。 tsup を走らせずに求まる。
 *
 * `outExtension` は呼んで実際の拡張子を得る。 字面で読むと `.js` を `.mjs` に
 * 変えるだけの変更を見落とし、 名前が変わって古い file が残る状態を通す。
 * 指定が無い場合の既定は `package.json` の `type` で決まる (module なら
 * esm が `.js` / cjs が `.cjs`、 それ以外は esm が `.mjs` / cjs が `.js`)。
 */
function expectedOutputs(name: string, option: TsupOptions): string[] {
  const entry = option.entry as string[];
  const stem = entry[0]!.replace(/^.*\//, '').replace(/\.[cm]?tsx?$/, '');
  const isModule = (JSON.parse(
    readFileSync(join(PACKAGES_DIR, name, 'package.json'), 'utf8'),
  ) as { type?: string }).type === 'module';

  const out: string[] = [];
  for (const format of option.format as string[]) {
    const fallback = format === 'cjs' ? (isModule ? '.cjs' : '.js') : isModule ? '.js' : '.mjs';
    const js = option.outExtension?.({ format })?.js ?? fallback;
    out.push(`${stem}${js}`);
    if (option.sourcemap === true) out.push(`${stem}${js}.map`);
    // 宣言の拡張子は js 側に揃う (`.cjs` なら `.d.cts`、 `.mjs` なら `.d.mts`)。
    if (option.dts === true) out.push(`${stem}.d${js.replace(/^\.(\w)?js$/, '.$1ts')}`);
  }
  return [...new Set(out)].sort();
}

/**
 * 固定出力の 4 条件を確かめる。 成り立たない理由を返す (空配列 = 成立)。
 * build 済かどうかに依らないので、 clean clone でも全件を検査できる。
 */
function fixedOutputViolations(name: string): string[] {
  const out: string[] = [];
  const script = readBuildScript(name);
  if (script !== EXPECTED_BUILD) {
    out.push(`${name}: build script が想定と違う (${script ?? '未定義'})`);
  }

  let options: TsupOptions[] | null;
  try {
    options = resolveTsupOptions(name);
  } catch (error) {
    return [...out, `${name}: 設定を解決できない (${(error as Error).message})`];
  }
  if (options === null) return [...out, `${name}: tsup.config.ts が無い`];
  if (options.length !== 1) {
    return [...out, `${name}: 設定が ${options.length} 件 (1 件でないと出力が増える)`];
  }

  const option = options[0]!;
  if (option.clean !== undefined && option.clean !== false) {
    out.push(`${name}: clean が無効でない (${String(option.clean)})`);
  }
  if (option.splitting !== false) {
    out.push(`${name}: splitting が false でない (chunk が出ると古い file が残る)`);
  }
  const entry = option.entry;
  const entryOk = Array.isArray(entry) && entry.length === 1 && typeof entry[0] === 'string';
  if (!entryOk) out.push(`${name}: entry が単一の file 名でない (${JSON.stringify(entry)})`);
  const format = option.format;
  const formatOk = Array.isArray(format) && [...format].sort().join(',') === 'cjs,esm';
  if (!formatOk) out.push(`${name}: format が esm + cjs でない (${JSON.stringify(format)})`);
  if (option.dts !== true) out.push(`${name}: dts が true でない`);
  if (option.sourcemap !== true) out.push(`${name}: sourcemap が true でない`);

  // 出力名を組み立てられるのは entry と format が揃っている時だけ。
  if (entryOk && formatOk) {
    const expected = expectedOutputs(name, option);
    if (expected.join(',') !== FIXED_OUTPUT.join(',')) {
      out.push(`${name}: 出力名が固定の 6 file と違う (${expected.join(', ')})`);
    }
  }

  // `dist/` に書くのが tsup だけであること。 `tsc -p` が同じ場所に emit すると、
  // clean が無い分そのまま残る (実測 = 1 回で 6 file が 72 file になった)。
  const tsconfig = join(PACKAGES_DIR, name, 'tsconfig.json');
  if (!existsSync(tsconfig)) out.push(`${name}: tsconfig.json が無い`);
  else {
    const compilerOptions = (JSON.parse(readFileSync(tsconfig, 'utf8')) as {
      compilerOptions?: { outDir?: string; noEmit?: boolean };
    }).compilerOptions ?? {};
    if (compilerOptions.outDir === 'dist' && compilerOptions.noEmit !== true) {
      out.push(`${name}: tsconfig.json が dist へ emit する (noEmit が要る)`);
    }
  }
  return out;
}

/**
 * dist の実 file が固定 6 件と**完全一致**するか。 未 build は判定不能で null。
 *
 * 集合の一致で見る。 「余分が無い」 だけだと 6 件のうち 1 件が欠けても通る。
 */
function hasFixedOutput(name: string): boolean | null {
  const dist = join(PACKAGES_DIR, name, 'dist');
  if (!existsSync(dist)) return null;
  const files = listFiles(dist).sort();
  if (files.length === 0) return null;
  return files.join(',') === FIXED_OUTPUT.join(',');
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
    const offenders = FIXED_OUTPUT_TARGETS.filter((name) => cleanEnabled(name));
    expect(
      offenders,
      'clean が有効だと build 中に dist が空になり、並列実行中の別 package が型定義を' +
        ` 解決できない (#1741)。 該当: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('chunk を出す共有依存は全件 clean が有効', () => {
    // 除外側も全件見る。 `some` にすると 1 件 clean があれば残りが無検査になる。
    const missing = CLEAN_REQUIRED_TARGETS.filter((name) => !cleanEnabled(name));
    expect(
      missing,
      `chunk を出す package で clean を外すと古い chunk が残る。 該当: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('clean を外せる 4 条件が全件で成り立つ (build 不要)', () => {
    const violations = FIXED_OUTPUT_TARGETS.flatMap((name) => fixedOutputViolations(name));
    expect(
      violations,
      '条件が崩れると clean を外したままでは古い生成物が残る。' +
        ` CLEAN_REQUIRED_TARGETS へ移して clean を戻す: ${violations.join(' / ')}`,
    ).toEqual([]);
  });

  it('除外側は固定出力の条件を満たさない', () => {
    // `cli` / `dapp` を惰性で除外し続けないための逆向きの検査。 条件を満たすように
    // なったら固定側へ移して clean を外せる。
    const nowFixed = CLEAN_REQUIRED_TARGETS.filter(
      (name) => fixedOutputViolations(name).length === 0,
    );
    expect(
      nowFixed,
      `固定出力になったので FIXED_OUTPUT_TARGETS へ移して clean を外せる: ${nowFixed.join(', ')}`,
    ).toEqual([]);
  });

  it('設定から求めた出力名が実際の出力と一致する (build 済のものだけ照合)', () => {
    // 設定からの導出が誤っていれば、 build 済のものが 6 file 完全一致にならない
    // 形で表に出る。
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
