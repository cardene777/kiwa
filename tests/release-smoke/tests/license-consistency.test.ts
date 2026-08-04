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

  // GH #1792 — 貢献条件とライセンスの矛盾。 LICENSE は PR を歓迎すると書きながら、 その PR を
  // 作るのに必要な fork / 複製 / 変更を禁じていた。 同時に CONTRIBUTING.md は貢献物が MIT に
  // なると書き、 README 2 本と VitePress footer も MIT を掲げていた。 外部貢献者は「PR を出して
  // よいか」 も「貢献物がどう扱われるか」 も文書から判断できなかった。
  //
  // 上の LICENSE 検査だけでは、 これらの面が MIT に戻っても気付けない。
  it('LICENSE grants what CONTRIBUTING instructs contributors to do', () => {
    const license = readText('LICENSE');
    const contributing = readText('CONTRIBUTING.md');

    // CONTRIBUTING が fork を指示する以上、 LICENSE 側にその許諾が要る。
    expect(
      contributing,
      'CONTRIBUTING no longer instructs contributors to fork; the grant assertion below is stale',
    ).toContain('Fork and clone the repository');
    expect(
      license,
      'CONTRIBUTING tells contributors to fork, but LICENSE grants no such permission',
    ).toContain('fork the repository, clone it, and create branches');
    // 許諾が目的限定であることを明示する文が要る (無制限の fork 許諾と読ませない)。
    expect(license).toContain('This contribution grant is limited to that purpose');
    // 禁止 list が許諾より前にあるため、 例外への参照が無いと字面が衝突する。
    expect(license).toContain('Except as expressly permitted in the two grants below');
  });

  it('no contributor-facing surface claims an MIT grant', () => {
    const surfaces: Array<[string, RegExp]> = [
      ['CONTRIBUTING.md', /licensed under the MIT License/],
      ['README.md', /license-MIT|\[MIT\]\(\.\/LICENSE\)/],
      ['README.ja.md', /license-MIT|\[MIT\]\(\.\/LICENSE\)/],
      ['docs/.vitepress/config.mts', /Released under the MIT License/],
    ];

    for (const [rel, pattern] of surfaces) {
      expect(
        readText(rel),
        `${rel} claims an MIT grant while LICENSE is All rights reserved`,
      ).not.toMatch(pattern);
    }
  });

  it('no manifest still references the retired @kiwa/ scope', () => {
    for (const rel of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
      const src = readText(rel);
      expect(src, `${rel} still references the retired @kiwa/ scope`).not.toMatch(/@kiwa\/[a-z-]/);
    }
  });
});
