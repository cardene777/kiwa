// Behavior test for v1.28-6 publish PR (Issue #976). Asserts that the publish
// artefacts land in the exact shape the previous v1.17 / v1.18 / v1.19 / v1.20 /
// v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 publish PRs
// established, so accidental drift (wrong plugin.json version, missing
// announcement file, forgotten Roadmap ✅ row, wrong package.json version,
// dropped release script filter entry) fails the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the mock harness
// behaviour + per-package advanced realtime semantics behaviour is covered by
// each package's own suite. v1.28 mirrors the v1.21 / v1.22 / v1.23 / v1.24 /
// v1.25 / v1.26 / v1.27 shape (single primary publish surface — this time
// `@kiwa-test/realtime` v0.2.0 minor bump), so the axes read the existing
// `packages/realtime/package.json` invariants plus the v1.14 payment-omission
// -avoidance release script filter invariant. The v1.14 lesson: an npm package
// must appear in **both** the `pnpm -F {name} build` step **and** the
// `pnpm publish --filter {name}` step of `scripts.release`, or one half
// silently skips it. v1.28 fixes the exact miss the Issue #976 body called out
// — `@kiwa-test/realtime` was **not** in the filter before this PR (v1.14
// payment miss + v1.25 perf-harness fix + v1.27 quality-metrics fix pattern,
// 4th application of the same lesson, systematic root cause pattern SSOT).
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

