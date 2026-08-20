import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, headingSectionIn, read } from './skill-md.js';

/**
 * `kiwa layers` の 2 つの path field は起点が違う、 を全 consumer が書いているか。
 *
 * `spec_path` は `--project-root` 起点、 `test_paths.files` は cwd 起点。 CLI は
 * `spec_path` に lang と module しか差し込まず、 `test_paths` だけ cwd 基準へ直す。
 * 読む側が起点を知らないと **spec だけ外す**。
 *
 * #2044 で `/kiwa-review` に、 #2046 で `/kiwa-test` に見つけた後、 残る 4 skill を dogfood
 * したところ 4 件とも同じ形で残っていた (#2048)。 **1 skill ずつ直すと片方だけ古いまま残る**
 * ので、 検査は skill 横断で 1 つに畳む (PR #2041 が forge / hardhat で採った形)。
 */

/** 解決を書いている consumer と、 その節の見出し。 */
const RESOLUTION_HEADING = '### 入力 spec の path は CLI から受け取る';
const RESOLUTION = /^### 入力 spec の path は CLI から受け取る$/m;

const LAYERS = (JSON.parse(read('docs/layers.json')) as {
  layers: {
    consumer_skill: string | null;
    also_consumed_by?: string[];
    test_outputs?: Record<string, string[]>;
  }[];
}).layers;

const CONSUMERS = [
  'kiwa-review',
  'kiwa-observe',
  ...LAYERS
    .flatMap((l) => [l.consumer_skill, ...(l.also_consumed_by ?? [])])
    .filter((s): s is string => Boolean(s)),
]
  // 宣言から導く = 対象を手で列挙すると、 layer が増えた時に検査だけ古いまま残る。
  // 解決を書いていない skill (orchestrator 等) は対象外。
  .filter((s, i, a) => a.indexOf(s) === i)
  .filter((s) => read(`.claude/skills/${s}/SKILL.md`).includes(RESOLUTION_HEADING));

const ANCHORS = /^#### 2 つの path は起点が違う$/m;
const FAILURE = /^#### 解決に失敗したら止める$/m;

function body(skill: string): string {
  return read(`.claude/skills/${skill}/SKILL.md`);
}

describe.each(CONSUMERS)('%s が spec の起点を書いている', (skill) => {
  it('解決 command に --project-root を渡す', () => {
    // 起点が `--project-root` である以上、 渡さない command は example 配下の spec を
    // cwd から探すことになる。
    const section = headingSectionIn(body(skill), RESOLUTION);
    const fence = /```bash\n([\s\S]*?)```/.exec(section);
    expect(fence, `${skill}: 解決 command の fence が無い`).toBeTruthy();
    expect(fence![1], `${skill}: 解決 command に --project-root が無い`).toContain(
      '--project-root',
    );
  });

  it('2 つの field の起点を表で分けて書いている', () => {
    // 散文ではなく **表の行** を見る。 節の地の文にも同じ語があるため、 節全体を対象に
    // すると行を薄める変異が素通りする (#2044 の変異 m8 で実測)。
    const rows = headingSectionIn(body(skill), ANCHORS)
      .split('\n')
      .filter((l) => l.startsWith('|'));
    const spec = rows.find((l) => l.includes('`spec_path`'));
    const tests = rows.find((l) => l.includes('test_paths'));
    expect(spec, `${skill}: 起点の表に spec_path 行が無い`).toBeTruthy();
    expect(spec!, `${skill}: spec_path の起点が --project-root でない`).toContain('--project-root');
    expect(tests, `${skill}: 起点の表に test_paths 行が無い`).toBeTruthy();
    expect(tests!, `${skill}: test_paths の起点が cwd でない`).toContain('cwd');
  });

  it('検証表が「解決先に file が無い」 を中断として持つ', () => {
    const row = headingSectionIn(body(skill), FAILURE)
      .split('\n')
      .filter((l) => l.startsWith('|'))
      .find((l) => l.includes('file が無い'));
    expect(row, `${skill}: 「file が無い」 行が検証表に無い`).toBeTruthy();
    expect(row!, `${skill}: file が無い時に中断すると書かれていない`).toContain('中断');
  });

  it('検証表の最終行が起点を伴って spec を開く', () => {
    // 「その `spec_path` を使う」 で終わると、 全行 pass した直後の Read が落ちる。
    // `/kiwa-observe` は 2 つの field を同列に並べており、 起点の違いが最も強く消えていた。
    const row = headingSectionIn(body(skill), FAILURE)
      .split('\n')
      .filter((l) => l.startsWith('|'))
      .find((l) => l.includes('上記いずれでもない'));
    expect(row, `${skill}: 検証表の最終行が無い`).toBeTruthy();
    expect(row!, `${skill}: 最終行が起点を書いていない`).toContain('$PROJECT_ROOT');
  });

  it('$PROJECT_ROOT の出どころを書いている', () => {
    expect(body(skill), `${skill}: $PROJECT_ROOT の定義が無い`).toMatch(
      /`\$PROJECT_ROOT` は skill 引数の `--project-root`/,
    );
  });

  it('--project-root を option として宣言している', () => {
    // 定義だけ書いて option に無いと、 呼出側が渡す手段を持たない。
    const options = body(skill)
      .split('\n')
      .filter((l) => l.startsWith('- `--'));
    expect(
      options.some((l) => l.startsWith('- `--project-root ')),
      `${skill}: --project-root が option に無い`,
    ).toBe(true);
  });
});

