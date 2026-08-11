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
 * install した CLI は `node_modules/.bin/` に置かれ、 そこは PATH の探索対象では
 * ない。 素の名前で叩けるのは global install した環境だけ。
 *
 * **起動形は 2 つある**。 kiwa repo の中で走る skill は pnpm workspace に居るので
 * `pnpm exec kiwa` に定まる。 `kiwa-app` だけは利用者 project で走るため、 相手の
 * package manager が判らない = 起動形を変数に持ち、 既定を skill 自身が宣言する。
 *
 * ここでは 3 つを見る。 各 skill がその文脈の起動形で書いていること、 起動行が
 * 消えていないこと、 そして **宣言された形が実際に走ること**。 3 番目が要点で、
 * 1 番目だけなら綴りが揃った動かない command で通ってしまう。
 */

/** kiwa repo の中で走る skill が使う起動形。 */
const REPO_LAUNCHER = ['pnpm', 'exec', 'kiwa'];

/** 利用者 project で走る skill。 起動形は変数で、 既定は SKILL.md が宣言する。 */
const USER_PROJECT_SKILL = 'kiwa-app';

type Form = 'repo' | 'variable' | 'bare';

interface Invocation {
  skill: string;
  /** 1-origin。 行継続で繋げた場合は先頭行。 */
  line: number;
  /** 書かれたままの行 (失敗 message 用)。 */
  text: string;
  form: Form;
}

/**
 * 引用の内側を落とした本文と、 行末で開いたままの引用符を返す。
 *
 * `echo "ERROR: kiwa layers が失敗"` は command 名を message に書いているだけで、
 * 打ち込む行ではない。 実際の起動行は command 名そのものを引用しない (引数は
 * 引用する = `--module "$MODULE"`) ので、 引用区間を落とすと message だけが消える。
 *
 * **状態は行をまたいで持ち回る**。 実 skill に複数行にまたがる引用がある
 * (`kiwa-nextjs` の JSON payload)。 行ごとに状態を捨てると、 閉じ引用符だけの行
 * (`}'`) を「開いた」 と読み、 その後ろに続く command を落とす。
 */
function stripQuoted(line: string, initial: string | null = null): { code: string; open: string | null } {
  let out = '';
  let quote = initial;
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
    // 二重引用符の中では backslash が次の 1 文字を escape する = `\"` は閉じない。
    // 単一引用符の中に escape は無い。
    if (quote === '"' && ch === '\\') {
      i += 1;
      continue;
    }
    if (ch === quote) quote = null;
  }
  return { code: out, open: quote };
}

/**
 * CLI の `layers` を起動している箇所と、 その起動形。
 *
 * 受け付ける文法は 3 つで、 いずれも **command 名と `layers` が同じ論理行に並ぶ**
 * 形に限る。 `sh -c '...'` / `eval` / 変数間接参照 (`"$CMD" layers`) は読まない =
 * 静的な shell 解析は収束しないため、 文法を宣言して境界を明示する側を採る。
 */
const OCCURRENCE = /(pnpm exec kiwa|\$\{?KIWA\}?|\bkiwa\b)[ \t]+layers\b/g;

function formOf(launcher: string): Form {
  if (launcher === REPO_LAUNCHER.join(' ')) return 'repo';
  if (launcher.startsWith('$')) return 'variable';
  return 'bare';
}

/**
 * fenced code block の中で CLI を起動している行。
 *
 * fence で決める。 fence の中に inline code span は無いので、 「fence の中にある」
 * と「打ち込む行である」 が一致する。 本文の言及 (「`kiwa layers` に訊く」 /
 * 「`kiwa layers --json` が返した layer」) は道具の名前であって、 打ち込む行では
 * ない。
 *
 * **覆えていないのは、 本文だけを読んで打ち込む経路**。 fence が隣にある形は
 * それで足りるが、 本文が唯一の指示になっている skill が将来現れた場合はここでは
 * 捕まらない。
 */
