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
 * `pnpm exec kiwa` に定まる。 `kiwa-app` だけは利用者 project で走り、 相手の package
 * manager が判らないので Node 同梱の npm から local の bin を引く (`npx --no kiwa`)。
 *
 * ここでは 3 つを見る。 各 skill がその文脈の起動形で書いていること、 起動行が
 * 消えていないこと、 そして **その形が実際に走ること**。 3 番目が要点で、 1 番目
 * だけなら綴りが揃った動かない command で通ってしまう。
 */

/** kiwa repo の中で走る skill が使う起動形。 */
const REPO_LAUNCHER = ['pnpm', 'exec', 'kiwa'];

/**
 * 利用者 project で走る skill が使う起動形。
 *
 * npm は Node に同梱されるので相手に別途 install させずに済み、 local の
 * `node_modules/.bin` を先に引く。 変数に入れて `$KIWA layers` と書く形は採らない =
 * 2 語以上を引用せずに展開する挙動が shell で割れる (bash は分割し、 zsh は分割
 * しないため `command not found: npx --no kiwa` になる。 macOS の既定 shell は zsh)。
 */
const USER_LAUNCHER = ['npx', '--no', 'kiwa'];

/** 利用者 project で走る skill。 */
const USER_PROJECT_SKILL = 'kiwa-app';

type Form = 'repo' | 'user' | 'bare';

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
      // 引用の外の `#` は行末までの comment。 落とさないと、 comment 中の
      // apostrophe (`don't` 等) が引用を開いたことになり、 状態を持ち回る以上
      // **その後ろの行がまとめて引用の中に見える**。 語頭の `#` だけを comment と
      // みなす (POSIX)。 語中の `#` は URL fragment などで現れる。
      //
      // 語頭は「空白の後」 だけではない。 shell の operator (`;` `|` `&` `(` `<` `>`)
      // の直後も新しい語の頭で、 `echo x;# don't` は comment になる。 空白だけに
      // 限ると、 この形の apostrophe が状態を汚す (Round 3 F2)。
      if (ch === '#' && (out === '' || /[\s;|&()<>]$/.test(out))) break;
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
 * CLI が受け付ける subcommand を、 CLI 自身の usage から読む。
 *
 * `layers` だけを見ていると、 同じ file の別 subcommand が素のまま残る。 実測で
 * `kiwa-app` Step 1 の `kiwa init --detect` がそうだった (Round 2 F1-a)。 一覧を
 * ここに書き写すと CLI が増やした時に追随しないので、 usage 文字列から取る。
 */
function subcommandsIn(source: string): string[] {
  const usage = /export const USAGE = `([\s\S]*?)`;/.exec(source);
  expect(usage, 'CLI の USAGE を読めない').not.toBeNull();
  const commands = /Commands:\n([\s\S]*?)\n\n/.exec(usage![1]!);
  expect(commands, 'USAGE に Commands 節が無い').not.toBeNull();
  const documented = [...new Set([...commands![1]!.matchAll(/^ {2}([a-z][a-z-]*)/gm)].map((m) => m[1]!))];

  // **件数の下限では足りない**。 usage の書式が変わって一部しか取れない時、 下限は
  // 通ってしまい、 取りこぼした subcommand が素の起動のまま検査を抜ける (Round 3 F1)。
  // 独立した 2 つ目の出所と突き合わせる = CLI が実際に分岐している command 名。
  // 片方だけ増減すれば食い違うので、 部分抽出はここで落ちる。
  const dispatched = [...new Set([...source.matchAll(/cmd === '([a-z][a-z-]*)'/g)].map((m) => m[1]!))];
  expect([...documented].sort(), 'usage と dispatch の subcommand が食い違う').toEqual(
    [...dispatched].sort(),
  );
  return documented;
}

function subcommands(): string[] {
  return subcommandsIn(read('packages/cli/src/runCli.ts'));
}

