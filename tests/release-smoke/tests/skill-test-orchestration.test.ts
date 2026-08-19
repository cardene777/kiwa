import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { REPO_ROOT, headingSectionIn, read } from './skill-md.js';

/**
 * `/kiwa-test` の command が、 書かれたとおりに実行して意図した副作用を起こすか。
 *
 * dogfood で 4 件外れた (#2046)。 3 件は 2 つの原因に集約される。
 *
 * 1. **zsh の no-match は展開段で起きる**。 `2>/dev/null` は command の stderr を、
 *    `|| true` は command の exit を隠すだけで、 command 自体が起動しない。 report の
 *    cleanup は 4 dir を brace + glob で畳んでおり、 1 dir でも一致 0 件だと **他 3 dir に
 *    一致があっても 1 件も消えなかった** (実測 `mint-nft`)。
 * 2. **path の起点が Step ごとに違う**。 Step 2 は repo root へ移動し、 Step 3 は
 *    `examples/{example}/` へ移動する。 その後の command が cwd 依存のまま書かれていると、
 *    どちらの起点で解決されるかが Step の並び順に依存する。
 *
 * 散文で「glob を使わない」 と書いても守られたか分からないので、 **command 文字列を
 * 実際に shell へ通して** 挙動を見る。
 */

const TEST_SKILL = read('.claude/skills/kiwa-test/SKILL.md');

/** 指定 heading 配下の bash fence を全部。 */
function bashFencesUnder(body: string, heading: RegExp): string[] {
  const section = headingSectionIn(body, heading);
  return [...section.matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1]!);
}

/**
 * zsh に式を渡して、 展開段で落ちるかを見る。
 *
 * `zsh -c` で走らせるのは、 このリポジトリの skill が実際に走る shell が zsh だから。
 * bash は一致 0 件の glob を literal のまま渡すため、 bash で試すと差が出ない。
 */