function invocationsIn(body: string, skill: string): Invocation[] {
  const found: Invocation[] = [];
  let fence: string | null = null;
  let quote: string | null = null;
  /** 行継続 (`\` 終端) で繋いでいる途中の論理行。 */
  let pending: { line: number; text: string; code: string } | null = null;

  body.split('\n').forEach((raw, i) => {
    const marker = /^\s*(`{3,}|~{3,})/.exec(raw);
    if (marker) {
      const run = marker[1]!;
      if (fence === null) {
        fence = run[0]!.repeat(run.length);
        quote = null;
        pending = null;
        return;
      }
      // 閉じ fence は開いたものと同じ文字で、 同じ長さ以上で、 info string を
      // 持たない。 内側のより長い fence が外側を閉じない。
      if (run[0] === fence[0] && run.length >= fence.length && raw.trim() === run) {
        fence = null;
        quote = null;
        pending = null;
      }
      return;
    }
    if (fence === null) return;

    const stripped = stripQuoted(raw, quote);
    quote = stripped.open;

    // 行継続は論理行に繋ぐ。 `kiwa \` 改行 `layers` を 1 つの起動として読む。
    const continues = /\\$/.test(stripped.code.trimEnd());
    const piece = stripped.code.replace(/\\\s*$/, ' ');
    const start = pending ?? { line: i + 1, text: raw.trim(), code: '' };
    const merged = {
      line: start.line,
      text: pending ? `${start.text} ${raw.trim()}` : start.text,
      code: start.code + piece,
    };
    if (continues) {
      pending = merged;
      return;
    }
    pending = null;

    for (const m of merged.code.matchAll(OCCURRENCE)) {
      found.push({ skill, line: merged.line, text: merged.text, form: formOf(m[1]!) });
    }
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

/** 変数に既定を入れる宣言 (`KIWA="${KIWA:-...}"`) の、 既定値の側。 */
const DECLARATION = /KIWA="\$\{KIWA:-([^"}]+)\}"/g;

/**
 * `kiwa-app` が宣言する既定の起動形を、 その宣言から読む。
 *
 * 宣言は 1 箇所ではない。 § CLI の起動形 が説明として持ち、 Step 2 の block も
 * 自分で持つ (block は単体で実行され、 env は次の実行に持ち越されない)。 複数ある
 * 以上、 **全部が同じ値であること** を要求する = 片方だけ直すと 2 つの既定が並ぶ。
 */
function declaredUserLauncher(): string[] {
  const declared = [...read(`.claude/skills/${USER_PROJECT_SKILL}/SKILL.md`).matchAll(DECLARATION)].map(
    (m) => m[1]!.trim(),
  );
  expect(declared.length, `${USER_PROJECT_SKILL} が KIWA の既定を宣言していない`).toBeGreaterThan(0);
  expect([...new Set(declared)], `既定が 1 つに定まらない: ${declared.join(' / ')}`).toHaveLength(1);
  return declared[0]!.split(/\s+/);
}

/** fence ごとの中身 (先頭行の 1-origin 行番号つき)。 */
function fences(body: string): { line: number; body: string }[] {
  const out: { line: number; body: string }[] = [];
  let open: { line: number; marker: string; lines: string[] } | null = null;
  body.split('\n').forEach((raw, i) => {
    const marker = /^\s*(`{3,}|~{3,})/.exec(raw);
    if (marker) {
      const run = marker[1]!;
      if (open === null) {
        open = { line: i + 2, marker: run[0]!.repeat(run.length), lines: [] };
        return;
      }
      if (run[0] === open.marker[0] && run.length >= open.marker.length && raw.trim() === run) {
        out.push({ line: open.line, body: open.lines.join('\n') });
        open = null;
        return;
      }
    }
    if (open !== null) open.lines.push(raw);
  });
  return out;
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
    expect(invocationsIn(fixture, 'x').map((i) => [i.line, i.form])).toEqual([[4, 'repo']]);
  });

  it('message の中の command 名を起動行として数えない', () => {
    // fence の中にも「打ち込む行」 でない出現がある。 失敗時の echo が代表で、
    // 実測で `kiwa-test` の 2 行がこれだった。
    const fixture = [
      '```bash',
      'pnpm exec kiwa layers --json --layer "$LAYER" --module "$MODULE"',
      '  || { echo "ERROR: kiwa layers が失敗 (layer=$LAYER)"; exit 1; }',
      "  || { echo 'ERROR: kiwa layers の出力を読めない'; exit 1; }",
      '```',
    ].join('\n');
    expect(invocationsIn(fixture, 'x').map((i) => i.line)).toEqual([2]);
  });

  it('quote の外し方が shell の読み方と合っている', () => {
    // `\"` は span を閉じない。 閉じ忘れた quote は行末まで飲む。
    expect(stripQuoted('a "b \\" c" d').code).toBe('a  d');
    expect(stripQuoted("echo 'x' kiwa layers").code).toBe('echo  kiwa layers');
    expect(stripQuoted('echo "unterminated kiwa layers').code).toBe('echo ');
  });

  it('複数行にまたがる quote の閉じ位置を追う', () => {
    // 実 skill にある形 (`kiwa-nextjs` の JSON payload)。 行ごとに状態を捨てると
    // 閉じ引用符 `'` を「開いた」 と読み、 **同じ行の後ろにある起動を落とす**。
    // 起動を次の行に置いた fixture では per-line reset でも同じ答えになるため、
    // 閉じ行に続けて書く形でないと識別力が無い (変異試験で実測)。
    const fixture = [
      '```bash',
      "node scripts/x.mjs '{",
      '  "cases": ["T-001"]',
      "}' && pnpm exec kiwa layers --json --layer contract",
      '```',
    ].join('\n');
    expect(invocationsIn(fixture, 'x').map((i) => i.line)).toEqual([4]);
  });

  it('複数行 quote の中に現れた command 名を起動として数えない', () => {
    // 上の裏。 payload の中身は打ち込む行ではない。 行ごとに状態を捨てると、
    // 2 行目以降が引用の外に見えて数えてしまう。
    const fixture = [
      '```bash',
      "node scripts/x.mjs '{",
      '  "note": "kiwa layers を後で叩く"',
      "}'",
      '```',
    ].join('\n');
    expect(invocationsIn(fixture, 'x')).toEqual([]);
  });

  it('行継続で分けた形を 1 つの起動として読む', () => {
    // `kiwa \` 改行 `layers` は shell では 1 つの command。 行単位で見ると
    // どちらの行にも `kiwa layers` が現れず、 素の起動が検査をすり抜ける。
    const fixture = ['```bash', 'kiwa \\', '  layers --json --layer contract', '```'].join('\n');
    expect(invocationsIn(fixture, 'x').map((i) => [i.line, i.form])).toEqual([[2, 'bare']]);
  });

  it('command 名と subcommand の間の空白を問わない', () => {
    // tab や複数空白で書いても shell では同じ command。
    const fixture = ['```bash', 'kiwa\tlayers --json', 'kiwa   layers --json', '```'].join('\n');
    expect(invocationsIn(fixture, 'x').map((i) => i.form)).toEqual(['bare', 'bare']);
  });

  it('変数経由の起動形を variable として読む', () => {
    const fixture = ['```bash', '$KIWA layers --json', '${KIWA} layers --json', '```'].join('\n');
    expect(invocationsIn(fixture, 'x').map((i) => i.form)).toEqual(['variable', 'variable']);
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
    expect(invocationsIn(fixture, 'x').map((i) => i.line)).toEqual([3]);
  });
});

