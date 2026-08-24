#!/usr/bin/env node
/**
 * 実行時間の gap report (Issue #2193)。
 *
 * 遅い test を「何をすれば速くなるか」 で分類して返す。
 *
 * ## 判定はしない (Issue #2196)
 *
 * coverage 側は ratchet で「下がったら落とす」 gate を持つが、**こちらは持たない**。
 * wall time の絶対値が判定材料にならないことを実測で確かめた。
 *
 * | 何を測るか | 安定性 |
 * |---|---|
 * | 絶対値 (wall time) | 同じ code で 11.5 / 29.9 / 30.6 / 69.9 秒 = **6 倍** |
 * | CPU 時間 (user + sys) | 平常 5 回で 6.49 - 9.02 秒 = 1.39 倍 |
 * | 静的な呼出箇所数 | cost と相関しない (70 箇所で 6.3 秒 / 数箇所で最遅) |
 * | **順位** | 4 run の順位相関 **0.93 - 0.97**、上位 10 の共通 7 件 |
 *
 * 順位は安定するので「次にどこを直すか」 は返せる。 絶対値は振れるので
 * 「遅くなったか」 は判定できない。 材料の安定性が違うため、片方が使えても
 * もう片方が使えるとは限らない。
 *
 * 実測で回帰と判定された 9 件は全て負荷差で、最小のものは 10ms が 35ms になっただけ
 * だった。 gate を残すと noise が毎回出て報告そのものが読まれなくなる。
 *
 * ## 入力
 *
 * vitest の `--reporter=json` 出力を `--report <path>` で渡す。 本 script は test を
 * 走らせない = 測る役と読む役を分ける。 走らせる形にすると、report を作り直さずに
 * 判定だけしたい時に毎回全 test を回すことになる。
 *
 * ## lever は実測から起こした
 *
 * `tests/release-smoke` の遅い上位 4 file を読むと遅さの出所が違った。
 *
 * | file | 実測 | 出所 |
 * |---|---|---|
 * | `mutation-gate-coverage` | 31.2s / 22 件 | test ごとに子プロセスを起動 (3 箇所) |
 * | `mutation-scope-report` | 30.3s / 65 件 | 同上 + 一時 dir 4 箇所 |
 * | `input-fingerprint` | 17.9s / 63 件 | 子プロセス 13 箇所 + 一時 dir 18 箇所 |
 * | `coverage-denominator` | 12.4s / 3 件 | `ts.createSourceFile` で全 package を parse |
 *
 * 直し方が違うので、遅い順に並べるだけでは足りない。
 */
import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// `fileURLToPath`、`.pathname` ではない。 `file:` URL は percent-encoding を保つため、
// 空白を含む dir 配下の checkout が存在しない path に解決する。
const SCRIPT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const REPO_ROOT = process.env.KIWA_GATE_ROOT
  ? resolve(process.env.KIWA_GATE_ROOT)
  : process.cwd() !== '/' && existsSync(resolve(process.cwd(), 'packages'))
    ? process.cwd()
    : SCRIPT_ROOT;



const AS_JSON = process.argv.includes('--json');
const REPORT = argValue('--report');

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

// **退役した flag は大声で落とす**。 黙って成功すると「baseline を更新した」 と
// 誤解したまま先へ進む (codex review r1-f1)。 exit 0 で通常の report が出るので、
// 更新されていないことに気付く手掛かりが 1 つも無い。
const RETIRED = ['--update-baseline'];
const usedRetired = RETIRED.filter((flag) => process.argv.includes(flag));
if (usedRetired.length > 0) {
  process.stderr.write(
    `${usedRetired.join(' / ')} は廃止された (Issue #2196)。\n` +
      '  duration に baseline は無い。 wall time は同じ code で 6 倍振れるため判定に使えず、\n' +
      '  本 script は遅い順に並べて lever で分類する診断だけを返す。\n' +
      '  flag を外して実行する。\n',
  );
  process.exit(2);
}

