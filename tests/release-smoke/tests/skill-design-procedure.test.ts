import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, headingSectionIn, read, skillBody } from './skill-md.js';

/**
 * `/kiwa-design` の手順を command 単位で実行した時に成立するか (#2064)。
 *
 * Layer 1 は chain の入口で、 書き先を外すと Layer 2 は `kiwa layers` 経由の正しい path を
 * 見に行くため spec を見つけられない。 **spec 生成も test 生成もそれぞれ成功で終わる** ので、
 * 実行して初めて分かる。
 *
 * dogfood で 3 件出た。 書き先を `--layer` から手で組み立てる式が 7 箇所 (20 layer 中 16 で
 * 宣言と食い違う)、 Step 1.5 の grep が起点を持たず repo root からは 0 hit、
 * `references/layer2-bridge.md` が 5 layer 分の写しを持ったまま腐っていた。
 */

const BIN = resolve(REPO_ROOT, 'packages/cli/dist/bin.js');
const DESIGN = skillBody('kiwa-design');
const BRIDGE = read('.claude/skills/kiwa-design/references/layer2-bridge.md');

const LAYERS = (JSON.parse(read('docs/layers.json')) as {
  layers: { id: string; spec_path: string }[];
}).layers;

/** `--layer` の値をそのまま dir にした素朴な式。 これが正しいのは 4 layer だけ。 */
function naive(id: string): string {
  return `tests/spec/${id}/test-spec-{module}.md`;
}

function layersJson(args: string[]): { layers: { id: string; spec_path: string }[] } {
  return JSON.parse(
    execFileSync('node', [BIN, 'layers', '--json', ...args], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
    }),
  );
}