function zshExpands(expr: string): { ok: boolean; stderr: string } {
  // **成功時も stderr を取る**。 `|| true` を付けた式は exit 0 で返るが、 展開段のエラーは
  // stderr に残る = exit だけを見ると「動いた」 と読めてしまう (旧形がまさにその形)。
  const stderrFile = join(mkdtempSync(join(tmpdir(), 'kiwa-zsh-')), 'stderr');
  try {
    execFileSync('zsh', ['-c', `{ ${expr} ; } 2>"${stderrFile}"`], {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { ok: true, stderr: readFileSync(stderrFile, 'utf-8') };
  } catch (e) {
    const err = e as { stderr?: string };
    const captured = existsSync(stderrFile) ? readFileSync(stderrFile, 'utf-8') : '';
    return { ok: false, stderr: captured || (err.stderr ?? '') };
  }
}

/** fence の中の、 comment でない行だけ。 */
function codeLines(fence: string): string[] {
  return fence
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0 && !l.trim().startsWith('#'));
}

describe('report cleanup が一致した分を実際に消す', () => {
  const roots: string[] = [];

  afterAll(() => {
    for (const dir of roots) rmSync(dir, { recursive: true, force: true });
  });

  /** 4 dir のうち 3 dir にだけ一致がある tree (dogfood で踏んだ形)。 */
  function fixture(): string {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-cleanup-'));
    roots.push(root);
    for (const d of ['contract', 'review', 'integrated']) {
      mkdirSync(join(root, 'tests/reports', d), { recursive: true });
      writeFileSync(join(root, 'tests/reports', d, `x-mint-nft.ja.md`), 'x');
    }
    // `tests/reports/e2e/` は作らない = 実 repo と同じ状態。
    return root;
  }

  it('旧形 (brace + glob) は 1 件も消せない', () => {
    const root = fixture();
    const legacy = `ROOT=${root}; EXAMPLE=mint-nft; rm -rf "$ROOT/tests/reports"/{contract,e2e,review,integrated}/*\${EXAMPLE}* 2>/dev/null || true`;
    const outcome = zshExpands(legacy);

    // `|| true` があるので exit は 0 に見えるが、 rm は起動していない。
    expect(outcome.stderr, 'zsh が展開段で落ちていない').toContain('no matches found');
    for (const d of ['contract', 'review', 'integrated']) {
      expect(
        existsSync(join(root, 'tests/reports', d, 'x-mint-nft.ja.md')),
        `${d} の report が消えている (旧形が動いてしまっている)`,
      ).toBe(true);
    }
  });

  it('新形 (dir ごとの find) は一致した 3 件を消す', () => {
    const root = fixture();
    const current = bashFencesUnder(TEST_SKILL, /^### Step 2\.5: 既存 test 検出 \+ 削除確認$/m)
      .find((f) => f.includes('tests/reports'));
    expect(current, 'cleanup の fence が見つからない').toBeTruthy();

    // fence から cleanup の loop だけを取り出して走らせる。 前段の cache 削除は
    // example dir を触るため、 この検査の関心ではない。
    const loop = /for d in contract e2e review integrated; do[\s\S]*?done/.exec(current!);
    expect(loop, 'dir ごとに回す loop が無い').toBeTruthy();

    const outcome = zshExpands(`set -e; ROOT=${root}; EXAMPLE=mint-nft\n${loop![0]}`);
    expect(outcome.ok, `cleanup が落ちた: ${outcome.stderr}`).toBe(true);
    for (const d of ['contract', 'review', 'integrated']) {
      expect(
        existsSync(join(root, 'tests/reports', d, 'x-mint-nft.ja.md')),
        `${d} の report が消えていない`,
      ).toBe(false);
    }
  });

  it('cleanup に brace + glob が残っていない', () => {
    const section = headingSectionIn(TEST_SKILL, /^### Step 2\.5: 既存 test 検出 \+ 削除確認$/m);
    expect(section, 'brace + glob の 1 行 cleanup が残っている').not.toMatch(
      /tests\/reports"\/\{[^}]*\}\/\*/,
    );
  });
});

describe('runner 検出が glob を shell に展開させない', () => {
  it('hardhat 検出が find を使う', () => {
    const fence = bashFencesUnder(TEST_SKILL, /^### Step 1a: runner 自動判断/m).find((f) =>
      f.includes('HAS_HARDHAT'),
    );
    expect(fence, 'HAS_HARDHAT を決める fence が無い').toBeTruthy();
    // **comment を除いた行だけを見る**。 節には「なぜ glob をやめたか」 の説明として
    // 旧形の command を引用してあり、 fence 全体を対象にすると説明文で発火する。
    const code = codeLines(fence!).join('\n');
    expect(code, 'hardhat 検出に glob が残っている').not.toMatch(/ls .*hardhat\.config\.\*/);
    expect(code, 'find で列挙していない').toContain('find');
  });

  it('hardhat を持たない example で shell error を出さない', () => {
    const fence = bashFencesUnder(TEST_SKILL, /^### Step 1a: runner 自動判断/m).find((f) =>
      f.includes('HAS_HARDHAT'),
    );
    const line = fence!.split('\n').find((l) => l.startsWith('HAS_HARDHAT='))!;
    // `hardhat.config.*` を持たない実在の example で走らせる。
    const outcome = zshExpands(
      `ROOT=${REPO_ROOT}; EXAMPLE=react-component-poc\n${line}\nprintf '%s' "$HAS_HARDHAT"`,
    );
    expect(outcome.stderr, 'no-match の shell error が出ている').not.toContain('no matches found');
  });
});

describe('git 操作が cwd に依らない', () => {
  it('Step 5.5 の git がすべて -C "$ROOT" を持つ', () => {
    // Step 3 が `examples/{example}/` へ cd するため、 repo 相対 pathspec を cwd 依存で
    // 書くと `examples/{example}/examples/{example}/test` に解決される (実測)。
    // **fence の中だけを見る**。 節の地の文にも「git mv 経由で履歴保持移動し」 という
    // 説明があり、 節全体を対象にすると散文で発火する。
    const gitLines = bashFencesUnder(TEST_SKILL, /^### Step 5\.5: 生成 test を/m)
      .flatMap((fence) => codeLines(fence))
      // `git` と subcommand の間に `-C "$ROOT"` が入るため、 隣接では拾えない。
      .filter((l) => /\bgit\b[^\n]*\b(mv|add)\b/.test(l));
    expect(gitLines.length, 'git mv / git add の行が見つからない').toBeGreaterThan(0);
    expect(
      gitLines.filter((l) => !l.includes('git -C "$ROOT"')),
      '対象を明示していない git 操作が残っている',
    ).toEqual([]);
  });

  it('fallback の git add が失敗を握り潰さない', () => {
    // 握り潰すと「退避したが staging されていない」 が成功として通り、 PR に test code が
    // 入らないまま完了する。 本 step の目的そのものが達成されない。
    const section = headingSectionIn(TEST_SKILL, /^### Step 5\.5: 生成 test を/m);
    const addAt = section.indexOf('git -C "$ROOT" add');
    expect(addAt, 'fallback の git add が無い').toBeGreaterThanOrEqual(0);
    expect(
      section.slice(addAt, addAt + 240),
      'git add の失敗を検知していない',
    ).toMatch(/\|\|\s*\{[^}]*exit 1/);
  });
});

describe('spec 存在 check の起点が生成先と揃っている', () => {
  it('Step 2.5 が examples/$EXAMPLE 起点で spec を見る', () => {
    const section = headingSectionIn(TEST_SKILL, /^### Step 2\.5: 既存 test 検出 \+ 削除確認$/m);
    const line = section.split('\n').find((l) => l.includes('EXISTING+=("') && l.includes('SPEC'));
    expect(line, 'spec の存在 check が見つからない').toBeTruthy();
    expect(line!, 'cwd 起点のまま spec を見ている').toContain('examples/$EXAMPLE/$SPEC');
  });

  it('全生成子 skill の起点が examples/{example} 配下であることと辻褄が合う', () => {
    // spec の存在 check は target に関係なく example 起点で見る。 contract だけでなく、
    // dApp / web の単独実行でも同じ起点を明示しないと生成先と存在 check が食い違う。
    const steps: [string, RegExp, RegExp[]][] = [
      [
        'Step 3',
        /^### Step 3: contract test chain 実行/m,
        [
          /^\[Step 3a\].*examples\/{example}\/.*cd/m,
          /^  examples\/{example}\/.*cd.*\/kiwa-forge/m,
          /^  examples\/{example}\/.*cd.*\/kiwa-hardhat/m,
        ],
      ],
      [
        'Step 4',
        /^### Step 4: dApp e2e test chain 実行/m,
        [
          /^\[Step 4a\].*examples\/{example}\/.*cd/m,
          /^\[Step 4b\].*examples\/{example}\/.*cd/m,
        ],
      ],
      [
        'Step 4w',
        /^### Step 4w: web chain 実行/m,
        [
          /^\[Step 4w-e2e-a\].*examples\/{example}\/.*cd/m,
          /^\[Step 4w-e2e-b\].*examples\/{example}\/.*cd/m,
          /^\[Step 4w-a11y-a\].*examples\/{example}\/.*cd/m,
          /^\[Step 4w-a11y-b\].*examples\/{example}\/.*cd/m,
        ],
      ],
    ];
    for (const [label, heading, invocations] of steps) {
      const section = headingSectionIn(TEST_SKILL, heading);
      for (const invocation of invocations) {
        expect(section, `${label} の生成子 skill に examples/{example}/ への cd が無い`).toMatch(
          invocation,
        );
      }
    }

    // CLI が返す spec_path は project-root 起点の相対 path で、 repo root からは開けない。
    const bin = resolve(REPO_ROOT, 'packages/cli/dist/bin.js');
    const out = execFileSync(
      'node',
      [bin, 'layers', '--json', '--layer', 'e2e', '--lang', 'ja', '--module', 'mint-nft'],
      { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
    );
    const spec = (JSON.parse(out) as { layers: { id: string; spec_path: string }[] }).layers.find(
      (l) => l.id === 'e2e',
    )!.spec_path;
    expect(spec.startsWith('tests/spec/'), 'spec_path が project-root 起点でない').toBe(true);
  });
});
