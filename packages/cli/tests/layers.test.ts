import { mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { loadLayerTable, resolveLayers } from '../src/detect/layers.js';

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

  it('drops one unknown layer rather than the whole recording', () => {
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
      // Asserting `toContain` alone would also pass if the whole recording were
      // discarded, since the fallback contains every layer.
      expect(resolved.source).toBe('detected');
      expect(resolved.layers.length).toBeLessThan(TABLE.length);
      expect(resolved.layers.map((l) => l.id)).toContain('rust-axum');
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