if (!REPORT) {
  process.stderr.write(
    'usage: node scripts/duration-gap-report.mjs --report <vitest json> [--json]\n' +
      '  --report は必須。 省略時に空の結果を返すと「遅い test は無い」 と読めるため止める。\n' +
      '  report は `vitest run --reporter=json --outputFile=<path>` で作る。\n',
  );
  process.exit(2);
}

/**
 * lever の定義。
 *
 * 順序が判定順で、**上から先に当たったものを採る**。 実 I/O 起動を子プロセス起動より
 * 先に置くのは、container を起動する test はたいてい子プロセスも使うため = 直すべきは
 * 重い側だから。
 */
const LEVERS = [
  {
    name: 'real-io',
    fix: 'container / anvil / browser を test ごとに立てている。 共有 fixture へ寄せる',
    // **module 指定子で見る**。 生の文字列一致にすると comment 内の言及で誤判定する
    // (実測で `mutation-gate-coverage.test.ts` が playwright を 1 度も使わずに
    // real-io に分類された。 出現箇所は説明の comment 2 行だけだった)。
    modules: /^(testcontainers|playwright|playwright-core|@playwright\/test|@viem\/anvil)$/,
    calls: /\bGenericContainer\b|\bcreateAnvil\b|\bchromium\.launch\b/,
  },
  {
    name: 'subprocess',
    fix: 'test ごとに子プロセスを起動している。 1 回に畳むか module を in-process で import する',
    modules: /^node:child_process$|^child_process$/,
    calls: /\b(spawnSync|execFileSync|execSync)\b|\bexecFile\(/,
  },
  {
    name: 'compile',
    fix: 'TypeScript を parse している。 1 度だけ parse して結果を共有する',
    modules: /^typescript$/,
    calls: /\b(createSourceFile|createProgram|transpileModule)\b/,
  },
  {
    name: 'wall-clock',
    fix: '実時間を待っている。 fake timer に置き換える',
    // fake timer を使っていれば対象外。 呼出の出現だけで判定すると、既に直した file を
    // 毎回「直せ」 と勧めることになる。
    modules: null,
    calls: /\b(setTimeout|setInterval|sleep|delay)\(/,
    unless: /\buseFakeTimers\b/,
  },
  {
    name: 'filesystem',
    fix: '一時 dir を test ごとに作っている。 1 つを共有して中身だけ差し替える',
    modules: null,
    calls: /\b(mkdtempSync|mkdirSync|writeFileSync|readdirSync)\b/,
  },
];

/**
 * comment を落とす。
 *
 * lever は「その file が実際に何を使うか」 で決まる。 comment 内の言及で分類すると、
 * 使っていない lever の直し方を勧めることになる。
 *
 * 文字列 literal 内の `//` は落とさない = 完全な parse はしない。 module 指定子と
 * 呼出名の判定に使うだけなので、誤って落ちた行があっても分類は他の手掛かりに寄る。
 */
function codeOnly(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/**
 * import / require の module 指定子のうち、**値として取り込むもの** を集める。
 *
 * type-only import は落とす。 型だけの import は browser も container も起動しないため、
 * module 名の一致だけで `real-io` に倒すと本当の原因を隠して誤った直し方を勧める
 * (この repo の TS file は `import type { Page } from '@playwright/test'` を書く)。
 *
 * 落とす形は 2 つ。
 *
 * | 形 | 例 |
 * |---|---|
 * | 文全体が type-only | `import type { Page } from '@playwright/test'` |
 * | 名前が全て `type` 付き | `import { type Page } from '@playwright/test'` |
 *
 * 混在 (`import { type Page, chromium } from ...`) は値の取り込みがあるので残す。
 */
function moduleSpecifiers(code) {
  const found = new Set();

  // `import ... from '<mod>'` を句ごとに見る。 句の中身で type-only かを判定する。
  for (const m of code.matchAll(/\bimport\b([\s\S]*?)\bfrom\s*['"]([^'"]+)['"]/g)) {
    const clause = m[1];
    const mod = m[2];
    if (/^\s*type\b/.test(clause)) continue;
    const braces = /\{([\s\S]*?)\}/.exec(clause);
    if (braces) {
      const names = braces[1]
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
      const hasValue = names.some((n) => !/^type\s/.test(n));
      const outsideBraces = clause.replace(/\{[\s\S]*?\}/, '').replace(/[,\s]/g, '');
      if (!hasValue && outsideBraces === '') continue;
    }
    found.add(mod);
  }

  // 副作用 import と動的 import と require。 いずれも値を取り込む形しかない。
  for (const re of [
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
  ]) {
    for (const m of code.matchAll(re)) found.add(m[1]);
  }
  return found;
}

/**
 * 分類できなかった file の lever。
 *
 * **`unknown` にしない**。 「分類できなかった」 を「直し方が無い」 と読ませないため、
 * 対処のある lever と対処を決めていない file を名前で区別する。
 */
const FALLBACK = { name: 'inherent', fix: '出所が読み取れない。 実測して budget に計上するか、個別に調べる' };

function classify(absPath) {
  let src = '';
  try {
    src = readFileSync(absPath, 'utf8');
  } catch {
    // 読めない = compile 後の file が消えている等。 分類の材料が無いので fallback。
    return FALLBACK;
  }
  const code = codeOnly(src);
  const mods = moduleSpecifiers(code);
  const found = LEVERS.find((l) => {
    if (l.unless && l.unless.test(code)) return false;
    if (l.modules && [...mods].some((m) => l.modules.test(m))) return true;
    return l.calls.test(code);
  });
  return found ?? FALLBACK;
}

/**
 * compile 後の path を source に戻す。
 *
 * 素の `npx vitest run` は `tests/*.ts` と `.vitest-dist/tests/*.js` の**両方**を拾う
 * (実測で 155 file のうち 76 file が compile 後だった)。 そのまま数えると同じ test を
 * 2 回計上し、合計が倍に見える。
 */
/**
 * compile 後の拡張子と、その元になりうる source 拡張子。
 *
 * **`.js` → `.ts` の 1 対 1 に決め打たない** (codex review r4-f1)。 `packages/ui` は
 * `jsx: "react-jsx"` で `.test.tsx` を持ち、その compile 後は `.js` になる。
 * 一律 `.ts` に戻すと存在しない path を baseline に書き、次の run で「別 file」 として
 * 扱われて ratchet が効かなくなる。
 */
const SOURCE_EXTENSIONS = {
  '.js': ['.ts', '.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts'],
};

function toSource(absPath) {
  const rel = relative(REPO_ROOT, absPath).split('\\').join('/');
  const stripped = rel.replace('/.vitest-dist/', '/').replace(/^\.vitest-dist\//, '');

  // `.vitest-dist` を通っていない path はそのまま。 全ての `.js` を書き換えると、
  // `tests/a.test.js` と `tests/a.test.ts` という別々の file が同じ名前に潰れる
  // (codex review r3-f1)。
  if (stripped === rel) return stripped;

  const dot = stripped.lastIndexOf('.');
  const ext = dot >= 0 ? stripped.slice(dot) : '';
  const base = dot >= 0 ? stripped.slice(0, dot) : stripped;
  const candidates = SOURCE_EXTENSIONS[ext] ?? [];

  // **実在する source を探して決める**。 推測で倒すと存在しない path を作る。
  const found = candidates.filter((c) => existsSync(resolve(REPO_ROOT, `${base}${c}`)));

  // 1 件に定まった時だけ戻す。
  //
  // **2 件以上ある時は推測しない**。 `a.test.ts` と `a.test.tsx` が同居していると
  // どちらが元かは compile 後の path からは決まらず、候補の並び順で決まってしまう
  // (変異試験で並びを入れ替えると解決先が変わることを実測した)。
  // 並び順という実装の都合が baseline の key を決める形にはしない。
  //
  // 0 件の時も同じ = source が消えている / 別 dir にある。 存在しない path を
  // 作ると baseline がその名前で固定され、次の run で別 file 扱いになる。
  if (found.length === 1) return `${base}${found[0]}`;

  // 拡張子は compile 後のまま残す。 `.vitest-dist` の除去は別の話で、source と
  // compile 後を 1 件に畳むための正規化なので常に行う。
  return stripped;
}


function build() {
  let report;
  try {
    report = JSON.parse(readFileSync(resolve(REPORT), 'utf8'));
  } catch (err) {
    process.stderr.write(`report を読めない: ${err.message}\n`);
    process.exit(2);
  }

  const results = Array.isArray(report.testResults) ? report.testResults : [];
  const merged = new Map();
  const seen = new Set();

  for (const tr of results) {
    if (!tr || typeof tr.name !== 'string') continue;
    const file = toSource(tr.name);
    const ms = Number(tr.endTime) - Number(tr.startTime);
    const tests = Array.isArray(tr.assertionResults) ? tr.assertionResults.length : 0;
    seen.add(file);

    // 0 を「速い」 と読ませない。 duration を出さない reporter 設定では全 file が
    // 0 になるので、後段で別枠に出す。
    if (!Number.isFinite(ms) || ms <= 0) continue;

    // 重複は **遅い側** を採る。 速い方を採ると「速くなった」 と誤報する。
    const prev = merged.get(file);
    if (!prev || ms > prev.ms) merged.set(file, { ms, tests, abs: tr.name });
    else if (prev && tests > prev.tests) merged.set(file, { ...prev, tests });
  }

  // **畳んだ後に導く**。 source と compile 後は同じ file に正規化されるが、片方だけ 0 に
  // なることがある (実測で素の `npx vitest run` が両方を拾う)。 0 の側を先に `unmeasured` へ
  // 入れると、同じ file が `files` と `unmeasured` の両方に出る。
  //
  // duration の達成条件は「回帰 0 件 かつ 未測定 0 件」 なので、この形が 1 件でもあると
  // `/kiwa-loop` は永久に達成へ到達できず baseline を更新できない (codex review r2-f1)。
  const unmeasured = new Set([...seen].filter((file) => !merged.has(file)));

  const files = [];

  for (const [file, info] of merged) {
    const lever = classify(info.abs);
    const msPerTest = info.tests > 0 ? Math.round((info.ms / info.tests) * 100) / 100 : null;
    files.push({ file, ms: info.ms, tests: info.tests, msPerTest, lever: lever.name, fix: lever.fix });
  }

  files.sort((a, b) => b.ms - a.ms || a.file.localeCompare(b.file));


  return {
    totalMs: files.reduce((sum, f) => sum + f.ms, 0),
    files,
    unmeasured: [...unmeasured].sort(),
  };
}

function toMarkdown(r) {
  const out = ['# duration gap report', ''];
  const sec = (ms) => `${(ms / 1000).toFixed(2)}s`;

  out.push(
    `合計 ${sec(r.totalMs)} / ${r.files.length} file。`,
    '',
    '**絶対値は判定に使わない**。 同じ code で 6 倍振れる (Issue #2196)。',
    '読むのは順位と lever 別の偏りで、その 2 つは負荷が変わっても保たれる。',
    '',
  );

  out.push('## 遅い順', '', '| file | 所要 | 件数 | 1 件 | lever | 直し方 |', '|---|---|---|---|---|---|');
  for (const f of r.files.slice(0, 25)) {
    const per = f.msPerTest === null ? '-' : `${f.msPerTest}ms`;
    out.push(`| \`${f.file}\` | ${sec(f.ms)} | ${f.tests} | ${per} | ${f.lever} | ${f.fix} |`);
  }
  if (r.files.length > 25) out.push('', `… 他 ${r.files.length - 25} file`);
  out.push('');

  if (r.unmeasured.length > 0) {
    out.push(
      '## 測れていない file',
      '',
      '「速い」 とは別物。 duration を出さない reporter 設定では全 file がここに来る。',
      '',
    );
    for (const f of r.unmeasured) out.push(`- \`${f}\``);
    out.push('');
  }


  return out.join('\n');
}

const report = build();
process.stdout.write(AS_JSON ? `${JSON.stringify(report, null, 2)}\n` : `${toMarkdown(report)}\n`);
