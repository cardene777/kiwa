import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);

function read(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

/**
 * 起動できる形で書かれているか (#1908)。
 *
 * `kiwa layers` に解決を寄せた 3 件 (#1861 / #1899 / #1902) は、 どれも「解決を
 * CLI 1 箇所に閉じる」 変更だった。 閉じた先を **起動できるか** は誰も確かめて
 * いない。 release-smoke は `node packages/cli/dist/bin.js` を組み立てて呼んでおり、
 * これは skill が書いている形ではない。 dogfood で chain の 1 step 目が
 * `command not found: kiwa` で落ちて初めて判った。
 *
 * ここでは 2 つを見る。 skill が書いている形が 1 つに揃っていること、 そしてその形が
 * **実際に走ること**。 後者が要点で、 前者だけなら綴りが揃った動かない command で
 * 通ってしまう。
 *
 * 対象は fenced code block の行に限る。 本文の言及 (「`kiwa layers` に訊く」 /
 * 「`kiwa layers --json` が返した layer」) は道具の名前であって、 打ち込む行では
 * ない。 **覆えていないのは、 本文だけを読んで打ち込む経路**。 fence が隣にある形
 * (kiwa-design) はそれで足りるが、 本文が唯一の指示になっている skill が将来
 * 現れた場合はここでは捕まらない。
 */

/** The launcher the skills document, as its argv. */
const LAUNCHER = ['pnpm', 'exec', 'kiwa'];

interface Invocation {
  skill: string;
  line: number;
  /** The line as written, for the failure message. */
  text: string;
  /** The same line with quoted spans blanked, which is what the checks read. */
  code: string;
}

/**
 * Blank out quoted spans so a mention inside a string is not read as a command.
 *
 * `echo "ERROR: kiwa layers が失敗"` names the command in a message. The command
 * token of a real invocation is never itself inside quotes — only its arguments
 * are (`--module "$MODULE"`) — so removing the spans leaves invocations intact
 * and drops messages.
 *
 * Read one line at a time. A quote left open at the end of the line takes the
 * rest of the line with it, which is how a shell reads that line in isolation.
 * State is not carried into the next line: a string spanning lines would need
 * the fence parsed as shell, and the two forms in these files (here-doc bodies
 * and message strings) both sit on one line.
 */
function stripQuoted(line: string): string {
  let out = '';
  let quote: string | null = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (quote === null) {
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      out += ch;
      continue;
    }
    // Inside double quotes a backslash escapes the next character, so a `\"`
    // does not close the span. Single quotes have no escapes in shell.
    if (quote === '"' && ch === '\\') {
      i += 1;
      continue;
    }
    if (ch === quote) quote = null;
  }
  return out;
}

/**
 * Lines inside a fenced code block that run the CLI.
 *
 * Fences decide it rather than backticks: inside a fence there are no inline
 * code spans, so "appears in a fence" and "is meant to be run" coincide. The
 * fence marker is matched at the line start with its own run length, because a
 * ```` ```bash ```` opener and a ``` closer differ in content but not in role.
 */
function invocationsIn(body: string, skill: string): Invocation[] {
  const found: Invocation[] = [];
  let fence: string | null = null;
  body.split('\n').forEach((line, i) => {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line);
    if (marker) {
      const run = marker[1]!;
      if (fence === null) {
        fence = run[0]!.repeat(run.length);
        return;
      }
      // A closing fence is at least as long as the one it closes and carries no
      // info string, so a longer inner fence does not end the outer block.
      if (run[0] === fence[0] && run.length >= fence.length && line.trim() === run) {
        fence = null;
        return;
      }
      return;
    }
    if (fence === null) return;
    const code = stripQuoted(line);
    if (!/\bkiwa layers\b/.test(code)) return;
    found.push({ skill, line: i + 1, text: line.trim(), code: code.trim() });
  });
  return found;
}

