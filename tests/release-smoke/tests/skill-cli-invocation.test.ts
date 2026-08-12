import { execFile } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';

import { REPO_ROOT, read, rootDependencies, skillsWithSkillMd } from './skill-md.js';

const execFileAsync = promisify(execFile);

/**
 * 起動できる形で書かれているか (#1908)。
 *
 * `kiwa layers` に解決を寄せた 3 件 (#1861 / #1899 / #1902) は、 どれも「解決を CLI 1 箇所に
 * 閉じる」 変更だった。 閉じた先を **起動できるか** は誰も確かめていない。 release-smoke は
 * `node packages/cli/dist/bin.js` を組み立てて呼んでおり、 これは skill が書いている形では
 * ない。 dogfood で chain の 1 step 目が `command not found: kiwa` で落ちて初めて判った。
 *
 * install した CLI は `node_modules/.bin/` に置かれ、 そこは PATH の探索対象ではない。 素の
 * 名前で叩けるのは global install した環境だけ。
 *
 * **起動形は 2 つある**。 kiwa repo の中で走る skill は pnpm workspace に居るので
 * `pnpm exec kiwa` に定まる。 `kiwa-app` だけは利用者 project で走り、 相手の package manager が
 * 判らないので Node 同梱の npm から local の bin を引く (`npx --no kiwa`)。
 *
 * ここでは 3 つを見る。 各 skill がその文脈の起動形で書いていること、 起動行が消えていない
 * こと、 そして **その形が実際に走ること**。 3 番目が要点で、 1 番目だけなら綴りが揃った
 * 動かない command で通ってしまう。
 *
 * ## 受け付ける文法 (契約)
 *
 * 読むのは fenced code block の中で、 **command 名と subcommand が同じ論理行に並ぶ** 形だけ。
 * 引用の中と comment の中は読まない。 行継続は 1 論理行に繋ぐ。
 *
 * 読まない形を先に宣言する。 `sh -c '...'` / `eval` / 変数間接参照 (`"$CMD" layers`) / backtick
 * command substitution の中。 shell を完全に解析する道は取らない = 静的解析は収束せず、
 * lexical な隅を 1 つ塞ぐたびに別の隅が開く (本検査の review が 5 round でこれを実測した)。
 *
 * **代わりに、 読み方が外れた時に黙って通さない**。 fence の終わりで引用が開いたままなら、
 * その block は読めていないので検査ごと落とす。 取りこぼしを静かな緑にしない、 が境界の引き方。
 *
 * ## 判断の記録は case 表に置く (#1920)
 *
 * どの隅をどう読むかは review の 7 round が 1 つずつ見つけた。 その理由を **実装の comment と
 * test の説明の 2 箇所に書いていた** ため、 同じ話が 2 度あった。 理由は `STRIP_CASES` /
 * `SCAN_CASES` の `why` に置き、 実装側は「何をしているか」 だけを書く。 落ちた時に読むのは
 * 落ちた case の `why` で、 そこに round 番号まで入っている。
 */

/** kiwa repo の中で走る skill が使う起動形。 */
const REPO_LAUNCHER = ['pnpm', 'exec', 'kiwa'];

/**
 * 利用者 project で走る skill が使う起動形。
 *
 * npm は Node に同梱されるので相手に別途 install させずに済み、 local の `node_modules/.bin` を
 * 先に引く。 変数に入れて `$KIWA layers` と書く形は採らない = 2 語以上を引用せずに展開する
 * 挙動が shell で割れる (bash は分割し、 zsh は分割しないため `command not found: npx --no kiwa`
 * になる。 macOS の既定 shell は zsh)。
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
 * `echo "ERROR: kiwa layers が失敗"` は command 名を message に書いているだけで、 打ち込む行では
 * ない。 実際の起動行は command 名そのものを引用しない (引数は引用する = `--module "$MODULE"`)
 * ので、 引用区間を落とすと message だけが消える。
 *
 * **状態は行をまたいで持ち回る**。 実 skill に複数行にまたがる引用がある (`kiwa-nextjs` の JSON
 * payload)。 行ごとに状態を捨てると、 閉じ引用符だけの行 (`}'`) を「開いた」 と読み、 その後ろに
 * 続く command を落とす。
 */
