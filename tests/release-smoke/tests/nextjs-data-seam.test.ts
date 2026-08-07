import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
 * Write the worked example into a throwaway project alongside the action and
 * state module it names, then run it under this repo's Vitest.
 */
function runWorkedExample(source: string): { ok: boolean; output: string } {
  const dir = mkdtempSync(join(tmpdir(), 'kiwa-seam-'));
  TMP_ROOTS.push(dir);
  mkdirSync(join(dir, 'tests'), { recursive: true });

  writeFileSync(
    join(dir, 'tests', 'users.js'),
    [
      // Exported as a value as well as through functions. Modules commonly do
      // both, and the two forms behave differently inside a `vi.mock` factory.
      'export const store = new Map();',
      'export async function findUserByEmail(email) { return store.get(email) ?? null; }',
      'export async function createUser(input) {',
      '  const user = { id: `u_${store.size + 1}`, email: input.email };',
      '  store.set(input.email, user);',
      '  return user;',
      '}',
    ].join('\n'),
  );

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
    const { ok, output } = runWorkedExample(workedExample());
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
    const { ok, output } = runWorkedExample(broken);
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
