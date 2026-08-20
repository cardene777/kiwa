// 前段 build の対象が「packages 全件 + test の中で build されない workspace 全件」 と
// 一致し続けることを固定する (Issue #2086)。
//
// root `package.json` の `test` は先頭で build を回してから各 workspace の test を走らせる。
// この前段が全 workspace を対象にしていた頃、 playwright を使う 17 件は `webServer.command`
// が `pnpm build && pnpm start` の形で自分をもう一度 build するため、 同じ Next.js build が
// 2 回走っていた (#2084、 実測 793 秒 → 677 秒)。
//
// 削減は root `package.json` の 1 行が保っているだけで、 壊れても test は全て通る。
// 壊れ方は 2 方向ある。
//
//   1. 前段を `pnpm -r build` に戻す → 116 秒が戻る。 実行時間が延びるだけで誰も気付かない
//   2. 新しい workspace を前段に入れ忘れる → その workspace の build 検証が静かに消える
//
// 2 は #2085 の review で実際に 2 件見つかっている (`examples-nextjs-app-router-full` は
// build script を途中までしか見ずに `next build` を含むことを見落とし、
// `dogfood-oidc-federation-rp` は `examples/*/package.json` の探索が入れ子の workspace に
// 届かず列挙から落ちていた)。 人の目では 2 件とも落とした。
//
// ## なぜ実行時間そのものを測らないか
//
// 壁時計時間を閾値にすると機械の状態で揺れて flaky になる。 測るのは時間ではなく、
// 時間を決めている構造の方にする。
//
// ## なぜ glob を使わないか
//
// workspace の列挙は pnpm に委ねる。 `examples/*` の glob は
// `examples/dogfood-oidc-federation/rp` のような入れ子の workspace に届かず、
// **本 test が防ごうとしている漏れを test 自身が再現する**。
// `pnpm-workspace.yaml` はその path を明示的に列挙しているため、 pnpm に聞けば漏れない。
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);

// playwright の設定 file は拡張子が揺れる。 1 つに決め打ちすると、
// 別の拡張子で書いた workspace が「再 build しない」 側に誤分類される。
const PLAYWRIGHT_CONFIG_NAMES = [
  'playwright.config.ts',
  'playwright.config.js',
  'playwright.config.mjs',
  'playwright.config.cjs',
] as const;

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
}

interface Workspace {
  name: string;
  path: string;
}

function readPackageJson(dir: string): PackageJson {
  return JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8')) as PackageJson;
}

