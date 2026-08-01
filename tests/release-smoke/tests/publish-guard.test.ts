import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

function readJson<T = unknown>(rel: string): T {
  return JSON.parse(readFileSync(resolve(REPO_ROOT, rel), 'utf-8')) as T;
}

interface Manifest {
  name?: string;
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

function packagesWithWorkspaceDeps(): Array<{ dir: string; manifest: Manifest }> {
  const out: Array<{ dir: string; manifest: Manifest }> = [];
  for (const dir of readdirSync(resolve(REPO_ROOT, 'packages'))) {
    const rel = `packages/${dir}/package.json`;
    if (!existsSync(resolve(REPO_ROOT, rel))) continue;
    const manifest = readJson<Manifest>(rel);
    const deps = Object.values(manifest.dependencies ?? {});
    if (deps.some((v) => v.startsWith('workspace:'))) out.push({ dir, manifest });
  }
  return out;
}

/**
 * Guard against publishing an uninstallable package.
 *
 * Workspace siblings are declared with the `workspace:*` protocol. `pnpm publish`
 * rewrites those ranges to concrete versions inside the tarball; `npm publish`
 * uploads the protocol verbatim. A consumer then hits EUNSUPPORTEDPROTOCOL and
 * cannot install the package at all — while `npm publish` itself reported success.
 *
 * This exact failure shipped @kiwa-lab/lean@0.1.0, @kiwa-lab/lean@0.2.0 and
 * @kiwa-lab/spec-kit@0.1.0 as broken artifacts. The `prepublishOnly` guard added
 * afterwards makes `npm publish` fail loudly instead. These assertions keep the
 * guard wired to every package that could reproduce the fault.
 */
describe('publish guard against unresolved workspace: ranges', () => {
  it('the guard script exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'scripts/assert-pnpm-publish.mjs'))).toBe(true);
  });

  it('every package with workspace deps wires prepublishOnly to the guard', () => {
    const offenders: string[] = [];
    for (const { dir, manifest } of packagesWithWorkspaceDeps()) {
      const hook = manifest.scripts?.prepublishOnly;
      if (hook !== 'node ../../scripts/assert-pnpm-publish.mjs') {
        offenders.push(`${manifest.name ?? dir}: ${hook ?? '(missing)'}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the guard covers a non-trivial number of packages', () => {
    // If a refactor drops workspace deps everywhere this test would silently pass,
    // so pin the shape of the workspace we are actually protecting.
    expect(packagesWithWorkspaceDeps().length).toBeGreaterThanOrEqual(30);
  });

  it('the guard rejects a non-pnpm user agent', () => {
    const script = resolve(REPO_ROOT, 'scripts/assert-pnpm-publish.mjs');
    let exitCode = 0;
    let stderr = '';
    try {
      execFileSync(process.execPath, [script], {
        env: { ...process.env, npm_config_user_agent: 'npm/10.0.0 node/v22.0.0' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      const e = err as { status?: number; stderr?: Buffer };
      exitCode = e.status ?? -1;
      stderr = e.stderr?.toString('utf-8') ?? '';
    }
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Refusing to publish');
    expect(stderr).toContain('EUNSUPPORTEDPROTOCOL');
  });

  it('the guard accepts a pnpm user agent from the root release', () => {
    const script = resolve(REPO_ROOT, 'scripts/assert-pnpm-publish.mjs');
    expect(() =>
      execFileSync(process.execPath, [script], {
        env: {
          ...process.env,
          npm_config_user_agent: 'pnpm/10.33.2 npm/? node/v22.0.0',
          KIWA_RELEASE: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    ).not.toThrow();
  });

  it('the guard rejects pnpm outside the root release', () => {
    // `clean-dist.mjs` は root の `release` の先頭でしか走らない。
    // `pnpm publish --filter <package>` はそれを迂回し、 `files: ["dist"]` の
    // 中身をそのまま tarball に載せる (#1750 review)。
    const script = resolve(REPO_ROOT, 'scripts/assert-pnpm-publish.mjs');
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      npm_config_user_agent: 'pnpm/10.33.2 npm/? node/v22.0.0',
    };
    delete env['KIWA_RELEASE'];
    let exitCode = 0;
    let stderr = '';
    try {
      execFileSync(process.execPath, [script], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      const e = err as { status?: number; stderr?: Buffer };
      exitCode = e.status ?? -1;
      stderr = e.stderr?.toString('utf-8') ?? '';
    }
    expect(exitCode).toBe(1);
    expect(stderr).toContain('outside the root release');
    expect(stderr).toContain('pnpm release');
  });

  it('the release script publishes through pnpm, not npm', () => {
    const release = readJson<{ scripts: { release: string } }>('package.json').scripts.release;
    expect(release).toContain('pnpm publish');
    expect(release).not.toMatch(/(^|\s|&&\s*)npm publish/);
  });
});
