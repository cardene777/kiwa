#!/usr/bin/env node
/**
 * カバレッジの gap report (Issue #2193)。
 *
 * 「次にどこを埋めるか」 を安い順に返す。
 *
 * ## なぜ要るか
 *
 * `coverage-high-water.json` の ratchet は単調性を保証する = 一度上げた値は下がらない。
 * つまり **毎回 1 歩でも進めれば必ず 100% に着く**構造は既にある。
 * 足りないのは「次にどこを埋めるか」 を返すものだけで、無いために実測で
 * ratchet 登録 25 package のうち 20 package が 100% 未満で止まっていた。
 *
 * ## 何を返さないか
 *
 * 判定はしない。 gate は `scripts/check-coverage-gates.mjs` の責務で、本 script は
 * 読むだけで `coverage-high-water.json` を書き換えない。
 *
 * ## 行番号は compile 後のもの
 *
 * `coverage-final.json` の `path` は `.vitest-dist` 配下の `.js` を指す (実測で全 package)。
 * `tsconfig.vitest.json` は `sourceMap` を出さないため、`.js` の行から `.ts` の行への
 * 正確な対応は取れない。
 *
 * したがって **file path は source (`.ts`) に戻し、行番号は compile 後のまま** 返す。
 * 混ぜて「source の行番号」 として出すと、読み手が別の行を見に行く。
 * 出力にも `line_basis: "compiled"` を書いて、どちら基準かを明示する。
 *
 * 正確な対応が要るなら sourcemap を有効にする必要があるが、それは coverage の測定値
 * そのものを変える (remap 後の数値になる) ため ratchet の値を作り直すことになり、
 * 本 script の範囲を超える。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// `fileURLToPath`、`.pathname` ではない。 `file:` URL は percent-encoding を保つため、
// 空白を含む dir 配下の checkout が `…/kiwa%20probe/…` という存在しない path に解決する。
// `scripts/lib/is-main-module.mjs` が同じ罠を記録している。
const SCRIPT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const REPO_ROOT = process.env.KIWA_GATE_ROOT
  ? resolve(process.env.KIWA_GATE_ROOT)
  : process.cwd() !== '/' && existsSync(resolve(process.cwd(), 'packages'))
    ? process.cwd()
    : SCRIPT_ROOT;

const AS_JSON = process.argv.includes('--json');
const ONLY = argValue('--package');

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

/**
 * 走査対象の package dir を列挙する。
 *
 * `gate-inputs.mjs` の `COVERAGE_PKG_DIRS` を使わないのは、fixture で検査するため。
 * 一覧を持つと fixture 側にも同じ一覧が要り、検査が「一覧どおりに動くか」 しか見なくなる。
 * `packages/*` を直接読めば、実 repo でも fixture でも同じ経路を通る。
 */
