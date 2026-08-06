import { chmodSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { loadJson, loadLayerTable, resolveLayers } from '../src/detect/layers.js';

const TABLE = loadLayerTable();

/** A timestamp after every file the fixture writes, so nothing reads as stale. */
function fresh(): string {
  return new Date(Date.now() + 60_000).toISOString();
}

function fixture(files: Record<string, string>, stack: unknown | null): string {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-layers-'));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
  if (stack !== null) {
    mkdirSync(join(root, '.kiwa'), { recursive: true });
    writeFileSync(join(root, '.kiwa', 'stack.json'), JSON.stringify(stack, null, 2));
  }
  return root;
}

function runtimes(layers: { runtime: string | null }[]): Record<string, number> {
  return layers.reduce<Record<string, number>>((acc, layer) => {
    const key = layer.runtime ?? '?';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function withFixture<T>(root: string, body: () => T): T {
  try {
    return body();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('narrowing happens per runtime', () => {
  it('drops the runtimes whose manifests are absent and narrows the one that matched', () => {
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
    });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.source).toBe('detected');
      // `contract` survives because no reader looks for `foundry.toml`, so its
      // absence was never established.
      expect(runtimes(resolved.layers)).toEqual({ rust: 1, solidity: 1 });
      expect(resolved.layers.map((l) => l.id)).toContain('rust-axum');
    });
  });

  it('says which runtimes it excluded and why', () => {
    // `scan` reads the working directory and one level of declared workspace
    // members, so a Go service in an undeclared subdirectory is absent to it
    // and present to the project — its five layers stop being offered. The
    // exclusion is the better default; being unable to find out why is not.
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
    });
    withFixture(root, () => {
      const { warnings } = resolveLayers({ cwd: root });
      expect(warnings.join('\n')).toMatch(/excluded go: no go manifest/);
      expect(warnings.join('\n')).toMatch(/excluded typescript: no typescript manifest/);
    });
  });

  it('keeps every TypeScript layer, because nothing can detect them', () => {
    // `docs/stack-signals.json` carries no TypeScript signals — JS detection was
    // left out of #1812 because the corpus to measure it against does not
    // exist. Narrowing on an empty result would delete 19 layers on no evidence.
    const root = fixture({ 'package.json': '{"name":"app"}' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'package.json', language: 'typescript' }],
      detected: [],
    });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      const counts = runtimes(resolved.layers);
      expect(counts.typescript).toBe(TABLE.filter((l) => l.runtime === 'typescript').length);
      expect(counts.rust).toBeUndefined();
      expect(counts.go).toBeUndefined();
    });
  });

  it('does not let a Rust detection delete the TypeScript half of a monorepo', () => {
    // The case the first design got wrong: a Next.js frontend beside a Rust
    // service would have lost all 19 TypeScript layers silently.
    const root = fixture(
      { 'Cargo.toml': '[dependencies]\n', 'package.json': '{"name":"app"}' },
      {
        generated_at: fresh(),
        scanned: [
          { manifest: 'Cargo.toml', language: 'rust' },
          { manifest: 'package.json', language: 'typescript' },
        ],
        detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
      },
    );
    withFixture(root, () => {
      const counts = runtimes(resolveLayers({ cwd: root }).layers);
      expect(counts.typescript).toBe(TABLE.filter((l) => l.runtime === 'typescript').length);
      expect(counts.rust).toBe(1);
      expect(counts.go).toBeUndefined();
    });
  });
});

