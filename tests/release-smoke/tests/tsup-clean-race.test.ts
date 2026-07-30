import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

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
 * 2. **chunk を出さない** — 内容から名前が決まる chunk が出ると、 名前が変わるたびに
 *    古い file が残る。 条件 1 と同じく出力の顔ぶれで判る (chunk が出れば 6 file に
 *    収まらない)。 設定側の `splitting: false` はそもそも chunk を作らせないための
 *    もので、 検査はその結果を見る
 * 3. **`dist/` に書くのが tsup だけ** (`tsconfig.json` の `noEmit`) — `tsc -p` が
 *    同じ `dist/` に emit すると、 clean が無い分そのまま残って npm tarball に載る
 *    (`files: ["dist"]`)。 実測では `tsc -p` 1 回で 6 file が 72 file になった
 * 4. **build が失敗した時に宣言を残さない** — tsup は js を先に、 宣言を後に書く。
 *    clean があった時は build 冒頭で宣言が消えるので、 宣言の生成だけ落ちた build は
 *    consumer 側で `TS7016` として現れた。 clean を外すと古い宣言が残り、 新しい js と
 *    食い違ったまま型検査が通る。 そのため build script が失敗時に宣言を消す
 *
 * ## 条件 1 と 2 は tsup に聞く
 *
 * この検査は当初 `tsup.config.ts` を正規表現で読み、 次に評価して解決値を見ていた。
 * どちらも round を重ねるたびに抜け道が出続けた。
 *
 * - 正規表現 = `clean: true` の字面 / 配列指定 / spread / `defineConfig([...])` /
 *   変数経由の export / shorthand
 * - 評価 = 独立 context に並べ忘れた global (`setTimeout` / `TextEncoder`) /
 *   `outExtension` に渡す文脈の不足 / tsup が正規化で足す既定値 (`outDir: 'dist'`) /
 *   設定が外部の状態を読む形
 *
 * いずれも「検査が tsup の解決を作り直している」 ことが根で、 作り直しである限り
 * どこかで食い違う (`rules/quality.md` § shortcut pattern の 5 回目 = 契約変更)。
 *
 * 作り直すのをやめ、 **package 自身の build script をそのまま走らせて結果を見る**。
 * `dist/` に目印を置いて build し、 目印が残るか (clean 無効) 消えるか (clean 有効) と、
 * 出力 file の顔ぶれを見る。 設定をどう書いても、 tsup が実際にする事だけが結果に出る。
 *
 * 出力先を一時 dir に振る形も試したが採らない。 `--out-dir` で上書きすると設定が
 * `options.outDir` を見て分岐する時に実 build と違う結果が出て、 隔離のつもりで
 * 測る対象そのものを変えてしまう (実測 = 実 build が `index.mjs`、 probe が `index.js`)。
 *
 * 本物の `dist/` を触るため、 この file は `package.json` の `test` で単独の vitest
 * 実行に分けてある。 並列に走る他の test と重ならない。
 *
 * 条件 3 と 4 は build を走らせずに決まるので、 設定と script をそのまま見る。
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
 * 後半は条件 4 (失敗時に宣言を残さない)。 `||` は sh と cmd.exe の双方が解釈するが、
 * 中括弧 / `rm` / `exit` は sh にしか無い。 削除は Node に寄せて shell に依らない形にする。
 */
const EXPECTED_BUILD =
  'tsup || node -e "const{rmSync}=require(\'node:fs\');'
  + "for(const f of ['dist/index.d.ts','dist/index.d.cts'])rmSync(f,{force:true});"
  + 'process.exit(1)"';

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
 * 一時出力先に置く目印。 dotfile にしない。
 *
 * tsup の clean は glob で消すため、 先頭が `.` の file は消し漏れる。 dotfile を
 * 目印にすると clean が有効でも「残った」 と読めてしまう (実測 = `dapp` で確認)。
 *
 * 設定が外部の状態を見て `clean` を切り替える形は、 その時の実挙動しか判らない。
 * 実 build も同じように振れるので、 どの検査でも決められない。
 */
