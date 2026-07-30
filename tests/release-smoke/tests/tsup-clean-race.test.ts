import { execFileSync } from 'node:child_process';
import {
  existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync,
  writeFileSync,
} from 'node:fs';
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
  /** この実行より前の更新時刻を持つ file。 空でなければ今回の build が書いていない。 */
  stale: string[];
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
 * 本物の `dist/` に目印を 1 つ足して build し、 残るか消えるかを見る。 既にある
 * file には触らない。 空にすると、 この検査が防ごうとしている race を検査自身が
 * 作ってしまう (`pnpm -r test` は 169 package を並列に走らせる)。 前の build の
 * 残りを「この実行の出力」 と読まないための判定は、 出力 file の更新時刻で行う。 他の test と重ならないよう、 この file は
 * `package.json` の `test` で単独の vitest 実行に分けてある。
 */
function probeBuild(name: string): BuildProbe {
  const dist = join(PACKAGES_DIR, name, 'dist');
  const probe = join(dist, PROBE);
  mkdirSync(dist, { recursive: true });

  // 目印を 1 つ足すだけで、 既にある file には触らない。
  //
  // 以前は「この実行の出力だけを見る」 ために `dist/` を空にしていた。 だがこの
  // 検査が防ごうとしている race を、 検査自身が作ってしまう。 `pnpm -r test` は
  // 169 package を並列に走らせるので、 空にしている間に別 package の `tsc` が
  // 型定義を読みに来る。 release-smoke の中で実行を分けても、 外の 168 package
  // からは見えない。
  //
  // 代わりに、 出力 file の更新時刻がこの実行より後かどうかで「この実行が書いたか」
  // を見る。 出力先を `dist` 以外に変えた設定も、 filter が 1 件も一致しなかった
  // 実行も、 `dist/` の file は前のままなので更新時刻で判る。
  writeFileSync(probe, 'probe', 'utf8');
  // 目印自身の更新時刻を基準にする。 別に時刻を採ると、 file system の分解能や
  // 時計のずれで前後が入れ替わり得る。
  const startedAt = statSync(probe).mtimeMs;

  let error: string | null = null;
  try {
    // `--fail-if-no-match` が無いと、 名前が 1 件も一致しない filter でも exit 0 に
    // なる。 何も build していない実行を成功として読むことになる。
    execFileSync('pnpm', ['--filter', `@kiwa-lab/${name}`, '--fail-if-no-match', 'build'], {
      cwd: REPO_ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (thrown) {
    const stderr = (thrown as { stderr?: string }).stderr ?? '';
    error = `${(thrown as Error).message}\n${stderr}`;
  }

  // 目印を消す前に見る。 消した後では clean が消したのかこちらが消したのか判らない。
  const probeSurvived = existsSync(probe);
  rmSync(probe, { force: true });
  if (error !== null) return { probeSurvived: false, files: [], stale: [], error };

  const files = listFiles(dist).filter((file) => file !== PROBE).sort();
  return {
    probeSurvived,
    files,
    // この実行より前の更新時刻を持つ file。 1 件でもあれば、 その file は今回の
    // build が書いたものではない。
    stale: files.filter((file) => statSync(join(dist, file)).mtimeMs < startedAt),
    error: null,
  };
}

/**
 * `dist/` に書くのが tsup だけかを確かめる (条件 3)。
 *
 * 判定は TypeScript に解決させる。 生の JSON を読むと `extends` を辿らないため、
 * base 側で `noEmit` を立てた設定を誤って違反にし、 逆に base 側で `outDir` を
 * 与える設定を見落とす。 `outDir` は解決後の絶対 path を symlink まで解いて、
 * package の `dist/` と同じ場所を指すかで見る (`dist-link -> dist` のような別名で
 * 抜けられないように)。
 *
 * package 内の `tsconfig*.json` を全件見る。 `tsconfig.json` だけだと、 それを
 * 継承して `noEmit` を戻す別 config を足すだけで抜けられる。
 */
function emitViolations(name: string): string[] {
  const dir = join(PACKAGES_DIR, name, 'dist');
  const pkg = join(PACKAGES_DIR, name);
  // 同 dir の `tsconfig*.json` を全件見る。 `tsconfig.json` だけを見ると、
  // それを継承して `noEmit: false` と `outDir: dist` を上書きする別 config を
  // 足すだけで抜けられる。
  const configs = readdirSync(pkg)
    .filter((file) => file.startsWith('tsconfig') && file.endsWith('.json'))
    .sort();
  if (configs.length === 0) return [`${name}: tsconfig.json が無い`];

  const out: string[] = [];
  for (const config of configs) {
    const path = join(pkg, config);
    const read = ts.readConfigFile(path, (target) => readFileSync(target, 'utf8'));
    if (read.error !== undefined) {
      out.push(`${name}/${config}: 読めない (${ts.flattenDiagnosticMessageText(read.error.messageText, ' ')})`);
      continue;
    }
    const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, pkg);
    const { outDir, noEmit } = parsed.options;
    if (outDir === undefined || noEmit === true) continue;
    // symlink を解いてから比べる。 `dist` を指す別名 (`dist-link -> dist`) を
    // `outDir` にすると、 文字列の比較では別の場所に見える。
    if (physical(outDir) !== physical(dir)) continue;
    out.push(`${name}/${config}: dist へ emit する (noEmit が要る)`);
  }
  return out;
}

/** symlink を解いた path。 解けない (まだ無い) 場合は正規化だけする。 */
function physical(path: string): string {
  try {
    return realpathSync(resolve(path));
  } catch {
    return resolve(path);
  }
}

/**
 * 他 package の script から build される package 名。
 *
 * workspace の全 `package.json` を辿る。 以前は `packages` / `examples` / `tests` の
 * 直下だけを見ていたため、 `tests/fixtures/basic-connect` のような入れ子の
 * workspace member が漏れていた。
 *
 * `test` / `pretest` だけでなく全 script を見る。 `test: "pnpm run build-shared"` の
 * ように別 script を挟むと、 その先の filter が読めないため。
 */
function collectSharedBuildTargets(): Set<string> {
  const targets = new Set<string>();
  for (const manifest of findManifests(REPO_ROOT)) {
    const scripts = (JSON.parse(readFileSync(manifest, 'utf8')) as {
      scripts?: Record<string, string>;
    }).scripts;
    if (scripts === undefined) continue;
    // release 経路は publish 前に 1 度だけ走る単独 step で、 並列の race を作らない。
    // 全 package を列挙するため、 これを数えると分類の一覧が意味を失う。
    for (const [key, script] of Object.entries(scripts)) {
      if (key === 'release' || key === 'prerelease' || key === 'release-check') continue;
      // pnpm は `-F <pkg>` / `--filter <pkg>` / `--filter=<pkg>` を受ける。
      // 区切りを空白 1 つに決め打つと、 `=` 形式や空白 2 つの記述を取り落とす。
      for (const match of script.matchAll(/(?:-F|--filter)[=\s]+@kiwa-lab\/([a-z0-9-]+)/g)) {
        targets.add(match[1]!);
      }
    }
  }
  return targets;
}

/** workspace 内の `package.json` を辿る。 `node_modules` と build 生成物は降りない。 */
function findManifests(root: string, depth = 0): string[] {
  if (depth > 4) return [];
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      if (entry.name === 'package.json' && depth > 0) out.push(join(root, entry.name));
      continue;
    }
    if (['node_modules', 'dist', '.git', '.vitest-dist', 'coverage'].includes(entry.name)) continue;
    if (entry.name.startsWith('.')) continue;
    out.push(...findManifests(join(root, entry.name), depth + 1));
  }
  return out;
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

  it('出力が全件この実行の build で書かれている', () => {
    // 出力先を `dist` 以外に変えた設定や、 filter が 1 件も一致しなかった実行は、
    // `dist/` の file が前のまま残る。 顔ぶれだけを見ると素通りするので、
    // 更新時刻でこの実行が書いたことを確かめる。
    const stale = [...probes.entries()]
      .filter(([, probe]) => probe.error === null && probe.stale.length > 0)
      .map(([name, probe]) => `${name} (${probe.stale.join(', ')})`);
    expect(
      stale,
      `build が別の場所へ書いたか、 何も build していない。 該当: ${stale.join(' / ')}`,
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