describe('absence is established by looking', () => {
  it('sees a Go module the workspace definition never named', async () => {
    // The case review flagged and the probe reproduced: root `package.json`,
    // an undeclared `services/api/go.mod`, and all five Go layers dropped with
    // no warning. `scan` cannot see it — it reads declared members, honouring
    // `!pkgs/skip`, which is right for reading dependencies and wrong as a
    // basis for concluding a language is absent.
    const { presentManifests } = await import('../src/detect/scan.js');
    const root = mkdtempSync(join(tmpdir(), 'kiwa-present-'));
    try {
      writeFileSync(join(root, 'package.json'), '{"name":"app"}');
      mkdirSync(join(root, 'services', 'api'), { recursive: true });
      writeFileSync(join(root, 'services', 'api', 'go.mod'), 'module x\n');
      expect(presentManifests(root).manifests.map((m) => m.path).sort()).toEqual([
        join('services', 'api', 'go.mod'),
        'package.json',
      ].sort());
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not read other people\'s manifests', async () => {
    const { presentManifests } = await import('../src/detect/scan.js');
    const root = mkdtempSync(join(tmpdir(), 'kiwa-present-skip-'));
    try {
      writeFileSync(join(root, 'package.json'), '{"name":"app"}');
      for (const noise of ['node_modules/dep', 'target/debug', '.next/cache']) {
        mkdirSync(join(root, noise), { recursive: true });
        writeFileSync(join(root, noise, 'Cargo.toml'), '[dependencies]\n');
      }
      expect(presentManifests(root).manifests.map((m) => m.language)).toEqual(['typescript']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not stop at a fixed depth', async () => {
    // A depth limit makes every project with a service one level further down
    // look like a project without one, and no depth is right for every layout:
    // three missed `apps/services/api`, four would miss the next shape.
    const { presentManifests } = await import('../src/detect/scan.js');
    const root = mkdtempSync(join(tmpdir(), 'kiwa-depth-'));
    try {
      writeFileSync(join(root, 'package.json'), '{"name":"app"}');
      mkdirSync(join(root, 'a', 'b', 'c', 'd', 'e'), { recursive: true });
      writeFileSync(join(root, 'a', 'b', 'c', 'd', 'e', 'go.mod'), 'module x\n');
      const found = presentManifests(root);
      expect(found.manifests.map((m) => m.language)).toContain('go');
      expect(found.complete).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reports that it stopped rather than reporting what it did not reach', async () => {
    // The budget is what makes an unbounded walk safe, and the flag is what
    // keeps a stopped walk from being read as an answer. Neither is observable
    // without being able to exhaust it.
    const { presentManifests } = await import('../src/detect/scan.js');
    const root = mkdtempSync(join(tmpdir(), 'kiwa-cap-'));
    try {
      writeFileSync(join(root, 'package.json'), '{"name":"app"}');
      mkdirSync(join(root, 'a', 'b', 'c'), { recursive: true });
      writeFileSync(join(root, 'a', 'b', 'c', 'go.mod'), 'module x\n');

      const stopped = presentManifests(root, 2);
      expect(stopped.complete).toBe(false);
      expect(stopped.manifests.map((m) => m.language)).not.toContain('go');

      const finished = presentManifests(root);
      expect(finished.complete).toBe(true);
      expect(finished.manifests.map((m) => m.language)).toContain('go');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not call a search finished when a directory could not be opened', async () => {
    // The same mistake as ignoring the budget, in a different guise: the Go
    // module is there, the search could not see it, and reporting the search as
    // finished would let the reader exclude all five Go layers.
    const { presentManifests } = await import('../src/detect/scan.js');
    const root = mkdtempSync(join(tmpdir(), 'kiwa-perm-'));
    const closed = join(root, 'services');
    try {
      writeFileSync(join(root, 'package.json'), '{"name":"app"}');
      mkdirSync(join(closed, 'api'), { recursive: true });
      writeFileSync(join(closed, 'api', 'go.mod'), 'module x\n');
      chmodSync(closed, 0o000);

      const result = presentManifests(root);
      expect(result.manifests.map((m) => m.language)).not.toContain('go');
      expect(result.complete).toBe(false);
    } finally {
      try {
        chmodSync(closed, 0o755);
      } catch {
        // Already gone, or never created.
      }
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('narrows nothing when the search did not finish', () => {
    // An unfinished search can say what it found and nothing about what it did
    // not — so it supports neither the exclusions, which rest on absence, nor
    // the within-language narrowing, since the crate that would have widened it
    // may be in the part that went unseen.
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
    });
    withFixture(root, () => {
      const resolved = resolveLayers({
        cwd: root,
        presence: { manifests: [{ path: 'Cargo.toml', language: 'rust' }], complete: false },
      });
      expect(resolved.source).toBe('all');
      expect(resolved.layers).toHaveLength(TABLE.length);
      expect(resolved.warnings.join(' ')).toMatch(/did not finish/);
    });
  });

  it('does not narrow a runtime whose manifests were not all read', () => {
    // `scan` follows the workspace definition, so an undeclared second crate is
    // never opened. Its framework could be anything, and narrowing to what the
    // declared crate said would drop the layer the undeclared one needs — the
    // language set alone cannot see this, because both crates are Rust.
    const root = fixture(
      {
        'Cargo.toml': '[dependencies]\n',
        'services/worker/Cargo.toml': '[dependencies]\nactix-web = "4"\n',
      },
      {
        generated_at: fresh(),
        scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
        detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
      },
    );
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.layers.filter((l) => l.runtime === 'rust')).toHaveLength(
        TABLE.filter((l) => l.runtime === 'rust').length,
      );
      expect(resolved.warnings.join('\n')).toMatch(/services\/worker\/Cargo\.toml was not read by both passes/);
    });
  });

  it('does not narrow when the read set names something the search never saw', () => {
    // The reverse asymmetry. `scan` follows the workspace definition into
    // places the search declines to enter (`dist`, `vendor`, dot-prefixed), so
    // a manifest can be read and not found. Either disagreement means the two
    // passes did not see the same project.
    // The file has to exist, or the recording is discarded as stale and the
    // fallback would make this pass without the branch under test running.
    const root = fixture(
      { 'Cargo.toml': '[dependencies]\n', 'vendor/inner/Cargo.toml': '[dependencies]\n' },
      {
        generated_at: fresh(),
        scanned: [
          { manifest: 'Cargo.toml', language: 'rust' },
          { manifest: 'vendor/inner/Cargo.toml', language: 'rust' },
        ],
        detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
      },
    );
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.layers.filter((l) => l.runtime === 'rust')).toHaveLength(
        TABLE.filter((l) => l.runtime === 'rust').length,
      );
      expect(resolved.warnings.join('\n')).toMatch(/vendor\/inner\/Cargo\.toml/);
    });
  });

  it('keeps a runtime whose only manifest sits where the search does not go', () => {
    // The sharper form of the same disagreement: with no Rust manifest visible
    // to the search, the runtime is absent from `present` altogether. Testing
    // absence before disagreement excluded all five layers on a search already
    // known not to cover them.
    const root = fixture(
      { 'package.json': '{"name":"app"}', 'vendor/inner/Cargo.toml': '[dependencies]\n' },
      {
        generated_at: fresh(),
        scanned: [
          { manifest: 'package.json', language: 'typescript' },
          { manifest: 'vendor/inner/Cargo.toml', language: 'rust' },
        ],
        detected: [],
      },
    );
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.layers.filter((l) => l.runtime === 'rust')).toHaveLength(
        TABLE.filter((l) => l.runtime === 'rust').length,
      );
      expect(resolved.warnings.join('\n')).not.toMatch(/excluded rust/);
    });
  });

  it('still narrows a runtime whose manifests were all read', () => {
    // The other half: an unread manifest is what suspends the narrowing, not
    // the mere possibility of one.
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
    });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.layers.filter((l) => l.runtime === 'rust').map((l) => l.id)).toEqual([
        'rust-axum',
      ]);
      expect(resolved.warnings.join('\n')).not.toMatch(/was not read/);
    });
  });

  it('suspends only the runtime with the unread manifest', () => {
    const root = fixture(
      {
        'Cargo.toml': '[dependencies]\n',
        'services/worker/Cargo.toml': '[dependencies]\n',
        'go.mod': 'module x\n',
      },
      {
        generated_at: fresh(),
        scanned: [
          { manifest: 'Cargo.toml', language: 'rust' },
          { manifest: 'go.mod', language: 'go' },
        ],
        detected: [
          { layer: 'rust-axum', manifest: 'Cargo.toml' },
          { layer: 'go-gin', manifest: 'go.mod' },
        ],
      },
    );
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.layers.filter((l) => l.runtime === 'rust')).toHaveLength(
        TABLE.filter((l) => l.runtime === 'rust').length,
      );
      expect(resolved.layers.filter((l) => l.runtime === 'go').map((l) => l.id)).toEqual(['go-gin']);
    });
  });

  it('sees a manifest added after the recording was taken', () => {
    // The recording answers for the moment it was taken. Reading which
    // languages exist from it would miss a `go.mod` added since — and the
    // staleness check cannot catch that, because it only knows the manifests
    // the recording already named.
    const root = fixture(
      { 'Cargo.toml': '[dependencies]\n', 'services/api/go.mod': 'module x\n' },
      {
        generated_at: fresh(),
        scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
        detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
      },
    );
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.layers.filter((l) => l.runtime === 'go')).toHaveLength(
        TABLE.filter((l) => l.runtime === 'go').length,
      );
      expect(resolved.warnings.join('\n')).not.toMatch(/excluded go/);
    });
  });

  it('keeps a runtime the project turns out to contain', () => {
    const root = fixture(
      { 'package.json': '{"name":"app"}', 'services/api/go.mod': 'module x\n' },
      {
        generated_at: fresh(),
        scanned: [{ manifest: 'package.json', language: 'typescript' }],
        detected: [],
      },
    );
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.layers.filter((l) => l.runtime === 'go')).toHaveLength(
        TABLE.filter((l) => l.runtime === 'go').length,
      );
      expect(resolved.warnings.join('\n')).not.toMatch(/excluded go/);
    });
  });

});

