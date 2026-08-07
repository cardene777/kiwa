import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const REPO_ROOT = repoRoot(HERE);

const SKILL = readFileSync(
  resolve(REPO_ROOT, '.claude/skills/kiwa-nextjs/SKILL.md'),
  'utf-8',
);

/**
 * The body of a `##`/`###`/`####` section, up to the next heading of the same
 * or shallower depth.
 *
 * Matched as a whole line. Substring matching lets a renamed heading keep the
 * section visible, so a mutation that removes it outright passes (#1853).
 *
 * Fenced blocks are skipped when looking for the end. A shell comment inside a
 * ```bash block starts with `# `, and reading it as a heading cut this section
 * off at its own grep example.
 */
function section(heading: string): string {
  const lines = SKILL.split('\n');
  const depth = /^#+/.exec(heading)?.[0].length ?? 0;
  const start = lines.findIndex((line) => line.trim() === heading);
  expect(start, `見出しが 1 行として見つからない: ${heading}`).toBeGreaterThan(-1);

  const body: string[] = [];
  let fenced = false;
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('```')) fenced = !fenced;
    if (!fenced) {
      const hashes = /^(#+)\s/.exec(line)?.[1];
      if (hashes !== undefined && hashes.length <= depth) break;
    }
    body.push(line);
  }
  return body.join('\n');
}

/** The ```ts fenced blocks inside a chunk of markdown. */
function tsBlocks(text: string): string[] {
  return [...text.matchAll(/```ts\n([\s\S]*?)```/g)].map((m) => m[1] ?? '');
}

/**
 * The Step 3 template alone — the block with `{placeholder}` text, not the
 * worked example that sits in the same section.
 *
 * Joining both blocks let a mutation strip `vi.hoisted` from the template while
 * the worked example still carried it, and every assertion passed.
 */
function stepThreeTemplate(): string {
  const blocks = tsBlocks(section('### Step 3: vitest test の生成')).filter((b) =>
    b.includes('{ACTION}'),
  );
  expect(blocks, 'placeholder を持つ template block が 1 つでない').toHaveLength(1);
  return blocks[0] ?? '';
}

/** The three seed routes Step 2 offers, in the order it recommends them. */
type Route = 'reset' | 'resetModules' | 'mock';

const ROUTE_LABEL: Record<Route, string> = {
  reset: '選択 1',
  resetModules: '選択 2',
  mock: '選択 3',
};

/**
 * Expand the Step 3 template for one route into runnable code.
 *
 * Every `{placeholder}` has to be covered by the route's map. A placeholder the
 * map does not know fails the test, so adding one to the template forces a
 * decision about how it expands instead of being silently dropped.
 *
 * Round 2 checked the template against a hand-written example and skipped any
 * line that was nothing but a placeholder — which is exactly where `Given.data`
 * and the dynamic import live (#1857 Round 2 retry, R2b-F2).
 */
