import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, skillBody } from './skill-md.js';

/**
 * example 配下の run 成果物が gitignore されているか (#2078).
 *
 * `/kiwa-observe` Step 0 は `--outputFile=tests/reports/vitest-results.json` を `--root`
 * 起点で解決するため、 実行のたびに example 配下へ書く。 掃除する経路は無い。
 *
 * 無視していないと `git add examples` が無関係な PR に巻き込む。 実際に PR #2071 で
 * `examples/dogfood-foundry-dapp/tests/reports/contract/coverage-dogfood-token.lcov` が
 * staging に入った。
 */

/** `git check-ignore` の判定。 `.gitignore` の文字列ではなく git 自身に訊く。 */
function ignored(path: string): boolean {
  try {
    execFileSync('git', ['check-ignore', '-q', '--', path], {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

/** 無視されるべき run 成果物。 いずれも追跡済 file は 0 件。 */
const MUST_IGNORE = [
  'examples/nextjs-app-router-full/tests/reports/vitest-results.json',
  'examples/nextjs-app-router-full/tests/reports/observe/history-x.json',
  'examples/dogfood-foundry-dapp/tests/reports/contract/coverage-x.lcov',
  'examples/any-example/hardhat-cache/x.json',
  'examples/any-example/hardhat-artifacts/x.json',
  'examples/any-example/coverage/index.html',
  'examples/any-example/coverage.json',
  'examples/any-example/test-results/x.png',
  'examples/any-example/playwright-report/index.html',
];

/**
 * 無視してはいけない path。
 *
 * `forge-out/` は 54 file、 repo root の `tests/reports/` は 13 file が追跡済で、
 * blanket ignore すると消える。 前者は `build-info/` だけ、 後者は example 名を挟む前置で
 * 分ける (block comment の中に `*` と `/` を並べて書けないため、 pattern は
 * `.gitignore` 側を見る)。
 */
const MUST_TRACK = [
  'tests/reports/contract/coverage-report-mint-nft.ja.md',
  'examples/dogfood-foundry-dapp/forge-out/x.json',
];

describe('example 配下の run 成果物を無視する', () => {
  it('対象を 1 件以上並べている (空振り防止)', () => {
    expect(MUST_IGNORE.length).toBeGreaterThan(0);
    expect(MUST_TRACK.length).toBeGreaterThan(0);
  });

  it.each(MUST_IGNORE)('%s が無視される', (path) => {
    expect(ignored(path), `${path}: 無視されていない`).toBe(true);
  });

  it.each(MUST_TRACK)('%s は無視されない (陰性対照)', (path) => {
    // 「無視される」 だけを見ると、 `examples/` 全体を無視しても通る。 追跡すべき側が
    // 通ることまで見て初めて範囲が固定される。
    expect(ignored(path), `${path}: 追跡すべき path が無視されている`).toBe(false);
  });

  it('追跡済 file が 1 件も無視対象に入っていない', () => {
    // 上の 2 件は代表点。 実際の追跡 file 全件を git に通して、 巻き込みが 0 であることを
    // 直接確かめる。
    const tracked = execFileSync('git', ['ls-files'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      maxBuffer: 64 * 1024 * 1024,
    });
    expect(tracked.split('\n').filter(Boolean).length, '追跡 file を 1 件も読めていない').toBeGreaterThan(
      0,
    );
    let swept = '';
    try {
      swept = execFileSync('git', ['check-ignore', '--stdin'], {
        cwd: REPO_ROOT,
        input: tracked,
        encoding: 'utf-8',
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch {
      // 1 件も一致しなければ `check-ignore` は exit 1 を返す = これが期待する状態。
      swept = '';
    }
    expect(swept.split('\n').filter(Boolean), '追跡済 file が無視対象に入っている').toEqual([]);
  });
});

describe('無視対象が skill の書き先と対応している', () => {
  it('kiwa-observe が example 配下の tests/reports に書くと宣言している', () => {
    // 無視の理由は「skill がそこへ書く」 こと。 書き先が変わったらこの検査が落ちて、
    // 無視規則を見直す契機になる。
    const observe = skillBody('kiwa-observe');
    expect(observe, 'Step 0 の outputFile が tests/reports 配下でない').toContain(
      '--outputFile=tests/reports/vitest-results.json',
    );
    expect(observe, 'history の書き先が tests/reports 配下でない').toMatch(
      /\$\{PROJECT_ROOT\}\/tests\/reports\/observe\//,
    );
  });

  it('kiwa-test の掃除対象が無視規則に含まれている', () => {
    // Step 2.5 が消す成果物は run のたびに生まれる。 `forge-out` と `cache` / `.next` は
    // 別扱い (前者は追跡済、 後 2 者は既存規則) なので除いて突き合わせる。
    const test = skillBody('kiwa-test');
    const line = test.split('\n').find((l) => l.includes('rm -rf "$ROOT/examples/$EXAMPLE"'));
    expect(line, 'Step 2.5 の掃除行が無い').toBeTruthy();
    const targets = [...test.matchAll(/rm -rf "\$ROOT\/examples\/\$EXAMPLE"\/\{([^}]+)\}/g)]
      .flatMap((m) => m[1]!.split(','))
      .map((t) => t.trim());
    expect(targets.length, '掃除対象を 1 件も読めていない').toBeGreaterThan(0);

    const exempt = new Set(['forge-out']);
    // dir を指す規則は末尾 `/` を持ち、 **実在しない path では dir と判定されない**。
    // `git check-ignore examples/x/coverage` は一致せず、 `.../coverage/probe` なら一致する。
    // 掃除対象には dir (`coverage`) と file (`coverage.json`) が混ざるので両方を試す。
    const ignoredAsEither = (target: string): boolean =>
      ignored(`examples/any-example/${target}`) ||
      ignored(`examples/any-example/${target}/probe`);
    const missing = targets.filter((t) => !exempt.has(t)).filter((t) => !ignoredAsEither(t));
    expect(missing, '掃除対象で無視されていないものがある').toEqual([]);
  });
});
