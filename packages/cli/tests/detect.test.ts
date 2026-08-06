import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { detectFrom, resolve as resolvePrecedence, type SignalTable } from '../src/detect/detect.js';
import { readCargoToml, readGoMod, readPackageJson } from '../src/detect/manifests.js';
import { scan } from '../src/detect/scan.js';
import { loadSignalTable } from '../src/detect/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The repository root, found by climbing until `docs/layers.json` appears.
 *
 * A fixed number of `..` breaks the moment the compiled tests sit at a
 * different depth than the source — which is exactly what happened here, since
 * vitest runs them from `.vitest-dist/tests/`.
 */
function findRepoRoot(): string {
  let dir = HERE;
  for (let up = 0; up < 8; up += 1) {
    if (existsSync(resolve(dir, 'docs', 'layers.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('repository root not found');
}

const REPO_ROOT = findRepoRoot();

// The same table the CLI loads, through the same loader, so a change to how it
// is found is exercised here rather than only in production.
const TABLE = loadSignalTable() as SignalTable;

/**
 * Detection measured against the polyglot examples.
 *
 * These are the corpus because they carry both halves: `rust-axum-poc` depends
 * on `axum` for real and declares `kiwa-test-rs = { features = ["axum"] }`,
 * which is the answer. The JS examples cannot serve the same purpose — 83 of
 * the 139 carry nothing but `@types/node`, `typescript` and `vitest`, and
 * `auth-lucia-poc` does not depend on `lucia` at all, because the adapters mock
 * the library rather than importing it.
 */

function detectExample(name: string): string[] {
  const manifests = scan(resolve(REPO_ROOT, 'examples', name));
  const all = manifests.flatMap((m) => detectFrom(TABLE, m.language, m.path, m.deps));
  return resolvePrecedence(all).map((d) => d.layer);
}

describe('manifest readers', () => {
  it('reads a Cargo dependency with its features', () => {
    const deps = readCargoToml(
      ['[dependencies]', 'axum = { version = "0.8", features = ["json", "tokio"] }'].join('\n'),
    );
    expect(deps).toEqual([{ name: 'axum', features: ['json', 'tokio'] }]);
  });

  it('reads dev-dependencies as well as dependencies', () => {
    // `kiwa-test-rs` is a dev dependency, and it is the entry that says which
    // layer the project tests. Reading only `[dependencies]` would miss it.
    const deps = readCargoToml(
      ['[dev-dependencies]', 'kiwa-test-rs = { version = "0.5", features = ["axum"] }'].join('\n'),
    );
    expect(deps).toEqual([{ name: 'kiwa-test-rs', features: ['axum'] }]);
  });

  it('ignores a commented-out Cargo dependency', () => {
    const deps = readCargoToml(['[dependencies]', '# axum = "0.8"', 'serde = "1"'].join('\n'));
    expect(deps.map((d) => d.name)).toEqual(['serde']);
  });

  it('reads go.mod require blocks and single lines', () => {
    const deps = readGoMod(
      [
        'module example.com/x',
        'require (',
        '\tgithub.com/gin-gonic/gin v1.12.0',
        ')',
        'require github.com/stretchr/testify v1.9.0',
      ].join('\n'),
    );
    expect(deps.map((d) => d.name)).toEqual([
      'github.com/gin-gonic/gin',
      'github.com/stretchr/testify',
    ]);
  });

  it('skips go.mod replace directives', () => {
    // Every polyglot example points kiwa-test-go at the in-repo copy. Reading
    // the replacement would report a filesystem path as a dependency.
    //
    // The earlier version of this used a module path on the left of the arrow,
    // which the require-block reader ignores anyway — so deleting the skip left
    // it green. A relative path on the left is what actually distinguishes the
    // two readings, and it is what the examples contain.
    const deps = readGoMod(
      [
        'require (',
        '\tgithub.com/cardene777/kiwa-test-go v0.2.0',
        ')',
        'replace github.com/cardene777/kiwa-test-go => ../../kiwa-go',
      ].join('\n'),
    );
    expect(deps.map((d) => d.name)).toEqual(['github.com/cardene777/kiwa-test-go']);
  });

  it('does not read a replacement target as a dependency', () => {
    const deps = readGoMod('replace example.com/a => ./vendor/a');
    expect(deps).toEqual([]);
  });

  it('does not read a replace block as dependencies', () => {
    // The block form is what the guard actually earns its place for: outside a
    // block these lines are skipped anyway for want of a `require ` prefix.
    const deps = readGoMod(
      [
        'require (',
        '\tgithub.com/real/dep v1.0.0',
        ')',
        'replace (',
        '\tgithub.com/replaced/one => ../one',
        '\tgithub.com/replaced/two => ../two',
        ')',
      ].join('\n'),
    );
    expect(deps.map((d) => d.name)).toEqual(['github.com/real/dep']);
  });

  it('returns nothing for an unparseable package.json', () => {
    // A broken manifest makes detection report nothing, not abort a command the
    // user ran for another reason.
    expect(readPackageJson('{ not json')).toEqual([]);
  });
});

describe('detection against the polyglot corpus', () => {
  it.each([
    ['rust-axum-poc', ['rust-axum']],
    ['rust-actix-web-poc', ['rust-actix-web']],
    ['rust-tower-http-poc', ['rust-tower-http']],
    ['rust-cargo-poc', ['rust-unit']],
    ['go-gin-poc', ['go-gin', 'go-unit']],
    ['go-echo-poc', ['go-echo', 'go-unit']],
    ['go-fiber-poc', ['go-fiber', 'go-unit']],
    ['go-testing-poc', ['go-unit']],
  ])('%s detects %j', (name, expected) => {
    expect(detectExample(name)).toEqual(expected);
  });

  it('does not report rust-axum for the tower-http example', () => {
    // The one case dependency names alone get wrong: tower-http wraps an axum
    // router, so the example depends on both. The feature on kiwa-test-rs is
    // what settles it.
    expect(detectExample('rust-tower-http-poc')).not.toContain('rust-axum');
  });
});

describe('precedence', () => {
  it('an exact signal suppresses a weak one in the same group', () => {
    const all = detectFrom(TABLE, 'rust', 'Cargo.toml', [
      { name: 'axum', features: [] },
      { name: 'kiwa-test-rs', features: ['tower-http'] },
    ]);
    expect(resolvePrecedence(all).map((d) => d.layer)).toEqual(['rust-tower-http']);
  });

  it('a weak signal still applies when nothing exact claimed its group', () => {
    const all = detectFrom(TABLE, 'rust', 'Cargo.toml', [{ name: 'axum', features: [] }]);
    expect(resolvePrecedence(all).map((d) => d.layer)).toEqual(['rust-axum']);
  });

  it('an exact signal in one group does not suppress a weak one in another', () => {
    // Grouping by runtime prefix. Every Go signal in the table happens to be
    // exact, so pairing Rust with Go proves nothing: collapsing the groups
    // leaves both standing either way. The weak signal has to be in a
    // different group from the exact one for the grouping to be doing work.
    const decided = detectFrom(TABLE, 'rust', 'Cargo.toml', [
      { name: 'kiwa-test-rs', features: ['tower-http'] },
    ]);
    const weakElsewhere: typeof decided = [
      { layer: 'go-gin', signal: 'synthetic', manifest: 'go.mod', strength: 'weak' },
    ];
    expect(resolvePrecedence([...decided, ...weakElsewhere]).map((d) => d.layer)).toEqual([
      'go-gin',
      'rust-tower-http',
    ]);
  });

  it('an exact signal suppresses a weak one only within its own group', () => {
    // The other half of the same claim: the weak Rust signal does disappear.
    const all = detectFrom(TABLE, 'rust', 'Cargo.toml', [
      { name: 'axum', features: [] },
      { name: 'kiwa-test-rs', features: ['tower-http'] },
    ]);
    const layers = resolvePrecedence(all).map((d) => d.layer);
    expect(layers).toContain('rust-tower-http');
    expect(layers).not.toContain('rust-axum');
  });

  it('reports each layer once even when several signals point at it', () => {
    const all = detectFrom(TABLE, 'rust', 'Cargo.toml', [
      { name: 'axum', features: [] },
      { name: 'kiwa-test-rs', features: ['axum'] },
    ]);
    expect(resolvePrecedence(all)).toHaveLength(1);
  });
});

describe('every detected layer exists in docs/layers.json', () => {
  it('no signal points at a layer the table does not define', () => {
    // #1810 removed `contract-rust` because nothing implemented it. A signal
    // pointing at a layer that is not in the table would advertise the same
    // kind of dead option.
    const layers = JSON.parse(readFileSync(resolve(REPO_ROOT, 'docs/layers.json'), 'utf-8')) as {
      layers: { id: string }[];
    };
    const known = new Set(layers.layers.map((l) => l.id));

    const named = new Set<string>();
    for (const list of [...Object.values(TABLE.signals), TABLE.generated.signals]) {
      for (const signal of list) {
        if (signal.layer) named.add(signal.layer);
        if (signal.default) named.add(signal.default);
        for (const layer of Object.values(signal.features ?? {})) named.add(layer);
      }
    }

    expect([...named].filter((l) => !known.has(l))).toEqual([]);
    expect(named.size).toBeGreaterThanOrEqual(7);
  });
});
