// Behavior test for v1.18-6 publish PR (Issue #798). Asserts that the publish
// artefacts land in the exact shape the previous v1.16 / v1.17 publish PRs
// established, so accidental drift (wrong plugin.json version, missing
// announcement file, forgotten Roadmap ✅ row, wrong Cargo.toml version) fails
// the release gate loudly.
//
// The 5 axes checked here are pure data-file invariants — the mock harness
// behaviour + dogfood app behaviour is covered by their own package suites.
// v1.18 differs from v1.17 in that the primary publish surface is a Rust
// crate (`kiwa-test-rs` v0.5.0 → crates.io) rather than an npm package, so
// the last axis reads Cargo.toml + CHANGELOG.md instead of a changeset file.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 つ親 = repo root (`tests/release-smoke/.vitest-dist/tests/` 配下)
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

function readText(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

function readJson<T = unknown>(rel: string): T {
  return JSON.parse(readText(rel)) as T;
}

describe('v1.18-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.18.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.18.0');
    // The description v-marker was `v1.17` before this PR; the publish PR must
    // update it to `v1.18` so `claude plugins list` surfaces the right milestone.
    expect(plugin.description.startsWith('OSS test framework for dApps + web apps + full-stack frameworks (v1.18)')).toBe(true);
  });

  it('plugin.json keywords include the v1.18 Blockchain 深化 markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The 4 additional axes each need a discoverable keyword so plugin search
    // (e.g. `claude plugins search reth`) surfaces kiwa. `blockchain` is the
    // catch-all + one keyword per new module or axis (reth / foundry-rs /
    // invariant / fuzz / EIP-712 / Multicall3 / Permit2 / reorg / anvil-fork).
    for (const kw of ['blockchain', 'reth', 'reth-rs', 'foundry-rs', 'invariant-testing', 'fuzz-testing', 'eip-712', 'multicall3', 'permit2', 'reorg', 'anvil-fork']) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.18 row referencing the 6 sub-Issues #793-#798', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.18** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.18\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [793, 794, 795, 796, 797, 798]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.18/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 publish PRs all landed the
    // same 4-file set (gh-discussions + x-thread-en + x-thread-ja + zenn-article).
    // Missing any of these means the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.18/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.18 marker so we do not silently ship an empty
      // scaffold that copy-paste from v1.17 forgot to rename.
      expect(readText(rel)).toContain('v1.18');
    }
  });

  it('VitePress config.mts wires the Blockchain 深化 sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('Blockchain 深化 (v1.18)');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/25-reth-node-test',
      '/tutorials/26-foundry-invariant-fuzz',
      '/tutorials/27-dapp-e2e-reorg',
      '/migrations/v1.17-to-v1.18',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('kiwa-rs Cargo.toml version bumped to 0.5.0 with matching CHANGELOG row', () => {
    // kiwa-test-rs is the primary publish surface for v1.18 (crates.io, not
    // npm). Cargo.toml is the SSOT; `cargo publish` reads the version + name
    // from here. Version drift here = wrong crate version on crates.io.
    const cargo = readText('kiwa-rs/Cargo.toml');
    expect(cargo).toMatch(/version\s*=\s*"0\.5\.0"/);
    // The description mentions "kiwa Rust cargo test adapter" — we keep the
    // shape stable across releases so crates.io indexing stays consistent.
    expect(cargo).toContain('name = "kiwa-test-rs"');
    // CHANGELOG.md must carry a `## v0.5.0` row so `cargo publish` metadata
    // + docs.rs render + humans reading the file all agree on what shipped.
    const changelog = readText('kiwa-rs/CHANGELOG.md');
    expect(changelog).toMatch(/##\s*v0\.5\.0/);
    // The v0.5 row should reference Issue #793 (the parent kiwa-test-rs v0.5
    // sub-Issue). Broken link = readers cannot trace the change back.
    expect(changelog).toContain('#793');
  });
});
