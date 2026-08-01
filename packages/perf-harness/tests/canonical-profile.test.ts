// baseline を環境ごとに分けた時の不変条件を固定する (#1729)。
//
// baseline は記録した機械でしか比較に使えない (`isComparableEnv` が platform /
// CPU / Node 版の一致を要求する)。 環境を区別せず同じ path に書くと、 別の機械で
// 回した実行が前の記録を自分の値で上書きし、 追跡している file が汚れる。
//
// 追跡するのは 1 つの profile だけ。 全環境を追跡すると 148 file が機械の数だけ
// 増え、 その大半は誰も比較に使わない。
//
// profile の名前は 3 箇所に現れる (`CANONICAL_ENV_PROFILE` / `.gitignore` /
// `docs/quality/perf-thresholds.md`)。 1 箇所だけ直すと、 追跡の意図と実際の
// ignore 規則が食い違う。

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_ENV_PROFILE,
  captureEnv,
  defaultBaselinePath,
  envProfile,
  isCanonicalEnv,
  isComparableEnv,
  nonCanonicalEnvNotice,
} from '../src/baseline.js';
import type { BaselineEnv } from '../src/types.js';

const HERE = dirname(fileURLToPath(import.meta.url));
// compile 後は `.vitest-dist/tests/` から走るため 4 階層上が repo root
// (`.vitest-dist/tests` → `.vitest-dist` → `perf-harness` → `packages` → root)。
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

function envWith(overrides: Partial<BaselineEnv>): BaselineEnv {
  return { ...captureEnv(), ...overrides };
}