/** pnpm に workspace を列挙させる。 selectors を渡すとその選択結果になる。 */
function listWorkspaces(selectors: readonly string[]): Workspace[] {
  const stdout = execFileSync('pnpm', [...selectors, 'ls', '--depth', '-1', '--json'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const parsed = JSON.parse(stdout) as Workspace[];
  return parsed.filter((w) => w.path !== undefined && w.name !== undefined && w.path !== REPO_ROOT);
}

/** その workspace の test が自分を build し直すか (playwright の webServer 経由)。 */
function rebuildsDuringTest(dir: string): boolean {
  const test = readPackageJson(dir).scripts?.test ?? '';
  if (!test.includes('playwright')) return false;
  for (const name of PLAYWRIGHT_CONFIG_NAMES) {
    const configPath = resolve(dir, name);
    if (!existsSync(configPath)) continue;
    const source = readFileSync(configPath, 'utf8');
    const command = /command:\s*['"`]([^'"`]+)/.exec(source)?.[1];
    if (command !== undefined && /\bbuild\b/.test(command)) return true;
  }
  return false;
}

/**
 * 引用を尊重して空白で分割する。 `--filter "./packages/**"` の引用を落とすと
 * pnpm に渡した時に glob が shell 展開済みの形と区別できなくなる。
 */
function tokenize(segment: string): string[] {
  const tokens = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;
  return (segment.match(tokens) ?? []).map((t) => t.replace(/^['"]|['"]$/g, ''));
}

/**
 * root `package.json` の `test` から、 前段 build が実際に選ぶ workspace 名を集める。
 *
 * 前段の終わりは `docs:gen:test` の位置で決める。 それより後ろの `pnpm ... test` を
 * 拾うと、 build ではなく test の対象を数えることになる。
 */
function actualPrebuildTargets(): Set<string> {
  const testScript = readPackageJson(REPO_ROOT).scripts?.test ?? '';
  expect(testScript, 'root package.json の scripts.test が空').not.toBe('');
  const boundary = testScript.indexOf('docs:gen:test');
  expect(boundary, 'scripts.test に docs:gen:test が無く前段の終わりを決められない').toBeGreaterThan(
    0,
  );
  const prebuild = testScript.slice(0, boundary);

  // `pnpm <selectors> build` の形を拾う。 segment を先頭から読む形にはしない =
  // 前段は `sh -c 'export KIWA_DEPS_PREBUILT=1; pnpm ... build && ...` の並びで、
  // 最初の segment の先頭 token は `pnpm` ではなく `sh` になる。
  const buildCommand = /\bpnpm\s+([^&;]*?)\s+build(?=\s|$|&|;)/g;
  const selected = new Set<string>();
  let matched = 0;
  for (const match of prebuild.matchAll(buildCommand)) {
    matched += 1;
    const selectors = tokenize(match[1] ?? '');
    for (const ws of listWorkspaces(selectors)) {
      // 選ばれても `build` を持たない workspace では build は走らない。
      if (readPackageJson(ws.path).scripts?.build === undefined) continue;
      selected.add(ws.name);
    }
  }
  expect(matched, '前段に `pnpm ... build` の形が 1 つも無い (検査が空振りしている)').toBeGreaterThan(
    0,
  );
  return selected;
}

/** 前段 build の対象であるべき workspace 名。 */
function expectedPrebuildTargets(): { all: Set<string>; packages: string[]; others: string[] } {
  const packages: string[] = [];
  const others: string[] = [];
  for (const ws of listWorkspaces(['-r'])) {
    if (readPackageJson(ws.path).scripts?.build === undefined) continue;
    const rel = relative(REPO_ROOT, ws.path);
    if (rel.startsWith(`packages${'/'}`)) {
      // packages は後段の test が build し直さないため常に前段で作る。
      packages.push(ws.name);
      continue;
    }
    // それ以外は、 自分の test が build し直すなら前段では作らない。
    if (rebuildsDuringTest(ws.path)) continue;
    others.push(ws.name);
  }
  return { all: new Set([...packages, ...others]), packages, others };
}

describe('前段 build の対象 (#2086)', () => {
  const expected = expectedPrebuildTargets();
  const actual = actualPrebuildTargets();

  it('期待集合を導出できている', () => {
    // 集合が空だと以下の一致検査が素通りするため、 両側が 1 件以上あることを先に固定する。
    expect(expected.packages.length, 'packages 配下の build 対象を 1 件も拾えていない').toBeGreaterThan(
      0,
    );
    expect(
      expected.others.length,
      'test の中で build されない非 packages を 1 件も拾えていない',
    ).toBeGreaterThan(0);
  });

  it('前段 build の対象が期待集合と完全に一致する', () => {
    const missing = [...expected.all].filter((n) => !actual.has(n)).sort();
    const extra = [...actual].filter((n) => !expected.all.has(n)).sort();

    // 不足 = その workspace の build 検証が消える。
    expect(missing, `前段 build に入っていない workspace がある: ${missing.join(', ')}`).toEqual([]);
    // 余分 = 後段の test が build し直す workspace を二重に build している。
    expect(extra, `前段 build が余分な workspace を含む: ${extra.join(', ')}`).toEqual([]);
  });

  it('test の中で build し直す workspace を前段に含めない', () => {
    const rebuilt = listWorkspaces(['-r']).filter((ws) => {
      if (readPackageJson(ws.path).scripts?.build === undefined) return false;
      if (relative(REPO_ROOT, ws.path).startsWith(`packages${'/'}`)) return false;
      return rebuildsDuringTest(ws.path);
    });
    // 二重 build の削減がこの集合の大きさで決まるため、 0 件になっていないことを固定する。
    expect(rebuilt.length, 'test の中で build し直す workspace を 1 件も検出できていない').toBeGreaterThan(
      0,
    );
    for (const ws of rebuilt) {
      expect(actual.has(ws.name), `${ws.name} は test の中で build されるため前段に不要`).toBe(false);
    }
  });
});