export function stripQuoted(
  line: string,
  initial: string | null = null,
): { code: string; open: string | null; continues: boolean } {
  let out = '';
  let quote = initial;
  let continues = false;
  /** 直前に out へ足した 1 文字が escape 由来か (= 語の一部で、 operator ではない)。 */
  let escaped = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (quote === null) {
      // 引用の外の backslash は次の 1 文字を語の一部にする。 文字はそのまま残し、 operator で
      // ないことだけを escaped で覚える。 行末の `\` は escape ではなく行継続で、 呼出側が末尾
      // 文字から推し量らずに済むよう返り値で確定させる。
      if (ch === '\\') {
        if (i === line.length - 1) {
          continues = true;
          break;
        }
        out += line[i + 1]!;
        escaped = true;
        i += 1;
        continue;
      }
      // 引用の外の語頭の `#` は行末までの comment (POSIX)。 語頭とみなすのは行頭と空白の後、
      // および **引用の外で必ず operator になる文字** (`;` `|` `&`) の直後だけ。 `(` `)` `<` `>`
      // `{` は入れない = comment を過剰に検出する誤りは実在する起動行を落とす。
      if (ch === '#' && !escaped && (out === '' || /[\s;|&]$/.test(out))) break;
      escaped = false;
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      out += ch;
      continue;
    }
    escaped = false;
    // 二重引用符の中では backslash が次の 1 文字を escape する = `\"` は閉じない。 単一引用符の
    // 中に escape は無い。
    if (quote === '"' && ch === '\\') {
      i += 1;
      continue;
    }
    if (ch === quote) quote = null;
  }
  return { code: out, open: quote, continues };
}

/**
 * CLI が受け付ける subcommand を、 CLI 自身の usage から読む。
 *
 * `layers` だけを見ていると、 同じ file の別 subcommand が素のまま残る。 実測で `kiwa-app`
 * Step 1 の `kiwa init --detect` がそうだった (Round 2 F1-a)。 一覧をここに書き写すと CLI が
 * 増やした時に追随しないので、 usage 文字列から取る。
 */
export function subcommandsIn(source: string): string[] {
  const usage = /export const USAGE = `([\s\S]*?)`;/.exec(source);
  expect(usage, 'CLI の USAGE を読めない').not.toBeNull();
  const commands = /Commands:\n([\s\S]*?)\n\n/.exec(usage![1]!);
  expect(commands, 'USAGE に Commands 節が無い').not.toBeNull();
  const documented = [...new Set([...commands![1]!.matchAll(/^ {2}([a-z][a-z-]*)/gm)].map((m) => m[1]!))];

  // **件数の下限では足りない**。 書式が変わって一部しか取れない時、 下限は通ってしまい、 取り
  // こぼした subcommand が素の起動のまま抜ける (Round 3 F1)。 CLI が実際に分岐している名前と
  // 突き合わせ、 片方だけ増減したら落とす。
  const dispatched = [...new Set([...source.matchAll(/cmd === '([a-z][a-z-]*)'/g)].map((m) => m[1]!))];
  expect([...documented].sort(), 'usage と dispatch の subcommand が食い違う').toEqual(
    [...dispatched].sort(),
  );
  return documented;
}

let subcommandCache: string[] | null = null;
function subcommands(): string[] {
  subcommandCache ??= subcommandsIn(read('packages/cli/src/runCli.ts'));
  return subcommandCache;
}