function packageDirs() {
  const base = resolve(REPO_ROOT, 'packages');
  if (!existsSync(base)) return [];
  return readdirSync(base)
    .filter((name) => {
      try {
        return statSync(resolve(base, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .map((name) => `packages/${name}`)
    .sort();
}

/**
 * compile 後の path を source に戻す。
 *
 * `<pkg>/.vitest-dist/src/a.js` → `<pkg>/src/a.ts`。
 * `.vitest-dist` を経由しない path (既に source を指す coverage) はそのまま返す。
 */
function toSource(absPath) {
  const rel = relative(REPO_ROOT, absPath).split('\\').join('/');
  const stripped = rel.replace('/.vitest-dist/', '/');
  return stripped.replace(/\.js$/, '.ts');
}

/**
 * production code だけを数える。
 *
 * test 自身の未実行行を勧めると「test の test を書く」 に誘導する。
 * 判定は path 中の segment で行う = `tests/` 配下と `*.test.*` / `*.spec.*` を外す。
 */
function isProduction(source) {
  const segments = source.split('/');
  if (segments.includes('tests') || segments.includes('test')) return false;
  const base = segments[segments.length - 1] ?? '';
  return !/\.(test|spec)\.[cm]?[jt]sx?$/.test(base);
}

/**
 * 1 package 分の gap を組む。
 *
 * 返すのは 3 つ。 未覆行の総数、file 単位の内訳、そして測れなかった理由。
 * 「gap 0 件」 と「測っていない」 を同じ形にしない = 潰すと未測定が達成に化ける
 * (`rules/quality.md § 判定できなかったことを値に潰さない` と同じ判断)。
 */
function gapFor(dir) {
  const finalPath = resolve(REPO_ROOT, dir, 'coverage/coverage-final.json');
  if (!existsSync(finalPath)) {
    return { unmeasured: `no coverage-final.json at ${relative(REPO_ROOT, finalPath)}` };
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(finalPath, 'utf8'));
  } catch (err) {
    return { unmeasured: `coverage-final.json is unreadable (${err.message})` };
  }

  const files = [];
  for (const entry of Object.values(raw)) {
    if (!entry || typeof entry !== 'object') continue;
    const source = toSource(entry.path ?? '');
    if (!isProduction(source)) continue;

    const stmtMap = entry.statementMap ?? {};
    const lines = [];
    for (const [id, count] of Object.entries(entry.s ?? {})) {
      if (count !== 0) continue;
      const line = stmtMap[id]?.start?.line;
      if (typeof line === 'number') lines.push(line);
    }
    lines.sort((a, b) => a - b);

    // 分岐は **path 単位** で数える。 分岐単位で 1 と数えると、`switch` の未通過 case が
    // 何本あっても 1 に潰れる。 同じ行に複数の未通過 path があれば行番号を複数回出す。
    //
    // 実測で `coverage-high-water.json` の 20 package が 100% 未満だった主因は branches で、
    // statement は既に 100% の package が多い。 ここを数えないと gap report が
    // 「もう埋まっている」 と嘘をつく。
    const branchMap = entry.branchMap ?? {};
    const branches = [];
    for (const [id, hits] of Object.entries(entry.b ?? {})) {
      if (!Array.isArray(hits)) continue;
      const meta = branchMap[id];
      for (let i = 0; i < hits.length; i += 1) {
        if (hits[i] !== 0) continue;
        const line = meta?.locations?.[i]?.start?.line ?? meta?.line ?? meta?.loc?.start?.line;
        if (typeof line === 'number') branches.push(line);
      }
    }
    branches.sort((a, b) => a - b);

    const fnMap = entry.fnMap ?? {};
    const functions = [];
    for (const [id, count] of Object.entries(entry.f ?? {})) {
      if (count !== 0) continue;
      const meta = fnMap[id];
      const line = meta?.decl?.start?.line ?? meta?.line ?? meta?.loc?.start?.line;
      if (typeof line === 'number') functions.push({ name: meta?.name ?? '(anonymous)', line });
    }
    functions.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name));

    const uncovered = lines.length + branches.length + functions.length;
    if (uncovered === 0) continue;
    files.push({ source, lines, branches, functions, uncovered });
  }

  // 未覆行の多い順。 同数は path で決める = `Object.keys` の順に依存させると、
  // file を 1 つ増やすだけで出力順が変わる。
  files.sort((a, b) => b.uncovered - a.uncovered || a.source.localeCompare(b.source));
  const uncovered = files.reduce((sum, f) => sum + f.uncovered, 0);
  return { uncovered, files };
}

function build() {
  const dirs = ONLY ? [ONLY] : packageDirs();
  const packages = [];
  const unmeasured = [];

  for (const dir of dirs) {
    const g = gapFor(dir);
    if (g.unmeasured) {
      unmeasured.push({ dir, reason: g.unmeasured });
      continue;
    }
    if (g.uncovered === 0) continue;
    packages.push({ dir, uncovered: g.uncovered, files: g.files });
  }

  // 残り量の降順。 **同数の tiebreak はここに書かない** = `packageDirs()` が既に path 順で
  // 返し、`Array.sort` は安定なので同数の相対順は保たれる。 変異試験で `localeCompare` を
  // 外しても 1 件も落ちず、順序を保証しているのが上流の sort だと分かった (T-CGR-017 が
  // そちらを固定する)。 同じ順序を 2 箇所で作ると、片方を消しても検査が落ちない。
  packages.sort((a, b) => b.uncovered - a.uncovered);
  return { line_basis: 'compiled', packages, unmeasured };
}

/** 長い列挙を 12 件で打ち切る。 打ち切ったことを明示する (no silent caps)。 */
function cap(values, limit = 12) {
  if (values.length === 0) return '-';
  const shown = values.slice(0, limit).join(', ');
  return values.length > limit ? `${shown} … 他 ${values.length - limit} 件` : shown;
}

function toMarkdown(report) {
  const out = ['# coverage gap report', ''];

  if (report.packages.length === 0) {
    out.push('未達は 0 件。', '');
  } else {
    out.push(
      '行番号は **compile 後** (`.vitest-dist` 配下) のもの。 sourcemap が無いため',
      'source の行番号には戻せない。 file path は source に戻してある。',
      '',
      '| package | 残り | 先頭の file |',
      '|---|---|---|',
    );
    for (const p of report.packages) {
      out.push(`| \`${p.dir}\` | ${p.uncovered} | \`${p.files[0]?.source ?? '-'}\` |`);
    }
    out.push('');

    for (const p of report.packages) {
      out.push(
        `## ${p.dir}`,
        '',
        '| file | 残り | 未実行 stmt | 未通過 branch | 未呼出 function |',
        '|---|---|---|---|---|',
      );
      for (const f of p.files) {
        out.push(
          `| \`${f.source}\` | ${f.uncovered} | ${cap(f.lines)} | ${cap(f.branches)} | ` +
            `${cap(f.functions.map((fn) => `${fn.name}:${fn.line}`))} |`,
        );
      }
      out.push('');
    }
  }

  if (report.unmeasured.length > 0) {
    out.push(
      '## 測れていない package',
      '',
      '「gap 0 件」 とは別物。 埋まっているのではなく **何も分かっていない**。',
      '',
      '| package | 理由 |',
      '|---|---|',
    );
    for (const u of report.unmeasured) out.push(`| \`${u.dir}\` | ${u.reason} |`);
    out.push('');
  }

  return out.join('\n');
}

const report = build();
process.stdout.write(AS_JSON ? `${JSON.stringify(report, null, 2)}\n` : `${toMarkdown(report)}\n`);
