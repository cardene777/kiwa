#!/usr/bin/env node
/**
 * 実行時間の gap report (Issue #2193)。
 *
 * 遅い test を「何をすれば速くなるか」 で分類して返す。
 *
 * ## coverage 側との 2 つの違い
 *
 * 1. **判定材料が noise を持つ**。 coverage は決定的だが wall time は負荷で動く。
 *    実測で `@kiwa-lab/orm` の分岐が並列測定時だけ 94.49% になり、直列だと 2 回とも
 *    94.5% だった。 時間は更に振れるので margin (既定 30%) の内側は回帰にしない。
 * 2. **ratchet の向きが逆**。 coverage の `--update-high-water` は高い方を残すが、
 *    こちらの `--update-baseline` は **低い方** を残す。 遅い値を焼き付けたら常に緑になる。
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
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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

const BASELINE_PATH = resolve(REPO_ROOT, 'test-duration-baseline.json');

/**
 * 回帰と判定する増加率。
 *
 * **伸ばす方向にしか変えない**。 縮めると noise で毎回赤くなり、報告そのものが
 * 読まれなくなる。 30% は `tests/release-smoke` の実測 (同じ file を 4 回回して
 * 最速と最遅の比が 1.18) に余裕を持たせた値。
 */
const MARGIN = 0.3;

const AS_JSON = process.argv.includes('--json');
const UPDATE = process.argv.includes('--update-baseline');
const REPORT = argValue('--report');

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

if (!REPORT) {
  process.stderr.write(
    'usage: node scripts/duration-gap-report.mjs --report <vitest json> [--json] [--update-baseline]\n' +
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

/** import / require の module 指定子を集める。 */
function moduleSpecifiers(code) {
  const found = new Set();
  const patterns = [
    /\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
  ];
  for (const re of patterns) {
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
function toSource(absPath) {
  const rel = relative(REPO_ROOT, absPath).split('\\').join('/');
  return rel.replace('/.vitest-dist/', '/').replace(/^\.vitest-dist\//, '').replace(/\.js$/, '.ts');
}

function readBaseline() {
  if (!existsSync(BASELINE_PATH)) return {};
  try {
    const raw = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
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
  const unmeasured = new Set();

  for (const tr of results) {
    if (!tr || typeof tr.name !== 'string') continue;
    const file = toSource(tr.name);
    const ms = Number(tr.endTime) - Number(tr.startTime);
    const tests = Array.isArray(tr.assertionResults) ? tr.assertionResults.length : 0;

    if (!Number.isFinite(ms) || ms <= 0) {
      // 0 を「速い」 と読ませない。 duration を出さない reporter 設定では全 file が
      // 0 になるので、別枠に出して件数を見せる。
      unmeasured.add(file);
      continue;
    }

    // 重複は **遅い側** を採る。 速い方を採ると「速くなった」 と誤報する。
    const prev = merged.get(file);
    if (!prev || ms > prev.ms) merged.set(file, { ms, tests, abs: tr.name });
    else if (prev && tests > prev.tests) merged.set(file, { ...prev, tests });
  }

  const baseline = readBaseline();
  const files = [];
  const regressions = [];
  const withoutBaseline = [];

  for (const [file, info] of merged) {
    const lever = classify(info.abs);
    const msPerTest = info.tests > 0 ? Math.round((info.ms / info.tests) * 100) / 100 : null;
    files.push({ file, ms: info.ms, tests: info.tests, msPerTest, lever: lever.name, fix: lever.fix });

    // 比較対象が無い場合を先に分ける。 0 として扱うと必ず回帰になる
    // (`rules/quality.md § 判定できなかったことを値に潰さない`)。
    //
    // `continue` で抜ける形にはしない = 無効な `base` との比較は NaN になって常に false
    // なので、`continue` を消しても挙動が変わらず **検査が落ちない**。 変異試験でそれを
    // 確認したため、判定を 1 箇所に寄せて分岐の意図を code に残す。
    const base = baseline[file];
    const comparable = typeof base === 'number' && Number.isFinite(base) && base > 0;
    if (!comparable) {
      withoutBaseline.push(file);
    } else if (info.ms > base * (1 + MARGIN)) {
      regressions.push({ file, ms: info.ms, baselineMs: base, lever: lever.name });
    }
  }

  files.sort((a, b) => b.ms - a.ms || a.file.localeCompare(b.file));
  regressions.sort((a, b) => b.ms / b.baselineMs - a.ms / a.baselineMs);
  withoutBaseline.sort();

  if (UPDATE) {
    const next = { ...baseline };
    for (const f of files) {
      const base = next[f.file];
      // **低い方だけを採る**。 coverage 側の `--update-high-water` と符号が逆で、
      // 遅い値を焼き付けたら常に緑になる。
      if (typeof base !== 'number' || f.ms < base) next[f.file] = f.ms;
    }
    const ordered = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(BASELINE_PATH, `${JSON.stringify(ordered, null, 2)}\n`);
  }

  return {
    margin: MARGIN,
    totalMs: files.reduce((sum, f) => sum + f.ms, 0),
    files,
    regressions,
    withoutBaseline,
    unmeasured: [...unmeasured].sort(),
  };
}

function toMarkdown(r) {
  const out = ['# duration gap report', ''];
  const sec = (ms) => `${(ms / 1000).toFixed(2)}s`;

  out.push(`合計 ${sec(r.totalMs)} / ${r.files.length} file。 回帰の判定は baseline の ${Math.round(r.margin * 100)}% 増から。`, '');

  if (r.regressions.length > 0) {
    out.push('## 回帰', '', '| file | 今回 | baseline | lever |', '|---|---|---|---|');
    for (const g of r.regressions) {
      out.push(`| \`${g.file}\` | ${sec(g.ms)} | ${sec(g.baselineMs)} | ${g.lever} |`);
    }
    out.push('');
  }

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

  if (r.withoutBaseline.length > 0) {
    out.push('## baseline を持たない file', '', `${r.withoutBaseline.length} 件。 \`--update-baseline\` で記録する。`, '');
  }

  return out.join('\n');
}

const report = build();
process.stdout.write(AS_JSON ? `${JSON.stringify(report, null, 2)}\n` : `${toMarkdown(report)}\n`);