/** 語の間の空白を問わない形にした launcher pattern。 */
function launcherPattern(launcher: string[]): string {
  return launcher.map((token) => token.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')).join('[ \\t]+');
}

/**
 * CLI を起動している箇所を拾う pattern。
 *
 * 空白は launcher の内側でも問わない。 `pnpm  exec  kiwa` は shell では同じ command で、 単一
 * 空白だけを認めると **正しい行を素の起動と誤判定する** (Round 2 F2-b)。
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
 * fence で決める。 fence の中に inline code span は無いので、 「fence の中にある」 と「打ち込む
 * 行である」 が一致する。 本文の言及 (「`kiwa layers` に訊く」) は道具の名前であって、 打ち込む
 * 行ではない。
 *
 * **覆えていないのは、 本文だけを読んで打ち込む経路**。 本文が唯一の指示になっている skill が
 * 将来現れた場合はここでは捕まらない。
 */
export function invocationsIn(body: string, skill: string): Invocation[] {
  const pattern = occurrence();
  const found: Invocation[] = [];
  let fence: string | null = null;
  let fenceLine = 0;
  let quote: string | null = null;
  /** 行継続 (`\` 終端) で繋いでいる途中の論理行。 */
  let pending: { line: number; text: string; code: string } | null = null;

  body.split('\n').forEach((raw, i) => {
    const marker = /^\s*(`{3,}|~{3,})/.exec(raw);
    if (marker) {
      const run = marker[1]!;
      if (fence === null) {
        fence = run[0]!.repeat(run.length);
        fenceLine = i + 1;
        quote = null;
        pending = null;
        return;
      }
      // 閉じ fence は開いたものと同じ文字で、 同じ長さ以上で、 info string を持たない。 内側の
      // より長い fence が外側を閉じない。
      if (run[0] === fence[0] && run.length >= fence.length && raw.trim() === run) {
        // 引用が開いたまま fence が閉じた = この block の読み方が外れている。 黙って進むと後続の
        // 起動が見えないまま緑になるので、 その場で落とす。
        expect(quote, `${skill}: fence (${fenceLine}-${i + 1} 行) の引用が閉じていない`).toBeNull();
        fence = null;
        quote = null;
        pending = null;
      }
      return;
    }
    if (fence === null) return;

    const stripped = stripQuoted(raw, quote);
    quote = stripped.open;

    // 行継続は論理行に繋ぐ。
    const continues = stripped.continues;
    const piece = continues ? `${stripped.code} ` : stripped.code;
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
  return skillsWithSkillMd().map((skill) => ({
    skill,
    rel: `.claude/skills/${skill}/SKILL.md`,
  }));
}

let invocationCache: Invocation[] | null = null;
function invocations(): Invocation[] {
  invocationCache ??= skillFiles().flatMap(({ skill, rel }) => invocationsIn(read(rel), skill));
  return invocationCache;
}

/** 失敗 message 用に `skill:line: text` へ潰す。 */
function locate(found: Invocation[]): string[] {
  return found.map(({ skill, line, text }) => `${skill}:${line}: ${text.slice(0, 100)}`);
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
    // 件数の下限では通ってしまう形。 取りこぼした subcommand は素の起動のまま検査を抜けるので、
    // 2 つ目の出所と突き合わせて落とす (Round 3 F1)。
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

/**
 * 引用と comment の外し方が shell の読み方と合っているか。
 *
 * 各行が review の 1 round で見つかった形。 `why` が根拠の SSOT で、 落ちた時に「直してよい
 * 振る舞いか」 をここで判じる。
 */
const STRIP_CASES: { why: string; input: string; code?: string; continues?: boolean }[] = [
  { why: '`\\"` は二重引用符を閉じない', input: 'a "b \\" c" d', code: 'a  d' },
  { why: '単一引用符の中は落とす', input: "echo 'x' kiwa layers", code: 'echo  kiwa layers' },
  { why: '閉じ忘れた引用は行末まで飲む', input: 'echo "unterminated kiwa layers', code: 'echo ' },
  { why: '語中の # は comment ではない (URL fragment)',
    input: 'curl https://x/y#frag && kiwa layers', code: 'curl https://x/y#frag && kiwa layers' },
  { why: '変数展開の $# も語中', input: 'test $# -gt 0', code: 'test $# -gt 0' },
  { why: 'operator の直後は語頭 (Round 3 F2)', input: "true &&# it's fine", code: 'true &&' },
  { why: '`{` は operator ではない = ${#VAR} を comment と読まない',
    input: 'echo ${#VAR} && pnpm exec kiwa layers', code: 'echo ${#VAR} && pnpm exec kiwa layers' },
  { why: 'escape した # は語の一部 (Round 5 R5-1)',
    input: 'echo a\\#b && kiwa layers', code: 'echo a#b && kiwa layers' },
  { why: '行末の escaped backslash は行継続ではない (Round 7 R7-1)', input: 'echo a\\\\', continues: false },
  { why: '行末の裸の backslash は行継続', input: 'pnpm exec kiwa layers \\', continues: true },
];

describe('引用と comment を shell と同じ規則で外す', () => {
  it.each(STRIP_CASES)('$why', ({ input, code, continues }) => {
    const got = stripQuoted(input);
    if (code !== undefined) expect(got.code).toBe(code);
    if (continues !== undefined) expect(got.continues).toBe(continues);
  });
});

/**
 * fence の中の起動行だけを取れているか。
 *
 * `expect` は `[行番号, 起動形]` の全件。 **件数の下限にしない** = 取りこぼしを緑にしないため、
 * どの行をどう読んだかまで固定する。
 */
interface ScanCase {
  why: string;
  /** bash fence の中身。 fence が 1 行目なので、 期待する行番号は 2 から始まる。 */
  bash?: string[];
  /** fence の外まで書く必要がある形 (本文との混在 / 入れ子 fence)。 */
  raw?: string[];
  expect: [number, Form][] | 'throws';
}

const SCAN_CASES: ScanCase[] = [
  { why: '本文の言及を起動行として数えない',
    raw: ['`--input-spec` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。', '',
      '```bash', 'pnpm exec kiwa layers --json --layer contract', '```', '',
      '報告には `kiwa layers --json` が stderr に出した warning を載せる。'],
    expect: [[4, 'repo']] },
  { why: 'fence の中でも message の中の command 名は数えない',
    bash: ['pnpm exec kiwa layers --json --layer "$LAYER" --module "$MODULE"',
      '  || { echo "ERROR: kiwa layers が失敗 (layer=$LAYER)"; exit 1; }',
      "  || { echo 'ERROR: kiwa layers の出力を読めない'; exit 1; }"],
    expect: [[2, 'repo']] },
  { why: '複数行にまたがる引用の閉じ位置を追う (kiwa-nextjs の JSON payload)',
    bash: ["node scripts/x.mjs '{", '  "cases": ["T-001"]', "}' && pnpm exec kiwa layers --json --layer contract"],
    expect: [[4, 'repo']] },
  { why: '複数行引用の中に現れた command 名は起動ではない',
    bash: ["node scripts/x.mjs '{", '  "note": "kiwa layers を後で叩く"', "}'"],
    expect: [] },
  { why: '行継続で分けた形を 1 つの起動として読む',
    bash: ['kiwa \\', '  layers --json --layer contract'],
    expect: [[2, 'bare']] },
  { why: 'command 名と subcommand の間の空白を問わない',
    bash: ['kiwa\tlayers --json', 'kiwa   layers --json'],
    expect: [[2, 'bare'], [3, 'bare']] },
  { why: 'launcher の内側の空白も問わない (Round 2 F2-b)',
    bash: ['pnpm  exec\tkiwa layers --json', 'npx --no  kiwa layers --json'],
    expect: [[2, 'repo'], [3, 'user']] },
  { why: 'layers 以外の subcommand も起動として読む (Round 2 F1-a)',
    bash: ['kiwa init --detect', 'npx --no kiwa init --detect'],
    expect: [[2, 'bare'], [3, 'user']] },
  { why: 'comment 中の apostrophe が後続行を飲まない (Round 2 F2-a)',
    bash: ["# don't use the bare name here", 'pnpm exec kiwa layers --json'],
    expect: [[3, 'repo']] },
  { why: 'operator の直後の # も comment として読む (Round 3 F2)',
    bash: ["echo x;# don't use the bare name", 'pnpm exec kiwa layers --json'],
    expect: [[3, 'repo']] },
  { why: 'escape した operator を語の区切りと読まない (Round 5 R5-1)',
    bash: ['echo a\\;#frag && pnpm exec kiwa layers --json'],
    expect: [[2, 'repo']] },
  { why: 'escape した文字を残す = `\\kiwa` (alias 迂回) を見失わない (Round 6 R6-1)',
    bash: ['\\kiwa layers --json'],
    expect: [[2, 'bare']] },
  { why: '行末の escaped backslash を行継続と読まない (Round 7 R7-1)',
    bash: ['pnpm exec \\\\', 'kiwa layers --json'],
    expect: [[3, 'bare']] },
  { why: 'substitution の閉じ括弧を語の区切りと読まない (Round 4 R4-1)',
    bash: ['echo $(printf y)#frag && pnpm exec kiwa layers --json',
      'echo $((1))#frag && npx --no kiwa init --detect'],
    expect: [[2, 'repo'], [3, 'user']] },
  { why: '入れ子の fence で閉じ位置を取り違えない',
    raw: ['````markdown', '```bash', 'pnpm exec kiwa layers --json', '```', '````',
      '本文で `kiwa layers` に触れる行。'],
    expect: [[3, 'repo']] },
  // backtick 内の comment のように、 読み方が外れる形は塞ぎ切れない。 塞げないこと自体は受け
  // 入れるが、 **黙って後続を隠す** のは受け入れない。
  { why: 'fence の終わりで引用が開いたままなら落ちる (Round 5 R5-2)',
    bash: ["echo `# don't`", 'pnpm exec kiwa layers --json'],
    expect: 'throws' },
];

describe('fence の中の起動行だけを取る', () => {
  it.each(SCAN_CASES)('$why', ({ bash, raw, expect: want }) => {
    const lines = raw ?? ['```bash', ...bash!, '```'];
    const body = lines.join('\n');
    if (want === 'throws') {
      expect(() => invocationsIn(body, 'x')).toThrow();
      return;
    }
    expect(invocationsIn(body, 'x').map((i) => [i.line, i.form])).toEqual(want);
  });
});

describe('skill が書いている起動形が文脈に合っている', () => {
  it('素の command が 1 つも残っていない', () => {
    // PATH に載らないので、 素の名前で書かれた行はどの文脈でも走らない。
    const bare = locate(invocations().filter(({ form }) => form === 'bare'));
    expect(bare, `素の command が残る行:\n${bare.join('\n')}`).toEqual([]);
  });

  it('repo の中の skill は launcher を直に書く', () => {
    const wrong = locate(
      invocations().filter(({ skill, form }) => skill !== USER_PROJECT_SKILL && form !== 'repo'),
    );
    expect(wrong, `launcher を通らない起動行:\n${wrong.join('\n')}`).toEqual([]);
  });

  it('利用者 project で走る skill は pnpm を要求しない', () => {
    // `pnpm exec` を直に書くと、 npm / yarn / bun の project で止まる。 相手の package manager は
    // 判らないので、 Node 同梱の npm から local の bin を引く。
    const wrong = locate(
      invocations().filter(({ skill, form }) => skill === USER_PROJECT_SKILL && form !== 'user'),
    );
    expect(wrong, `文脈に合わない起動行:\n${wrong.join('\n')}`).toEqual([]);
  });

  it('利用者 project 向けの skill が起動形を本文でも宣言する', () => {
    // block の形だけだと、 読み手は「なぜ npx なのか」 と「引けない時どうするか」 を知る手立てが
    // ない。 節を持ち、 置き換え表と `--` の注意を添える。
    const body = read(`.claude/skills/${USER_PROJECT_SKILL}/SKILL.md`);
    expect(body, '§ CLI の起動形 が無い').toContain('## CLI の起動形');
    expect(body, '起動形を本文で名指ししていない').toContain(`\`${USER_LAUNCHER.join(' ')}\``);
    expect(body, 'flag だけを渡す時の -- 境界に触れていない').toContain(
      `${USER_LAUNCHER.join(' ')} -- --help`,
    );
  });

  it('起動行の数が宣言どおり', () => {
    // 下限 (「1 件以上ある」) では、 起動行を消す変更が検査を素通りする。 数を増減させるのは
    // 設計上の行為なので、 同じ変更の中でここを直して差分に出す。
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

/**
 * 書かれている起動形をそのまま argv にして走らせる。
 *
 * 5 件は互いに独立で、 直列に回す理由が無い (実測で 1 件 600-1600ms、 直列 5453ms)。 まとめて
 * 起動し、 各 test は結果だけを見る。 **失敗は起動ごとに持つ** = 1 件が落ちた時に、 どの起動形が
 * 落ちたか判らないと直せない。
 */
const LAUNCHES = {
  repoRoot: { launcher: REPO_LAUNCHER, args: ['layers', '--json', '--layer', 'contract'], cwd: '.' },
  exampleCwd: { launcher: REPO_LAUNCHER, args: ['layers', '--layer', 'contract'], cwd: 'examples/mint-nft' },
  userProject: { launcher: USER_LAUNCHER, args: ['layers', '--layer', 'contract'], cwd: '.' },
  helpViaSeparator: { launcher: USER_LAUNCHER, args: ['--', '--help'], cwd: '.' },
  helpWithoutSeparator: { launcher: USER_LAUNCHER, args: ['--help'], cwd: '.' },
} as const;

type LaunchKey = keyof typeof LAUNCHES;
type Launched = { stdout: string; error: string | null };

describe('その起動形が実際に走る', () => {
  const out = {} as Record<LaunchKey, Launched>;

  beforeAll(async () => {
    const keys = Object.keys(LAUNCHES) as LaunchKey[];
    const done = await Promise.all(
      keys.map(async (key): Promise<Launched> => {
        const spec = LAUNCHES[key];
        const [command, ...prefix] = spec.launcher as unknown as [string, ...string[]];
        try {
          const { stdout } = await execFileAsync(command, [...prefix, ...spec.args], {
            cwd: resolve(REPO_ROOT, spec.cwd),
            encoding: 'utf-8',
          });
          return { stdout, error: null };
        } catch (err) {
          return { stdout: '', error: String((err as Error).message) };
        }
      }),
    );
    keys.forEach((key, i) => {
      out[key] = done[i]!;
    });
  }, 120_000);

  it('repo root で launcher が layer を返す', () => {
    // #1908 の本体。 `node packages/cli/dist/bin.js` を組み立てて呼ぶ検査は、 bin が link されて
    // いない状態でも通る (実測で release-smoke 888 件が緑のまま chain の 1 step 目が落ちた)。
    // skill が書いている argv をそのまま渡す。
    expect(out.repoRoot.error, `${REPO_LAUNCHER.join(' ')} が走らない`).toBeNull();
    const parsed = JSON.parse(out.repoRoot.stdout) as { layers: { id: string }[] };
    expect(parsed.layers.map((l) => l.id)).toContain('contract');
  });

  it('example dir を cwd にしても走る', () => {
    // skill は example の中から起動される (`kiwa-test` Step 5a が cwd を移す)。 workspace の外側に
    // 出るわけではないが、 root の node_modules/.bin を引けるかは cwd で変わるため、 実際に降りて
    // 確かめる。
    expect(existsSync(resolve(REPO_ROOT, LAUNCHES.exampleCwd.cwd)), 'examples/mint-nft が無い').toBe(
      true,
    );
    expect(out.exampleCwd.error, 'example dir から走らない').toBeNull();
    expect(out.exampleCwd.stdout.trim()).toBe('contract');
  });

  it('利用者 project 向けの起動形も走る', () => {
    // 確かめるのは「pnpm を要求せずに local の bin を引けること」 まで。 npm / yarn / bun それぞれの
    // project を作って回す検査は持っていない。
    expect(out.userProject.error, `${USER_LAUNCHER.join(' ')} が走らない`).toBeNull();
    expect(out.userProject.stdout.trim()).toBe('contract');
  });

  it('前提の確認が CLI に届く', () => {
    // `npx --no kiwa --help` は `--help` を npx 自身が取り、 **CLI が入っていなくても** npx の usage を
    // 出して exit 0 になる (実測)。 前提の確認としては必ず成功する = install 漏れを見逃す。
    // `--` を挟んだ形が CLI に届くことを固定する。
    expect(out.helpViaSeparator.error, '-- を挟んだ形が走らない').toBeNull();
    expect(out.helpViaSeparator.stdout, 'CLI の usage が返っていない').toContain(
      'Usage: kiwa <command>',
    );

    // 挟まない形が npx に取られることも併せて示す。 これが変わったら注意書きの前提が変わる。
    //
    // **否定の assertion の前に、 起動できたことを別に固定する** (Round 1 R1-F1)。 起動が
    // 失敗すると stdout は空になり、 空文字は「CLI の usage を含まない」 を満たす = npx が
    // 壊れていても緑になる。 実測で、 launcher を存在しない binary に差し替えても 41 件すべてが
    // 通った。 直前の refactor で `execFileSync` の throw を握って `{ stdout: '', error }` に
    // 変えた時に入った穴で、 握る前は throw がそのまま test を落としていた。
    expect(out.helpWithoutSeparator.error, '-- を挟まない形が走らない').toBeNull();
    // 空 stdout でも否定は満たされるため、 「何かを出した」 ことも要る。 npm の help 文言
    // そのものは見ない = npm の版で変わる語に検査を縛らない。
    expect(out.helpWithoutSeparator.stdout.trim(), 'npx が何も出力していない').not.toBe('');
    expect(out.helpWithoutSeparator.stdout, 'npx が --help を取らなくなっている').not.toContain(
      'Usage: kiwa <command>',
    );
  });
});

describe('launcher が宣言に支えられている', () => {
  it('root が CLI を依存として宣言している', () => {
    // 上の実行検査は、 宣言を消した後も link が残っている限り通る。 消えるのは次の `pnpm install`
    // で、 その時点で気付く手立てが無くなる。 宣言そのものを見る。
    expect(Object.keys(rootDependencies())).toContain('@kiwa-lab/cli');
  });

  it('CLI package が launcher の名前で bin を出している', () => {
    // `kiwa` という名前は CLI 側の宣言が決める。 rename されれば launcher が指す先が消えるので、
    // 名前が一致することを見る。
    const cli = JSON.parse(read('packages/cli/package.json')) as { bin?: Record<string, string> };
    const name = REPO_LAUNCHER[REPO_LAUNCHER.length - 1]!;
    expect(Object.keys(cli.bin ?? {}), `bin に ${name} が無い`).toContain(name);
    expect(existsSync(resolve(REPO_ROOT, 'packages/cli', cli.bin![name]!))).toBe(true);
  });
});
