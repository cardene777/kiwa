// The cost table in `docs/quality/mutation-thresholds.md` has to keep matching
// the configs it describes (Issue #2168).
//
// The table mixes two kinds of number. Measurements (ms per test, collect
// seconds, run durations, mutant counts) are observations of one run — nothing
// in a fresh checkout can derive them, and `mutation-report/` is gitignored.
// Settings (concurrency, `timeoutMS`) are different: they are read straight out
// of each `stryker.config.mjs`, so a config change silently makes the prose
// wrong.
//
// `rules/quality.md § 導出可能記述は人手で書かない` asks for one of three routes
// when writing a derivable value. This file is route 1 for the settings half.
//
// The population matters. #2174 review round 1 found that asserting "only
// `dapp` lowers concurrency" against the *table's* package set was already
// false repo-wide: `e2e` and `ui` also run at 2, and `e2e` also sets
// `timeoutMS`. Claims about configs are checked against every config.
//
// When it fails, the fix is one of:
//   1. the config changed on purpose — update the table row and the prose
//   2. the table was wrong — fix the number
//   3. a package left the table — remove its row or add the package back
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const DOC = resolve(REPO_ROOT, 'docs/quality/mutation-thresholds.md');
const PACKAGES = resolve(REPO_ROOT, 'packages');

/** The heading the cost table lives under. */
const SECTION = '### Why per-mutant cost varies so much between packages (#2168)';

/**
 * Pull the cost table's package rows out of the section.
 *
 * The row shape is `| \`pkg\` | ms | collect | concurrency | mutants | run | cap |`.
 * Reading the section rather than the whole file keeps the other tables in this
 * document (tiers, overrides, widening) out of the match.
 */
function readCostRows(): Array<{ pkg: string; concurrency: number }> {
  const doc = readFileSync(DOC, 'utf8');
  const start = doc.indexOf(SECTION);
  expect(start, `見出し「${SECTION}」 が docs に無い`).toBeGreaterThan(-1);

  // The section ends at the next `### ` heading, or at the end of the file.
  const after = doc.slice(start + SECTION.length);
  const end = after.indexOf('\n### ');
  const section = end === -1 ? after : after.slice(0, end);

  const rows: Array<{ pkg: string; concurrency: number }> = [];
  for (const line of section.split('\n')) {
    const m = /^\|\s*`([a-z0-9-]+)`\s*\|[^|]*\|[^|]*\|\s*(\d+)\s*\|/.exec(line);
    if (m) rows.push({ pkg: m[1]!, concurrency: Number(m[2]) });
  }
  return rows;
}

interface ConfigRow {
  pkg: string;
  concurrency: number | null;
  timeoutMS: number | null;
}

/** Every package that carries a Stryker config, with the settings it declares. */
function readAllConfigs(): ConfigRow[] {
  const out: ConfigRow[] = [];
  for (const pkg of readdirSync(PACKAGES)) {
    const path = join(PACKAGES, pkg, 'stryker.config.mjs');
    let body: string;
    try {
      body = readFileSync(path, 'utf8');
    } catch {
      continue;
    }
    const c = /^\s*concurrency:\s*(\d+)\s*,/m.exec(body);
    const t = /^\s*timeoutMS:\s*(\d+)\s*,/m.exec(body);
    out.push({
      pkg,
      concurrency: c ? Number(c[1]) : null,
      timeoutMS: t ? Number(t[1]) : null,
    });
  }
  return out;
}

/** Every `*.test.ts` under a directory, including subdirectories. */
function walkTests(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      out.push(...walkTests(path));
    } else if (name.endsWith('.test.ts')) {
      out.push(path);
    }
  }
  return out;
}

/**
 * `@playwright/test` を名指しする行を、 file ごとにそのまま集める。
 *
 * **形を分類しない**。 5 round にわたって分類の抜けが出続けた =
 * `import type` の行頭判定 (r2-f5) → 値の re-export (r3-f1) → binding 名 (r4-f1) →
 * alias と `import x = require(...)` (r5-f1 / r5-f2)。 形を数え上げる限り
 * 「まだ見ていない形」 が残り、 収束しない (`rules/quality.md § 契約完備性 checklist
 * § 責務境界` が静的解析について実測している非収束と同じ性質)。
 *
 * 代わりに **宣言の文面をそのまま突き合わせる**。 alias を足しても、 `import =` に
 * 変えても、 re-export にしても、 型のみに落としても、 行の文字列が変わるので落ちる。
 * 分類の網羅性に依存しないぶん、 検査が守れる範囲は狭いが確実になる。
 *
 * docs 側の記述もこの粒度に合わせてある = 「6 module が名指しし、 うち 4 つが
 * 値 binding を持つ」 までしか書かない。 emit 後に何が残るかは検査しない。
 */
