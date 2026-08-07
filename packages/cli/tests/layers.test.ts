import { chmodSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { loadJson, loadLayerTable, outputMap, resolveLayers, strList } from '../src/detect/layers.js';
import { signalsFingerprint, type SignalTable } from '../src/detect/detect.js';
import { loadSignalTable } from '../src/detect/index.js';

/** The table the CLI actually loads, so fixtures fingerprint what it will read. */
const SIGNALS = loadSignalTable() as SignalTable;

const TABLE = loadLayerTable();

/**
 * TypeScript layers that no signal names, so no detection can rule them out.
 *
 * Counted from the table rather than written as 14, because the number moves
 * the moment a signal is added — and a stale literal would read as the count
 * still holding.
 */
const UNDETECTABLE_TS = TABLE.filter(
  (l) => l.runtime === 'typescript' && !l.id.startsWith('nextjs-'),
).length;

/** A timestamp after every file the fixture writes, so nothing reads as stale. */
function fresh(): string {
  return new Date(Date.now() + 60_000).toISOString();
}

/**
 * A project directory with an optional recording.
 *
 * The recording is stamped with the fingerprint of the table it will be read
 * against, because the reader rejects one that cannot say which table produced
 * it. Tests that inject a table pass it here so the two agree; tests about the
 * rejection itself put their own `signals` in `stack`, which wins.
 */
function fixture(
  files: Record<string, string>,
  stack: unknown | null,
  signalTable: SignalTable | null = SIGNALS,
): string {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-layers-'));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
  if (stack !== null) {
    mkdirSync(join(root, '.kiwa'), { recursive: true });
    const body =
      stack && typeof stack === 'object' && !Array.isArray(stack)
        ? { signals: signalsFingerprint(signalTable), ...(stack as Record<string, unknown>) }
        : stack;
    writeFileSync(join(root, '.kiwa', 'stack.json'), JSON.stringify(body, null, 2));
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

  it('keeps the TypeScript layers no signal can detect', () => {
    // Narrowing on an empty result would delete layers on no evidence. Which
    // layers that applies to is asked per layer, not per language: `next` names
    // the five `nextjs-*` ones, so their absence from a manifest with no
    // dependencies is evidence and they go. Nothing names the other fourteen.
    const root = fixture({ 'package.json': '{"name":"app"}' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'package.json', language: 'typescript' }],
      detected: [],
    });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      const counts = runtimes(resolved.layers);
      expect(counts.typescript).toBe(UNDETECTABLE_TS);
      expect(resolved.layers.filter((l) => l.id.startsWith('nextjs-'))).toHaveLength(0);
      expect(counts.rust).toBeUndefined();
      expect(counts.go).toBeUndefined();
    });
  });

  it('does not let a Rust detection delete the TypeScript half of a monorepo', () => {
    // The case the first design got wrong: a Rust service beside a JS package
    // would have lost every TypeScript layer silently. What survives is now
    // decided by TypeScript's own evidence — the `package.json` here has no
    // dependencies, so the five `nextjs-*` layers go and the rest stay.
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
      expect(counts.typescript).toBe(UNDETECTABLE_TS);
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
    //
    // Every narrowable layer has to be detected for that to hold, which now
    // includes the five `nextjs-*` ones — so the fixture depends on `next`.
    // Leaving it out ruled them out, and the recording then did do work.
    const narrowable = (l: { id: string; runtime: string | null }): boolean =>
      l.runtime === 'rust' || l.runtime === 'go' || l.id.startsWith('nextjs-');
    const manifestFor = (l: { id: string; runtime: string | null }): string =>
      l.runtime === 'rust' ? 'Cargo.toml' : l.runtime === 'go' ? 'go.mod' : 'package.json';
    const root = fixture({ 'package.json': '{"dependencies":{"next":"^15.0.0"}}', 'Cargo.toml': '[dependencies]\n', 'go.mod': 'module x\n' }, {
      generated_at: fresh(),
      scanned: [
        { manifest: 'package.json', language: 'typescript' },
        { manifest: 'Cargo.toml', language: 'rust' },
        { manifest: 'go.mod', language: 'go' },
      ],
      detected: TABLE.filter(narrowable).map((l) => ({ layer: l.id, manifest: manifestFor(l) })),
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

describe('a layer is narrowable only when a signal names it', () => {
  // Narrowing asks "was it detected", and that only means something for a layer
  // some signal could have detected. Coverage is uneven within a language, so
  // the question is asked per layer: `orm-query` here is named and absent, so
  // it goes; the layers nothing names stay regardless.
  const MANIFESTS = { 'Cargo.toml': 'rust', 'go.mod': 'go', 'package.json': 'typescript' };
  const ORM: Record<string, unknown> = {
    match: 'drizzle-orm',
    layer: 'orm-query',
    strength: 'exact',
  };

  // The recording is stamped with the injected table's fingerprint, because the
  // reader rejects one taken with a different table before it narrows anything.
  function withEmptyProject<T>(signalTable: SignalTable, body: (root: string) => T): T {
    const root = fixture(
      { 'package.json': '{"name":"app"}' },
      {
        generated_at: fresh(),
        scanned: [{ manifest: 'package.json', language: 'typescript' }],
        detected: [],
      },
      signalTable,
    );
    return withFixture(root, () => body(root));
  }

  const ids = (layers: { id: string }[]) => layers.map((l) => l.id);

  it('drops a layer the generated half names', () => {
    const table = {
      manifests: MANIFESTS,
      signals: { typescript: [] },
      generated: { signals: [{ ...ORM, language: 'typescript' }] },
    } as never as SignalTable;
    withEmptyProject(table, (root) => {
      const resolved = resolveLayers({ cwd: root, signalTable: table });
      expect(ids(resolved.layers)).not.toContain('orm-query');
      // Same runtime, same recording, no signal names it.
      expect(ids(resolved.layers)).toContain('unit');
    });
  });

  it('drops a layer the hand-written half names', () => {
    const table = {
      manifests: MANIFESTS,
      signals: { typescript: [ORM] },
      generated: { signals: [] },
    } as never as SignalTable;
    withEmptyProject(table, (root) => {
      const resolved = resolveLayers({ cwd: root, signalTable: table });
      expect(ids(resolved.layers)).not.toContain('orm-query');
      expect(ids(resolved.layers)).toContain('unit');
    });
  });

  it('keeps it when no signal names it', () => {
    const table: SignalTable = {
      manifests: MANIFESTS,
      signals: { typescript: [] },
      generated: { signals: [] },
    };
    withEmptyProject(table, (root) => {
      const resolved = resolveLayers({ cwd: root, signalTable: table });
      expect(ids(resolved.layers)).toContain('orm-query');
    });
  });

  it('counts a layer named only through also', () => {
    // `also` is how one dependency implies several layers. Reading only `layer`
    // and `default` would leave those unnarrowable while the signal that names
    // them is right there.
    const table = {
      manifests: MANIFESTS,
      signals: {
        typescript: [{ match: 'x', default: 'unit', also: ['orm-query'], strength: 'exact' }],
      },
      generated: { signals: [] },
    } as never as SignalTable;
    withEmptyProject(table, (root) => {
      const resolved = resolveLayers({ cwd: root, signalTable: table });
      expect(ids(resolved.layers)).not.toContain('orm-query');
      expect(ids(resolved.layers)).not.toContain('unit');
      expect(ids(resolved.layers)).toContain('data');
    });
  });

  it('counts a layer named only through a feature map', () => {
    const table = {
      manifests: MANIFESTS,
      signals: {
        typescript: [
          { match: 'x', kind: 'feature', features: { q: 'orm-query' }, strength: 'exact' },
        ],
      },
      generated: { signals: [] },
    } as never as SignalTable;
    withEmptyProject(table, (root) => {
      const resolved = resolveLayers({ cwd: root, signalTable: table });
      expect(ids(resolved.layers)).not.toContain('orm-query');
      expect(ids(resolved.layers)).toContain('unit');
    });
  });
});

describe('a recording has to come from the table it is read against', () => {
  // The staleness check compares the recording to the project, so it cannot see
  // that the signal table changed underneath. A recording taken before `next`
  // existed says nothing about the five `nextjs-*` layers, and reading its
  // silence as absence removes exactly what the signal was added to find.
  const project = { 'package.json': '{"dependencies":{"next":"^15.0.0"}}' };
  const recording = {
    generated_at: fresh(),
    scanned: [{ manifest: 'package.json', language: 'typescript' }],
    detected: [],
  };

  it('falls back when the recording names no table', () => {
    // What every `.kiwa/stack.json` written before this field looks like.
    const root = fixture(project, { ...recording, signals: undefined });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.source).toBe('all');
      expect(resolved.warnings.join(' ')).toMatch(/does not record which signal table/);
      expect(resolved.layers.filter((l) => l.id.startsWith('nextjs-'))).toHaveLength(5);
    });
  });

  it('says the table was unreadable rather than that it differed', () => {
    // Without this branch the two cases collapse: a missing table makes the
    // expected fingerprint empty, which no recorded one equals, so the reader
    // would report "a different signal table" for a table that is not there.
    // The outcome is the same either way — the diagnosis is not.
    const root = fixture(project, recording, null);
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root, signalTable: null });
      expect(resolved.source).toBe('all');
      expect(resolved.warnings.join(' ')).toMatch(/signal table could not be read/);
      expect(resolved.warnings.join(' ')).not.toMatch(/different signal table/);
    });
  });

  it('falls back when the recording names a different table', () => {
    const root = fixture(project, { ...recording, signals: 'deadbeefdeadbeef' });
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.source).toBe('all');
      expect(resolved.warnings.join(' ')).toMatch(/different signal table/);
      expect(resolved.layers.filter((l) => l.id.startsWith('nextjs-'))).toHaveLength(5);
    });
  });

  it('uses the recording when the table matches', () => {
    // The other side of the same check: without this, rejecting everything
    // would satisfy the two above.
    const root = fixture(project, recording);
    withFixture(root, () => {
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.source).toBe('detected');
      expect(resolved.layers.filter((l) => l.id.startsWith('nextjs-'))).toHaveLength(0);
    });
  });

  it('is not disturbed by reformatting or reordering the table', () => {
    // Key order and whitespace do not change which layers a dependency yields.
    // Invalidating every recording over a reformat costs a re-run for nothing.
    const reordered: SignalTable = {
      manifests: SIGNALS.manifests,
      generated: SIGNALS.generated,
      signals: Object.fromEntries(Object.entries(SIGNALS.signals).reverse()),
    };
    expect(signalsFingerprint(reordered)).toBe(signalsFingerprint(SIGNALS));
  });

  it('changes when a signal changes', () => {
    const edited: SignalTable = {
      ...SIGNALS,
      signals: { ...SIGNALS.signals, typescript: [] },
    };
    expect(signalsFingerprint(edited)).not.toBe(signalsFingerprint(SIGNALS));
  });

  it('what the writer records is what the reader accepts', async () => {
    // The two sides derive the fingerprint independently. A test that only
    // checked the reader would pass with a writer that never wrote one.
    const { writeStackFile } = await import('../src/detect/index.js');
    const root = mkdtempSync(join(tmpdir(), 'kiwa-roundtrip-'));
    try {
      writeFileSync(join(root, 'package.json'), '{"dependencies":{"next":"^15.0.0"}}');
      writeStackFile(
        root,
        [{ layer: 'nextjs-rsc', signal: 'next', manifest: 'package.json', strength: 'exact' }],
        [{ path: 'package.json', language: 'typescript' }],
        new Date(Date.now() + 60_000),
      );
      const resolved = resolveLayers({ cwd: root });
      expect(resolved.warnings.join(' ')).not.toMatch(/signal table/);
      expect(resolved.source).toBe('detected');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
describe('the layer table is mirrored, not selected from', () => {
  // Projecting a subset makes a second, narrower contract over the same SSOT:
  // `docs/layers.json` declares what a layer needs and the only programmatic
  // reader answers with less. Choosing which fields to pass is itself the
  // drift, because the choice has to be remade every time a field is added.
  const raw = loadJson<{ layers: Record<string, unknown>[] }>('layers.json')!;

  it('every field in layers.json survives the projection', () => {
    const declared = new Set(raw.layers.flatMap((row) => Object.keys(row)));
    const produced = new Set(Object.keys(TABLE[0]!));
    expect([...declared].sort()).toEqual([...produced].sort());
  });

  it('carries the providers and how they are chosen', () => {
    // The case that motivated this. Without these two, a caller cannot narrow
    // and `kiwa-auth` generates all five providers for an app using one.
    const auth = TABLE.find((l) => l.id === 'auth')!;
    expect(auth.providers).toEqual(['nextauth', 'lucia', 'better-auth', 'clerk', 'auth0']);
    expect(auth.selected_by).toBe('kiwa-auth --provider');
  });

  it('carries variants, which are chosen without a flag', () => {
    const orm = TABLE.find((l) => l.id === 'orm-query')!;
    expect(orm.variants).toEqual(['drizzle', 'prisma', 'kysely']);
    expect(orm.selected_by).toMatch(/kiwa-orm/);
  });

  it('carries where each consuming skill writes', () => {
    const nextjs = TABLE.find((l) => l.id === 'nextjs-rsc')!;
    // `.rsc.md` の spec を読む layer なので出力も `.rsc.test.ts`。 #1844 で
    // 5 mode が 1 file を奪い合う形を解いた時に変わった。
    expect(nextjs.test_outputs).toEqual({
      'kiwa-nextjs': ['{example}/tests/integration/{module}.rsc.test.ts'],
    });
  });

  it('keeps lists and maps as lists and maps', () => {
    // Passing them through `str()` would turn every one into null, which reads
    // as "not declared" for a field that is declared and non-empty.
    for (const layer of TABLE) {
      expect(Array.isArray(layer.providers)).toBe(true);
      expect(Array.isArray(layer.targets)).toBe(true);
      expect(Array.isArray(layer.variants)).toBe(true);
      expect(Array.isArray(layer.also_consumed_by)).toBe(true);
      expect(typeof layer.test_outputs).toBe('object');
      expect(Array.isArray(layer.test_outputs)).toBe(false);
    }
  });

  it('gives a list field an empty list rather than null when it is absent', () => {
    // Absent and empty mean the same thing for a list — no choice to make — so
    // callers get one shape instead of two.
    const noProviders = TABLE.filter((l) => !l.providers.length);
    expect(noProviders.length).toBeGreaterThan(0);
    for (const layer of noProviders) expect(layer.providers).toEqual([]);
  });

  it('leaves a scalar null when it is absent', () => {
    // `mode` is declared on 6 of the 30. The other 24 have no key at all, and
    // null says that more plainly than an empty string.
    const withoutMode = TABLE.filter((l) => l.mode === null);
    expect(withoutMode.length).toBeGreaterThan(0);
  });
});

describe('a hand-edited layers.json degrades predictably', () => {
  // `docs/layers.json` is written by hand and every entry in it is well formed,
  // so none of this is reachable through the real file. It is reachable through
  // an edit, and the alternative to handling it is a crash or a value of the
  // wrong shape reaching a caller that trusts the type.

  it('reads a missing list as empty rather than absent', () => {
    // The caller checks `providers.length`. Null would throw there, and the
    // throw would land far from the edit that caused it.
    expect(strList(undefined)).toEqual([]);
    expect(strList(null)).toEqual([]);
    expect(strList('nextauth')).toEqual([]);
    expect(strList({ 0: 'nextauth' })).toEqual([]);
  });

  it('drops list entries that are not usable strings', () => {
    expect(strList(['nextauth', 42, null, '', 'lucia', { a: 1 }])).toEqual(['nextauth', 'lucia']);
  });

  it('reads a missing output map as empty', () => {
    expect(outputMap(undefined)).toEqual({});
    expect(outputMap(null)).toEqual({});
    expect(outputMap('paths')).toEqual({});
  });

  it('does not read an array as an output map', () => {
    // An array is an object. Passing it through would produce `{"0": [...]}`,
    // keyed by index rather than by consuming skill.
    expect(outputMap(['a', 'b'])).toEqual({});
  });

  it('keeps the map keyed by skill and its values lists', () => {
    expect(outputMap({ 'kiwa-auth': ['a.ts', 7, 'b.ts'], 'kiwa-orm': 'not-a-list' })).toEqual({
      'kiwa-auth': ['a.ts', 'b.ts'],
      'kiwa-orm': [],
    });
  });
});
