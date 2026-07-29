// Guards for the two ways a perf suite can measure without judging (Issue #1708).
//
// A perf suite that runs to completion proves nothing on its own. Two failure
// modes hide inside a green run and neither is visible from its output:
//
//   1. The suite discards `runPerf3Layer`'s return value, so a cap breach never
//      reaches an assertion. `dogfood-nats-jetstream` sat 2x over its memory cap
//      for as long as the report existed, and the suite passed every time.
//   2. The suite runs without `--expose-gc`, so `measureMemory` cannot call
//      `global.gc()` and the delta includes allocations that were about to be
//      released. The same `dogfood-nats-jetstream` op reported 215,800 B under
//      that regime and 20,555 B once GC was available — a breach that was an
//      artefact of the measurement, not of the library.
//
// Both are one-line omissions in files that otherwise look complete, which is
// exactly the shape a test catches and a reader does not.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 つ親 = repo root
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');
const ROOTS = ['packages', 'examples'];

function walk(dir: string, match: (name: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const full = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) out.push(...walk(full, match));
    else if (match(entry)) out.push(full);
  }
  return out;
}

function perfTestFiles(): string[] {
  return ROOTS.flatMap((root) =>
    walk(join(REPO_ROOT, root), (name) => name.endsWith('.perf.ts') || name.endsWith('.perf.tsx')),
  );
}

function perfConfigFiles(): string[] {
  return ROOTS.flatMap((root) =>
    walk(join(REPO_ROOT, root), (name) => name === 'vitest.perf.config.ts'),
  );
}

const rel = (file: string) => file.slice(REPO_ROOT.length + 1);

describe('perf gate coverage (#1708)', () => {
  it('runPerf3Layer を呼ぶ suite は判定結果を assert する', () => {
    const offenders = perfTestFiles()
      .filter((file) => {
        const body = readFileSync(file, 'utf8');
        if (!body.includes('runPerf3Layer(')) return false;
        // `allPassed` を見ていれば、上限も (gate 有効時は) 回帰も 1 箇所で拾える。
        return !body.includes('allPassed');
      })
      .map(rel);

    expect(
      offenders,
      '戻り値を捨てると上限超過が assertion に届かない。`expect(result.allPassed).toBe(true)` を足す',
    ).toEqual([]);
  });

  it('perf 実行は --expose-gc 付きで走る', () => {
    const offenders = perfConfigFiles()
      .filter((file) => !readFileSync(file, 'utf8').includes('expose-gc'))
      .map(rel);

    expect(
      offenders,
      'GC を呼べない測定は解放される一時使用まで拾い、memory 上限との比較が成立しない。' +
        "`poolOptions: { forks: { execArgv: ['--expose-gc'] } }` を足す",
    ).toEqual([]);
  });

  it('perf 実行は fork pool を使う (worker_threads は execArgv を無視する)', () => {
    // `--expose-gc` を書いても pool が threads だと届かない。書いた側からは
    // 設定済みに見えるので、GC 無しの測定に静かに戻る。
    const offenders = perfConfigFiles()
      .filter((file) => {
        const body = readFileSync(file, 'utf8');
        if (!body.includes('expose-gc')) return false;
        return !/pool:\s*'forks'/.test(body);
      })
      .map(rel);

    expect(offenders, "`pool: 'forks'` を明示する").toEqual([]);
  });
});