describe('複数 producer layer の解決 command', () => {
  const cases = LAYERS.flatMap((layer) => {
    const producers = Object.keys(layer.test_outputs ?? {});
    if (producers.length < 2) return [];
    return [layer.consumer_skill, ...(layer.also_consumed_by ?? [])]
      .filter((skill): skill is string => Boolean(skill))
      .map((skill) => [skill, producers.find((producer) => producer === skill)] as const);
  });

  it('複数 producer を持つ consumer が存在する', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it.each(cases)('%s が自身の producer を選ぶ', (skill, producer) => {
    expect(producer, `${skill}: test_outputs に対応する producer が無い`).toBeTruthy();
    const section = headingSectionIn(body(skill), RESOLUTION);
    const fence = /```bash\n([\s\S]*?)```/.exec(section);
    expect(fence, `${skill}: 解決 command の fence が無い`).toBeTruthy();
    expect(fence![1], `${skill}: 複数 producer から自身を選んでいない`).toContain(
      `--producer ${producer}`,
    );
  });
});

describe('起点の違いは CLI の実挙動である', () => {
  /**
   * 検査の前提を **実物で固定する**。 CLI が 2 つの field を同じ起点で返すようになったら、
   * 上の 6 検査は「もう不要な規約」 を守らせ続けることになる。
   */
  it.each([
    ['cli', 'kiwa-cli', 'kiwa-cli-test', 'examples/cli-poc'],
    ['data', 'orders', 'kiwa-data', 'examples/queue-poc'],
    ['api', 'items', 'kiwa-api', 'examples/nextjs-api-poc'],
  ])('%s layer は project-root 起点でしか spec を開けない', (layer, module, producer, example) => {
    const bin = resolve(REPO_ROOT, 'packages/cli/dist/bin.js');
    const out = execFileSync(
      'node',
      [
        bin,
        'layers',
        '--json',
        '--layer',
        layer,
        '--lang',
        'ja',
        '--module',
        module,
        '--producer',
        producer,
        '--project-root',
        example,
      ],
      { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
    );
    const spec = (JSON.parse(out) as { layers: { id: string; spec_path: string }[] }).layers.find(
      (l) => l.id === layer,
    )!.spec_path;

    expect(existsSync(resolve(REPO_ROOT, spec)), `${layer}: cwd 起点で開けてしまう`).toBe(false);
    expect(
      existsSync(resolve(REPO_ROOT, example, spec)),
      `${layer}: project-root 起点でも開けない`,
    ).toBe(true);
  });

  it('起点が一致する呼出では差が出ない (陰性対照)', () => {
    // 上の 3 件は「cwd から開けない」 を判定材料にする。 恒真でないことを **差がゼロの
    // 入力** で確かめる = `--project-root .` なら 2 つの起点は同じ dir を指す。
    const bin = resolve(REPO_ROOT, 'packages/cli/dist/bin.js');
    const out = execFileSync(
      'node',
      [bin, 'layers', '--json', '--layer', 'contract', '--lang', 'ja', '--module', 'mint-nft',
        '--producer', 'kiwa-forge', '--project-root', '.'],
      { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
    );
    const spec = (JSON.parse(out) as { layers: { id: string; spec_path: string }[] }).layers.find(
      (l) => l.id === 'contract',
    )!.spec_path;
    expect(existsSync(resolve(REPO_ROOT, spec)), '起点が一致しているのに開けない').toBe(true);
  });
});