describe('an asset is taken from this package or not at all', () => {
  /** `dist/detect/` beside a `dist/<name>.json`, the shape a published install has. */
  function installed(assetBody: string | null): { start: string; root: string } {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-asset-'));
    const start = join(root, 'node_modules', '@kiwa-lab', 'cli', 'dist', 'detect');
    mkdirSync(start, { recursive: true });
    if (assetBody !== null) {
      writeFileSync(join(start, '..', 'layers.json'), assetBody);
    }
    return { start, root };
  }

  it('takes the copy the build put beside itself', () => {
    const { start, root } = installed('{"layers":[{"id":"from-the-package"}]}');
    withFixture(root, () => {
      const parsed = loadJson<{ layers: { id: string }[] }>('layers.json', start);
      expect(parsed?.layers[0]?.id).toBe('from-the-package');
    });
  });

  it('does not climb out of node_modules into the installing project', () => {
    // Without the boundary, an install whose asset went missing would adopt
    // the user's own `layers.json` and answer with their layers, consumer
    // skills and spec paths — as if they were ours.
    const { start, root } = installed(null);
    writeFileSync(join(root, 'layers.json'), '{"layers":[{"id":"theirs"}]}');
    mkdirSync(join(root, 'docs'), { recursive: true });
    writeFileSync(join(root, 'docs', 'layers.json'), '{"layers":[{"id":"theirs-too"}]}');
    withFixture(root, () => {
      expect(loadJson('layers.json', start)).toBeNull();
    });
  });

  it('refuses a corrupt asset instead of looking further up', () => {
    // Treating a parse failure as "not here" would walk past the real answer
    // and keep going until something else parsed.
    const { start, root } = installed('{ not json');
    withFixture(root, () => {
      expect(() => loadJson('layers.json', start)).toThrow(/not valid JSON/);
    });
  });
});

