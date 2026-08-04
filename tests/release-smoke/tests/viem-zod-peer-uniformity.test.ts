// Fail-fast detection for the viem/zod peer-split pattern (Issue #1787).
//
// `abitype` — reached from every `viem` install — declares `zod` as an *optional*
// peer accepting `^3.22.0 || ^4.0.0`. An importer that does not declare `zod`
// itself leaves the choice to pnpm's peer dedupe, and the dedupe result is not
// stable across lockfile regenerations. Two observed regenerations moved a
// different subset of importers each time:
//
//   * PR #1786 (package removal) moved `examples/dogfood-dapp-e2e-reorg` to v4.
//   * A single-importer `zod` declaration moved 16 *other* examples to v4.
//
// The damage is not the zod version itself. Every example depends on
// `@kiwa-lab/dapp`, which declares `zod: ^3.23.8` and therefore resolves
// `viem` under a v3 peer key. When an example resolves `viem` under a v4 peer
// key, the example and the adapter it exercises load **two different viem
// instances** — wallet clients, chain objects, and ABI caches stop being
// identity-comparable across that boundary.
//
// The invariant this axis holds: every importer that resolves `viem` resolves it
// under the same `zod` peer as `packages/dapp`. `packages/dapp` is the reference
// because it is the published adapter the examples consume; the examples follow
// it rather than the other way round.
//
// When this test fails, the fix is exactly one of:
//   1. Declare `zod` in the offending importer's `package.json`, in the same
//      section that declares `viem`/`wagmi`, with the range `packages/dapp` uses.
//      An explicit declaration removes the importer from pnpm's dedupe guesswork.
//   2. If `packages/dapp` itself moved to a new zod major, update the examples in
//      the same change so the whole set moves together.
//
// A workspace-wide `zod` override is NOT a valid fix. It rewrites `better-call`'s
// peer (`^4.0.0`) as well, and Better Auth's `dist/state.mjs` calls
// `z.looseObject`, which does not exist on the zod v3 root export.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 つ親 = repo root (`tests/release-smoke/.vitest-dist/tests/` 配下)
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

const REFERENCE_IMPORTER = 'packages/dapp';

/** `viem` を解決する importer と、 その peer 鍵に現れる zod 版の対応。 */
function readViemZodPeers(): Map<string, string[]> {
  const lock = readFileSync(resolve(REPO_ROOT, 'pnpm-lock.yaml'), 'utf-8');
  const found = new Map<string, string[]>();

  let inImporters = false;
  let importer: string | null = null;
  let dependency: string | null = null;

  for (const line of lock.split('\n')) {
    // 最上位 key。 `importers:` に入る／出るの判定に使う。
    const topLevel = /^(\S[^:]*):\s*$/.exec(line);
    if (topLevel?.[1] !== undefined) {
      inImporters = topLevel[1] === 'importers';
      importer = null;
      dependency = null;
      continue;
    }
    if (!inImporters) continue;

    // importer 名 (深さ 2)。 `.` や `examples/foo` の形。
    const importerLine = /^ {2}(\S[^:]*):\s*$/.exec(line);
    if (importerLine?.[1] !== undefined) {
      importer = importerLine[1].replace(/^'|'$/g, '');
      dependency = null;
      continue;
    }
    if (importer === null) continue;

    // 依存名 (深さ 6)。 scope 付きは単引用符で囲まれる。
    const dependencyLine = /^ {6}'?([^\s:']+)'?:\s*$/.exec(line);
    if (dependencyLine?.[1] !== undefined) {
      dependency = dependencyLine[1];
      continue;
    }

    const versionLine = /^ {8}version: (.+)$/.exec(line);
    if (versionLine?.[1] !== undefined && dependency === 'viem') {
      const zods = [...versionLine[1].matchAll(/zod@([0-9][^)]*)/g)]
        .map((m) => m[1])
        .filter((v): v is string => v !== undefined);
      found.set(importer, [...new Set(zods)].sort());
    }
  }

  return found;
}

describe('viem/zod peer uniformity', () => {
  const peers = readViemZodPeers();

  it('parses the lockfile and finds the reference importer', () => {
    // 解析が空振りしていないことを先に確かめる。 lockfile の書式が変わって
    // parser が 0 件を返すと、 以降の assertion が全て空集合で通ってしまう。
    expect(peers.size).toBeGreaterThan(0);
    expect(peers.has(REFERENCE_IMPORTER)).toBe(true);
    expect(peers.get(REFERENCE_IMPORTER)).toHaveLength(1);
  });

  it('resolves viem under the same zod peer in every importer', () => {
    const reference = peers.get(REFERENCE_IMPORTER);
    expect(reference).toBeDefined();

    const mismatched = [...peers.entries()]
      .filter(([, zods]) => zods.join(',') !== reference!.join(','))
      .map(([name, zods]) => `${name} → zod ${zods.join(',') || '(なし)'}`);

    expect(
      mismatched,
      `${REFERENCE_IMPORTER} は zod ${reference!.join(',')} で viem を解決している。` +
        ' 一致しない importer は viem を別実体として読み込む。',
    ).toEqual([]);
  });
});
