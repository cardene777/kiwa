import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);

function read(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

/**
 * 観測が run 履歴を持ち越すか (#1918)。
 *
 * `detectFlaky` は同じ test の run が `minRuns` (既定 3) に届いて初めて判定する。 skill が
 * history を持ち越さない間、 run は常に 1 回で、 **flaky はどの layer でも一度も判定された
 * ことがなかった**。
 *
 * ここでは **SKILL.md に書かれている script をそのまま実行する**。 placeholder だけを埋めて
 * 3 回走らせ、 3 回目に判定が成立することを見る。 script を読み替えて別実装を検査すると、
 * 書かれている手順が動かないまま緑になる (#1908 / #1915 で 2 度踏んだ形)。
 */

/** Step 1 の ts fence (次の同レベル heading まで)。 */
function stepOneScript(): string {
  const body = read('.claude/skills/kiwa-observe/SKILL.md');
  const at = body.search(/^### Step 1\b/m);
  expect(at, 'Step 1 が見つからない').toBeGreaterThan(-1);
  const rest = body.slice(at);
  const next = rest.slice(1).search(/^### /m);
  const section = next === -1 ? rest : rest.slice(0, next + 1);
  const fence = /```ts\n([\s\S]*?)```/.exec(section);
  expect(fence, 'Step 1 に ts の code fence が無い').not.toBeNull();
  return fence![1]!;
}

/** vitest reporter が出す形の最小 JSON。 */
function report(startTime: number, statuses: Record<string, 'passed' | 'failed'>): string {
  return JSON.stringify({
    startTime,
    testResults: [
      {
        testFilePath: 'tests/unit/sample.test.ts',
        assertionResults: Object.entries(statuses).map(([id, status]) => ({
          fullName: `${id} sample`,
          status,
          duration: 1,
        })),
      },
    ],
  });
}

describe('kiwa-observe が run 履歴を持ち越す', () => {
  // script は repo の中に置く。 外に置くと import が解決しない (#1915)。
  const scratch = resolve(REPO_ROOT, '.context/scratch');
  const scriptPath = resolve(scratch, `kiwa-observe-history-check-${process.pid}.mjs`);
  const projects: string[] = [];

  /**
   * test ごとに独立した観測対象を作る。
   *
   * history は module / layer ごとに 1 file なので、 共有すると前の test の run が
   * 「最大 N 回」 に混ざる (実測で 1 件落ちた)。
   */
  function newProject(): string {
    const dir = mkdtempSync(resolve(tmpdir(), 'kiwa-observe-history-'));
    projects.push(dir);
    return dir;
  }

  /** 1 回分の観測を回し、 dashboard を返す。 */
  function observe(project: string, startTime: number, statuses: Record<string, 'passed' | 'failed'>): string {
    const vitestJson = resolve(project, `report-${startTime}.json`);
    writeFileSync(vitestJson, report(startTime, statuses), 'utf-8');
    const out = resolve(project, 'dashboard.md');
    const header = [
      `const PROJECT_ROOT = ${JSON.stringify(project)};`,
      `const VITEST_JSON = ${JSON.stringify(vitestJson)};`,
      `const SPEC_PATH = ${JSON.stringify(resolve(REPO_ROOT, 'tests/spec/contract/test-spec-mint-nft.ja.md'))};`,
      `const TEST_PATHS = [${JSON.stringify(resolve(REPO_ROOT, 'tests/fixtures/mint-nft/contract-test/MintNft.t.sol'))}];`,
      `const MODULE = 'mint-nft';`,
      `const LAYER = 'contract';`,
      `const OUT_PATH = ${JSON.stringify(out)};`,
      '',
    ].join('\n');
    writeFileSync(scriptPath, header + stepOneScript(), 'utf-8');
    execFileSync('node', [scriptPath], { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' });
    return readFileSync(out, 'utf-8');
  }

  beforeAll(() => {
    mkdirSync(scratch, { recursive: true });
  });

  afterAll(() => {
    rmSync(scriptPath, { force: true });
    for (const dir of projects) rmSync(dir, { recursive: true, force: true });
  });

  it('3 回観測すると判定が成立する', () => {
    // 1 / 2 回目は判定材料が足りない。 3 回目で minRuns に届く。
    const project = newProject();
    const first = observe(project, 1000, { 'T-A-001': 'passed' });
    expect(first, '1 回目で判定してしまっている').toContain('flaky は判定していない');
    expect(first).toContain('最大 1 回しか無い');

    const second = observe(project, 2000, { 'T-A-001': 'passed' });
    expect(second).toContain('最大 2 回しか無い');

    const third = observe(project, 3000, { 'T-A-001': 'passed' });
    expect(third, '3 回目でも判定していない').not.toContain('flaky は判定していない');
    expect(third, '判定した上で 0 件の文言が出ていない').toContain('No flaky tests detected.');
  });

  it('3 回のうち 1 回だけ失敗した test を flaky として出す', () => {
    const project = newProject();
    const failing = 'T-B-001';
    observe(project, 4000, { [failing]: 'passed' });
    observe(project, 5000, { [failing]: 'failed' });
    const third = observe(project, 6000, { [failing]: 'passed' });
    expect(third, 'flaky の表が出ていない').toContain('| testId | failure rate |');
    expect(third).toContain(`| ${failing} |`);
    expect(third).toContain('33.3%');
  });

  it('同じ report を 2 度観測しても run 数が増えない', () => {
    // `--vitest-json` で同じ file を再利用する経路がある。 2 度足すと 1 回の run が
    // 2 回に化け、 判定が実態より早く成立する。
    const project = newProject();
    const id = 'T-C-001';
    observe(project, 7000, { [id]: 'passed' });
    const again = observe(project, 7000, { [id]: 'passed' });
    expect(again, '同じ run を 2 回数えている').toContain('最大 1 回しか無い');
  });

  it('history が壊れている時は黙って空から数え直さない', () => {
    // 空へ倒すと、 判定に届かない状態が「まだ 3 回に達していない」 と区別できず毎回そう
    // 見える (#1909 / #1910 と同じ「静かな緑」)。
    const project = newProject();
    observe(project, 8000, { 'T-D-001': 'passed' }); // history を作る
    const historyPath = resolve(project, 'tests/reports/observe/history-mint-nft-contract.json');
    writeFileSync(historyPath, '{ broken', 'utf-8');
    expect(() => observe(project, 9000, { 'T-D-001': 'passed' })).toThrow();
  });
});