/** 語の間の空白を問わない形にした launcher pattern。 */
function launcherPattern(launcher: string[]): string {
  return launcher.map((token) => token.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')).join('[ \\t]+');
}

/**
 * CLI を起動している箇所を拾う pattern と、 その起動形。
 *
 * 受け付ける文法は **command 名と subcommand が同じ論理行に並ぶ** 形に限る。
 * `sh -c '...'` / `eval` / 変数間接参照 (`"$CMD" layers`) は読まない = 静的な shell
 * 解析は収束しないため、 文法を宣言して境界を明示する側を採る。
 *
 * 空白は launcher の内側でも問わない。 `pnpm  exec  kiwa` は shell では同じ command
 * で、 単一空白だけを認めると **正しい行を素の起動と誤判定する** (Round 2 F2-b)。
 */
function occurrence(): RegExp {
  const subs = subcommands().join('|');
  return new RegExp(
    `(${launcherPattern(REPO_LAUNCHER)}|${launcherPattern(USER_LAUNCHER)}|\\bkiwa\\b)[ \\t]+(?:${subs})\\b`,
    'g',
  );
}

function formOf(launcher: string): Form {
  const tokens = launcher.trim().split(/[ \t]+/);
  if (tokens.join(' ') === REPO_LAUNCHER.join(' ')) return 'repo';
  if (tokens.join(' ') === USER_LAUNCHER.join(' ')) return 'user';
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
  const pattern = occurrence();
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

    for (const m of merged.code.matchAll(pattern)) {
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


describe('subcommand 一覧を 2 つの出所で突き合わせる', () => {
  /** usage と dispatch を持つ最小の source。 */
  function fixture(usage: string[], dispatch: string[]): string {
    return [
      'export const USAGE = `Usage: kiwa <command> [options]',
      '',
      'Commands:',
      ...usage.map((name) => `  ${name} [options]        なにか`),
      '',
      'options:',
      '`;',
      ...dispatch.map((name) => `  if (cmd === '${name}') { return 0; }`),
    ].join('\n');
  }

  it('両方が同じなら一覧を返す', () => {
    expect(subcommandsIn(fixture(['init', 'layers'], ['init', 'layers']))).toEqual(['init', 'layers']);
  });

  it('usage が取りこぼした時に落ちる', () => {
    // 件数の下限では通ってしまう形。 取りこぼした subcommand は素の起動のまま
    // 検査を抜けるので、 2 つ目の出所と突き合わせて落とす (Round 3 F1)。
    expect(() => subcommandsIn(fixture(['init'], ['init', 'layers']))).toThrow();
  });

  it('dispatch にだけある command でも落ちる', () => {
    // 逆向き。 usage に書き忘れた command も食い違いとして扱う。
    expect(() => subcommandsIn(fixture(['init', 'layers', 'doctor'], ['init', 'layers']))).toThrow();
  });

  it('実 CLI の一覧を読めている', () => {
    // fixture だけだと、 実 file の書式が変わった時に気付けない。
    expect(subcommands()).toContain('layers');
    expect(subcommands()).toContain('init');
  });
});

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

  it('launcher の内側の空白も問わない', () => {
    // `pnpm  exec  kiwa` は shell では同じ command。 単一空白だけを認めると、
    // 正しい行を素の起動と誤判定する (Round 2 F2-b)。
    const fixture = [
      '```bash',
      'pnpm  exec\tkiwa layers --json',
      'npx --no  kiwa layers --json',
      '```',
    ].join('\n');
    expect(invocationsIn(fixture, 'x').map((i) => i.form)).toEqual(['repo', 'user']);
  });

  it('layers 以外の subcommand も起動として読む', () => {
    // `layers` だけを見ていた間、 同じ file の `kiwa init --detect` が素のまま
    // 残っていた (Round 2 F1-a)。 subcommand 一覧は CLI の usage から取る。
    const fixture = ['```bash', 'kiwa init --detect', 'npx --no kiwa init --detect', '```'].join('\n');
    expect(invocationsIn(fixture, 'x').map((i) => i.form)).toEqual(['bare', 'user']);
  });

  it('comment 中の apostrophe が後続行を飲まない', () => {
    // 引用状態を持ち回る以上、 comment の `'` を引用開始と読むと **fence の残り
    // 全部** が引用の中に見える (Round 2 F2-a)。 引用の外の `#` は行末までの
    // comment として落とす。
    const fixture = [
      '```bash',
      "# don't use the bare name here",
      'pnpm exec kiwa layers --json',
      '```',
    ].join('\n');
    expect(invocationsIn(fixture, 'x').map((i) => i.line)).toEqual([3]);
  });

  it('語中の # を comment と読まない', () => {
    // URL fragment などで現れる。 POSIX でも comment は語頭の `#` だけ。
    expect(stripQuoted('curl https://x/y#frag && kiwa layers').code).toBe(
      'curl https://x/y#frag && kiwa layers',
    );
    // 変数展開の `$#` も語中。
    expect(stripQuoted('test $# -gt 0').code).toBe('test $# -gt 0');
  });

  it('operator の直後の # も comment として読む', () => {
    // 語頭は空白の後だけではない。 `;` `|` `&` `(` の直後も新しい語の頭で、
    // ここを外すと apostrophe が引用状態を汚す (Round 3 F2)。
    const fixture = [
      '```bash',
      "echo x;# don't use the bare name",
      'pnpm exec kiwa layers --json',
      '```',
    ].join('\n');
    expect(invocationsIn(fixture, 'x').map((i) => i.line)).toEqual([3]);
    expect(stripQuoted("true &&# it's fine").code).toBe('true &&');
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

  it('利用者 project で走る skill は pnpm を要求しない', () => {
    // `pnpm exec` を直に書くと、 npm / yarn / bun の project で止まる。 相手の
    // package manager は判らないので、 Node 同梱の npm から local の bin を引く。
    const wrong = invocations()
      .filter(({ skill, form }) => skill === USER_PROJECT_SKILL && form !== 'user')
      .map(({ line, text }) => `${USER_PROJECT_SKILL}:${line}: ${text.slice(0, 100)}`);
    expect(wrong, `文脈に合わない起動行:\n${wrong.join('\n')}`).toEqual([]);
  });

  it('利用者 project 向けの skill が起動形を本文でも宣言する', () => {
    // block の形だけだと、 読み手は「なぜ npx なのか」 と「引けない時どうするか」 を
    // 知る手立てが無い。 節を持ち、 置き換え表と `--` の注意を添える。
    const body = read(`.claude/skills/${USER_PROJECT_SKILL}/SKILL.md`);
    expect(body, '§ CLI の起動形 が無い').toContain('## CLI の起動形');
    expect(body, '起動形を本文で名指ししていない').toContain(`\`${USER_LAUNCHER.join(' ')}\``);
    expect(body, 'flag だけを渡す時の -- 境界に触れていない').toContain(
      `${USER_LAUNCHER.join(' ')} -- --help`,
    );
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
      // Step 1 の `init --detect` と Step 2 の `layers` で 2 件。
      'kiwa-app': 2,
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

  it('利用者 project 向けの起動形も走る', () => {
    // 確かめるのは「pnpm を要求せずに local の bin を引けること」 まで。 npm /
    // yarn / bun それぞれの project を作って回す検査は持っていない。
    expect(run(USER_LAUNCHER, ['layers', '--layer', 'contract'], REPO_ROOT).trim()).toBe('contract');
  });

  it('前提の確認が CLI に届く', () => {
    // `npx --no kiwa --help` は `--help` を npx 自身が取り、 **CLI が入っていなくても**
    // npx の usage を出して exit 0 になる (実測)。 前提の確認としては必ず成功する =
    // install 漏れを見逃す。 `--` を挟んだ形が CLI に届くことを固定する。
    const reached = run(USER_LAUNCHER, ['--', '--help'], REPO_ROOT);
    expect(reached, 'CLI の usage が返っていない').toContain('Usage: kiwa <command>');

    // 挟まない形が npx に取られることも併せて示す。 これが変わったら注意書きの
    // 前提が変わる。
    const swallowed = run(USER_LAUNCHER, ['--help'], REPO_ROOT);
    expect(swallowed, 'npx が --help を取らなくなっている').not.toContain('Usage: kiwa <command>');
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