function expandTemplate(route: Route, values: Record<string, string>): string {
  const lines = stepThreeTemplate().split('\n');
  const label = ROUTE_LABEL[route];
  const out: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();
    // A marker is a standalone directive that governs the lines after it. A
    // line that merely mentions a route (`{選択 1 なら ...}` in `beforeEach`)
    // is content to substitute — treating it as a marker ate the block it sat
    // in and produced unparseable code.
    const isMarker =
      trimmed.startsWith('{data seam') ||
      (trimmed.startsWith('{') && trimmed.includes('出さない'));

    if (!isMarker) {
      out.push(line);
      continue;
    }

    // A marker either introduces a block or excludes the next line. The
    // exclusion form says so in words ("この行は出さない").
    const excludes = trimmed.includes('出さない');
    const named = /選択 [123]/.exec(trimmed)?.[0];
    // A marker that names no route applies to every route.
    const applies = named === undefined || named === label;

    if (excludes) {
      // Drop the following line when the marker's route is the target.
      if (applies) i += 1;
      continue;
    }

    // Skip the block when the marker names another route. The block runs to
    // the next blank line.
    if (!applies) {
      while (i + 1 < lines.length && (lines[i + 1] ?? '').trim() !== '') i += 1;
      i += 1; // the blank line itself
    }
  }

  let code = out.join('\n');

  // Prose placeholders first: they contain token placeholders inside, so
  // substituting tokens first would stop them matching the map.
  const prose = /\{[^{}]*[^\x00-\x7F][^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  const unknown: string[] = [];
  code = code.replace(prose, (m) => {
    const v = values[m];
    if (v === undefined) {
      unknown.push(m);
      return m;
    }
    return v;
  });

  // Then bare token placeholders: `{ACTION}`, `{STATE_NAME}` and friends.
  code = code.replace(/\{([A-Z][A-Za-z_]*)\}/g, (m) => {
    const v = values[m];
    if (v === undefined) {
      unknown.push(m);
      return m;
    }
    return v;
  });

  expect(unknown, `${label} の展開 map に無い placeholder:\n${unknown.join('\n')}`).toEqual([]);
  return code;
}

/**
 * The code lines the template introduces with a `{data seam ...}` marker,
 * reduced to the literal text around their placeholders.
 *
 * The worked example is written by hand, so the two can drift: an added line in
 * the template stays undemonstrated and the example still runs. Deriving the
 * list from the template means a new line has to show up in the example or this
 * fails (#1857 Round 2, R2-F4).
 *
 * Lines under a marker naming 選択 1 or 選択 2 are exempt — the example expands
 * 選択 3, and those two routes produce different code.
 */
function dataSeamContractLines(): string[] {
  const lines = stepThreeTemplate().split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (!/^\{data seam/.test(line.trim())) continue;
    if (/選択 1|選択 2/.test(line)) continue;
    // The marker introduces the code lines up to the next blank line.
    for (let j = i + 1; j < lines.length; j += 1) {
      const code = lines[j] ?? '';
      if (code.trim() === '') break;
      // A line that is nothing but a placeholder carries no literal to match.
      if (/^\s*\{[^}]*\}\s*,?\s*$/.test(code)) continue;
      out.push(code.trim());
    }
  }
  expect(out.length, 'data seam の code 行が template から取れない').toBeGreaterThan(0);
  return out;
}