describe('skill が書いている起動形が文脈に合っている', () => {
  it('素の command が 1 つも残っていない', () => {
    // PATH に載らないので、 素の名前で書かれた行はどの文脈でも走らない。
    const bare = invocations()
      .filter(({ form }) => form === 'bare')
      .map(({ skill, line, text }) => `${skill}:${line}: ${text.slice(0, 100)}`);
    expect(bare, `素の command が残る行:\n${bare.join('\n')}`).toEqual([]);
  });

  it('repo の中の skill は launcher を直に書く', () => {
    const wrong = invocations()
      .filter(({ skill, form }) => skill !== USER_PROJECT_SKILL && form !== 'repo')
      .map(({ skill, line, text }) => `${skill}:${line}: ${text.slice(0, 100)}`);
    expect(wrong, `launcher を通らない起動行:\n${wrong.join('\n')}`).toEqual([]);
  });

  it('利用者 project で走る skill は package manager を固定しない', () => {
    // `pnpm exec` を直に書くと、 npm / yarn / bun の project で止まる。 起動形は
    // 変数に持ち、 既定を skill 自身が宣言する。
    const wrong = invocations()
      .filter(({ skill, form }) => skill === USER_PROJECT_SKILL && form !== 'variable')
      .map(({ line, text }) => `${USER_PROJECT_SKILL}:${line}: ${text.slice(0, 100)}`);
    expect(wrong, `package manager を固定した起動行:\n${wrong.join('\n')}`).toEqual([]);
    // 宣言が無ければ変数は空で展開され、 `layers ...` が command として走る。
    expect(declaredUserLauncher().length).toBeGreaterThan(0);
  });

  it('変数で起動する block は同じ block で既定を宣言する', () => {
    // block は単体で実行され、 env は次の実行に持ち越されない。 別の節にある宣言に
    // 頼ると、 その block だけを実行した時に空で展開されて `layers ...` が command
    // として走る。 実測で、 宣言を 1 箇所消しても他の検査は全て緑のままだった。
    const naked = fences(read(`.claude/skills/${USER_PROJECT_SKILL}/SKILL.md`))
      .filter(({ body }) => /\$\{?KIWA\}?[ \t]+layers\b/.test(body))
      .filter(({ body }) => !new RegExp(DECLARATION.source).test(body))
      .map(({ line }) => `${USER_PROJECT_SKILL}:${line}`);
    expect(naked, `既定を宣言せずに $KIWA を使う block:\n${naked.join('\n')}`).toEqual([]);
  });

  it('起動行の数が宣言どおり', () => {
    // 下限 (「1 件以上ある」) では、 起動行を消す変更が検査を素通りする。 数を
    // 増減させるのは設計上の行為なので、 同じ変更の中でここを直して差分に出す。
    const counted = invocations().reduce<Record<string, number>>((acc, { skill }) => {
      acc[skill] = (acc[skill] ?? 0) + 1;
      return acc;
    }, {});
    expect(counted).toEqual({
      'kiwa-a11y': 1,
      'kiwa-api': 1,
      'kiwa-app': 1,
      'kiwa-auth': 1,
      'kiwa-cache': 1,
      'kiwa-cli-test': 1,
      'kiwa-data': 1,
      'kiwa-design': 1,
      'kiwa-e2e': 1,
      'kiwa-edge': 1,
      'kiwa-forge': 1,
      'kiwa-hardhat': 1,
      'kiwa-nextjs': 1,
      'kiwa-observe': 2,
      'kiwa-orm': 1,
      'kiwa-play': 1,
      'kiwa-queue': 1,
      'kiwa-review': 2,
      'kiwa-test': 2,
      'kiwa-ui': 1,
      'kiwa-vitest': 1,
    });
  });
});

