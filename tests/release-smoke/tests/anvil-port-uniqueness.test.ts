import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * ローカルチェーンのポートが example 間で重ならないことを固定する (#1724)。
 *
 * `pnpm test` は example を並列に走らせる。 同じポートを 2 つ以上の example が
 * 使うと、 先に取った 1 つだけが起動し、 残りは `Address already in use` で即座に
 * 落ちる (実測 = 32ms で exit 1)。 どれが先着になるかは実行ごとに変わるため、
 * 落ちる対象が毎回入れ替わる。
 *
 * 実測では 10 の example が `8545` を共有していた。 3 回連続実行で
 * `nextjs-aa-erc4337` / `nextjs-aa-smart-account` / `nextjs-aa-erc4337` と
 * 落ちる対象が入れ替わり、 これが唯一の原因だった。
 *
 * 起動が遅いのではない。 18 個を同時に起動する probe では、 機械が空いている時で
 * 最大 128ms、 全 core を埋めた時でも最大 1,099ms で立った。 待ち時間の既定
 * (10 秒) は 9 倍の余裕がある。
 */

// compile 後は `.vitest-dist/tests/` から走るため 4 階層上が repo root。
//
// `import.meta.dirname` は Node 20.11.0 追加で、 repo の下限 (>=20) を下回る
// 20.0-20.10 では undefined になり module 読込時に落ちる。 既存 24 件と同じ形にする。
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');
const EXAMPLES_DIR = join(REPO_ROOT, 'examples');

/**
 * example が使うローカルチェーンのポート。
 *
 * `port: 8545` (起動時の指定) と `ANVIL_PORT = 8545` (test / app 側の参照) の
 * 両方を拾う。 前者だけを見ると、 起動と参照がずれている example を見落とす。
 */
function collectChainPorts(name: string): Map<number, string[]> {
  const found = new Map<number, string[]>();
  for (const file of listSourceFiles(join(EXAMPLES_DIR, name))) {
    const text = readFileSync(file, 'utf8');
    const relative = file.slice(EXAMPLES_DIR.length + name.length + 2);
    for (const match of text.matchAll(/(?:port:\s*|ANVIL_PORT\s*=\s*)(8\d{3})\b/g)) {
      const port = Number(match[1]);
      found.set(port, [...(found.get(port) ?? []), relative]);
    }
  }
  return found;
}

/** example 配下の source を辿る。 生成物と依存は降りない。 */
function listSourceFiles(root: string, depth = 0): string[] {
  if (!existsSync(root) || depth > 5) return [];
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'out', 'coverage', '.vitest-dist'].includes(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;
      out.push(...listSourceFiles(join(root, entry.name), depth + 1));
      continue;
    }
    if (/\.(ts|tsx|mjs)$/.test(entry.name)) out.push(join(root, entry.name));
  }
  return out;
}

describe('ローカルチェーンのポートが重ならない (#1724)', () => {
  const owners = new Map<number, string[]>();
  if (existsSync(EXAMPLES_DIR)) {
    for (const entry of readdirSync(EXAMPLES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      for (const port of collectChainPorts(entry.name).keys()) {
        owners.set(port, [...(owners.get(port) ?? []), entry.name]);
      }
    }
  }

  it('同じポートを 2 つ以上の example が使わない', () => {
    const shared = [...owners.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([port, names]) => `${port} (${names.join(', ')})`)
      .sort();
    expect(
      shared,
      '並列実行で先着 1 つだけが起動し、 残りは Address already in use で落ちる。' +
        ` 該当: ${shared.join(' / ')}`,
    ).toEqual([]);
  });

  it('example の中でポートの指定が食い違わない', () => {
    // 起動時の指定と、 test / app 側の参照が別々の番号になっていると、
    // 起動は成功するのに繋がらない。
    const inconsistent: string[] = [];
    for (const entry of readdirSync(EXAMPLES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const ports = collectChainPorts(entry.name);
      // 複数チェーンを立てる example (`nextjs-multi-chain`) は別扱い。
      if (ports.size > 1 && !entry.name.includes('multi-chain')) {
        const detail = [...ports.entries()]
          .map(([port, files]) => `${port} (${files.join(', ')})`)
          .join(' / ');
        inconsistent.push(`${entry.name}: ${detail}`);
      }
    }
    expect(inconsistent).toEqual([]);
  });
});