/** A template line as a regex: literals kept, `{placeholder}` made a wildcard. */
function skeletonToRegex(line: string): RegExp {
  const parts = line.split(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
  const body = parts
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[\\s\\S]*?');
  return new RegExp(body);
}

/**
 * The runnable expansion of the Step 3 template, between the marker comments.
 *
 * The template itself is full of `{placeholder}` text and cannot be executed.
 * The worked example is the same shape with concrete names, so running it is
 * the only way to tell whether the template describes code that works. Round 1
 * of #1857 found the template produced a `ReferenceError` that collected zero
 * tests, and every wording assertion here still passed.
 */
function workedExample(): string {
  const m = /<!-- kiwa-nextjs:worked-example:start -->\n```ts\n([\s\S]*?)```\n<!-- kiwa-nextjs:worked-example:end -->/.exec(
    SKILL,
  );
  expect(m?.[1], '展開例の marker が見つからない').toBeTruthy();
  return m?.[1] ?? '';
}

const TMP_ROOTS: string[] = [];

afterAll(() => {
  for (const dir of TMP_ROOTS) rmSync(dir, { recursive: true, force: true });
});

/**
 * The state module each route needs.
 *
 * `reset` gets the reset and seed exports Step 2 asks for first; the other two
 * do not, which is what pushes them to the later routes.
 */
function usersModule(route: Route | 'example'): string {
  // A top-level side effect is what separates 選択 2 from 選択 3. Re-importing
  // the module (選択 2) runs it again; replacing the module (選択 3) never runs
  // it at all. Without one, both routes work on the same fixture and the test
  // proves nothing about when to pick which (#1857 Round 2 retry 2, R2R2-F1).
  const sideEffect =
    route === 'resetModules' || route === 'mock'
      ? ['globalThis.__usersLoads = (globalThis.__usersLoads ?? 0) + 1;']
      : [];
  const base = [
    ...sideEffect,
    // Exported as a value as well as through functions. Modules commonly do
    // both, and the two forms behave differently inside a `vi.mock` factory.
    'export const store = new Map();',
    'export async function findUserByEmail(email) { return store.get(email) ?? null; }',
    'export async function createUser(input) {',
    '  const user = { id: `u_${store.size + 1}`, email: input.email };',
    '  store.set(input.email, user);',
    '  return user;',
    '}',
  ];
  if (route !== 'reset') return base.join('\n');
  return [
    ...base,
    'export function __resetForTesting() { store.clear(); }',
    'export async function seedUser(input) {',
    "  store.set(input.email, { id: 'u_seed', email: input.email });",
    '}',
  ].join('\n');
}

/**
 * Write generated code into a throwaway project alongside the action and state
 * module it names, then run it under this repo's Vitest.
 */
function runGenerated(
  source: string,
  route: Route | 'example' = 'example',
): { ok: boolean; output: string } {
  const dir = mkdtempSync(join(tmpdir(), 'kiwa-seam-'));
  TMP_ROOTS.push(dir);
  mkdirSync(join(dir, 'tests'), { recursive: true });

  writeFileSync(join(dir, 'tests', 'users.js'), usersModule(route));

  writeFileSync(
    join(dir, 'tests', 'signup.js'),
    [
      "import { createUser, findUserByEmail } from './users.js';",
      'export async function signup(formData) {',
      "  const email = String(formData.get('email') ?? '').trim().toLowerCase();",
      "  const password = String(formData.get('password') ?? '');",
      "  if (!email.includes('@')) return { ok: false, error: 'invalid-email' };",
      "  if (password.length < 8) return { ok: false, error: 'weak-password' };",
      "  if (await findUserByEmail(email)) return { ok: false, error: 'already-registered' };",
      '  const user = await createUser({ email, password });',
      '  return { ok: true, userId: user.id };',
      '}',
    ].join('\n'),
  );

  writeFileSync(join(dir, 'tests', 'generated.test.js'), source);
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module' }));

  // The template imports the helper by package name, which does not resolve in
  // a throwaway directory. Aliased to the real source rather than stubbed, so
  // the expansion runs against the helper it will run against in a user's app.
  //
  // The config file is loaded by Node, not by Vitest's resolver, so it needs a
  // real `node_modules` next to it to find `vitest/config`.
  symlinkSync(resolve(REPO_ROOT, 'node_modules'), join(dir, 'node_modules'), 'dir');
  const helper = resolve(REPO_ROOT, 'packages/nextjs/src/index.ts');
  writeFileSync(
    join(dir, 'vitest.config.js'),
    [
      "import { defineConfig } from 'vitest/config';",
      'export default defineConfig({',
      `  resolve: { alias: { '@kiwa-lab/nextjs': ${JSON.stringify(helper)} } },`,
      '});',
    ].join('\n'),
  );

  const vitestBin = resolve(REPO_ROOT, 'node_modules/.bin/vitest');
  try {
    const out = execFileSync(vitestBin, ['run', '--root', dir, '--environment', 'node'], {
      cwd: dir,
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 120_000,
    });
    return { ok: true, output: out };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    return { ok: false, output: `${e.stdout ?? ''}\n${e.stderr ?? ''}` };
  }
}

describe('kiwa-nextjs は data seam を検出して seed する', () => {
  // The helper seeds only its own env in every mode, so a module-level store
  // leaks the same way behind `invokeMiddleware` / `renderServerComponent` /
  // `invokeParallelRoutes` / `setupNextRscEnv`. Fixing only the mode that was
  // measured leaves the other four broken.
  const OTHER_MODES = [
    '## middleware mode (Issue #495、 v1.0.2+)',
    '## RSC mode (Issue #494、 v1.0.3+)',
    '## Parallel Routes mode (Issue #523、 v1.0.4+)',
    '## RSC streaming + Suspense boundary 拡張 (`--layer nextjs-rsc-streaming`、 Issue #558)',
  ];

  // `invokeServerAction` seeds formData / args / cookies / headers and nothing
  // else. An action reading a module-level store leaks state between cases,
  // and the env-seam check does not notice because the action touches neither
  // redirect nor cookies nor revalidatePath (#1856, measured on a real app).
  it('Step 2 が grep を判定ではなく候補抽出として扱う', () => {
    const dataSeam = section('#### data seam (seed する軸)');
    expect(dataSeam).toContain('grep');
    // A regex over declaration syntax cannot see a factory call or a
    // destructured binding, so treating its output as the answer produces a
    // false zero on ordinary code.
    //
    // Asserted on the prose line, not anywhere in the section. The bash block's
    // own comment says the same thing, so an alternation over the whole section
    // stayed green when the rule itself was rewritten to the opposite.
    const grepRule = dataSeam
      .split('\n')
      .filter((line) => !line.startsWith('#') && line.includes('grep'))
      .join('\n');
    expect(grepRule).toContain('0 件と決めない');
    for (const missed of ['factory', '分割代入', 'static', 're-export']) {
      expect(dataSeam, `落ちる形の列挙に ${missed} が無い`).toContain(missed);
    }
  });

  it('辿る範囲に visited set と上限がある', () => {
    const dataSeam = section('#### data seam (seed する軸)');
    // Without these, a cyclic import graph never terminates and a large app
    // makes generation unbounded.
    expect(dataSeam).toContain('visited set');
    expect(dataSeam).toMatch(/深さ \d+|file \d+ 件/);
    expect(dataSeam).toContain('node_modules');
  });

  it('判定が 3 値で、 未確認を 0 件に倒さない', () => {
    const dataSeam = section('#### data seam (seed する軸)');
    // "not found" and "could not look" are different answers. Collapsing the
    // second into the first drops the seed exactly where the traversal gave up.
    // The word appears in the traversal section too, so the assertion is on the
    // decision table: three outcomes, and the third one still seeds.
    const table = dataSeam
      .split('\n')
      .filter((line) => line.startsWith('|') && line.includes('seed 経路'));
    expect(table, `判定表の行が足りない:\n${table.join('\n')}`).toHaveLength(3);
    const unconfirmed = table.filter((line) => line.includes('未確認'));
    expect(unconfirmed).toHaveLength(1);
    expect(unconfirmed[0]).toContain('seed 経路を入れ');
  });

  it('実装を通す経路を mock より優先している', () => {
    const dataSeam = section('#### data seam (seed する軸)');
    // Replacing the module wholesale makes the security and uniqueness cases
    // assert against the mock, so a real defect in that module still passes.
    const order = ['reset / seed の export', 'vi.resetModules', 'vi.mock'];
    const positions = order.map((needle) => dataSeam.indexOf(needle));
    expect(positions.every((p) => p > -1), `選択肢が揃っていない: ${String(positions)}`).toBe(true);
    expect(positions, 'mock が先に来ている').toEqual([...positions].sort((a, b) => a - b));
  });

  it('Given の data 部分を clear 後に seed すると書いてある', () => {
    const dataSeam = section('#### data seam (seed する軸)');
    // `beforeEach` empties the store; a case that assumes an existing row has
    // to put it back, or it runs against empty state and the expectation from
    // the spec no longer matches.
    expect(dataSeam).toContain('Given');
    expect(dataSeam).toMatch(/clear した後に入れ直す|入れ直す/);
  });

  // The defect Round 1 caught: every wording assertion passed while the
  // template produced a test file that collected zero cases.
  it('展開例が実際に Vitest で走る', () => {
    const { ok, output } = runGenerated(workedExample());
    expect(ok, `展開例が走らなかった:\n${output}`).toBe(true);
    expect(output).toMatch(/3 passed|Tests {2}3 passed/);
  });

  it('vi.hoisted を外すと展開例が collect できなくなる', () => {
    // This is the failure the template used to describe. Asserting it keeps
    // `vi.hoisted` from being "simplified" away later.
    const broken = workedExample().replace(
      'const seam = vi.hoisted(() => ({ users: new Map() }));',
      'const seam = { users: new Map() };',
    );
    expect(broken, '差し替え対象が展開例に無い').not.toBe(workedExample());
    const { ok, output } = runGenerated(broken);
    expect(ok).toBe(false);
    expect(output).toMatch(/before initialization|hoisted/);
  });

  it('展開例が seed と clear の両方を実演している', () => {
    const example = workedExample();
    // A Given-row case and a case that must not see the previous row. One
    // without the other proves only half the contract.
    expect(example).toMatch(/seam\.users\.set\(/);
    expect(example).toMatch(/seam\.users\.clear\(\)/);
  });

  // Round 2 retry (R2b-F2): the check above skips lines that are nothing but a
  // placeholder, which is exactly where `Given.data` and the dynamic import
  // live. Expanding the template for each route and running the result covers
  // them, and a placeholder the map does not know fails outright.
  const ROUTE_VALUES: Record<Route, Record<string, string>> = {
    reset: {
      '{ACTION}': 'signup',
      '{ACTION_PATH}': './signup.js',
      '{MODULE}': 'signup',
      '{ID}': 'T-001',
      '{Observation}': '既存 row を seed して重複を検出する',
      // The template's 選択 1 covers modules exporting reset *or* seed; this
      // fixture exports both, so the import list carries both.
      '{RESET_EXPORT}': '__resetForTesting, seedUser',
      '{STATE_MODULE}': './users.js',
      '{選択 1 なら {RESET_EXPORT}();、 選択 2 なら vi.resetModules();、 選択 3 なら {STATE_NAME}.{STATE_FIELD} を空に戻す}':
        '__resetForTesting();',
      '{Given.data を 選択 1 なら seed export 呼出、 選択 3 なら {STATE_NAME}.{STATE_FIELD} への書込に展開}':
        "await seedUser({ email: 'a@b' });",
      '{FormData の各 entry を fd.set(key, value) に展開}':
        "fd.set('email', 'a@b'); fd.set('password', 'abcd1234');",
      '{Given.cookies を object に展開}': '{}',
      '{Given.headers を object に展開}': '{}',
      '{Args を配列に展開}': '[]',
      '{Then を expect(...).toBe(...) 等に展開}':
        "expect(result).toEqual({ ok: false, error: 'already-registered' });",
    },
    resetModules: {
      '{ACTION}': 'signup',
      '{ACTION_PATH}': './signup.js',
      '{MODULE}': 'signup',
      '{ID}': 'T-001',
      '{Observation}': 'reset 後の module で登録できる',
      '{STATE_MODULE}': './users.js',
      '{選択 1 なら {RESET_EXPORT}();、 選択 2 なら vi.resetModules();、 選択 3 なら {STATE_NAME}.{STATE_FIELD} を空に戻す}':
        'vi.resetModules();',
      '{Given.data を 選択 1 なら seed export 呼出、 選択 3 なら {STATE_NAME}.{STATE_FIELD} への書込に展開}':
        '',
      '{FormData の各 entry を fd.set(key, value) に展開}':
        "fd.set('email', 'a@b'); fd.set('password', 'abcd1234');",
      '{Given.cookies を object に展開}': '{}',
      '{Given.headers を object に展開}': '{}',
      '{Args を配列に展開}': '[]',
      '{Then を expect(...).toBe(...) 等に展開}':
        [
          'expect(result).toMatchObject({ ok: true });',
          '    // 実装を通す経路なので module body が走っている。',
          '    expect(globalThis.__usersLoads ?? 0).toBeGreaterThan(0);',
        ].join('\n'),
    },
    mock: {
      '{ACTION}': 'signup',
      '{ACTION_PATH}': './signup.js',
      '{MODULE}': 'signup',
      '{ID}': 'T-001',
      '{Observation}': '既存 row を seed して重複を検出する',
      '{STATE_MODULE}': './users.js',
      '{STATE_NAME}': 'seam',
      '{STATE_FIELD}': 'users',
      '{STATE_INITIALIZER}': 'new Map()',
      '{STATE_MODULE の各 export を {STATE_NAME}.{STATE_FIELD} 経由の実装に差し替える}':
        [
          'store: seam.users,',
          '  findUserByEmail: async (email) => seam.users.get(email) ?? null,',
          '  createUser: async (input) => {',
          '    const user = { id: `u_${seam.users.size + 1}`, email: input.email };',
          '    seam.users.set(input.email, user);',
          '    return user;',
          '  }',
        ].join('\n'),
      '{選択 1 なら {RESET_EXPORT}();、 選択 2 なら vi.resetModules();、 選択 3 なら {STATE_NAME}.{STATE_FIELD} を空に戻す}':
        'seam.users.clear();',
      '{Given.data を 選択 1 なら seed export 呼出、 選択 3 なら {STATE_NAME}.{STATE_FIELD} への書込に展開}':
        "seam.users.set('a@b', { id: 'u_seed', email: 'a@b' });",
      '{FormData の各 entry を fd.set(key, value) に展開}':
        "fd.set('email', 'a@b'); fd.set('password', 'abcd1234');",
      '{Given.cookies を object に展開}': '{}',
      '{Given.headers を object に展開}': '{}',
      '{Args を配列に展開}': '[]',
      '{Then を expect(...).toBe(...) 等に展開}':
        [
          "expect(result).toEqual({ ok: false, error: 'already-registered' });",
          '    // module ごと差し替えたので実装の body は 1 度も走っていない。',
          '    // 副作用を持つ module ではこれが 選択 3 を選ぶ理由になる。',
          '    expect(globalThis.__usersLoads ?? 0).toBe(0);',
        ].join('\n'),
    },
  };

  it.each(['reset', 'resetModules', 'mock'] as Route[])(
    'template を %s で展開したものが実際に走る',
    (route) => {
      const code = expandTemplate(route, ROUTE_VALUES[route]);
      expect(code, '展開結果に placeholder が残っている').not.toMatch(/\{[A-Z][A-Za-z_]*\}/);

      // The action is bound once. `resetModules` re-imports it inside the test
      // so it sees the fresh module; keeping the static import as well still
      // runs (the inner `const` shadows it) but leaves an unused import in
      // every generated file, which is what the exclusion marker prevents.
      const staticImport = new RegExp(`^import \\{ signup \\} from`, 'm').test(code);
      const dynamicImport = /await import\('\.\/signup\.js'\)/.test(code);
      if (route === 'resetModules') {
        expect(dynamicImport, 'resetModules 経路に動的 import が無い').toBe(true);
        expect(staticImport, 'resetModules 経路に静的 import が残っている').toBe(false);
      } else {
        expect(staticImport, `${route} 経路に静的 import が無い`).toBe(true);
        expect(dynamicImport, `${route} 経路に動的 import が混ざっている`).toBe(false);
      }

      // `expect(__usersLoads).toBe(0)` also passes when the module never had a
      // side effect to begin with, so the fixture's own content is pinned. The
      // two routes are only distinguishable while it is there.
      if (route === 'resetModules' || route === 'mock') {
        expect(usersModule(route), `${route} の fixture に副作用が無い`).toContain(
          '__usersLoads',
        );
        // Pinned as content, not behaviour. The `Then` assertion already fails
        // first when the route is broken (measured: relaxing these two lines
        // changes no outcome), so they document which route touches the real
        // module rather than detecting it. Removing them silently would lose
        // the only place that distinction is written down.
        const expected = route === 'mock' ? '.toBe(0)' : '.toBeGreaterThan(0)';
        expect(code, `${route} の展開に module load の assertion が無い`).toContain(
          `expect(globalThis.__usersLoads ?? 0)${expected}`,
        );
      }

      const { ok, output } = runGenerated(code, route);
      expect(ok, `${route} の展開が走らなかった:\n${output}\n--- code ---\n${code}`).toBe(true);
      expect(output).toMatch(/1 passed/);
    },
  );

  it('選択 3 の展開から mock を外すと落ちる', () => {
    // A relaxed assertion inside generated code still passes, so the outer test
    // cannot see it weaken. Removing the mock is the failure the assertion is
    // supposed to catch: the real module body runs, `__usersLoads` becomes 1,
    // and the seed goes somewhere the action never reads.
    const code = expandTemplate('mock', ROUTE_VALUES.mock);
    const withoutMock = code.replace(/vi\.mock\('\.\/users\.js'[\s\S]*?\}\)\);\n/, '');
    expect(withoutMock, 'mock block が展開結果に無い').not.toBe(code);

    const { ok, output } = runGenerated(withoutMock, 'mock');
    expect(ok, `mock を外しても通ってしまう:\n${output}`).toBe(false);
  });

  it('展開例が template の data seam 行をすべて実演している', () => {
    // Derived from the template, not listed here. Adding a line to the template
    // extends what the example has to show, without editing this test.
    const example = workedExample();
    for (const line of dataSeamContractLines()) {
      expect(example, `展開例が template の行を実演していない: ${line}`).toMatch(
        skeletonToRegex(line),
      );
    }
  });

  it('template が 3 つの seed 経路すべてに展開先を持つ', () => {
    // Step 2 offers reset export / vi.resetModules / vi.mock. A route named in
    // the rules but absent from the template cannot be generated, which is how
    // R2-F2 shipped: `vi.resetModules` was the recommended middle option and
    // the template had no place to put it.
    const template = stepThreeTemplate();
    // Asserted on the code each route emits, not on the label. The label
    // appears in several comment lines, so `toContain('選択 2')` stayed green
    // when the dynamic-import block was deleted.
    const routeCode: [string, RegExp][] = [
      ['選択 1', /import \{ \{RESET_EXPORT\} \} from/],
      ['選択 2', /await import\('\{ACTION_PATH\}'\)/],
      ['選択 3', /vi\.mock\('\{STATE_MODULE\}'/],
    ];
    for (const [route, code] of routeCode) {
      expect(template, `template に ${route} の展開先が無い`).toMatch(code);
    }
    expect(template, '選択 2 の reset 呼出が template に無い').toContain('vi.resetModules()');
  });

  it('hoist が壊れる条件を eager 評価で説明している', () => {
    const example = section('##### 展開例 (release-smoke が実際に走らせる)');
    // "state を値として返す時だけ" is too narrow: `size: seam.users.size` and a
    // spread are eager too, and reading the rule as a list of shapes makes the
    // other eager forms look safe. The boundary is when the factory runs.
    //
    // Asserted on the table, not the sentence above it. The sentence's wording
    // also appears in the example's own comment, so a phrase check stayed green
    // when the claim was narrowed back.
    const rows = example
      .split('\n')
      .filter((line) => line.startsWith('|') && /読む|読まない/.test(line));
    const eager = rows.filter((line) => /\|\s*読む\s*\|?\s*$/.test(line.trim()));
    const deferred = rows.filter((line) => line.includes('読まない'));
    expect(eager.length, `eager な形が 1 つしか挙がっていない:\n${rows.join('\n')}`)
      .toBeGreaterThanOrEqual(3);
    expect(deferred).toHaveLength(1);
    // The claim this replaced. Stating it again contradicts the table.
    expect(example, '「値として返す時だけ」 の断定が戻っている').not.toMatch(
      /「値として」\s*返す時だけ/,
    );
  });

  it('template が Given の data 部分を展開する場所を持つ', () => {
    // The rule lives in Step 2; without a slot in the template the generator
    // has nowhere to put the seed and every Given row is silently dropped.
    const template = stepThreeTemplate();
    expect(template).toMatch(/\{Given\.data[^}]*\}/);
  });

  it('4 mode の参照が共有節の条件を書き写していない', () => {
    // Round 1's pointer said "1 件以上なら seed 経路を足す", which predates the
    // three-value rule and silently excluded 未確認. A copied condition goes
    // stale the moment the shared section changes, so the pointers carry none.
    for (const heading of OTHER_MODES) {
      const body = section(heading);
      expect(body, `${heading} が条件を書き写している`).not.toMatch(/1 件以上なら/);
      expect(body).toContain('書き写さない');
    }
  });

  it('Step 3 の template が seed 経路を持つ', () => {
    const template = stepThreeTemplate();
    expect(template, 'mock 経路が template に無い').toContain('vi.mock');
    // Asserted on the assignment, not the word. The template's own comment says
    // "state は必ず vi.hoisted に置く", so `toContain('vi.hoisted')` stayed green
    // when the code line was rewritten to a plain object literal.
    expect(template, 'state の束縛が vi.hoisted を通っていない').toMatch(
      /const \{STATE_NAME\} = vi\.hoisted\(/,
    );
    expect(template, 'clear 経路が template に無い').toContain('beforeEach');
    // The reset route needs its import, not just a call in `beforeEach`.
    expect(template, 'reset 経路の import が template に無い').toMatch(
      /import \{ \{RESET_EXPORT\} \} from/,
    );
  });

  it('Step 3 が seed block を条件付きだと書いている', () => {
    const step3 = section('### Step 3: vitest test の生成');
    const conditional = step3
      .split('\n')
      .filter((line) => line.includes('data seam') && !line.startsWith('{'));
    expect(conditional.join('\n')).toMatch(/0 件.*省く|だけ出す/);
  });

  it.each(OTHER_MODES)('%s も data seam を省かない', (heading) => {
    expect(section(heading)).toContain('data seam (seed する軸) に従');
  });

  it('5 mode の helper が何を seed するかを 1 表にまとめている', () => {
    const dataSeam = section('#### data seam (seed する軸)');
    for (const helper of [
      'invokeServerAction',
      'invokeMiddleware',
      'renderServerComponent',
      'invokeParallelRoutes',
      'setupNextRscEnv',
    ]) {
      expect(dataSeam, `${helper} が seed 範囲の表に無い`).toContain(helper);
    }
  });

  it('落ちる形の列挙が file 内で 1 箇所に閉じている', () => {
    // Four mode sections restating the same table is how the declaration and
    // its copies drift apart. They point at the shared section instead.
    const occurrences = SKILL.split('\n').filter((line) => line.includes('分割代入'));
    expect(occurrences).toHaveLength(1);
  });
});