describe('その起動形が実際に走る', () => {
  /** 起動形をそのまま argv にして走らせ、 stdout を返す。 */
  function run(launcher: string[], args: string[], cwd: string): string {
    const [command, ...prefix] = launcher as [string, ...string[]];
    return execFileSync(command, [...prefix, ...args], { cwd, encoding: 'utf-8', stdio: 'pipe' });
  }

  it('repo root で launcher が layer を返す', () => {
    // #1908 の本体。 `node packages/cli/dist/bin.js` を組み立てて呼ぶ検査は、
    // bin が link されていない状態でも通る (実測で release-smoke 888 件が緑のまま
    // chain の 1 step 目が落ちた)。 skill が書いている argv をそのまま渡す。
    const out = run(REPO_LAUNCHER, ['layers', '--json', '--layer', 'contract'], REPO_ROOT);
    const parsed = JSON.parse(out) as { layers: { id: string }[] };
    expect(parsed.layers.map((l) => l.id)).toContain('contract');
  });

  it('example dir を cwd にしても走る', () => {
    // skill は example の中から起動される (`kiwa-test` Step 5a が cwd を移す)。
    // workspace の外側に出るわけではないが、 root の node_modules/.bin を引けるかは
    // cwd で変わるため、 実際に降りて確かめる。
    const cwd = resolve(REPO_ROOT, 'examples/mint-nft');
    expect(existsSync(cwd), 'examples/mint-nft が無い').toBe(true);
    expect(run(REPO_LAUNCHER, ['layers', '--layer', 'contract'], cwd).trim()).toBe('contract');
  });

  it('利用者 project 向けの既定も走る', () => {
    // `kiwa-app` が宣言している既定を、 宣言から読んでそのまま走らせる。 これが
    // 確かめるのは「pnpm を要求せずに local の bin を引けること」 まで。 npm /
    // yarn / bun それぞれの project を作って回す検査は持っていない。
    const out = run(declaredUserLauncher(), ['layers', '--layer', 'contract'], REPO_ROOT);
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
    const name = REPO_LAUNCHER[REPO_LAUNCHER.length - 1]!;
    expect(Object.keys(cli.bin ?? {}), `bin に ${name} が無い`).toContain(name);
    expect(existsSync(resolve(REPO_ROOT, 'packages/cli', cli.bin![name]!))).toBe(true);
  });
});
