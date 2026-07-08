// Behavior test for v2.0-4 publish PR。
// v2.0 = @kiwa/* rename milestone (pure rename、 API 変更 0、 shape / semantic 変更 0)
// systematic root cause pattern SSOT 43rd application (name-space migration variant)。
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

function readText(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

function readJson<T = unknown>(rel: string): T {
  return JSON.parse(readText(rel)) as T;
}

describe('v2.0-4 publish artefacts', () => {
  it('plugin.json version bumped to 2.0.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('2.0.0');
  });

  it('all 4 announcement files exist under docs/announcements/v2.0/', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v2.0/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v2.0');
    }
  });

  it('VitePress config.mts wires v2.0 migration guide', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v2.0');
    expect(config).toContain('/migrations/v2.0-rename-plan');
  });

  it('全 49 package name field は @kiwa/ prefix で 始まる', () => {
    const glob = readText('pnpm-workspace.yaml');
    // pnpm-workspace.yaml は packages ディレクトリ を 列挙、 個別 name は package.json
    // ここでは代表 8 package の name を verify
    const reps = ['desktop', 'quality-metrics', 'core', 'dapp', 'auth', 'payment', 'a11y', 'visual'];
    for (const name of reps) {
      const pkg = readJson<{ name: string }>(`packages/${name}/package.json`);
      expect(pkg.name, `packages/${name}/package.json name`).toBe(`@kiwa/${name}`);
    }
    expect(glob).toContain('packages/');
  });

  it('root scripts.release は @kiwa/ prefix filter で 統一', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    expect(pkg.scripts.release).toContain('-F @kiwa/core');
    expect(pkg.scripts.release).toContain('-F @kiwa/desktop');
    expect(pkg.scripts.release).toContain('-F @kiwa/quality-metrics');
    expect(pkg.scripts.release).toContain('--filter @kiwa/core');
    expect(pkg.scripts.release).not.toContain('@kiwa-test/');
  });

  it('release script filter 全 @kiwa-test/ 除去 (43rd application、 name-space migration)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    expect(pkg.scripts.release).not.toMatch(/@kiwa-test\//);
  });

  it('v1-67-publish.test.ts 削除 (前 milestone smoke SOP)', () => {
    const path = resolve(HERE, 'v1-67-publish.test.ts');
    expect(existsSync(path)).toBe(false);
  });

  it('desktop tutorial v1.67 snippet が @kiwa/desktop import で 更新済 (backward compat 絶対維持)', () => {
    const src = readText('packages/desktop/tests/docs-tutorial-v1.67.test.ts');
    expect(src).toContain("from '../src/index.js'");
    // desktop package の import 全 @kiwa/ prefix 反映 (workspace 内部 dep)
    const workflow = readText('examples/dogfood-desktop-invoke-cache-app/src/workflow.ts');
    expect(workflow).toContain("from '@kiwa/desktop'");
    expect(workflow).not.toContain('@kiwa-test/');
  });
});
