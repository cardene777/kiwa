import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
import { readPackageJson } from '../src/detect/manifests.js';
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
 * Detection measured against the repository's own examples.
 *
 * The JS examples are a weak corpus on their own — most carry nothing but
 * `@types/node`, `typescript` and `vitest`, and `auth-lucia-poc` does not
 * depend on `lucia` at all, because the adapters mock the library rather than
 * importing it. What can be measured against them is the Next.js signal, which
 * is the one dependency projects declare for real.
 */

function detectExample(name: string): string[] {
  const manifests = scan(resolve(REPO_ROOT, 'examples', name));
  const all = manifests.flatMap((m) => detectFrom(TABLE, m.language, m.path, m.deps));
  return resolvePrecedence(all).map((d) => d.layer);
}

describe('manifest readers', () => {
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

describe('precedence', () => {
  /**
   * A table written for the test rather than the repository's own.
   *
   * These cases are about `resolve`, not about which languages kiwa supports.
   * Pointing them at the real table tied them to the Rust signals, and #1864
   * broke all five by removing that language. Synthetic layer names keep the
   * claim readable: the group is the prefix before the first `-`, so
   * `alpha-one` and `alpha-two` compete while `beta-one` stands apart.
   */
  const SYNTH: SignalTable = {
    manifests: { 'package.json': 'typescript' },
    signals: {
      typescript: [
        { match: 'weak-alpha', layer: 'alpha-one', strength: 'weak' },
        {
          match: 'adapter',
          kind: 'feature',
          features: { two: 'alpha-two' },
          default: 'alpha-default',
          also: ['alpha-implied'],
          strength: 'exact',
        },
      ],
    },
    generated: { signals: [] },
  };

  it('an exact signal suppresses a weak one in the same group', () => {
    const all = detectFrom(SYNTH, 'typescript', 'package.json', [
      { name: 'weak-alpha', features: [] },
      { name: 'adapter', features: ['two'] },
    ]);
    // `also` does not add alpha-implied here, because the feature named a more
    // specific layer. What matters is that the weak alpha-one signal is gone.
    expect(resolvePrecedence(all).map((d) => d.layer)).toEqual(['alpha-two']);
  });

  it('a weak signal still applies when nothing exact claimed its group', () => {
    const all = detectFrom(SYNTH, 'typescript', 'package.json', [
      { name: 'weak-alpha', features: [] },
    ]);
    expect(resolvePrecedence(all).map((d) => d.layer)).toEqual(['alpha-one']);
  });

  it('an exact signal in one group does not suppress a weak one in another', () => {
    // Grouping by prefix. The weak signal has to be in a different group from
    // the exact one for the grouping to be doing work.
    const decided = detectFrom(SYNTH, 'typescript', 'package.json', [
      { name: 'adapter', features: ['two'] },
    ]);
    const weakElsewhere: typeof decided = [
      { layer: 'beta-one', signal: 'synthetic', manifest: 'package.json', strength: 'weak' },
    ];
    expect(resolvePrecedence([...decided, ...weakElsewhere]).map((d) => d.layer)).toEqual([
      'alpha-two',
      'beta-one',
    ]);
  });

  it('an exact signal suppresses a weak one only within its own group', () => {
    const all = detectFrom(SYNTH, 'typescript', 'package.json', [
      { name: 'weak-alpha', features: [] },
      { name: 'adapter', features: ['two'] },
    ]);
    const layers = resolvePrecedence(all).map((d) => d.layer);
    expect(layers).toContain('alpha-two');
    expect(layers).not.toContain('alpha-one');
  });

  it('reports each layer once even when several signals point at it', () => {
    const table: SignalTable = {
      manifests: SYNTH.manifests,
      signals: {
        typescript: [
          { match: 'weak-alpha', layer: 'alpha-one', strength: 'weak' },
          {
            match: 'adapter',
            kind: 'feature',
            features: { one: 'alpha-one' },
            default: 'alpha-default',
            strength: 'exact',
          },
        ],
      },
      generated: { signals: [] },
    };
    const all = detectFrom(table, 'typescript', 'package.json', [
      { name: 'weak-alpha', features: [] },
      { name: 'adapter', features: ['one'] },
    ]);
    // alpha-one once, not twice — the weak name signal and the exact feature
    // signal both point at it.
    const layers = resolvePrecedence(all).map((d) => d.layer);
    expect(layers.filter((l) => l === 'alpha-one')).toHaveLength(1);
    expect(layers).toEqual(['alpha-one']);
  });
});

describe('an implied layer holds only while nothing more specific appears', () => {
  const IMPLIED: SignalTable = {
    manifests: { 'package.json': 'typescript' },
    signals: {
      typescript: [
        {
          match: 'adapter',
          kind: 'feature',
          features: { two: 'alpha-two' },
          default: 'alpha-default',
          also: ['alpha-implied'],
          strength: 'exact',
        },
        { match: 'framework', layer: 'alpha-framework', strength: 'exact' },
      ],
    },
    generated: { signals: [] },
  };

  it('keeps the implied layer when the adapter is all the manifest says', () => {
    const all = detectFrom(IMPLIED, 'typescript', 'package.json', [
      { name: 'adapter', features: [] },
    ]);
    expect(resolvePrecedence(all).map((d) => d.layer)).toEqual(['alpha-default', 'alpha-implied']);
  });

  it('drops it once a more specific layer is named', () => {
    // The adapter alone implies two layers as a fallback. A dependency that
    // names one layer outright is what the project actually uses.
    const all = detectFrom(IMPLIED, 'typescript', 'package.json', [
      { name: 'adapter', features: [] },
      { name: 'framework', features: [] },
    ]);
    expect(resolvePrecedence(all).map((d) => d.layer)).toEqual(['alpha-framework']);
  });

  it('says nothing at all when the entry inherits from the workspace', () => {
    const all = detectFrom(IMPLIED, 'typescript', 'package.json', [
      { name: 'adapter', features: [], unresolved: true },
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

  // The answer does not depend on the order dependencies are written in.
  //
  // It used to. `resolve` kept the first entry it saw for a layer and only ever
  // replaced a weak one with an exact one — a comparison that could never fire,
  // since a group holding any exact signal loses its weak ones earlier. So an
  // implied entry arriving first took the slot, `asserted` came out empty, and
  // the loop that drops implied layers dropped nothing.
  //
  // Swapping two lines of a package.json changed which layers came back. Fixed
  // in #1837 by letting an asserted detection replace an implied one.
  describe('the resolver answers the same however the dependencies are ordered', () => {
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

    it('drops them just the same when the implying dependency comes first', () => {
      expect(detect(['next', 'next-safe-action'])).toEqual(['nextjs-server-action']);
    });

    it('gives the same answer for every ordering of three dependencies', () => {
      // Two entries can agree by accident. Permuting three makes the check
      // independent of which pair happened to be written first.
      const names = ['next', 'next-safe-action', '@types/node'];
      const permutations = [
        [0, 1, 2],
        [0, 2, 1],
        [1, 0, 2],
        [1, 2, 0],
        [2, 0, 1],
        [2, 1, 0],
      ].map((order) => detect(order.map((i) => names[i]!)));
      for (const answer of permutations) expect(answer).toEqual(permutations[0]);
      expect(permutations[0]).toEqual(['nextjs-server-action']);
    });

    it('keeps the asserted signal as the one it reports', () => {
      // Replacing the entry has to carry the signal with it, or the report
      // names the dependency that merely implied the layer.
      const all = detectFrom(asserted, 'typescript', 'package.json', [
        { name: 'next', features: [] },
        { name: 'next-safe-action', features: [] },
      ]);
      const kept = resolvePrecedence(all).find((d) => d.layer === 'nextjs-server-action');
      expect(kept?.signal).toBe('next-safe-action');
      expect(kept?.implied).toBeUndefined();
    });
  });

  it('drops a weak detection outright when its group holds an exact one', () => {
    // Why strength is not compared when replacing: a group with any exact
    // signal loses all of its weak ones before `kept` is built, so two entries
    // for one layer always share a strength.
    const table: SignalTable = {
      manifests: TABLE.manifests,
      signals: {
        typescript: [
          { match: 'weakly', layer: 'nextjs-rsc', strength: 'weak' },
          { match: 'firmly', layer: 'nextjs-middleware', strength: 'exact' },
        ],
      },
      generated: { signals: [] },
    };
    const all = detectFrom(table, 'typescript', 'package.json', [
      { name: 'weakly', features: [] },
      { name: 'firmly', features: [] },
    ]);
    expect(resolvePrecedence(all).map((d) => d.layer)).toEqual(['nextjs-middleware']);
  });

  it('does not answer a manifest of another language that names next', () => {
    // The signal is scoped to the language it was written for. A Solidity
    // project that happens to declare something spelled `next` is not a
    // Next.js project.
    const all = detectFrom(TABLE, 'solidity', 'foundry.toml', [{ name: 'next', features: [] }]);
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
    // Two more come with it, both weak: `react` names `ui` and
    // `@playwright/test` names `e2e-generic`. Weak because neither layer
    // declares `providers`, so nothing in the table says which of their peers
    // are subjects rather than tools.
    //
    // Listed rather than derived: the point of this test is the example, and a
    // derived expectation would restate the generator instead of checking it.
    expect(detectExample('nextjs-app-router-full')).toEqual(
      [...NEXTJS_LAYERS, 'e2e-generic', 'ui'].sort(),
    );
  });
});

describe('the generated half is written from the packages, not by hand', () => {
  const generated = TABLE.generated.signals;

  const LAYER_TABLE = JSON.parse(readFileSync(resolve(REPO_ROOT, 'docs/layers.json'), 'utf-8')) as {
    layers: { id: string; consumer_skill: string; providers?: string[] }[];
  };

  /** Every `@kiwa-lab/*` package with the peers it declares, minus the runner. */
  const PACKAGES = readdirSync(resolve(REPO_ROOT, 'packages'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => resolve(REPO_ROOT, 'packages', e.name, 'package.json'))
    .filter((p) => existsSync(p))
    .map((p) => JSON.parse(readFileSync(p, 'utf-8')) as { name?: string; peerDependencies?: Record<string, string> })
    .filter((pkg) => (pkg.name ?? '').startsWith('@kiwa-lab/'))
    .map((pkg) => ({
      name: pkg.name!.slice('@kiwa-lab/'.length),
      peers: Object.keys(pkg.peerDependencies ?? {}).filter((peer) => peer !== 'vitest'),
    }));

  it('covers every package that declares a peer and owns a layer', () => {
    // Derived, not listed. The first version of the generator carried a fixed
    // list of six package names and missed `a11y`, `api` and `e2e` — three
    // packages with real peers whose libraries were simply undetectable, with
    // nothing failing to say so.
    const owned = new Set(LAYER_TABLE.layers.map((l) => l.consumer_skill));
    const expected = new Set(
      PACKAGES.filter((p) => p.peers.length && owned.has(`kiwa-${p.name}`)).flatMap((p) =>
        LAYER_TABLE.layers.filter((l) => l.consumer_skill === `kiwa-${p.name}`).map((l) => l.id),
      ),
    );
    expect(new Set(generated.map((s) => s.layer))).toEqual(expected);
    expect(expected.size).toBeGreaterThan(5);
  });

  it('says which package it skipped and why', () => {
    // `dapp` declares peers and owns no layer. Producing nothing for it is
    // correct; producing nothing silently is not, because that reads the same
    // as a package with no peers.
    const withoutLayer = PACKAGES.filter(
      (p) =>
        p.peers.length && !LAYER_TABLE.layers.some((l) => l.consumer_skill === `kiwa-${p.name}`),
    ).map((p) => p.name);
    expect(withoutLayer).toEqual(['dapp']);
    expect(generated.filter((s) => s.match === 'viem')).toEqual([]);
  });

  it('never emits the runner as a subject', () => {
    // `vitest` is a peer of all six and the subject of none.
    expect(generated.filter((s) => s.match === 'vitest')).toEqual([]);
  });

  it('promotes a peer to exact only when a layer declares it a provider', () => {
    // The rest stay weak, which is how `testcontainers` can point at three
    // layers without claiming any of them: `resolve` drops it the moment
    // something exact turns up in the same group.
    const exact = generated.filter((s) => s.strength === 'exact').map((s) => s.match);
    expect(exact.sort()).toEqual(
      [
        '@clerk/backend',
        'auth0',
        'better-auth',
        'bullmq',
        'inngest',
        'lucia',
        'memcached',
        'next-auth',
        'redis',
      ].sort(),
    );
  });

  it('matches a provider written differently from its package', () => {
    // `providers` names the provider and the peer names the package:
    // `nextauth` against `next-auth`, `clerk` against `@clerk/backend`. Both
    // pairs have to line up or the exact list above loses two entries.
    const byMatch = new Map(generated.map((s) => [s.match, s]));
    expect(byMatch.get('next-auth')?.strength).toBe('exact');
    expect(byMatch.get('@clerk/backend')?.strength).toBe('exact');
  });

  it('leaves a tool weak even where it is the only signal for a layer', () => {
    // `testcontainers` is a peer of cache, orm and queue. Emitting it exact
    // would have a project that merely runs containers claim three layers.
    for (const s of generated.filter((x) => x.match === 'testcontainers')) {
      expect(s.strength).toBe('weak');
    }
    expect(generated.filter((x) => x.match === 'testcontainers').length).toBeGreaterThan(1);
  });

  it('carries the language on every entry', () => {
    expect(generated.filter((s) => s.language !== 'typescript')).toEqual([]);
  });
});

describe('a generated signal applies only to the language it came from', () => {
  // `redis` is the case that forces this: it is a real npm package and a real
  // Solidity project. A signal derived from the TypeScript `cache` package's
  // peerDependencies must not answer a foundry.toml.
  const withGenerated = (signals: GeneratedSignal[]): SignalTable => ({
    manifests: TABLE.manifests,
    signals: { solidity: [{ match: 'forge-std', default: 'contract', strength: 'exact' }] },
    generated: { signals },
  });

  const cacheFromTypescript: GeneratedSignal = {
    match: 'redis',
    layer: 'cache',
    strength: 'exact',
    language: 'typescript',
  };

  it('does not answer a manifest in another language', () => {
    const all = detectFrom(withGenerated([cacheFromTypescript]), 'solidity', 'foundry.toml', [
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
    expect(detectFrom(table, 'solidity', 'foundry.toml', dep)).toEqual([]);
    expect(detectFrom(table, 'typescript', 'package.json', dep)).toEqual([]);
  });

  it('leaves the hand-written signals for that language alone', () => {
    // The filter narrows the generated half only. Narrowing both would make
    // this test the one that catches it.
    const all = detectFrom(withGenerated([cacheFromTypescript]), 'solidity', 'foundry.toml', [
      { name: 'forge-std', features: [] },
    ]);
    expect(all.map((d) => d.layer)).toEqual(['contract']);
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
    // #1810 removed a layer because nothing implemented it. A signal pointing
    // at a layer that is not in the table would advertise the same kind of dead
    // option.
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
