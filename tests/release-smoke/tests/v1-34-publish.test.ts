// Behavior test for v1.34-6 publish PR (Issue #1053). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 / v1.30 /
// v1.31 / v1.32 / v1.33 publish PRs established, so accidental drift (wrong
// plugin.json version, missing announcement file, forgotten Roadmap ✅ row,
// wrong package.json version, dropped release script filter entry) fails the
// release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the frontend
// deepening behaviour (RSC harness + streaming SSR + view transitions + form
// action advanced + server action advanced + PPR + interception routes +
// parallel routes advanced) is covered by `@kiwa-test/component` v0.3 +
// `@kiwa-test/nextjs` v1.2 own suites (328 semantics tests already landed in
// v1.34-1). v1.34 diverges from the v1.13+ "single primary publish surface"
// shape — it lands a **pair** publish surface (component v0.2.0 → v0.3.0 +
// nextjs v1.1.0 → v1.2.0) because the frontend deepening spans two adapter
// packages (Storybook-8 component test harness + Next.js 15 App Router
// adapter) rather than a single provider layer. The axes verify both
// packages hold the expected version bumps + both remain in the release
// script filter halves (v1.14 payment-omission-avoidance pattern SSOT
// applied per-package, 9th application).
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

describe('v1.34-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.34.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.34.0');
    // The description v-marker was `v1.33` before this PR; the publish PR must
    // update it to `v1.34` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.34)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.34 frontend deepening markers', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.34 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search frontend-real-driver` /
    // `claude plugins search rsc-streaming-ssr`) surfaces kiwa.
    for (const kw of [
      'frontend-deepening',
      'frontend-real-driver',
      'vertical-pair-sixth',
      'component-v0-3',
      'nextjs-v1-2',
      'rsc-harness',
      'rsc-suspense-boundary',
      'streaming-ssr',
      'selective-hydration',
      'view-transitions',
      'element-transition',
      'document-transition',
      'form-action-advanced',
      'useformstatus',
      'useoptimistic',
      'server-action-advanced',
      'revalidatepath',
      'revalidatetag',
      'redirect-action',
      'partial-prerendering',
      'ppr',
      'static-shell',
      'dynamic-hole',
      'interception-routes',
      'intercepting-routes',
      'intercepted-modal',
      'parallel-routes-advanced',
      'default-slot',
      'loading-slot',
      'component-8-axis-advanced',
      'nextjs-8-axis-advanced',
      'frontend-24-cell-fidelity-grid',
      'frontend-real-driver-testing-ssot',
      'storybook-8-mdx',
      'nextjs-rsc-streaming-app',
      'nextjs-server-action-app',
      'snippet-validation-12-milestone-streak',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.34 row referencing the 6 sub-Issues #1048/#1049/#1050/#1051/#1052/#1053', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.34** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.34\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [1048, 1049, 1050, 1051, 1052, 1053]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.34/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 /
    // v1.30 / v1.31 / v1.32 / v1.33 publish PRs all landed the same 4-file set
    // (gh-discussions + x-thread-en + x-thread-ja + zenn-article). Missing
    // any of these means the release lost its distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.34/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.34 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.33 forgot to rename.
      expect(readText(rel)).toContain('v1.34');
    }
  });

  it('VitePress config.mts wires the frontend deepening (v1.34) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.34');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/67-rsc-streaming-ssr',
      '/tutorials/68-server-action-optimistic',
      '/tutorials/69-storybook-8-mdx',
      '/concepts/frontend-real-driver-testing',
      '/migrations/v1.33-to-v1.34',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/component + @kiwa-test/nextjs package.json are v0.3.0 + v1.2.0 (v1.34 pair publish surface, existing packages minor bump)', () => {
    // The v1.34 primary publish surface is a **pair** — `@kiwa-test/component`
    // v0.2.0 → v0.3.0 + `@kiwa-test/nextjs` v1.1.0 → v1.2.0. This diverges
    // from the v1.13+ single-surface shape because the frontend deepening
    // spans two adapter packages (Storybook-8 component test harness +
    // Next.js 15 App Router adapter). `pnpm changeset publish` reads both
    // files as the SSOT; version drift here = wrong npm version on the
    // registry.
    const component = readJson<{ name: string; version: string }>(
      'packages/component/package.json',
    );
    expect(component.name).toBe('@kiwa-test/component');
    expect(component.version).toBe('0.3.0');
    // The component package must ship a src/ + tests/ pair so the v1.34
    // 4 advanced axis harness has a compile-safe entry point (avoids
    // empty-scaffold publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/component/src')), 'missing component src/').toBe(
      true,
    );
    expect(
      existsSync(resolve(REPO_ROOT, 'packages/component/tests')),
      'missing component tests/',
    ).toBe(true);

    const nextjs = readJson<{ name: string; version: string }>('packages/nextjs/package.json');
    expect(nextjs.name).toBe('@kiwa-test/nextjs');
    expect(nextjs.version).toBe('1.2.0');
    expect(existsSync(resolve(REPO_ROOT, 'packages/nextjs/src')), 'missing nextjs src/').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/nextjs/tests')), 'missing nextjs tests/').toBe(
      true,
    );
  });

  it('release script filter contains @kiwa-test/component + @kiwa-test/nextjs in both -F build and --filter publish halves (v1.14 payment omission avoidance, 9th application, systematic root cause pattern SSOT backed by v1.29-1 fail-fast axis)', () => {
    // v1.14 shipped `@kiwa-test/payment` but forgot to add it to the release
    // script filter; the miss was discovered in v1.23 (PR #912) and fixed as
    // a follow-up. v1.25 landed `@kiwa-test/perf-harness` in the filter
    // proactively (Issue #932). v1.27 fixed the exact miss for
    // `@kiwa-test/quality-metrics` (Issue #961). v1.28 fixed the exact miss
    // for `@kiwa-test/realtime` (Issue #976). v1.29 landed the exact fix for
    // the brand-new `@kiwa-test/release-invariants` package (Issue #988).
    // v1.30 verified the existing `@kiwa-test/a11y` package remains in both
    // halves. v1.31 verified the existing `@kiwa-test/streaming` package
    // remains in both halves. v1.32 verified the existing `@kiwa-test/orm`
    // package remains in both halves. v1.33 verified the existing
    // `@kiwa-test/payment` package remains in both halves. v1.34 verifies
    // both `@kiwa-test/component` + `@kiwa-test/nextjs` remain in both
    // halves — the pair publish surface makes v1.34 the first milestone to
    // exercise the per-package filter guard with 2 packages. The pattern
    // SSOT is fully backed by v1.29-1's fail-fast release-script-filter.test.ts
    // axis, but v1.34-6 still verifies the primary publish surface is
    // present in both halves as a per-milestone shape guard. This is the
    // 9th application of the systematic root cause pattern.
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/component` (build step) and the
    // `--filter @kiwa-test/component` (publish step) must be present.
    expect(
      release,
      'release script missing build filter for @kiwa-test/component',
    ).toContain('-F @kiwa-test/component');
    expect(
      release,
      'release script missing publish filter for @kiwa-test/component',
    ).toContain('--filter @kiwa-test/component');
    // Both the `-F @kiwa-test/nextjs` (build step) and the
    // `--filter @kiwa-test/nextjs` (publish step) must be present.
    expect(
      release,
      'release script missing build filter for @kiwa-test/nextjs',
    ).toContain('-F @kiwa-test/nextjs');
    expect(
      release,
      'release script missing publish filter for @kiwa-test/nextjs',
    ).toContain('--filter @kiwa-test/nextjs');
  });
});
