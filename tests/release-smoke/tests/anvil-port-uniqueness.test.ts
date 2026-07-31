import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * example が使うポートが互いに重ならないことを固定する (#1724)。
 *
 * ローカルチェーン (anvil) と web server (Next.js / Vite) の 2 系統を見る。
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
 *
 * web server 側も同じ形で落ちる。 `nextjs-aa-erc4337` と `nextjs-ens-resolver` が
 * どちらも 3042 を使っており、 後から起動した側が
 * `3042 is already used` で落ちた。
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

/**
 * example が使う web server のポート。
 *
 * `playwright.config.ts` の `url` / `baseURL` と、 `package.json` の
 * `next dev -p` / `next start -p` を拾う。 config だけを見ると、 起動と待受が
 * ずれている example を見落とす。
 */
function collectServerPorts(name: string): Set<number> {
  const found = new Set<number>();
  const config = join(EXAMPLES_DIR, name, 'playwright.config.ts');
  if (existsSync(config)) {
    for (const match of readFileSync(config, 'utf8').matchAll(/127\.0\.0\.1:(\d{4})/g)) {
      found.add(Number(match[1]));
    }
  }
  const manifest = join(EXAMPLES_DIR, name, 'package.json');
  if (existsSync(manifest)) {
    const scripts = (JSON.parse(readFileSync(manifest, 'utf8')) as {
      scripts?: Record<string, string>;
    }).scripts ?? {};
    for (const script of Object.values(scripts)) {
      for (const match of script.matchAll(/(?:next|vite)[^&|]*?-p\s+(\d{4})/g)) {
        found.add(Number(match[1]));
      }
    }
  }
  return found;
}

/** browser を起動する対象か。 */
function usesBrowser(dir: string): boolean {
  for (const sub of ['tests', 'src']) {
    for (const file of listSourceFiles(join(dir, sub))) {
      const text = readFileSync(file, 'utf8');
      if (/setupE2eEnv|setupBrowserComponentEnv|chromium\.launch/.test(text)) return true;
    }
  }
  return false;
}

function readScripts(dir: string): Record<string, string> {
  const manifest = join(dir, 'package.json');
  if (!existsSync(manifest)) return {};
  return (JSON.parse(readFileSync(manifest, 'utf8')) as {
    scripts?: Record<string, string>;
  }).scripts ?? {};
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

  const serverOwners = new Map<number, string[]>();
  if (existsSync(EXAMPLES_DIR)) {
    for (const entry of readdirSync(EXAMPLES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      for (const port of collectServerPorts(entry.name)) {
        serverOwners.set(port, [...(serverOwners.get(port) ?? []), entry.name]);
      }
    }
  }

  it('web server のポートを 2 つ以上の example が使わない', () => {
    const shared = [...serverOwners.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([port, names]) => `${port} (${names.join(', ')})`)
      .sort();
    expect(
      shared,
      '後から起動した側が `is already used` で落ちる。' + ` 該当: ${shared.join(' / ')}`,
    ).toEqual([]);
  });

  it('チェーンのポートを 2 つ以上の example が使わない', () => {
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

  it('browser を起動する対象は hook の待ち時間も指定している', () => {
    // `--testTimeout` は test 本体にしか効かない。 browser の起動と終了は
    // `beforeAll` / `afterEach` で行うため、 hook 側の既定 (10 秒) が効く。
    // 並列実行の負荷では終了だけで 10 秒を超える (#1724 実測 =
    // `full-stack-poc` の `afterEach` が `Hook timed out in 10000ms`)。
    const missing: string[] = [];
    for (const dir of ['packages', 'examples']) {
      const root = join(REPO_ROOT, dir);
      if (!existsSync(root)) continue;
      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (!usesBrowser(join(root, entry.name))) continue;
        const scripts = readScripts(join(root, entry.name));
        for (const [key, script] of Object.entries(scripts)) {
          if (!key.startsWith('test')) continue;
          for (const call of script.match(/vitest run [^&|]*/g) ?? []) {
            if (!call.includes('--hookTimeout')) missing.push(`${entry.name} (${key})`);
          }
        }
      }
    }
    expect(
      [...new Set(missing)].sort(),
      `browser の起動 / 終了が hook の既定 10 秒に収まらない。 該当: ${missing.join(', ')}`,
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