/** repo root から shell 1 行を走らせ、 出力行数を返す (no match の exit 1 は 0 行として扱う)。 */
function hits(command: string): number {
  try {
    const out = execFileSync('bash', ['-c', command], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return out.split('\n').filter((l) => l.length > 0).length;
  } catch (e) {
    // grep は operand の 1 つが存在しないと **一致があっても** 非 0 で終わる。
    // exit code で 0 hit に倒すと、 拾えているのに拾えていないと読む。
    const out = (e as { stdout?: string }).stdout ?? '';
    return out.split('\n').filter((l) => l.length > 0).length;
  }
}

describe('書き先を --layer から組み立てない', () => {
  it('素朴な式は 20 layer 中 16 で宣言と食い違う', () => {
    // 手順が書いていた「20 layer 中 16」 を実物から導く。 layer が増減した時に
    // 数だけ古くなるのを防ぐ (数は SKILL.md の本文にも出るので下で突き合わせる)。
    const disagree = LAYERS.filter((l) => l.spec_path !== naive(l.id));
    expect(LAYERS.length, 'layer を 1 つも読めていない (検査が空振りしている)').toBeGreaterThan(0);
    expect(disagree.length).toBe(16);

    // 一致する 4 件だけを見て規則を推せてしまうことが、 この穴の成立条件だった。
    expect(LAYERS.filter((l) => l.spec_path === naive(l.id)).map((l) => l.id).sort()).toEqual([
      'contract',
      'e2e',
      'integration',
      'unit',
    ]);
  });

  it('SKILL.md 本文の件数が実物と一致する', () => {
    const claim = /20 layer 中 (\d+) で一致しない/.exec(DESIGN);
    expect(claim, 'SKILL.md が件数を主張する文を持たない').toBeTruthy();
    expect(Number(claim![1]), 'SKILL.md の件数が docs/layers.json と食い違う').toBe(
      LAYERS.filter((l) => l.spec_path !== naive(l.id)).length,
    );
  });

  it('素朴な式が SKILL.md と layer2-bridge.md に 1 件も無い', () => {
    // 7 箇所あった。 1 箇所でも残ると、 そこだけ読んだ人が 16 layer で外す。
    expect(DESIGN).not.toContain('tests/spec/{layer}/');
    expect(BRIDGE).not.toContain('tests/spec/{layer}/');
  });

  it('CLI から受け取る経路が書いてある', () => {
    const section = headingSectionIn(DESIGN, /^### 書き先は CLI が返す 1 つの path$/m);
    const fence = /```bash\n([\s\S]*?)```/.exec(section);
    expect(fence, '解決 command の fence が無い').toBeTruthy();
    expect(fence![1], 'spec_path を受け取っていない').toContain('spec_path');
    expect(fence![1], 'module を渡していない').toContain('--module');
    expect(fence![1], 'lang を渡していない').toContain('--lang');
  });
});

describe('lang が path のどこに出るかを実物で固定する', () => {
  // 表の各 cell を CLI に問い直す。 手で書いた path は必ずずれるので、 実物から導く。
  it.each([
    ['contract', 'en', 'tests/spec/contract/test-spec-{module}.md'],
    ['contract', 'ja', 'tests/spec/contract/test-spec-{module}.ja.md'],
    ['a11y', 'en', 'tests/spec/integration/test-spec-{module}.a11y.md'],
    ['a11y', 'ja', 'tests/spec/integration/test-spec-{module}.a11y.ja.md'],
  ])('%s × %s の cell が CLI と一致する', (layer, lang, cell) => {
    // `--module` は `[a-z0-9-]` しか受けないので、 placeholder ではなく実値を渡して
    // 返った path を placeholder 形へ戻して比べる。
    const spec = layersJson(['--layer', layer, '--module', 'mod', '--lang', lang]).layers.find(
      (l) => l.id === layer,
    )!.spec_path;
    expect(spec.replace('test-spec-mod', 'test-spec-{module}')).toBe(cell);
    expect(DESIGN, `Step 0 の表に ${cell} が無い`).toContain(cell);
  });

  it('lang suffix は layer suffix の後ろに来る (陰性対照)', () => {
    // 上の 4 件は「cell と CLI が一致する」 を見るだけなので、 順序を取り違えた表を
    // 書いても cell 側を合わせれば通る。 順序そのものを実物で押さえる。
    const spec = layersJson(['--layer', 'a11y', '--module', 'm', '--lang', 'ja']).layers[0]!
      .spec_path;
    expect(spec.endsWith('.a11y.ja.md'), `lang が末尾でない: ${spec}`).toBe(true);
    expect(spec.endsWith('.ja.a11y.md'), '順序が逆でも通ってしまう').toBe(false);
  });
});

describe('Step 1.5 の grep が起点を持つ', () => {
  const STEP = /^#### Step 1\.5: UI feature grep \(e2e layer 必須\)$/m;

  function fence(): string {
    const section = headingSectionIn(DESIGN, STEP);
    const m = /```bash\n([\s\S]*?)```/.exec(section);
    expect(m, 'Step 1.5 に bash fence が無い').toBeTruthy();
    return m![1]!;
  }

  it('探索先を $PKG_DIR 起点で書く', () => {
    const body = fence();
    expect(body, 'PKG_DIR を確定させていない').toContain('PKG_DIR=');
    // 裸の operand が 1 つでも残ると、 その行だけ repo root で 0 hit になる。
    const bare = body
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('#'))
      .filter((l) => / (app|src\/components)\//.test(l));
    expect(bare, '起点の無い operand が残っている').toEqual([]);
  });

  it('手順の grep を repo root から実行してヒットする', () => {
    // 実行して確かめる。 「$PKG_DIR と書いてあるか」 だけでは、 値が空でも通る。
    const body = fence();
    const lines = body.split('\n');
    const grepIndex = lines.findIndex((l) => l.startsWith('grep -rn "data-testid"'));
    const grepLine = lines[grepIndex];
    const setup = lines.slice(0, grepIndex).join('\n');
    expect(setup, 'PKG_DIR と探索 dir の代入が無い').toContain('PKG_DIR=');
    expect(grepLine, 'data-testid の grep 行が無い').toBeTruthy();
    expect(hits(`${setup}\n${grepLine}`), '手順どおり実行して 0 hit').toBeGreaterThan(0);
    // 対象 example は app/ だけを持つ。 存在しない src/components/ も grep に渡すと、
    // hit を出力しながら exit 2 になるため、 出力件数だけでは回帰を検出できない。
    expect(() =>
      execFileSync('bash', ['-c', `${setup}\n${grepLine}`], {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });

  it('起点を外すと 0 hit になる (穴の再現)', () => {
    // 陽性対照。 直した形が効いているのは、 直す前の形が実際に 0 を返すから。
    // ここが 0 でなくなったら repo root に app/ が生えたということで、 上の検査の
    // 前提が変わる。
    expect(hits('grep -rn "data-testid" app/ src/components/ 2>/dev/null')).toBe(0);
  });

  it('awk で潰れることを実物で押さえる', () => {
    // 手順が禁じた `awk -F'"' '{print $2}'` は、 単引用や式の形を空文字にする。
    const with_awk = hits(
      `grep -rn "data-testid" examples/nextjs-app-router-full/app 2>/dev/null | awk -F'"' '{print $2}' | grep -c '^$'`,
    );
    expect(DESIGN, 'awk を禁じる記述が無い').toContain("awk -F'\"' '{print $2}'");
    // `grep -c` は 1 行 (件数) を返すので、 件数そのものを取り出して見る。
    const collapsed = Number(
      execFileSync(
        'bash',
        [
          '-c',
          `grep -rn "data-testid" examples/nextjs-app-router-full/app 2>/dev/null | awk -F'"' '{print $2}' | grep -c '^$'`,
        ],
        { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
      ).trim(),
    );
    expect(with_awk, '検査が空振りしている').toBe(1);
    expect(collapsed, '潰れる行が 1 件も無い').toBeGreaterThan(0);
  });
});

describe('layer2-bridge.md が宣言の写しを持たない', () => {
  it('spec path の対応表を持たない', () => {
    // 5 行の写しが 16 layer 分抜けたまま腐っていた。 写しを置かないことで直す。
    const rows = BRIDGE.split('\n').filter((l) => /^\| `tests\/spec\//.test(l));
    expect(rows, '対応表の写しが復活している').toEqual([]);
  });

  it('実装済 skill を未実装として書かない', () => {
    // 「Phase E-4 で新規追加予定」 の 3 skill はいずれも実装済で dogfood 済だった。
    //
    // 語だけを grep しない。 直した経緯を説明する散文にも同じ語が出るため、 **状態を
    // 主張している形** に絞る = 表の cell が「予定」 で終わる行と、 消費 skill を
    // 決まっていないものとして書く形。
    const stale = BRIDGE.split('\n').filter(
      (l) => /予定[ 　]*\|/.test(l) || /\(Layer 2 未確定/.test(l),
    );
    expect(stale, '未実装扱いの記述が残っている').toEqual([]);
  });

  it('CLI 経路を案内している', () => {
    expect(BRIDGE).toContain('kiwa layers --json');
    expect(BRIDGE).toContain('consumer_skill');
  });
});