describe('a recording without a usable timestamp is discarded', () => {
  it('falls back when generated_at is absent', () => {
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, {
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
    });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.source).toBe('all');
      expect(resolved.warnings.join(' ')).toMatch(/no usable timestamp/);
    });
  });

  it('falls back when generated_at is not a date', () => {
    // Without the check the comparison against it is silently false and every
    // staleness test passes by accident.
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, {
      generated_at: 'sometime last week',
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
    });
    withFixture(root, () => {
      expect(resolveLayers({ cwd: root }).source).toBe('all');
    });
  });
});

describe('an explicit choice wins', () => {
  it('takes the flag over the detection', () => {
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
    });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root, explicit: 'contract' });
      expect(resolved.source).toBe('flag');
      expect(resolved.layers.map((l) => l.id)).toEqual(['contract']);
    });
  });

  it('rejects a layer the table does not declare', () => {
    const root = fixture({}, null);
    withFixture(root, () => {
      expect(() => resolveLayers({ cwd: root, explicit: 'nope' })).toThrow(/unknown layer/);
    });
  });

  it('treats an explicit all as every layer', () => {
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
    });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root, explicit: 'all' });
      expect(resolved.source).toBe('all');
      expect(resolved.layers).toHaveLength(TABLE.length);
    });
  });
});

describe('a recording that no longer describes the project is discarded', () => {
  it('falls back when a scanned manifest was edited afterwards', () => {
    // Adding `axum` to Cargo.toml without re-running detection would otherwise
    // narrow to the layer the project has moved off.
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, {
      generated_at: new Date(Date.now() - 60_000).toISOString(),
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [{ layer: 'rust-unit', manifest: 'Cargo.toml' }],
    });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.source).toBe('all');
      expect(resolved.layers).toHaveLength(TABLE.length);
      expect(resolved.warnings.join(' ')).toMatch(/changed after/);
    });
  });

  it('falls back when a scanned manifest is gone', () => {
    const root = fixture({}, {
      generated_at: fresh(),
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
    });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.source).toBe('all');
      expect(resolved.warnings.join(' ')).toMatch(/no longer exists/);
    });
  });

  it('falls back when the recording predates the scanned field', () => {
    // Without it, which languages were looked at is unknown, so no runtime can
    // be excluded on evidence.
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, {
      detected: [{ layer: 'rust-axum', manifest: 'Cargo.toml' }],
    });
    withFixture(root, () => {
      expect(resolveLayers({ cwd: root }).layers).toHaveLength(TABLE.length);
    });
  });
});