function playwrightReferences(path: string): string[] {
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes("'@playwright/test'") || line.includes('"@playwright/test"'));
}

describe('mutation cost doc — 表の設定値が config と一致する (#2168)', () => {
  it('T-MCD-001 表が package 行を 1 件以上持つ', () => {
    // 空の表に対して forEach を回すと assert に 1 度も到達せず、必ず通る。
    // 見出しを変えた / 表を消した形をここで落とす。
    expect(readCostRows().length, '表から package 行を 1 つも読めていない').toBeGreaterThan(0);
  });

  it('T-MCD-002 各行の concurrency が stryker.config.mjs と一致する', () => {
    const rows = readCostRows();
    // 下限は rows.length 側に課す。 突き合わせ件数と行数の一致は loop が必ず
    // 1 回ずつ増やすので空集合でも成立し、下限にならない (#2174 r1-f10)。
    expect(rows.length, '突き合わせる行が 1 つも無い').toBeGreaterThan(0);

    const byPkg = new Map(readAllConfigs().map((c) => [c.pkg, c.concurrency]));
    for (const { pkg, concurrency } of rows) {
      expect(byPkg.has(pkg), `packages/${pkg}/stryker.config.mjs が無い`).toBe(true);
      expect(concurrency, `${pkg} の concurrency が表と config で違う`).toBe(byPkg.get(pkg));
    }
  });

  it('T-MCD-003 concurrency を下げている package が本文の列挙と一致する', () => {
    // 本文は「dapp / e2e / ui の 3 つが 2 で走る」 と書く。 母集団は **全 config** で、
    // 表の package 集合ではない。 表を母集団にすると、表に載っていない package が
    // 下げても気付けない (#2174 r1-f6 で実際に外していた)。
    const configs = readAllConfigs();
    expect(configs.length, 'stryker config を 1 つも読めていない').toBeGreaterThan(0);

    // 名前だけを比べると、 e2e が 2 から 1 に変わっても通る。 値まで組で比べる。
    const lowered = configs
      .filter((c) => c.concurrency !== null && c.concurrency < 4)
      .map((c) => [c.pkg, c.concurrency] as const)
      .sort((a, b) => a[0].localeCompare(b[0]));

    // **期待値を本文から導く** (#2171)。 手書きの list にすると、本文・test・config の
    // 3 つが同じ主張の写しになり、config と test だけ直して本文が取り残される形が通る
    // (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。
    const doc = readFileSync(DOC, 'utf8');
    const sentence = /\b(?:One|Two|Three|Four|Five) packages? runs? Stryker at (\d+) rather than \d+: ([^.]+)\./.exec(doc);
    expect(sentence, '本文の「N packages run Stryker at X rather than Y: ...」 を読めない').not.toBeNull();
    const at = Number(sentence?.[1]);
    const named = [...(sentence?.[2] ?? '').matchAll(/`([a-z0-9-]+)`/g)]
      .map((m) => [m[1] as string, at] as const)
      .sort((a, b) => a[0].localeCompare(b[0]));
    expect(named.length, '本文が package を 1 つも名指ししていない').toBeGreaterThan(0);

    expect(lowered, 'concurrency < 4 の package と値が本文の列挙と違う').toEqual(named);
  });

  it('T-MCD-004 timeoutMS を明示する package が本文の列挙と一致する', () => {
    // 本文は「dapp と e2e が 60000 を置く」 と書く。 既定値そのものは本文から外した =
    // Stryker の schema default を検査で確かめる手段が無く、literal が腐る (#2174 r1-f8)。
    const configs = readAllConfigs();
    expect(configs.length, 'stryker config を 1 つも読めていない').toBeGreaterThan(0);

    const explicit = configs
      .filter((c) => c.timeoutMS !== null)
      .map((c) => [c.pkg, c.timeoutMS] as const)
      .sort((a, b) => a[0].localeCompare(b[0]));
    expect(explicit, 'timeoutMS を明示する package が本文の列挙と違う').toEqual([
      ['dapp', 60000],
      ['e2e', 60000],
    ]);
  });

  it('T-MCD-005 dapp の test は browser launcher を呼ばない (subdir 込み)', () => {
    // Stryker の include は `.vitest-dist/tests/**/*.test.js` で再帰的。 直下だけを
    // 見ると subdir に起動が入っても通る (#2174 r1-f7)。
    const dir = resolve(REPO_ROOT, 'packages/dapp/tests');
    const files = walkTests(dir);
    expect(files.length, 'dapp の test file を 1 つも読めていない').toBeGreaterThan(0);

    // 起動経路は launch / launchPersistentContext / launchServer / connectOverCDP / connect の 5 形。
    const launcher =
      /\b(chromium|firefox|webkit)\s*\.\s*(launch|launchPersistentContext|launchServer|connectOverCDP|connect)\s*\(/;
    const launching = files
      .filter((f) => launcher.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(dir.length + 1));
    expect(launching, '実 browser を起こす test が dapp に入った').toEqual([]);
  });

  it('T-MCD-007 timeout 節の数値が追跡下の実測 file と一致する', () => {
    // 節が引く数値は **gitignore された `mutation-report/mutation.json`** から導いたもので、
    // 生 report は残らない。 導出済の値を追跡下に置き、doc の側をそこから検査する
    // (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。
    type MeasuredRun = {
      concurrency: number;
      wallSeconds: number;
      status: Record<string, number>;
    };
    const measured = JSON.parse(
      readFileSync(resolve(REPO_ROOT, 'docs/quality/measurements/2171-dapp-stryker-runs.json'), 'utf8'),
    ) as {
      runs: Record<string, MeasuredRun> & { runB: MeasuredRun };
      transitions: Record<string, Record<string, number>>;
      timeoutsByFile: Record<string, Record<string, number>>;
    };
    const doc = readFileSync(DOC, 'utf8');
    const start = doc.indexOf('## Reading a change in timeout count');
    expect(start, 'timeout 節が見つからない').toBeGreaterThan(-1);
    const section = doc.slice(start, doc.indexOf('\n## ', start + 1));

    // 表の 3 行 (killed / survived / timeout) を実測と突き合わせる。
    const rows: [string, string][] = [
      ['baseline', 'baseline'],
      ['A', 'runA'],
      ['B', 'runB'],
    ];
    const mismatches: string[] = [];
    for (const [label, key] of rows) {
      const line = section
        .split('\n')
        .find((l) => l.startsWith(`| ${label} |`));
      if (line === undefined) {
        mismatches.push(`${label}: 表の行が無い`);
        continue;
      }
      const cells = line.split('|').map((c) => c.trim());
      const st = measured.runs[key]?.status ?? {};
      for (const [offset, name] of [
        [4, 'Killed'],
        [5, 'Survived'],
        [6, 'Timeout'],
      ] as const) {
        const written = Number(cells[offset]);
        const actual = st[name] ?? 0;
        if (written !== actual) mismatches.push(`${label}.${name}: doc ${cells[offset]} / 実測 ${actual}`);
      }
    }

    // nominal runner-minutes は wall time × concurrency。 wall の分だけ更新して古い
    // capacity が本文に残る形を止める。
    // **対象の文を取り出してから照合する** (#2171 r2-f1)。 文書全体を部分文字列で
    // 探す形は、別の package について同じ数字が書かれた時に通ってしまう。
    //
    // 文は `so \`dapp\`'s N timeouts account for ... of its M nominal runner-minutes.` の形。
    // N は timeout 件数、M は wall × concurrency ÷ 60。 **両方を同じ文から取る** =
    // 片方だけ更新されて食い違う形を落とす。
    const runB = measured.runs.runB;
    const sentence =
      /`dapp`'s\s+(\d+)\s+timeouts\s+account\s+for[\s\S]*?of\s+its\s+(\d+)\s+nominal\s+runner-minutes/.exec(
        doc.replace(/\s+/g, ' '),
      );
    if (sentence === null) {
      mismatches.push('dapp の timeout 文を節から取り出せない');
    } else {
      const writtenTimeouts = Number(sentence[1]);
      const writtenNominal = Number(sentence[2]);
      const actualTimeouts = runB.status.Timeout ?? 0;
      const actualNominal = Math.round((runB.wallSeconds * runB.concurrency) / 60);
      if (writtenTimeouts !== actualTimeouts) {
        mismatches.push(`dapp の timeout 件数: doc ${writtenTimeouts} / 実測 ${actualTimeouts}`);
      }
      if (writtenNominal !== actualNominal) {
        mismatches.push(`dapp の nominal runner-minutes: doc ${writtenNominal} / 実測 ${actualNominal}`);
      }
    }

    // 遷移の件数も同じく突き合わせる。 節は英数字ではなく綴りで書く箇所があるので、
    // 数字で書いた 2 行 (code block) だけを見る。
    for (const [pair, moves] of Object.entries(measured.transitions)) {
      const line = section.split('\n').find((l) => l.trim().startsWith(`${pair}:`));
      if (line === undefined) {
        mismatches.push(`${pair}: 遷移の行が無い`);
        continue;
      }
      for (const [move, count] of Object.entries(moves)) {
        const found = new RegExp(`${move.replace(/ /g, '\\s+')}\\s+${count}\\b`).test(line);
        if (!found) mismatches.push(`${pair} の "${move} ${count}" が行に無い`);
      }
    }

    // 節が名指しする file 別の増分。
    const inc = (file: string): number =>
      (measured.timeoutsByFile.runA?.[file] ?? 0) - (measured.timeoutsByFile.baseline?.[file] ?? 0);
    for (const [file, written] of [
      ['anvil.js', 13],
      ['anvil-pool.js', 14],
      ['fixture.js', 8],
    ] as const) {
      if (!section.includes(`\`${file}\` (+${written})`)) mismatches.push(`${file} の増分表記が節に無い`);
      if (inc(file) !== written) mismatches.push(`${file}: doc +${written} / 実測 +${inc(file)}`);
    }

    expect(mismatches.sort(), 'timeout 節の数値が実測と食い違う').toEqual([]);
  });

  it('T-MCD-006 dapp の src の @playwright/test 参照が本文と一致する', () => {
    // 本文は「6 module が名指しし、 うち 4 つが値 binding を持つ」 と書く。
    // 宣言の文面をそのまま比べるので、 alias / import = / re-export / 型のみ化の
    // いずれに変えても落ちる (#2174 r1-f5 / r3-f1 / r4-f1 / r5-f1 / r5-f2)。
    const dir = resolve(REPO_ROOT, 'packages/dapp/src');
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));
    expect(files.length, 'dapp の src file を 1 つも読めていない').toBeGreaterThan(0);

    const refs = files
      .map((f) => [f, playwrightReferences(resolve(dir, f))] as const)
      .filter(([, lines]) => lines.length > 0)
      .sort((a, b) => a[0].localeCompare(b[0]));

    expect(refs, 'dapp の src が @playwright/test を名指しする行が本文と違う').toEqual([
      ['balance-change.ts', ["import { expect } from '@playwright/test';"]],
      ['expect-custom-error.ts', ["import { expect } from '@playwright/test';"]],
      ['expect-event.ts', ["import { expect } from '@playwright/test';"]],
      ['fixture.ts', ["import { test as base, type Page } from '@playwright/test';"]],
      [
        'inject-multiple-wallets.ts',
        ["import type { Browser, BrowserContext, Page } from '@playwright/test';"],
      ],
      ['wait-for-wallet-connected.ts', ["import type { Page } from '@playwright/test';"]],
    ]);

    // うち値 binding を持つのは 4 つ = `import type` で始まらない行を持つ file。
    const withValues = refs
      .filter(([, lines]) => lines.some((l) => !l.startsWith('import type ')))
      .map(([f]) => f);
    expect(withValues, '値 binding を持つ file が本文と違う').toEqual([
      'balance-change.ts',
      'expect-custom-error.ts',
      'expect-event.ts',
      'fixture.ts',
    ]);
  });
});
