import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
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

    // grant block 全体を照合する。 見出し語 1 語だけを見ると `You MAY ALSO` を `You MAY NOT` に
    // 書き換えても通ってしまう (review が実測)。
    const grant = [
      'You MAY ALSO, for the sole purpose of preparing and submitting a contribution',
      'to this repository:',
      '',
      '  - fork the repository, clone it, and create branches;',
      '  - modify the Software and build, run, and test your modifications locally;',
      '  - publish your fork on the hosting platform to the extent required to open a',
      '    pull request against this repository.',
    ].join('\n');
    expect(license, 'the contribution grant block no longer matches verbatim').toContain(grant);

    // 許諾を後段で打ち消していないか。 hosting platform への公開は上の許諾で明示的に除外する。
    expect(license).toContain(
      'Except for the publication\non the hosting platform described immediately above',
    );
  });

  it('references a DCO that exists in the repository', () => {
    // LICENSE と CONTRIBUTING が DCO を条件にする以上、 その本文が repo に無いと同意を確認できない。
    const dco = readText('DCO');
    expect(dco).toContain('Developer Certificate of Origin');
    expect(dco).toContain('Version 1.1');

    expect(readText('LICENSE')).toContain('version 1.1 as reproduced verbatim in the DCO file');
    expect(readText('CONTRIBUTING.md')).toContain('git commit -s');
  });

  it('every published surface declares the proprietary license', () => {
    // npm 以外の 3 package は PyPI / crates.io / pkg.go.dev から直接見える面で、
    // 最初の実装はここを丸ごと見落としていた (grep pattern が .toml を含んでいなかった)。
    const declarations: Array<[string, string]> = [
      ['kiwa-py/pyproject.toml', 'LicenseRef-Proprietary'],
      ['kiwa-py/README.md', 'All rights reserved'],
    ];

    for (const [rel, expected] of declarations) {
      expect(readText(rel), `${rel} does not declare the proprietary license`).toContain(expected);
    }
  });

  it('no contributor-facing surface claims an MIT grant', () => {
    // 語形を絞りすぎると `Licensed under MIT.` や `MIT-licensed` を見逃す (review が実測)。
    const mitClaim = /\bMIT\b/;
    const surfaces = [
      'CONTRIBUTING.md',
      'README.ja.md',
      'docs/.vitepress/config.mts',
      'kiwa-py/pyproject.toml',
      'kiwa-py/README.md',
    ];

    for (const rel of surfaces) {
      expect(readText(rel), `${rel} mentions MIT while LICENSE is All rights reserved`).not.toMatch(
        mitClaim,
      );
    }

    // README.md は milestone 履歴に MIT を含むため、 現行の宣言だけを見る。
    const readme = readText('README.md');
    expect(readme).not.toMatch(/license-MIT/);
    expect(readme).not.toMatch(/\[MIT\]\(\.\/LICENSE\)/);
  });

  it('no manifest still references the retired @kiwa/ scope', () => {
    for (const rel of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
      const src = readText(rel);
      expect(src, `${rel} still references the retired @kiwa/ scope`).not.toMatch(/@kiwa\/[a-z-]/);
    }
  });
});
