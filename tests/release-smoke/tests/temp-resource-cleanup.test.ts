// Adapter が掘る一時 dir を `@kiwa-lab/core` の `createManagedTempDir` に一本化させる軸
// (Issue #1926)。
//
// `node:fs` の `mkdtemp` / `mkdtempSync` を直接呼ぶと、 掘った dir が `kiwa-` 名前空間に
// 入らず、 異常終了 (crash / Ctrl-C / SIGKILL / OOM) で残った時に誰も回収しない。 後始末は
// `finally` と `dispose` にしか無いので、 そこへ到達しない終わり方が丸ごと漏れる。
//
// 同じ形の事故は #1866 で起きている。 `shared-addresses` の一時 dir が 2 日で 146G 積み、
// ディスクが 3 回満杯になった。 あの時は 1 系統を直したが、 直接呼出が残っている限り
// 次の adapter が同じ入口を作れてしまう。 規範ではなく機械で塞ぐ。
//
// 落ちた時の直し方は 1 つ。 `createManagedTempDir({ label })` に置き換える。 名前空間と
// 次回起動時の回収が付いてくる。
//
// 対象外。
//   - `packages/core/src/temp.ts` = 名前空間の実装そのもの。 ここだけが直接呼ぶ
//   - test file = 一時 dir の寿命が test 内で閉じており、 runner が後始末する
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const PACKAGES_DIR = resolve(REPO_ROOT, 'packages');

/** 名前空間の実装。 ここだけは直接 `mkdtemp` を呼ぶ。 */
const IMPLEMENTATION = 'core/src/temp.ts';

/**
 * `mkdtemp` の呼出を拾う。
 *
 * import 名を変えられる (`import { mkdtemp as mk }`) ため、 呼出側だけを見ても漏れる。
 * `node:fs` 系から `mkdtemp` を import する行そのものを対象にする。 import しなければ
 * 呼べないので、 名前を変えても捕まる。
 */
const FS_IMPORT = /from\s+['"]node:fs(\/promises)?['"]/;
const MKDTEMP_BINDING = /\bmkdtemp(Sync)?\b/;

// `packages/<name>/src` 配下の `.ts` を集める (test file は除く)。
// 注 = block comment に `packages/*` と `/src` を続けて書くと comment が途中で閉じる。
function collectSourceFiles(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      collectSourceFiles(full, out);
      continue;
    }
    if (!entry.endsWith('.ts')) continue;
    if (entry.includes('.test.') || entry.includes('.spec.')) continue;
    out.push(full);
  }
  return out;
}

/**
 * import 文だけを取り出す。
 *
 * 本文の comment に `mkdtemp` と書いただけで落とすと、 なぜ直接呼んではいけないかを
 * 説明する comment が書けなくなる (この file 自身がそう)。
 */
function importLines(source: string): string[] {
  const lines: string[] = [];
  const pattern = /import[\s\S]*?from\s+['"][^'"]+['"]/g;
  const matches = source.match(pattern);
  if (matches) lines.push(...matches);
  return lines;
}

function findDirectMkdtempImports(): string[] {
  const offenders: string[] = [];
  let packageNames: string[];
  try {
    packageNames = readdirSync(PACKAGES_DIR);
  } catch {
    return offenders;
  }

  for (const name of packageNames) {
    const srcDir = join(PACKAGES_DIR, name, 'src');
    for (const file of collectSourceFiles(srcDir)) {
      const rel = relative(PACKAGES_DIR, file);
      if (rel === IMPLEMENTATION) continue;
      const source = readFileSync(file, 'utf8');
      for (const statement of importLines(source)) {
        if (FS_IMPORT.test(statement) && MKDTEMP_BINDING.test(statement)) {
          offenders.push(rel);
          break;
        }
      }
    }
  }
  return offenders;
}

describe('一時 dir は core の名前空間を通す (#1926)', () => {
  it('走査対象の source file を実際に拾えている', () => {
    // 拾えていない状態で「違反 0 件」 になると、 検査していないのに緑になる。
    // #1821 で実際に踏んだ形なので、 分母が非空であることを先に固定する。
    const total = readdirSync(PACKAGES_DIR).flatMap((name) =>
      collectSourceFiles(join(PACKAGES_DIR, name, 'src')),
    );
    expect(total.length).toBeGreaterThan(100);
  });

  it('名前空間の実装が実在する', () => {
    // 除外 1 件が実体を失うと、 除外だけが残って検査の意味が変わる。
    expect(() => readFileSync(join(PACKAGES_DIR, IMPLEMENTATION), 'utf8')).not.toThrow();
  });

  it('packages/*/src が node:fs の mkdtemp を直接 import しない', () => {
    const offenders = findDirectMkdtempImports();
    expect(
      offenders,
      `直接 mkdtemp を import している file がある。 @kiwa-lab/core の createManagedTempDir に置き換える:\n` +
        offenders.map((path) => `  packages/${path}`).join('\n'),
    ).toEqual([]);
  });
});
