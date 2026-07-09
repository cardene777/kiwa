import { readdirSync, readFileSync } from 'node:fs';
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

/**
 * License consistency guard.
 *
 * v2.18 switched the project to a proprietary "All rights reserved" license
 * while it is pre-release. Three surfaces declare a license independently
 * (root LICENSE, the plugin manifest, the marketplace entry) plus every
 * published package manifest. They drifted once already: LICENSE and all 43
 * package.json files were updated but the two .claude-plugin/*.json manifests
 * kept declaring MIT, which is what a marketplace user would actually see.
 *
 * These assertions fail loudly if any surface disagrees again.
 */
describe('license consistency across every declaring surface', () => {
  it('root LICENSE declares All rights reserved and no MIT grant remains', () => {
    const license = readText('LICENSE');
    expect(license).toContain('All rights reserved');
    expect(license).not.toContain('MIT License');
    expect(license).not.toContain('Permission is hereby granted, free of charge');
  });

  it('plugin manifest declares UNLICENSED', () => {
    expect(readJson<{ license: string }>('.claude-plugin/plugin.json').license).toBe('UNLICENSED');
  });

  it('marketplace entry declares UNLICENSED', () => {
    const mk = readJson<{ plugins: Array<{ license: string }> }>(
      '.claude-plugin/marketplace.json',
    );
    for (const plugin of mk.plugins) {
      expect(plugin.license).toBe('UNLICENSED');
    }
  });

  it('every packages/*/package.json declares UNLICENSED', () => {
    const pkgDir = resolve(REPO_ROOT, 'packages');
    const offenders: string[] = [];
    for (const name of readdirSync(pkgDir)) {
      let pkg: { name?: string; license?: string };
      try {
        pkg = readJson(`packages/${name}/package.json`);
      } catch {
        continue;
      }
      if (pkg.license !== 'UNLICENSED') {
        offenders.push(`${pkg.name ?? name}: ${pkg.license ?? '(missing)'}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('marketplace plugin version matches the plugin manifest version', () => {
    const pluginVersion = readJson<{ version: string }>('.claude-plugin/plugin.json').version;
    const mk = readJson<{ plugins: Array<{ name: string; version: string }> }>(
      '.claude-plugin/marketplace.json',
    );
    const kiwa = mk.plugins.find((p) => p.name === 'kiwa');
    expect(kiwa).toBeDefined();
    expect(kiwa?.version).toBe(pluginVersion);
  });

  it('no manifest still references the retired @kiwa/ scope', () => {
    for (const rel of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
      const src = readText(rel);
      expect(src, `${rel} still references the retired @kiwa/ scope`).not.toMatch(/@kiwa\/[a-z-]/);
    }
  });
});
