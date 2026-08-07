import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  detectFrom,
  resolve as resolvePrecedence,
  type GeneratedSignal,
  type SignalTable,
} from '../src/detect/detect.js';
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

  it('reads a dependency declared as its own table', () => {
    // `[dev-dependencies.kiwa-test-rs]` is a normal way to write an entry with
    // several fields, and reading tables by name alone missed it entirely —
    // taking the framework feature with it.
    const deps = readCargoToml(
      ['[dev-dependencies.kiwa-test-rs]', 'version = "0.5"', 'features = ["axum"]'].join('\n'),
    );
    expect(deps).toEqual([{ name: 'kiwa-test-rs', features: ['axum'] }]);
  });

  it('is not thrown off by a bracket inside a string value', () => {
    // A string can hold an unbalanced bracket, and counting it as nesting made
    // every entry after it look like a field of an entry still open — so the
    // dependency that decides the layer was dropped without a trace.
    const deps = readCargoToml(
      [
        '[dev-dependencies]',
        'weird = { version = "{{{" }',
        'kiwa-test-rs = { version = "0.5", features = ["axum"] }',
      ].join('\n'),
    );
    expect(deps).toEqual([
      { name: 'weird', features: [] },
      { name: 'kiwa-test-rs', features: ['axum'] },
    ]);
  });

  it('reads a multi-line string as one delimiter, not three', () => {
    // `\"\"\"` counted as three separate quotes leaves the reader inside a string
    // it never left, so the next entry vanished and its features were recorded
    // against the wrong dependency.
    const deps = readCargoToml(
      [
        '[dev-dependencies]',
        'weird = { note = \"\"\"a\"b\"\"\" }',
        'kiwa-test-rs = { features = ["axum"] }',
      ].join('\n'),
    );
    expect(deps).toEqual([
      { name: 'weird', features: [] },
      { name: 'kiwa-test-rs', features: ['axum'] },
    ]);
  });

  it('marks a workspace-inherited entry as unresolved', () => {
    // The feature list lives in the workspace root, which this reader does not
    // open. Recording it as a plain featureless entry let the caller apply the
    // default layer — a definite answer built from an absent one.
    const deps = readCargoToml(
      ['[dev-dependencies]', 'kiwa-test-rs = { workspace = true }'].join('\n'),
    );
    expect(deps).toEqual([{ name: 'kiwa-test-rs', features: [], unresolved: true }]);
  });

  it('does not mark an entry unresolved once its features are stated', () => {
    const deps = readCargoToml(
      ['[dev-dependencies]', 'kiwa-test-rs = { workspace = true, features = ["axum"] }'].join('\n'),
    );
    expect(deps).toEqual([{ name: 'kiwa-test-rs', features: ['axum'] }]);
  });

  it('skips an indirect entry that carries a trailing comment', () => {
    // Anchoring the marker to the end of the line read this as a direct
    // dependency, so a framework the project only holds transitively would be
    // reported as one it tests.
    const deps = readGoMod(
      ['require (', '\tgithub.com/gin-gonic/gin v1.9.0 // indirect // vendored', ')'].join('\n'),
    );
    expect(deps).toEqual([]);
  });

  it('does not read a comment that merely mentions indirect as the marker', () => {
    // Widening the matcher to fix `// indirect // extra` made any comment
    // holding the word drop the dependency, which loses a direct one.
    const deps = readGoMod(
      ['require (', '\tgithub.com/x/y v1.0.0 // see https://example.com/indirect', ')'].join('\n'),
    );
    expect(deps).toEqual([{ name: 'github.com/x/y', features: [] }]);
  });

  it('does not mistake "indirectly" for the indirect marker', () => {
    const deps = readGoMod(
      ['require (', '\tgithub.com/gin-gonic/gin v1.9.0 // indirectly relevant', ')'].join('\n'),
    );
    expect(deps).toEqual([{ name: 'github.com/gin-gonic/gin', features: [] }]);
  });

  it('reads features spread over several lines', () => {
    const deps = readCargoToml(
      [
        '[dependencies]',
        'axum = {',
        '  version = "0.8",',
        '  features = [',
        '    "json",',
        '    "tokio"',
        '  ]',
        '}',
      ].join('\n'),
    );
    expect(deps).toEqual([{ name: 'axum', features: ['json', 'tokio'] }]);
  });

  it('keeps entries separate when one spans lines', () => {
    // The failure this guards against is a multi-line entry swallowing the
    // next one's features.
    const deps = readCargoToml(
      [
        '[dependencies]',
        'axum = {',
        '  version = "0.8"',
        '}',
        'kiwa-test-rs = { version = "0.5", features = ["tower-http"] }',
      ].join('\n'),
    );
    expect(deps).toEqual([
      { name: 'axum', features: [] },
      { name: 'kiwa-test-rs', features: ['tower-http'] },
    ]);
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

  it('skips indirect dependencies', () => {
    // `go-gin-poc` carries 29 indirect entries against 2 direct ones. A project
    // that uses echo can hold gin transitively, and reading indirect entries
    // would report the framework it does not use.
    const deps = readGoMod(
      [
        'require (',
        '\tgithub.com/gin-gonic/gin v1.12.0',
        '\tgithub.com/bytedance/sonic v1.15.0 // indirect',
        ')',
      ].join('\n'),
    );
    expect(deps.map((d) => d.name)).toEqual(['github.com/gin-gonic/gin']);
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

describe('workspace resolution', () => {
  function fixture(files: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), 'kiwa-scan-'));
    for (const [rel, body] of Object.entries(files)) {
      const full = join(dir, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, body, 'utf-8');
    }
    return dir;
  }

  it('reads workspace members named by pnpm-workspace.yaml', () => {
    // In a monorepo the dependencies live in the members, not the root. Reading
    // only cwd finds nothing there.
    const dir = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - "apps/*"\n',
      'package.json': '{"name":"root"}',
      'apps/web/package.json': '{"dependencies":{"next":"15"}}',
    });
    try {
      const paths = scan(dir).map((m) => m.path);
      expect(paths).toContain(join('apps', 'web', 'package.json'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not expand a pattern deeper than one level', () => {
    // `packages/*/nested` once expanded to `packages/*`: the same directories,
    // one level short of what was asked for. Reading less is the safe failure.
    const dir = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - "libs/*/nested"\n',
      'package.json': '{"name":"root"}',
      'libs/one/package.json': '{"dependencies":{"axum":"1"}}',
    });
    try {
      const paths = scan(dir).map((m) => m.path);
      expect(paths).not.toContain(join('libs', 'one', 'package.json'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('honours a negated pattern', () => {
    const dir = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - "pkgs/*"\n  - "!pkgs/skip"\n',
      'package.json': '{"name":"root"}',
      'pkgs/keep/package.json': '{"dependencies":{"a":"1"}}',
      'pkgs/skip/package.json': '{"dependencies":{"b":"1"}}',
    });
    try {
      const paths = scan(dir).map((m) => m.path);
      expect(paths).toContain(join('pkgs', 'keep', 'package.json'));
      expect(paths).not.toContain(join('pkgs', 'skip', 'package.json'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reads members from an inline packages list', () => {
    // `packages: [apps/*]` is the same declaration written on one line, and
    // reading only the block form scanned the root manifest alone.
    const dir = fixture({
      'pnpm-workspace.yaml': 'packages: [apps/*, "libs/*"]\n',
      'package.json': '{"name":"root"}',
      'apps/web/package.json': '{"dependencies":{"a":"1"}}',
      'libs/util/package.json': '{"dependencies":{"b":"1"}}',
    });
    try {
      const paths = scan(dir).map((m) => m.path);
      expect(paths).toContain(join('apps', 'web', 'package.json'));
      expect(paths).toContain(join('libs', 'util', 'package.json'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('skips node_modules when expanding', () => {
    const dir = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - "*"\n',
      'package.json': '{"name":"root"}',
      'node_modules/pkg/package.json': '{"dependencies":{"react":"19"}}',
    });
    try {
      expect(scan(dir).map((m) => m.path)).not.toContain(
        join('node_modules', 'pkg', 'package.json'),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('detection against the polyglot corpus', () => {
  it.each([
    // The unit and integration layers are what the adapter means when nothing
    // more specific turned up. `rust-cargo-poc` (tests/poc.rs +
    // tests/poc_integration.rs) and `go-testing-poc` (calc_test.go +
    // integration/client_test.go) are those projects. The six framework
    // projects each name a framework and carry one test file, so they report
    // that framework alone — which is what AC 71 and AC 72 ask for.
    ['rust-axum-poc', ['rust-axum']],
    ['rust-actix-web-poc', ['rust-actix-web']],
    ['rust-tower-http-poc', ['rust-tower-http']],
    ['rust-cargo-poc', ['rust-integration', 'rust-unit']],
    ['go-gin-poc', ['go-gin']],
    ['go-echo-poc', ['go-echo']],
    ['go-fiber-poc', ['go-fiber']],
    ['go-testing-poc', ['go-integration', 'go-unit']],
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
    // `also` does not add rust-integration here, because the feature named a
    // framework layer and that is more specific. What matters for this case is
    // that the weak rust-axum signal is gone.
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
    // rust-axum once, not twice — the weak name signal and the exact feature
    // signal both point at it.
    const layers = resolvePrecedence(all).map((d) => d.layer);
    expect(layers.filter((l) => l === 'rust-axum')).toHaveLength(1);
    expect(layers).toEqual(['rust-axum']);
  });
});

describe('an implied layer holds only while nothing more specific appears', () => {
  it('keeps the integration layer when the adapter is all the manifest says', () => {
    const all = detectFrom(TABLE, 'rust', 'Cargo.toml', [{ name: 'kiwa-test-rs', features: [] }]);
    expect(resolvePrecedence(all).map((d) => d.layer)).toEqual(['rust-integration', 'rust-unit']);
  });

  it('drops it once a framework layer is named', () => {
    // `go-gin-poc` depends on both the adapter and gin, and carries a single
    // `counter_test.go`. Both the unit and the integration layer are fallbacks
    // here, and the framework layer is what the project actually names — which
    // is also what the Rust side already did through its feature list.
    const all = detectFrom(TABLE, 'go', 'go.mod', [
      { name: 'github.com/cardene777/kiwa-test-go', features: [] },
      { name: 'github.com/gin-gonic/gin', features: [] },
    ]);
    expect(resolvePrecedence(all).map((d) => d.layer)).toEqual(['go-gin']);
  });

  it('lets the default yield to a framework signal from another dependency', () => {
    // With the current table this is unobservable: every Rust framework signal
    // is weak, so it is suppressed before the default is ever compared against
    // it. A synthetic exact signal makes the intent testable — the default is a
    // fallback on the feature path too, not an assertion.
    const table: SignalTable = {
      manifests: TABLE.manifests,
      signals: {
        rust: [
          { match: 'kiwa-test-rs', kind: 'feature', features: {}, default: 'rust-unit', strength: 'exact' },
          { match: 'axum', layer: 'rust-axum', strength: 'exact' },
        ],
      },
      generated: { signals: [] },
    };
    const all = detectFrom(table, 'rust', 'Cargo.toml', [
      { name: 'kiwa-test-rs', features: [] },
      { name: 'axum', features: [] },
    ]);
    expect(resolvePrecedence(all).map((d) => d.layer)).toEqual(['rust-axum']);
  });

  it('says nothing at all when the entry inherits from the workspace', () => {
    const all = detectFrom(TABLE, 'rust', 'Cargo.toml', [
      { name: 'kiwa-test-rs', features: [], unresolved: true },
    ]);
    expect(resolvePrecedence(all)).toEqual([]);
  });
});

describe('a Next.js project is detected from the framework it depends on', () => {
  const NEXTJS_LAYERS = [
    'nextjs-middleware',
    'nextjs-parallel-route',
    'nextjs-rsc',
    'nextjs-rsc-streaming',
    'nextjs-server-action',
  ];

  it('reports every nextjs layer, because a manifest cannot tell them apart', () => {
    // Server actions, middleware, RSC, parallel routes and streaming are
    // distinguished by file layout. `next` settles that the project is a
    // Next.js one and nothing more, so all five are implied together rather
    // than one being guessed.
    const all = detectFrom(TABLE, 'typescript', 'package.json', [{ name: 'next', features: [] }]);
    expect(resolvePrecedence(all).map((d) => d.layer)).toEqual(NEXTJS_LAYERS);
  });

  it('marks them implied rather than asserted', () => {
    // The distinction is what lets a more specific signal drop them later. If
    // they were asserted, adding one would leave the other four standing.
    const all = detectFrom(TABLE, 'typescript', 'package.json', [{ name: 'next', features: [] }]);
    expect(resolvePrecedence(all).every((d) => d.implied)).toBe(true);
  });

  // Characterisation, not endorsement. An asserted signal is meant to drop the
  // implied ones in its group, and it does — but only when its dependency is
  // listed first. `resolve` keeps the first entry it sees for a layer and only
  // replaces a weak one with an exact one, so an implied-exact entry blocks the
  // asserted-exact entry for the same layer, and the group then looks like it
  // has nothing asserted at all.
  //
  // Reordering two lines of a package.json changes the answer. Tracked
  // separately; pinned here so a fix shows up as these two disagreeing.
  describe('the resolver answers differently depending on dependency order', () => {
    const asserted: SignalTable = {
      manifests: TABLE.manifests,
      signals: {
        typescript: [
          ...TABLE.signals.typescript!,
          { match: 'next-safe-action', layer: 'nextjs-server-action', strength: 'exact' },
        ],
      },
      generated: { signals: [] },
    };
    const detect = (names: string[]) =>
      resolvePrecedence(
        detectFrom(
          asserted,
          'typescript',
          'package.json',
          names.map((name) => ({ name, features: [] })),
        ),
      ).map((d) => d.layer);

    it('drops the implied four when the asserted dependency comes first', () => {
      expect(detect(['next-safe-action', 'next'])).toEqual(['nextjs-server-action']);
    });

    it('keeps all five when the implying dependency comes first', () => {
      expect(detect(['next', 'next-safe-action'])).toEqual(NEXTJS_LAYERS);
    });
  });

  it('does not answer a Cargo.toml that happens to depend on a crate named next', () => {
    const all = detectFrom(TABLE, 'rust', 'Cargo.toml', [{ name: 'next', features: [] }]);
    expect(all).toEqual([]);
  });

  it('finds them in an example that carries the real dependency', () => {
    // The signal exists for exactly this: kiwa's own adapter mocks Next.js, so
    // the evidence has to come from the project side. 18 of the 26 `*nextjs*`
    // examples depend on `next`; this is one of them.
    //
    // `dogfood-nextjs-server-action-app` is not — it depends on
    // `@kiwa-lab/nextjs` and nothing else. Naming an example without opening it
    // is how this test first passed against an empty result.
    expect(detectExample('nextjs-app-router-full')).toEqual(NEXTJS_LAYERS);
  });
});

describe('a generated signal applies only to the language it came from', () => {
  // `redis` is the case that forces this: it is a real npm package and a real
  // Rust crate. A signal derived from the TypeScript `cache` package's
  // peerDependencies must not answer a Cargo.toml.
  const withGenerated = (signals: GeneratedSignal[]): SignalTable => ({
    manifests: TABLE.manifests,
    signals: { rust: [{ match: 'kiwa-test-rs', default: 'rust-unit', strength: 'exact' }] },
    generated: { signals },
  });

  const cacheFromTypescript: GeneratedSignal = {
    match: 'redis',
    layer: 'cache',
    strength: 'exact',
    language: 'typescript',
  };

  it('does not answer a manifest in another language', () => {
    const all = detectFrom(withGenerated([cacheFromTypescript]), 'rust', 'Cargo.toml', [
      { name: 'redis', features: [] },
    ]);
    expect(all).toEqual([]);
  });

  it('answers a manifest in its own language', () => {
    const all = detectFrom(withGenerated([cacheFromTypescript]), 'typescript', 'package.json', [
      { name: 'redis', features: [] },
    ]);
    expect(all.map((d) => d.layer)).toEqual(['cache']);
  });

  it('matches nothing when the entry states no language', () => {
    // What stale generator output looks like. The alternative reading — a
    // missing field means "every language" — is the behaviour being removed, so
    // it is asserted against on both sides rather than left to the type.
    const stale = { match: 'redis', layer: 'cache', strength: 'exact' } as GeneratedSignal;
    const table = withGenerated([stale]);
    const dep = [{ name: 'redis', features: [] }];
    expect(detectFrom(table, 'rust', 'Cargo.toml', dep)).toEqual([]);
    expect(detectFrom(table, 'typescript', 'package.json', dep)).toEqual([]);
  });

  it('leaves the hand-written signals for that language alone', () => {
    // The filter narrows the generated half only. Narrowing both would make
    // this test the one that catches it.
    const all = detectFrom(withGenerated([cacheFromTypescript]), 'rust', 'Cargo.toml', [
      { name: 'kiwa-test-rs', features: [] },
    ]);
    expect(all.map((d) => d.layer)).toEqual(['rust-unit']);
  });

  it('keeps both halves when the languages agree', () => {
    const table: SignalTable = {
      manifests: TABLE.manifests,
      signals: { typescript: [{ match: 'next', layer: 'nextjs-rsc', strength: 'exact' }] },
      generated: { signals: [cacheFromTypescript] },
    };
    const all = detectFrom(table, 'typescript', 'package.json', [
      { name: 'next', features: [] },
      { name: 'redis', features: [] },
    ]);
    expect(all.map((d) => d.layer).sort()).toEqual(['cache', 'nextjs-rsc']);
  });
});

describe('the signal table stays unambiguous', () => {
  it('no signal carries both layer and default', () => {
    // The two would mean different things — `layer` is asserted, `default` only
    // holds while nothing more specific turned up — and the resolver keeps the
    // asserted one. A signal written with both silently loses its `default`,
    // which reads as a working fallback to whoever wrote it.
    const offenders: string[] = [];
    for (const [language, signals] of Object.entries(TABLE.signals)) {
      for (const signal of signals) {
        if (signal.layer && signal.default) offenders.push(`${language}: ${signal.match}`);
      }
    }
    for (const signal of TABLE.generated.signals) {
      if (signal.layer && signal.default) offenders.push(`generated: ${signal.match}`);
    }
    expect(offenders).toEqual([]);
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
        for (const layer of signal.also ?? []) named.add(layer);
        for (const layer of Object.values(signal.features ?? {})) named.add(layer);
      }
    }

    expect([...named].filter((l) => !known.has(l))).toEqual([]);
    expect(named.size).toBeGreaterThanOrEqual(10);
  });
});