describe('v1.28-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.28.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.28.0');
    // The description v-marker was `v1.27` before this PR; the publish PR must
    // update it to `v1.28` so `claude plugins list` surfaces the right
    // milestone.
    expect(
      plugin.description.startsWith(
        'OSS test framework for dApps + web apps + full-stack frameworks (v1.28)',
      ),
    ).toBe(true);
  });

  it('plugin.json keywords include the v1.28 realtime depth II markers (WebRTC + WebTransport + HTTP/3 + QUIC)', () => {
    const plugin = readJson<{ keywords: string[] }>('.claude-plugin/plugin.json');
    // The v1.28 additions need discoverable keywords so plugin search
    // (e.g. `claude plugins search webrtc` / `claude plugins search webtransport`)
    // surfaces kiwa. Catch-all + axis + protocol + technology-specific
    // keywords.
    for (const kw of [
      'webrtc',
      'webrtc-signaling',
      'webrtc-data-channel',
      'webrtc-media-track',
      'webrtc-ice-stun-turn',
      'sdp',
      'offer-answer',
      'ice-candidate',
      'renegotiation',
      'simulcast',
      'trickle-ice',
      'stun',
      'turn',
      'coturn',
      'mediasoup',
      'sfu',
      'p2p',
      'webtransport',
      'webtransport-unidirectional',
      'webtransport-bidirectional',
      'uni-stream',
      'bi-stream',
      'datagram',
      'http3',
      'http3-push',
      'server-push',
      'push-promise',
      'quic',
      'quic-multiplexing',
      'stream-multiplex',
      'stream-priority',
      'hpack',
      '0-rtt',
      '0-rtt-resumption',
      'connection-migration',
      'aioquic',
      'nginx-quic',
      'advanced-realtime',
      '8-axis-realtime',
      '24-row-grid',
      'realtime-fidelity',
      'webrtc-webtransport-testing',
    ]) {
      expect(plugin.keywords, `missing keyword: ${kw}`).toContain(kw);
    }
  });

  it('README Roadmap has a ✅ v1.28 row referencing the 6 sub-Issues #976/#977/#978/#979/#980/#983', () => {
    const readme = readText('README.md');
    // The Roadmap row uses the fixed `| ✅ **v1.28** |` prefix; downstream
    // release notes generator + CHANGELOG scraper key off this pattern.
    expect(readme).toMatch(/\|\s*✅\s*\*\*v1\.28\*\*\s*\|/);
    // Every one of the 6 sub-Issues must be linked in the resolved column so
    // clicking through leaves no dangling milestone entry.
    for (const num of [976, 977, 978, 979, 980, 983]) {
      expect(readme).toContain(`https://github.com/cardene777/kiwa/issues/${num}`);
    }
    // 6/6 resolved literal — the release gate copy is load-bearing here.
    expect(readme).toContain('**6/6 resolved**');
  });

  it('all 4 announcement files exist under docs/announcements/v1.28/', () => {
    // The v1.12 / v1.13 / v1.15 / v1.16 / v1.17 / v1.18 / v1.19 / v1.20 /
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 publish PRs all
    // landed the same 4-file set (gh-discussions + x-thread-en + x-thread-ja
    // + zenn-article). Missing any of these means the release lost its
    // distribution surface.
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.28/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      // File must contain the v1.28 marker so we do not silently ship an
      // empty scaffold that copy-paste from v1.27 forgot to rename.
      expect(readText(rel)).toContain('v1.28');
    }
  });

  it('VitePress config.mts wires the Realtime depth II (v1.28) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    // Sidebar label text — this is what shows up in the docs-site nav.
    expect(config).toContain('v1.28');
    // The 3 tutorial links + concept doc + migration guide must be wired into
    // the sidebar. Broken sidebar = reader cannot navigate to the tutorials
    // even if the pages exist.
    for (const link of [
      '/tutorials/52-webrtc-video-signaling',
      '/tutorials/53-webtransport-stream',
      '/tutorials/54-http3-multiplex',
      '/concepts/webrtc-webtransport-testing',
      '/migrations/v1.27-to-v1.28',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('realtime package.json minor-bumped to v0.2.0 with matching name + 8 new v0.2 semantics primitives on the src surface', () => {
    // The v1.28 primary publish surface is a single npm minor bump (same as
    // v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 — an existing
    // package extension, not a brand-new package like v1.20). `pnpm changeset
    // publish` reads this file as the SSOT; version drift here = wrong npm
    // version on the registry.
    const pkg = readJson<{ name: string; version: string }>('packages/realtime/package.json');
    expect(pkg.name).toBe('@kiwa-test/realtime');
    expect(pkg.version).toBe('0.2.0');
    // The package must ship a src/ + tests/ pair so the v1.28 advanced
    // semantics rollout has a compile-safe entry point (avoids empty-scaffold
    // publish accidents).
    expect(existsSync(resolve(REPO_ROOT, 'packages/realtime/src')), 'missing src/').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/realtime/tests')), 'missing tests/').toBe(true);
    // The 8 new v0.2 semantics primitives (`create{Axis}Mock` per axis) must
    // be exported from `src/semantics/index.ts` + `src/index.ts`. Any missing
    // export breaks the 24-row 3×8 fidelity grid rollout that depends on
    // them.
    const semanticsIndex = readText('packages/realtime/src/semantics/index.ts');
    for (const primitive of [
      'createWebRtcSignalingMock',
      'createWebRtcDataChannelMock',
      'createWebRtcTrackMock',
      'createWebRtcIceMock',
      'createWebTransportUniMock',
      'createWebTransportBiMock',
      'createHttp3PushMock',
      'createQuicMultiplexMock',
    ]) {
      expect(semanticsIndex, `missing v0.2 primitive in semantics/index.ts: ${primitive}`).toContain(
        primitive,
      );
    }
    const index = readText('packages/realtime/src/index.ts');
    for (const primitive of [
      'createWebRtcSignalingMock',
      'createWebRtcDataChannelMock',
      'createWebRtcTrackMock',
      'createWebRtcIceMock',
      'createWebTransportUniMock',
      'createWebTransportBiMock',
      'createHttp3PushMock',
      'createQuicMultiplexMock',
    ]) {
      expect(index, `missing v0.2 primitive in index.ts: ${primitive}`).toContain(primitive);
    }
  });

  it('release script filter now includes @kiwa-test/realtime (v1.14 payment + v1.25 perf-harness + v1.27 quality-metrics omission avoidance, 4th application, systematic root cause pattern SSOT)', () => {
    // v1.14 shipped `@kiwa-test/payment` but forgot to add it to the release
    // script filter; the miss was discovered in v1.23 (PR #912) and fixed as
    // a follow-up. v1.25 landed `@kiwa-test/perf-harness` in the filter
    // proactively (Issue #932). v1.27 fixed the exact miss for
    // `@kiwa-test/quality-metrics` (Issue #961). v1.28 fixes the exact miss
    // the Issue #976 body called out — `@kiwa-test/realtime` was **not** in
    // the filter before this PR (a 4th application of the same systematic
    // root cause pattern: any npm package reachable from the publish rollout
    // must appear in **both** the build filter and the publish filter).
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    // Both the `-F @kiwa-test/realtime` (build step) and the
    // `--filter @kiwa-test/realtime` (publish step) must be present; either
    // half alone is a partial fix that surfaces as a missing npm publish.
    expect(release, 'release script missing build filter for @kiwa-test/realtime').toContain(
      '-F @kiwa-test/realtime',
    );
    expect(release, 'release script missing publish filter for @kiwa-test/realtime').toContain(
      '--filter @kiwa-test/realtime',
    );
  });
});