const PROBE = 'clean-probe.txt';

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
  // release-smoke 自身の事前 build が並列に走らせるため、 同じ race 源になる。
  'perf-harness', 'skill-test',
] as const;

/**
 * 出力が固定でない package。 clean を外すと古い chunk が残るため clean が要る。
 * `cli` は追加 entry (`bin.ts`) と chunk、 `dapp` は追加 entry (`vitest`) と chunk。
 */
const CLEAN_REQUIRED_TARGETS = ['cli', 'dapp'] as const;

/** tsup を 1 回走らせた結果。 */
interface BuildProbe {
  /** 目印が残ったか。 残る = clean が無効。 */
  probeSurvived: boolean;
  /** 出力した実 file (目印を除く)。 */
  files: string[];
  /** build が落ちた場合の理由。 */
  error: string | null;
}

const probes = new Map<string, BuildProbe>();

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

function readBuildScript(name: string): string | null {
  const manifest = join(PACKAGES_DIR, name, 'package.json');
  if (!existsSync(manifest)) return null;
  const scripts = (JSON.parse(readFileSync(manifest, 'utf8')) as {
    scripts?: Record<string, string>;
  }).scripts;
  return scripts?.build ?? null;
}

/**
 * package 自身の build script をそのまま走らせて結果を見る。
 *
 * 出力先を一時 dir に振る形は採らない。 `--out-dir` で上書きすると、 設定が
 * `options.outDir` を見て分岐する時に実 build と違う結果が出る (実測 = 実 build が
 * `index.mjs`、 上書きした probe が `index.js`)。 隔離のつもりで測る対象そのものを
 * 変えてしまう。 build script の引数を取り出す必要も無くなる (引用符の中の `||` で
 * 壊れる形があった)。
 *
 * 本物の `dist/` を空にしてから目印を置いて build し、 残るか消えるかを見る。 空に
 * するのは、 前の build の残りを「この実行の出力」 と読まないため。 build は冪等なので
 * 走らせた後の `dist/` は通常の状態に戻る。 他の test と重ならないよう、 この file は
 * `package.json` の `test` で単独の vitest 実行に分けてある。
 */