describe('環境ごとの baseline 分離 (#1729)', () => {
  it('別の機械の baseline を上書きしない', () => {
    // 本 Issue の核。 platform / CPU / Node major のいずれかが違えば別 path になる。
    const mac = envWith({
      platform: 'darwin-arm64',
      cpuModel: 'Apple M4 Pro',
      nodeVersion: 'v24.15.0',
    });
    const linux = envWith({
      platform: 'linux-x64',
      cpuModel: 'AMD Ryzen 9 7950X',
      nodeVersion: 'v24.15.0',
    });
    expect(envProfile(mac)).not.toBe(envProfile(linux));
  });

  it('Node の major が違えば分かれる', () => {
    // V8 が変わると測定値の意味が変わる。
    const node22 = envWith({ nodeVersion: 'v22.14.0' });
    const node24 = envWith({ nodeVersion: 'v24.15.0' });
    expect(envProfile(node22)).not.toBe(envProfile(node24));
  });

  it('Node の patch が違っても分かれない', () => {
    // patch まで含めると、 Node を上げるたびに全 baseline が無効になる。
    const a = envWith({ nodeVersion: 'v24.15.0' });
    const b = envWith({ nodeVersion: 'v24.99.3' });
    expect(envProfile(a)).toBe(envProfile(b));
  });

  it('cpu 数が違っても分かれない', () => {
    // 同じ機械でも負荷や container の割当で `os.cpus().length` は動く。
    // その都度 profile が分かれると比較対象を見失う。 数の違いは
    // `isComparableEnv` が別途弾く。
    const few = envWith({ cpuCount: 4 });
    const many = envWith({ cpuCount: 12 });
    expect(envProfile(few)).toBe(envProfile(many));
  });

  it('同じ profile なら比較できる', () => {
    // path を分ける条件と比較の条件が食い違うと、 同じ dir を読みながら
    // 「比較できない」 と判断して再 seed し、 追跡している記録を上書きする
    // (#1729 review MAJOR 1)。
    const base = captureEnv();
    for (const [label, override] of [
      ['Node patch 違い', { nodeVersion: 'v24.99.3' }],
      ['cpu 数違い', { cpuCount: 4 }],
    ] as const) {
      const other = envWith(override);
      expect(envProfile(other), label).toBe(envProfile(base));
      expect(isComparableEnv(other, base), `${label}: 同じ profile なのに比較できない`).toBe(true);
    }
  });

  it('違う profile なら比較できない', () => {
    const base = captureEnv();
    for (const [label, override] of [
      ['platform 違い', { platform: 'linux-x64' }],
      ['CPU 違い', { cpuModel: 'AMD Ryzen 9 7950X' }],
      ['Node major 違い', { nodeVersion: 'v22.14.0' }],
    ] as const) {
      const other = envWith(override);
      expect(envProfile(other), label).not.toBe(envProfile(base));
      expect(isComparableEnv(other, base), `${label}: 違う profile なのに比較できる`).toBe(false);
    }
  });

  it('区切り文字だけが違う CPU 名が同じ profile に潰れない', () => {
    // slug 化だけだと `Intel Core i7-1065G7` と `Intel Core i7 1065G7` が同じ
    // 名前になる。 `isComparableEnv` は raw の一致を見るので、 同じ dir を読み
    // ながら互いに比較できず再 seed し合う (#1729 review MAJOR 2)。
    const hyphen = envWith({ cpuModel: 'Intel Core i7-1065G7' });
    const space = envWith({ cpuModel: 'Intel Core i7 1065G7' });
    expect(envProfile(hyphen)).not.toBe(envProfile(space));
  });

  it('canonical でない環境の注記が両方の profile を出す', () => {
    // 数値だけを見た読み手が「git に入っている記録と比べた結果」 と受け取らない
    // ようにする (#1729 review MAJOR 3)。
    const other = envWith({ platform: 'linux-x64' });
    const notice = nonCanonicalEnvNotice(other).join('\n');
    expect(notice).toContain(envProfile(other));
    expect(notice).toContain(CANONICAL_ENV_PROFILE);
    // canonical では出さない。
    expect(nonCanonicalEnvNotice(captureEnv())).toEqual([]);
  });

  it('profile 名が path に使える形になる', () => {
    // CPU model には空白と括弧が入る。 そのまま dir 名にすると shell と
    // glob の両方で扱いにくい。
    const messy = envWith({ cpuModel: 'Intel(R) Core(TM) i9-9880H CPU @ 2.30GHz' });
    const name = envProfile(messy);
    expect(name).toMatch(/^[a-z0-9-]+$/);
    expect(name).not.toContain(' ');
  });

  it('baseline の path に profile が入る', () => {
    const path = defaultBaselinePath('cache');
    expect(path).toContain(`/.perf-baseline/${envProfile()}/`);
    expect(path.endsWith('/cache.json')).toBe(true);
  });

  it('canonical の判定が profile の一致で決まる', () => {
    expect(isCanonicalEnv(envWith({ platform: 'linux-x64' }))).toBe(false);
  });

  it('`.gitignore` が canonical だけを通す', () => {
    // 文字列の一致ではなく git に聞く。 規則の書き方によっては、 意図した
    // 文字列が入っていても canonical が ignore される (git は dir を除外すると
    // 中の file を個別に戻せない)。
    const ignored = (relPath: string): boolean =>
      spawnSync('git', ['check-ignore', '-q', relPath], { cwd: REPO_ROOT }).status === 0;
    expect(
      ignored(`.perf-baseline/${CANONICAL_ENV_PROFILE}/newly-added.json`),
      'canonical の新規 file が ignore される',
    ).toBe(false);
    expect(
      ignored('.perf-baseline/some-other-profile/x.json'),
      'canonical 以外が追跡される',
    ).toBe(true);
    // 層を挟んだ形でも同じ。
    expect(ignored(`.perf-baseline/${CANONICAL_ENV_PROFILE}/saas/x.json`)).toBe(false);
  });

  it('文書が同じ profile を書いている', () => {
    const doc = join(REPO_ROOT, 'docs/quality/perf-thresholds.md');
    expect(existsSync(doc)).toBe(true);
    expect(readFileSync(doc, 'utf8')).toContain(CANONICAL_ENV_PROFILE);
  });

  it('profile の取得が git を呼ばない', () => {
    // `captureEnv()` を既定引数にすると `git rev-parse` が毎回走る。 profile は
    // baseline の path と report の注記の両方で引かれるため、 148 suite の実行で
    // 数百回になる (実測 = 300 回 9,010ms、 #1729 review MINOR 5)。
    //
    // profile に要る 3 値はどれも process の生存中に変わらないので 1 度だけ読む。
    const started = performance.now();
    for (let i = 0; i < 300; i += 1) envProfile();
    const elapsed = performance.now() - started;
    expect(elapsed, `300 回で ${elapsed.toFixed(0)}ms かかった`).toBeLessThan(500);
  });

  it('mock 経路と実 API 経路の両方が注記を出す', () => {
    // 片方だけに置くと、 もう片方の report を見た読み手が「git に入っている記録と
    // 比べた結果」 と受け取る (#1729 review MAJOR 3)。
    //
    // 注記の中身は環境依存なので、 両方が同じ helper を通ることを見る。
    // helper を経由しない直書きに戻ると、 片方だけ直した時に文面がずれる。
    const src = (name: string): string =>
      readFileSync(join(REPO_ROOT, 'packages/perf-harness/src', name), 'utf8');
    for (const file of ['three-layer.ts', 'live.ts']) {
      expect(src(file), `${file} が注記を出していない`).toContain('nonCanonicalEnvNotice(');
    }
  });

  it('追跡している baseline が canonical の下だけにある', () => {
    // 移し忘れがあると、 その file は誰の比較にも使われないまま残る。
    // file だけでなく dir も見る。 層の dir (`saas` 等) が profile の外に
    // 残っていると、 中身ごと取り残される。
    const tracked = spawnSync('git', ['ls-files', '.perf-baseline'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).stdout;
    const strays = tracked
      .split('\n')
      .filter((line) => line.length > 0)
      .filter((line) => !line.startsWith(`.perf-baseline/${CANONICAL_ENV_PROFILE}/`));
    expect(strays, `canonical の外で追跡されている: ${strays.slice(0, 5).join(', ')}`).toEqual([]);
  });
});
