import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);

function read(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

/**
 * 観測が走らせる test の範囲 (#1914)。
 *
 * `/kiwa-observe` の Step 0 は vitest を JSON で走らせる。 chain は本 skill を repo root
 * から起動するため (`/kiwa-test` Step 5a が `--project-root examples/{example}` を渡す)、
 * 範囲を絞らないと **monorepo 全体から test を集める**。 実測で repo root は 332 件を
 * 収集し、 その後 hardhat の fixture を読み込んで停止した。
 *
 * **失敗するより、 失敗しない方が危ない**。 集まるのは別 package の test なので、
 * dashboard の Summary が観測対象ではないものの pass / fail を報告する。 #1909 で直した
 * 「表示が実態を表さない」 形が別経路で戻る。
 */

/**
 * 指定した Step の本文 (次の同レベル heading まで)。
 *
 * **範囲を Step で閉じる**。 file 末尾まで探すと、 対象 Step から fence が消えた時に
 * 後続 Step の fence を拾い、 検査が別の command を見たまま緑になる (Round 1 F3)。
 */
function stepBody(heading: RegExp): string {
  const body = read('.claude/skills/kiwa-observe/SKILL.md');
  const at = body.search(heading);
  expect(at, `${heading} が見つからない`).toBeGreaterThan(-1);
  const rest = body.slice(at);
  const next = rest.slice(1).search(/^### /m);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

/** Step 0 の bash fence。 */
function stepZeroCommand(): string {
  const section = stepBody(/^### Step 0\b/m);
  const fence = /```bash\n([\s\S]*?)```/.exec(section);
  expect(fence, 'Step 0 に bash の code fence が無い').not.toBeNull();
  return fence![1]!.trim();
}

describe('kiwa-observe の Step 0 が観測対象に範囲を絞る', () => {
  it('vitest の起動が --root を観測対象の起点に向ける', () => {
    // 絞る先は `--project-root` と同じ値。 別の変数を書くと、 呼出側が渡した起点と
    // 収集範囲がずれる。
    const command = stepZeroCommand();
    expect(command, 'vitest を走らせていない').toContain('vitest run');
    expect(command, '--root を渡していない').toMatch(/--root\s+"\$PROJECT_ROOT"/);
  });

  it('test file が 0 件でも失敗にしない flag を渡す', () => {
    // vitest は test file が 1 件も無いと exit 1 で終わる (実測)。 runner が vitest で
    // ない layer では 0 件が正常なので、 失敗にすると観測がそこで止まる。
    expect(stepZeroCommand(), '--passWithNoTests を渡していない').toContain('--passWithNoTests');
  });

  it('出力先を --root 相対で書いている', () => {
    // `--outputFile` は `--root` から解決される。 repo root 相対で書くと
    // `$PROJECT_ROOT/$PROJECT_ROOT/tests/...` に書かれる (実測)。
    const command = stepZeroCommand();
    const output = /--outputFile=(\S+)/.exec(command);
    expect(output, '--outputFile を渡していない').not.toBeNull();
    expect(output![1]!, '出力先が root 相対でない').toBe('tests/reports/vitest-results.json');
  });

  it('読み先が 1 つの規則で決まる', () => {
    // Step 0 が書く先と Step 1 が読む先が別々に決まると、 前 run の結果を読んで
    // 「観測した」 ことになる。 `--vitest-json` を渡した時も同じ規則で決める
    // (Round 1 F1: 宣言は再利用と言いながら、 reader は固定 path を読んでいた)。
    const stepZero = stepBody(/^### Step 0\b/m);
    expect(stepZero, '読み先の規則を書いていない').toContain('VITEST_JSON');
    expect(stepZero, '--vitest-json を規則に含めていない').toMatch(
      /--vitest-json[^\n]*\n?[^\n]*その値/,
    );
    expect(stepZero, '既定の読み先を書いていない').toContain(
      '$PROJECT_ROOT/tests/reports/vitest-results.json',
    );

    const script = /```ts\n([\s\S]*?)```/.exec(stepBody(/^### Step 1\b/m));
    expect(script, 'Step 1 に ts の code fence が無い').not.toBeNull();
    expect(script![1]!, 'Step 1 が規則を使わず固定 path を読んでいる').toContain(
      'readFile(VITEST_JSON,',
    );
  });

  /** 書かれている起動形で走らせ、 生成された JSON を返す。 */
  function runScoped(projectRoot: string): { testResults: { name?: string }[]; numTotalTests?: number } {
    expect(existsSync(resolve(REPO_ROOT, projectRoot)), `${projectRoot} が無い`).toBe(true);
    const out = mkdtempSync(resolve(tmpdir(), 'kiwa-vitest-scope-'));
    try {
      const outputFile = resolve(out, 'vitest-results.json');
      execFileSync(
        'pnpm',
        [
          'exec',
          'vitest',
          'run',
          '--root',
          projectRoot,
          '--passWithNoTests',
          '--reporter=json',
          `--outputFile=${outputFile}`,
        ],
        { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
      );
      return JSON.parse(readFileSync(outputFile, 'utf-8')) as {
        testResults: { name?: string }[];
        numTotalTests?: number;
      };
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }

  it('test を持つ project では、 その project の test だけを集める', () => {
    // 0 件の側だけを見ると、 **1 件も集めない実装** でも通ってしまう (Round 1 F2)。
    // test がある project で、 集まったことと、 集まった先が root の下だけであることを
    // 同時に見る。 実測 0.9 秒 / 4 file / 32 件。
    const projectRoot = 'examples/dogfood-dapp-e2e-reorg';
    const report = runScoped(projectRoot);
    expect(report.testResults.length, 'test を 1 件も集めていない').toBeGreaterThan(0);
    expect(report.numTotalTests ?? 0).toBeGreaterThan(0);

    const outside = report.testResults
      .map((f) => f.name ?? '')
      .filter((name) => !name.includes(`/${projectRoot}/`));
    expect(outside, `root の外の test を集めている:\n${outside.join('\n')}`).toEqual([]);
  });

  it('runner が vitest でない layer でも非 0 で落ちない', () => {
    // #1914 の本体。 `contract` の runner は Foundry / Hardhat で、 その project に vitest の
    // 設定は無い。 **範囲を絞れば** exit 0 で record 0 件になる = 観測を止めずに、
    // dashboard 側が「実行結果を 1 件も受け取っていない」 と書ける (#1909)。
    //
    // 絞らない形 (repo root) はこの検査では走らせない。 332 件を集めた末に落ちるため、
    // 走らせること自体が高くつく。 代わりに上の静的検査が `--root` を要求する。
    // 別 package の test が 1 件も入らない。 絞らずに走らせた時は 332 件を集めた。
    const report = runScoped('examples/mint-nft');
    expect(report.testResults).toEqual([]);
    expect(report.numTotalTests ?? 0).toBe(0);
  });
});