function probeBuild(name: string): BuildProbe {
  const dist = join(PACKAGES_DIR, name, 'dist');
  // 前の build の残りを消してから測る。 残したまま測ると、 出力先を `dist` 以外に
  // 変えた設定や、 filter が 1 件も一致せず何も build しなかった実行でも、 前回の
  // 6 file がそのまま「正しい出力」 として読めてしまう (どちらも実測ですり抜けた)。
  // 空にしてから build すれば、 見えるのはこの実行が書いたものだけになる。
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  writeFileSync(join(dist, PROBE), 'probe', 'utf8');
  try {
    execFileSync('pnpm', ['--filter', `@kiwa-lab/${name}`, 'build'], {
      cwd: REPO_ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return {
      probeSurvived: existsSync(join(dist, PROBE)),
      files: listFiles(dist).filter((file) => file !== PROBE).sort(),
      error: null,
    };
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? '';
    return { probeSurvived: false, files: [], error: `${(error as Error).message}\n${stderr}` };
  } finally {
    rmSync(join(dist, PROBE), { force: true });
  }
}

/**
 * `dist/` に書くのが tsup だけかを確かめる (条件 3)。
 *
 * 判定は TypeScript に解決させる。 生の JSON を読むと `extends` を辿らないため、
 * base 側で `noEmit` を立てた設定を誤って違反にし、 逆に base 側で `outDir` を
 * 与える設定を見落とす。 `outDir` は解決後の絶対 path になるので、 文字列比較では
 * なく package の `dist/` と同じ場所を指すかで見る。
 */
function emitViolations(name: string): string[] {
  const dir = join(PACKAGES_DIR, name);
  const tsconfig = join(dir, 'tsconfig.json');
  if (!existsSync(tsconfig)) return [`${name}: tsconfig.json が無い`];

  const read = ts.readConfigFile(tsconfig, (path) => readFileSync(path, 'utf8'));
  if (read.error !== undefined) {
    return [`${name}: tsconfig.json を読めない (${ts.flattenDiagnosticMessageText(read.error.messageText, ' ')})`];
  }
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, dir);
  const { outDir, noEmit } = parsed.options;
  if (outDir === undefined) return [];
  if (resolve(outDir) !== resolve(dir, 'dist')) return [];
  return noEmit === true ? [] : [`${name}: tsconfig.json が dist へ emit する (noEmit が要る)`];
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
  beforeAll(() => {
    for (const name of [...FIXED_OUTPUT_TARGETS, ...CLEAN_REQUIRED_TARGETS]) {
      probes.set(name, probeBuild(name));
    }
  }, 900_000);

  it('build が全件通る', () => {
    // 落ちた build の結果は clean の有無を語らない。 先に落ちたことを出す。
    const failed = [...probes.entries()]
      .filter(([, probe]) => probe.error !== null)
      .map(([name, probe]) => `${name}: ${probe.error}`);
    expect(failed).toEqual([]);
  });

  it('固定出力の共有依存は全件 clean が無効', () => {
    // 一覧の全件を必ず検査する。 dist の有無で skip しない。
    const offenders = FIXED_OUTPUT_TARGETS.filter(
      (name) => probes.get(name)?.probeSurvived !== true,
    );
    expect(
      offenders,
      'clean が有効だと build 中に dist が空になり、並列実行中の別 package が型定義を' +
        ` 解決できない (#1741)。 該当: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('chunk を出す共有依存は全件 clean が有効', () => {
    // 除外側も全件見る。 `some` にすると 1 件 clean があれば残りが無検査になる。
    const missing = CLEAN_REQUIRED_TARGETS.filter(
      (name) => probes.get(name)?.probeSurvived !== false,
    );
    expect(
      missing,
      `chunk を出す package で clean を外すと古い chunk が残る。 該当: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('固定出力の共有依存は全件が同じ 6 file を出す', () => {
    // 集合の一致で見る。 「余分が無い」 だけだと 6 件のうち 1 件が欠けても通る。
    const wrongSide = FIXED_OUTPUT_TARGETS
      .filter((name) => probes.get(name)?.files.join(',') !== FIXED_OUTPUT.join(','))
      .map((name) => `${name} (${probes.get(name)?.files.join(', ')})`);
    expect(
      wrongSide,
      '出力の顔ぶれが変わると、 clean を外したままでは古い生成物が残る。' +
        ` CLEAN_REQUIRED_TARGETS へ移して clean を戻す: ${wrongSide.join(' / ')}`,
    ).toEqual([]);
  });

  it('除外側は固定 6 file を出さない', () => {
    // `cli` / `dapp` を惰性で除外し続けないための逆向きの検査。 固定になったら
    // 固定側へ移して clean を外せる。
    const nowFixed = CLEAN_REQUIRED_TARGETS.filter(
      (name) => probes.get(name)?.files.join(',') === FIXED_OUTPUT.join(','),
    );
    expect(
      nowFixed,
      `固定出力になったので FIXED_OUTPUT_TARGETS へ移して clean を外せる: ${nowFixed.join(', ')}`,
    ).toEqual([]);
  });

  it('dist に書くのが tsup だけ', () => {
    const violations = FIXED_OUTPUT_TARGETS.flatMap((name) => emitViolations(name));
    expect(violations).toEqual([]);
  });

  it('build が失敗した時に宣言を残さない', () => {
    const offenders = FIXED_OUTPUT_TARGETS
      .filter((name) => readBuildScript(name) !== EXPECTED_BUILD)
      .map((name) => `${name}: ${readBuildScript(name) ?? '未定義'}`);
    expect(
      offenders,
      'tsup は js を先に、 宣言を後に書く。 失敗時に宣言を消さないと、 新しい js と' +
        ` 古い宣言が同居したまま型検査が通る。 該当: ${offenders.join(' / ')}`,
    ).toEqual([]);
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