function skillFiles(): { skill: string; rel: string }[] {
  return readdirSync(resolve(REPO_ROOT, '.claude/skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ skill: e.name, rel: `.claude/skills/${e.name}/SKILL.md` }))
    .filter(({ rel }) => existsSync(resolve(REPO_ROOT, rel)));
}

function invocations(): Invocation[] {
  return skillFiles().flatMap(({ skill, rel }) => invocationsIn(read(rel), skill));
}

describe('fence の中の起動行だけを取る', () => {
  it('本文の言及を起動行として数えない', () => {
    // 抽出が本文まで拾うと、 「`kiwa layers` に訊く」 の 1 行を直すまで下の検査が
    // 赤のままになる。 逆に fence を見落とすと空集合になり、 何も見ずに緑になる。
    const fixture = [
      '`--input-spec` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。',
      '',
      '```bash',
      'pnpm exec kiwa layers --json --layer contract',
      '```',
      '',
      '報告には `kiwa layers --json` が stderr に出した warning を載せる。',
    ].join('\n');
    expect(invocationsIn(fixture, 'x').map((i) => i.text)).toEqual([
      'pnpm exec kiwa layers --json --layer contract',
    ]);
  });

  it('message の中の command 名を起動行として数えない', () => {
    // fence の中にも「打ち込む行」 でない出現がある。 失敗時の echo が代表で、
    // 実測で `kiwa-test` の 2 行がこれだった。
    const fixture = [
      '```bash',
      'pnpm exec kiwa layers --json --layer "$LAYER" --module "$MODULE" \\',
      '  || { echo "ERROR: kiwa layers が失敗 (layer=$LAYER)"; exit 1; }',
      "  || { echo 'ERROR: kiwa layers の出力を読めない'; exit 1; }",
      '```',
    ].join('\n');
    const found = invocationsIn(fixture, 'x');
    expect(found.map((i) => i.line)).toEqual([2]);
    // 引数側の quote を落としても command は残る。
    expect(found[0]!.code).toBe('pnpm exec kiwa layers --json --layer  --module  \\');
  });

  it('quote の外し方が shell の読み方と合っている', () => {
    // `\"` は span を閉じない。 閉じ忘れた quote は行末まで飲む。
    expect(stripQuoted('a "b \\" c" d')).toBe('a  d');
    expect(stripQuoted("echo 'x' kiwa layers")).toBe('echo  kiwa layers');
    expect(stripQuoted('echo "unterminated kiwa layers')).toBe('echo ');
  });

  it('入れ子の fence で閉じ位置を取り違えない', () => {
    // 4 連 backtick の中に 3 連が現れる形。 3 連で閉じたことにすると、 その後ろの
    // 本文が fence の中と読まれる。
    const fixture = [
      '````markdown',
      '```bash',
      'pnpm exec kiwa layers --json',
      '```',
      '````',
      '本文で `kiwa layers` に触れる行。',
    ].join('\n');
    expect(invocationsIn(fixture, 'x').map((i) => i.text)).toEqual(['pnpm exec kiwa layers --json']);
  });

  it('実 skill から起動行を取れている', () => {
    // 生存確認。 抽出が壊れて 0 件になると、 以降の「全て揃っている」 が空集合に
    // 対する主張へ退化する。
    expect(invocations().length).toBeGreaterThan(10);
  });
});

describe('skill が書いている起動形が 1 つに揃っている', () => {
  it('すべての起動行が同じ launcher を通る', () => {
    // 揃っていないと「どちらが正しいか」 が読み手に残る。 #1899 が解決を CLI へ
    // 寄せた意味は、 呼び方が 1 つであって初めて成立する。
    const launcher = LAUNCHER.join(' ');
    const stray = invocations()
      .filter(({ code }) => !code.includes(`${launcher} layers`))
      .map(({ skill, line, text }) => `${skill}:${line}: ${text.slice(0, 100)}`);
    expect(stray, `launcher を通らない起動行:\n${stray.join('\n')}`).toEqual([]);
  });

  it('launcher の後ろに素の command が残っていない', () => {
    // `pnpm exec kiwa layers ... | kiwa layers ...` のように 1 行に 2 回書く形を
    // 上の検査は見逃す (行に launcher が 1 つあれば通る)。 出現回数で見る。
    const uneven = invocations()
      .filter(({ code }) => {
        const total = code.match(/\bkiwa layers\b/g)?.length ?? 0;
        const viaLauncher = code.match(
          new RegExp(`\\b${LAUNCHER.join(' ')} layers\\b`, 'g'),
        )?.length ?? 0;
        return total !== viaLauncher;
      })
      .map(({ skill, line, text }) => `${skill}:${line}: ${text.slice(0, 100)}`);
    expect(uneven, `素の command が残る行:\n${uneven.join('\n')}`).toEqual([]);
  });
});

describe('その起動形が実際に走る', () => {
  it('repo root で launcher が layer を返す', () => {
    // #1908 の本体。 `node packages/cli/dist/bin.js` を組み立てて呼ぶ検査は、
    // bin が link されていない状態でも通る (実測で release-smoke 888 件が緑のまま
    // chain の 1 step 目が落ちた)。 skill が書いている argv をそのまま渡す。
    const [command, ...prefix] = LAUNCHER as [string, ...string[]];
    const out = execFileSync(command, [...prefix, 'layers', '--json', '--layer', 'contract'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    const parsed = JSON.parse(out) as { layers: { id: string }[] };
    expect(parsed.layers.map((l) => l.id)).toContain('contract');
  });

  it('example dir を cwd にしても走る', () => {
    // skill は example の中から起動される (`kiwa-test` Step 5a が cwd を移す)。
    // workspace の外側に出るわけではないが、 root の node_modules/.bin を引けるかは
    // cwd で変わるため、 実際に降りて確かめる。
    const cwd = resolve(REPO_ROOT, 'examples/mint-nft');
    expect(existsSync(cwd), 'examples/mint-nft が無い').toBe(true);
    const [command, ...prefix] = LAUNCHER as [string, ...string[]];
    const out = execFileSync(command, [...prefix, 'layers', '--layer', 'contract'], {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    expect(out.trim()).toBe('contract');
  });
});

describe('launcher が宣言に支えられている', () => {
  it('root が CLI を依存として宣言している', () => {
    // 上の実行検査は、 宣言を消した後も link が残っている限り通る。 消えるのは
    // 次の `pnpm install` で、 その時点で気付く手立てが無くなる。 宣言そのものを
    // 見る。
    const root = JSON.parse(read('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const declared = { ...root.dependencies, ...root.devDependencies };
    expect(Object.keys(declared)).toContain('@kiwa-lab/cli');
  });

  it('CLI package が launcher の名前で bin を出している', () => {
    // `kiwa` という名前は CLI 側の宣言が決める。 rename されれば launcher が
    // 指す先が消えるので、 名前が一致することを見る。
    const cli = JSON.parse(read('packages/cli/package.json')) as {
      bin?: Record<string, string>;
    };
    const name = LAUNCHER[LAUNCHER.length - 1]!;
    expect(Object.keys(cli.bin ?? {}), `bin に ${name} が無い`).toContain(name);
    expect(existsSync(resolve(REPO_ROOT, 'packages/cli', cli.bin![name]!))).toBe(true);
  });
});