describe('an unusable recording is not an error', () => {
  it('falls back when there is no file at all', () => {
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, null);
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.source).toBe('all');
      expect(resolved.warnings).toEqual([]);
    });
  });

  it('falls back when the file is malformed', () => {
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, null);
    mkdirSync(join(root, '.kiwa'), { recursive: true });
    writeFileSync(join(root, '.kiwa', 'stack.json'), '{ not json');
    withFixture(root, () => {
      expect(resolveLayers({ cwd: root }).layers).toHaveLength(TABLE.length);
    });
  });

  it('discards the whole recording when it names a layer this build does not know', () => {
    const root = fixture({ 'Cargo.toml': '[dependencies]\n' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'Cargo.toml', language: 'rust' }],
      detected: [
        { layer: 'rust-axum', manifest: 'Cargo.toml' },
        { layer: 'rust-from-the-future', manifest: 'Cargo.toml' },
      ],
    });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      // This reverses the first version, which dropped the single entry and
      // narrowed on the rest. Review pointed out what that leaves behind: the
      // writer knew a layer this build does not, so the two came from different
      // tables, and the entries that happen to be recognised are recognised by
      // coincidence. Narrowing on them can take a runtime down to nothing.
      expect(resolved.source).toBe('all');
      expect(resolved.layers).toHaveLength(TABLE.length);
      expect(resolved.warnings.join(' ')).toMatch(/rust-from-the-future/);
    });
  });

  it('reports all when the detection narrowed nothing', () => {
    // Saying `detected` here would claim the recording did work it did not do.
    const root = fixture({ 'package.json': '{"name":"app"}', 'Cargo.toml': '[dependencies]\n', 'go.mod': 'module x\n' }, {
      generated_at: fresh(),
      scanned: [
        { manifest: 'package.json', language: 'typescript' },
        { manifest: 'Cargo.toml', language: 'rust' },
        { manifest: 'go.mod', language: 'go' },
      ],
      detected: TABLE.filter((l) => l.runtime === 'rust' || l.runtime === 'go').map((l) => ({
        layer: l.id,
        manifest: l.runtime === 'rust' ? 'Cargo.toml' : 'go.mod',
      })),
    });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.layers).toHaveLength(TABLE.length);
      expect(resolved.source).toBe('all');
    });
  });
});

describe('what --detect writes is what the resolver reads', () => {
  it('narrows on a recording produced by the writer, not a hand-built one', async () => {
    // Every other case here hand-writes `.kiwa/stack.json`, so the writer and
    // the reader were only ever tested against each other's description. Two
    // sides of one contract with nothing comparing them is the shape this whole
    // series of changes has been about.
    const { runCli } = await import('../src/runCli.js');
    const dir = mkdtempSync(join(tmpdir(), 'kiwa-roundtrip-'));
    try {
      writeFileSync(
        join(dir, 'Cargo.toml'),
        ['[dev-dependencies]', 'kiwa-test-rs = { version = "0.5", features = ["axum"] }'].join('\n'),
      );
      const code = await runCli(['init', '--detect'], {
        cwd: () => dir,
        stdout: () => {},
        stderr: () => {},
        execSync: () => '',
        spawn: (() => {
          throw new Error('not used');
        }) as never,
      });
      expect(code).toBe(0);

      const resolved = resolveLayers({ cwd: dir });
      expect(resolved.source).toBe('detected');
      expect(resolved.layers.map((l) => l.id)).toContain('rust-axum');
      // The Go layers go because `go.mod` was looked for and not found; the
      // TypeScript ones go for the same reason. `contract` stays because
      // nothing looks for `foundry.toml`.
      expect(resolved.layers.filter((l) => l.runtime === 'go')).toHaveLength(0);
      expect(resolved.layers.filter((l) => l.runtime === 'solidity')).toHaveLength(1);

      // Editing the manifest after the fact must send the reader back to the
      // fallback. This is what ties the writer's timestamp to the reader's
      // staleness check — without it the writer could record an empty one and
      // every other assertion would still pass.
      const later = new Date(Date.now() + 120_000);
      utimesSync(join(dir, 'Cargo.toml'), later, later);
      const afterEdit = resolveLayers({ cwd: dir });
      expect(afterEdit.source).toBe('all');
      expect(afterEdit.warnings.join(' ')).toMatch(/changed after/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
