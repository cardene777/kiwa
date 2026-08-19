// 起動形の必須要素を照合する (#2023)。
//
// [PR #2022](https://github.com/cardene777/kiwa/pull/2022) の棚卸しで、 SKILL.md の bash fence に
// 現れる flag 133 件のうち 25 件が検査の照合文字列に 1 度も現れないことが分かった。 内訳の
// 大半 (21 件) は **その fence を読む検査が 1 件も無い** = 起動形を丸ごと書き換えても誰も
// 気付かない状態だった。
//
// 本 file が扱うのは、 そのうち **落とすと実害が出ることを実測した 3 件**。 実害の無い 3 件は
// 検査を書かず、 判断と理由を `docs/quality/check-authoring.md` に残した (何を検査しないと
// 決めたかが残らないと、 次に数えた人が同じ調査をやり直す)。
//
// | 起動形 | 落とした時に起きること | 実測 |
// |---|---|---|
// | `kiwa init --detect` | `--detect` 無しは **scaffold** する (CLI が分岐を持つ) | `runCli.ts` の `SCAFFOLD_FLAGS` |
// | `forge coverage --report lcov` | 既定は `summary` なので `.lcov` に表が入る | `forge coverage --help` の `[default: summary]` |
// | `pnpm add --save-dev` | 利用者 project の `dependencies` に test 専用 dep が入る | pnpm の既定 |
//
// 照合は **comment を除いた実行行** に対して行う。 fence の text は実行される引数の代理指標
// でしかなく、 引数を comment に退避する変異が素通りする (#2021 で実測)。
import { describe, expect, it } from 'vitest';
import ts from 'typescript';

import {
  fenceUnder,
  fenceUnderIn,
  headingSectionIn,
  read,
  skillBody,
  skillsWithSkillMd,
} from './skill-md.js';

/**
 * fence から comment を除いた実行行だけを返す。
 *
 * `\\` で継続した行は **1 行に畳む**。 畳まないと、 同じ command の要素が別々の行に見え、
 * 「同じ実行行にあること」 を見る検査 (#2024 の review 指摘) が成立しない。
 */
function executableLines(fence: string): string {
  return fence
    .replace(/\\\n\s*/g, ' ')
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .map((line) => line.replace(/\s+#.*$/, ''))
    .join('\n');
}

/** 実行行のうち、 指定した語をすべて含む最初の 1 行。 */
function commandLine(fence: string, ...needles: string[]): string | undefined {
  return executableLines(fence)
    .split('\n')
    .find((line) => needles.every((needle) => line.includes(needle)));
}

/** JavaScript の実行 code で option を判定している includes / startsWith call から flag を導く。 */
function acceptedOptions(script: string): Set<string> {
  const source = ts.createSourceFile(
    'release-readiness-check.mjs',
    script,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const accepted = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      (node.expression.name.text === 'includes' || node.expression.name.text === 'startsWith')
    ) {
      const argument = node.arguments[0];
      if (argument !== undefined && ts.isStringLiteral(argument)) {
        const flag = /^--[a-z][a-z0-9-]*/.exec(argument.text)?.[0];
        if (flag !== undefined) accepted.add(flag);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return accepted;
}

/** `--flag` と完全一致する string literal。 `--flag=value` の判定は別の argv 形式になる。 */
function exactOption(node: ts.Node | undefined): string | undefined {
  if (!node || !ts.isStringLiteralLike(node)) return undefined;
  return /^--[a-z][a-z0-9-]*$/.test(node.text) ? node.text : undefined;
}

/** 括弧や型 assertion を外した式。 */
function unwrapExpression(node: ts.Expression): ts.Expression {
  while (
    ts.isParenthesizedExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node)
  ) {
    node = node.expression;
  }
  return node;
}

/**
 * `layersCommand` が空白区切りで受け取る option の集合。
 *
 * Usage / error の literal は受理の証拠にならないため、 `layersCommand` 内の 3 つの argv
 * 判定 (`arg === '--x'` / `args.includes('--x')` / `takeFlagValue(args, '--x')`) だけを見る。
 * `startsWith('--x=')` は `--x=value` 専用で、 skill が書く `--x value` の証拠には数えない。
 */
function cliAcceptedOptions(script = read('packages/cli/src/runCli.ts')): Set<string> {
  const file = 'packages/cli/src/runCli.ts';
  const source = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true);
  const compilerOptions: ts.CompilerOptions = { noLib: true, noResolve: true };
  const host = ts.createCompilerHost(compilerOptions);
  host.fileExists = (candidate) => candidate === file;
  host.readFile = (candidate) => (candidate === file ? script : undefined);
  host.getSourceFile = (candidate) => (candidate === file ? source : undefined);
  const checker = ts
    .createProgram({ rootNames: [file], options: compilerOptions, host })
    .getTypeChecker();
  const accepted = new Set<string>();
  const command = source.statements.find(
    (node): node is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(node) && node.name?.text === 'layersCommand',
  );
  if (!command?.body) return accepted;
  const argsSymbol =
    command.parameters[0] && ts.isIdentifier(command.parameters[0].name)
      ? checker.getSymbolAtLocation(command.parameters[0].name)
      : undefined;
  if (!argsSymbol) return accepted;

  const identifierSymbol = (node: ts.Expression | undefined): ts.Symbol | undefined => {
    if (!node) return undefined;
    const expression = unwrapExpression(node);
    return ts.isIdentifier(expression) ? checker.getSymbolAtLocation(expression) : undefined;
  };

  const argumentTokens = new Set<ts.Symbol>();
  const collectArgumentTokens = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isVariableDeclarationList(node.parent) &&
      (node.parent.flags & ts.NodeFlags.Const) !== 0 &&
      ts.isIdentifier(node.name) &&
      node.initializer
    ) {
      const initializer = unwrapExpression(node.initializer);
      if (
        ts.isElementAccessExpression(initializer) &&
        identifierSymbol(initializer.expression) === argsSymbol
      ) {
        const symbol = checker.getSymbolAtLocation(node.name);
        if (symbol) argumentTokens.add(symbol);
      }
    }
    ts.forEachChild(node, collectArgumentTokens);
  };
  collectArgumentTokens(command.body);

  const isArgumentToken = (node: ts.Expression): boolean => {
    const symbol = identifierSymbol(node);
    if (symbol && argumentTokens.has(symbol)) return true;
    node = unwrapExpression(node);
    return (
      ts.isElementAccessExpression(node) && identifierSymbol(node.expression) === argsSymbol
    );
  };

  const visit = (node: ts.Node): void => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
    ) {
      const leftFlag = exactOption(node.left);
      const rightFlag = exactOption(node.right);
      const flag =
        leftFlag && isArgumentToken(node.right)
          ? leftFlag
          : rightFlag && isArgumentToken(node.left)
            ? rightFlag
            : undefined;
      if (flag) accepted.add(flag);
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const flag =
        ts.isPropertyAccessExpression(callee) &&
        callee.name.text === 'includes' &&
        identifierSymbol(callee.expression) === argsSymbol
          ? exactOption(node.arguments[0])
          : ts.isIdentifier(callee) &&
              callee.text === 'takeFlagValue' &&
              identifierSymbol(node.arguments[0]) === argsSymbol
            ? exactOption(node.arguments[1])
            : undefined;
      if (flag) accepted.add(flag);
    }
    ts.forEachChild(node, visit);
  };
  visit(command.body);
  return accepted;
}

/**
 * fence の中で `kiwa layers` に渡している option。
 *
 * 範囲は **`kiwa layers` から pipe まで**。 行全体を見ると同じ行の別 command の option を
 * 拾う (実測で `jq --arg` と `npx --no` の 2 件が混ざった)。 § 形 4 の「実効の単位で切る」。
 */
function layersOptions(fence: string): string[] {
  const found: string[] = [];
  for (const line of executableLines(fence).split('\n')) {
    const at = line.indexOf('kiwa layers');
    if (at < 0) continue;
    const rest = line.slice(at);
    const end = rest.search(/[|)]/);
    const segment = end === -1 ? rest : rest.slice(0, end);
    found.push(...(segment.match(/(?<![\w-])--[a-z][a-z0-9-]*/g) ?? []));
  }
  return found;
}

describe('SKILL.md の起動形が必須要素を落としていない', () => {
  it('/kiwa-app の検出が --detect を渡す', () => {
    // `kiwa init` は **scaffold する** (`runCli.ts` が `--detect` の有無で分岐し、
    // `SCAFFOLD_FLAGS` は `--detect` と併用できないと明示している)。 落とすと、
    // 「`.kiwa/stack.json` だけ書く」 と宣言している Step が利用者 project に test dir と
    // config を書き込む形に変わる。 **宣言と実行が逆になる**。
    const command = executableLines(fenceUnder('kiwa-app', /^## Step 1: /m, 'bash'));
    expect(command, 'kiwa init を呼んでいない').toContain('kiwa init');
    expect(command, '--detect を渡していない (scaffold に変わる)').toContain('--detect');
  });

  it('/kiwa-forge の coverage 計測が --report lcov を渡す', () => {
    // `forge coverage` の既定は `summary` (実測 = `--help` が `[default: summary]`)。
    // 落とすと `coverage-{module}.lcov` に summary の表が書かれ、 file 名は正しいまま
    // 中身だけが別物になる。 分類 (`references/coverage-classify.md`) は lcov の
    // `SF:` / `DA:` を読むため、 何も分類できない。
    const command = executableLines(fenceUnder('kiwa-forge', /^#### Step 5a: /m, 'bash'));
    // fence には summary を出す 2 本目の `forge coverage` もある。 fence 全体で 3 要素を
    // 別々に見ると、 `--report lcov` を 2 本目へ移しても緑になるため、 同じ実行行に束縛する。
    const lcovCommand = command
      .split('\n')
      .find(
        (line) =>
          line.includes('forge coverage') &&
          line.includes('tests/reports/contract/coverage-{module}.lcov'),
      );
    expect(lcovCommand, 'lcov の出力先へ書く forge coverage を呼んでいない').toBeDefined();
    expect(lcovCommand, '--report lcov を同じ実行行に渡していない').toContain('--report lcov');
    // 出力先も同じ実行行に束縛する。 lcov を出しても別の行が file を書けば、 分類は
    // summary を読む可能性がある。
    expect(lcovCommand, 'lcov の出力先が変わっている').toContain(
      'tests/reports/contract/coverage-{module}.lcov',
    );
  });

  it('/kiwa-hardhat の solidity-coverage install が --save-dev を渡す', () => {
    // 落とすと利用者 project の `dependencies` に入る。 test 専用の dep が runtime 依存
    // として宣言され、 その project を publish すると利用者の利用者にまで届く。
    // install 自体は成功するため、 落ちない。
    const section = skillBody('kiwa-hardhat');
    const command = executableLines(fenceUnderIn(section, /^### Step 5: /m, 'bash'));
    expect(command, 'solidity-coverage を install していない').toContain(
      'pnpm add --save-dev solidity-coverage',
    );
  });

  it('範囲が次の同 level 見出しの手前で閉じる', () => {
    // 範囲の閉じ方そのものを見る。 実装中に **範囲が 1 文字に潰れる** 形を踏んだ
    // (`m` flag の `^` が文字列先頭にも一致し、 対象の見出し自身を「次の見出し」 として
    // 拾っていた)。 fence が取れるかだけを見ていると、 潰れた時に「fence が無い」 としか
    // 分からず、 原因が範囲にあることに気付けない。
    const section = headingSectionIn(skillBody('kiwa-app'), /^## Step 1: /m);
    expect(section, '対象の見出しから始まっていない').toMatch(/^## Step 1: /);
    expect(section, '次の Step を飲み込んでいる').not.toContain('## Step 2: ');
    expect(section.length, '範囲が潰れている').toBeGreaterThan(50);
  });

  it('fence の中の comment 行で範囲が閉じない', () => {
    // shell の comment (`# 既存 worktree 掃除`) は行頭の `#` が markdown の見出しと同じ形。
    // 素朴に探すと fence の 1 行目で閉じ、 fence が「無い」 ことになる (実測 =
    // `/docs-publish-kiwa` の Step 3 が 46 文字で切れた)。
    const section = headingSectionIn(skillBody('docs-publish-kiwa'), /^### Step 3: /m);
    expect(section, 'fence の中で閉じている').toContain('git worktree add');
    expect(section, '次の Step を飲み込んでいる').not.toContain('### Step 4: ');
  });

  it('対象 Step から fence が消えたら隣の Step を拾わない', () => {
    // 範囲を `### ` で閉じると、 `## ` 見出しの skill では後続 Step を飲み込む =
    // 対象から fence が消えても隣の fence を拾って緑になる。 `fenceUnderIn` は level を
    // 数えて閉じるため、 消えたことが「見つからない」 として落ちる。
    const body = skillBody('kiwa-app');
    const stripped = body.replace(/```bash\nnpx --no kiwa init --detect\n```/, '');
    expect(stripped, '前提が崩れている (対象 fence を消せていない)').not.toBe(body);
    expect(() => fenceUnderIn(stripped, /^## Step 1: /m, 'bash')).toThrow();
  });
});

describe('/docs-generate が公開する API の範囲を絞る', () => {
  const TYPEDOC = /^### Step 3: /m;
  const FORGE_DOC = /^### Step 4: /m;

  it('typedoc の起動が private と internal を同じ行で除外する', () => {
    // 生成先 `docs/api/typescript` は `/docs-publish-kiwa` が gh-pages へ push する =
    // **除外が落ちると内部 API が公開 site に載る**。 生成も publish も成功するため落ちない。
    //
    // 2 つの除外は独立した要素で、 片方だけでは片方の surface が漏れる。 起動は継続行を
    // 持つため、 畳んでから同じ実行行に束縛する (別 command に移されると意味が変わる)。
    const line = commandLine(fenceUnder('docs-generate', TYPEDOC, 'bash'), 'typedoc');
    expect(line, 'typedoc を起動していない').toBeDefined();
    expect(line, '--excludePrivate を渡していない').toContain('--excludePrivate');
    expect(line, '--excludeInternal を渡していない').toContain('--excludeInternal');
    // 生成先も同じ行に束縛する。 別の行が別の場所へ出すと、 publish は空の dir を配る。
    expect(line, '生成先が docs/api/typescript でない').toContain('--out docs/api/typescript');
  });

  it('forge doc の起動が --no-server を渡す', () => {
    // `--no-server` 無しの `forge doc` は **server を起動して待ち続ける** (forge の既定)。
    // 落ちるのではなく止まるため、 chain から呼ぶと次の Step へ進まない。
    const line = commandLine(fenceUnder('docs-generate', FORGE_DOC, 'bash'), 'forge doc');
    expect(line, 'forge doc を起動していない').toBeDefined();
    expect(line, '--no-server を渡していない (server が上がって止まる)').toContain('--no-server');
  });
});

describe('/docs-publish-kiwa の gh-pages 操作が範囲を外さない', () => {
  const STEP_2 = /^### Step 2: /m;
  const STEP_3 = /^### Step 3: /m;
  const STEP_4 = /^### Step 4: /m;

  it('branch の存在確認が --heads で branch に限定する', () => {
    // `--heads` 無しの `ls-remote` は tag も返す。 `gh-pages` という tag があるだけで
    // 「branch は既にある」 と読み、 orphan の新設を飛ばして `worktree add` が失敗する。
    const line = commandLine(fenceUnder('docs-publish-kiwa', STEP_3, 'bash'), 'ls-remote');
    expect(line, 'branch の存在を確認していない').toBeDefined();
    expect(line, '--heads で branch に限定していない').toContain('--heads');
  });

  it('gh-pages を新設する時は orphan から始める', () => {
    // `--orphan` 無しで branch を切ると **main の履歴の上に site を載せる**。 push は成功し、
    // 公開もされるため気付かない。 gh-pages に repo の全履歴が入る。
    const line = commandLine(
      fenceUnder('docs-publish-kiwa', STEP_3, 'bash'),
      'git switch',
      'gh-pages',
    );
    expect(line, 'gh-pages を作る行が無い').toBeDefined();
    expect(line, '--orphan から始めていない').toContain('--orphan');
  });

  it('既定の push が --force を持たない', () => {
    // `--force` は `--force` option を渡した時だけの経路 (SKILL.md § Step 4 の但し書き)。
    // 既定の fence に `--force` が入ると、 **毎回 history を上書きする** publish になる。
    const push = executableLines(fenceUnder('docs-publish-kiwa', STEP_4, 'bash'))
      .split('\n')
      .filter((line) => line.includes('git push'));
    expect(push.length, 'Step 4 に push が無い').toBeGreaterThan(0);
    for (const line of push) {
      expect(line, '既定の push が history を上書きする').not.toContain('--force');
    }
  });

  it('build output の入替が worktree に降りた後に走る', () => {
    // 入替は **cwd を消す**。 直前の `cd` が消えるか行き先が変わると、 kiwa 本体で走る。
    // fence の中の順序が唯一の担保になる。
    const lines = executableLines(fenceUnder('docs-publish-kiwa', STEP_4, 'bash')).split('\n');
    const enter = lines.findIndex((line) => line.trim() === 'cd ../kiwa-gh-pages');
    const wipe = lines.findIndex((line) => line.includes('rm -rf'));
    expect(enter, 'gh-pages worktree に降りる行が無い').toBeGreaterThanOrEqual(0);
    expect(wipe, '入替の行が無い').toBeGreaterThanOrEqual(0);
    expect(wipe, '入替が worktree に降りる前に走る').toBeGreaterThan(enter);
    // 間に別の `cd` が挟まると、 降りた先が変わる。
    const between = lines
      .slice(enter + 1, wipe)
      .filter((line) => line.trimStart().startsWith('cd '));
    expect(between, '降りた後に別の cd が挟まっている').toEqual([]);
  });

  it('変更検出が --porcelain を渡す', () => {
    // `--porcelain` 無しの `git status` は branch 情報を必ず出す = 出力が空にならず、
    // 「変更なし」 を判定できない。
    const line = commandLine(fenceUnder('docs-publish-kiwa', STEP_2, 'bash'), 'git status');
    expect(line, '変更検出の行が無い').toBeDefined();
    expect(line, '--porcelain を渡していない').toContain('--porcelain');
  });
});

describe('/kiwa-release-check の宣言が script と一致する', () => {
  it('宣言した option を script が受け取る', () => {
    // SKILL.md は user に渡す option を宣言する。 script 側が名前を変えると、 **渡した option が
    // 黙って無視される** = `--include-dogfood-run` を渡したのに heavy run が走らないまま
    // 「RELEASE READY」 が出る。 どちらも成功で終わるため気付かない。
    //
    // 宣言を実物から導く (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。
    // 一覧を手で書き写すと、 option が増えた時に検査だけ古いまま残る。
    const section = headingSectionIn(skillBody('kiwa-release-check'), /^## 引数仕様/m);
    const declared = [...section.matchAll(/^- `(--[a-z][a-z0-9-]*)/gm)].map((m) => m[1]!);
    expect(declared.length, '引数仕様が 1 件も読めない').toBeGreaterThan(0);
    const script = read('scripts/release-readiness-check.mjs');
    const accepted = acceptedOptions(script);
    for (const flag of declared) {
      expect(accepted.has(flag), `script が ${flag} を受け取らない (宣言だけ残っている)`).toBe(
        true,
      );
    }
  });

  it('comment 内の option 判定を受理 code として数えない', () => {
    const script = "const found = args.includes('--actual'); // args.includes('--comment-only')";
    expect(acceptedOptions(script)).toEqual(new Set(['--actual']));
  });
});

/**
 * USAGE の `<command> options:` block が宣言している option。
 *
 * 範囲は **block の見出しから次の空行まで**。 説明の続き行は行頭が 2 space を超えるため、
 * 宣言行 (`  --x ...`) だけを取る形にすると本文中の `--x` を拾わない (§ 形 4)。
 */
function usageOptions(script: string, command: string): Set<string> {
  const start = script.indexOf(`${command} options:`);
  if (start < 0) return new Set();
  const rest = script.slice(start);
  const end = rest.indexOf('\n\n');
  const block = end === -1 ? rest : rest.slice(0, end);
  const options = new Set<string>();
  for (const line of block.split('\n')) {
    const declared = /^ {2}(--[a-z][a-z0-9-]*)(?=\s|$)/.exec(line);
    if (declared?.[1]) options.add(declared[1]);
  }
  return options;
}

describe('skill が CLI に渡す option を CLI が受け取る', () => {
  it('argv 判定だけを受理の証拠にする', () => {
    const script = `
      const USAGE = '--usage-only';
      function otherCommand(args: string[]) { return args.includes('--other-command'); }
      function layersCommand(args: string[]) {
        const arg = args[0];
        const otherArgs: string[] = [];
        const marker = '--not-an-option';
        let reassigned = args[1];
        reassigned = marker;
        if (arg === '--json') return;
        if (args.includes('--lang')) return;
        takeFlagValue(args, '--module');
        if (arg.startsWith('--equals-only=')) return;
        if (marker === '--comparison-only') return;
        if (reassigned === '--reassigned') return;
        {
          const arg = marker;
          if (arg === '--shadowed') return;
        }
        if (otherArgs.includes('--other-collection')) return;
        takeFlagValue(otherArgs, '--other-argv');
        throw new Error('--message-only');
      }
    `;
    expect(cliAcceptedOptions(script)).toEqual(new Set(['--json', '--lang', '--module']));
  });

  it('`kiwa layers` に渡す option が CLI の受理集合に含まれる', () => {
    // CLI が option 名を変えると、 skill が渡した値は **黙って無視される** = layer は
    // 既定で解決され、 spec の path も既定に落ちる。 どちらも成功で終わるため気付かない。
    //
    // 受理集合は `runCli.ts` の `layersCommand` にある argv 判定から導く
    // (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。 一覧を書き写すと、
    // option が増えた時に検査だけ古いまま残る。
    const accepted = cliAcceptedOptions();
    expect(accepted.size, 'CLI から option を 1 件も読めない').toBeGreaterThan(0);

    const passed = new Map<string, Set<string>>();
    for (const skill of skillsWithSkillMd()) {
      const body = skillBody(skill);
      const options = [...body.matchAll(/```(?:bash|sh)\n([\s\S]*?)```/g)].flatMap((m) =>
        layersOptions(m[1] ?? ''),
      );
      if (options.length > 0) passed.set(skill, new Set(options));
    }
    // 0 件で通る形を作らない (§ 形 1)。 fence の書き方が変わって 1 件も取れなくなると、
    // 検査本体が 1 度も走らずに緑になる。
    expect(passed.size, '`kiwa layers` を呼ぶ skill が 1 件も無い').toBeGreaterThan(0);

    const unknown: string[] = [];
    for (const [skill, options] of passed) {
      for (const option of options) {
        if (!accepted.has(option)) unknown.push(`${skill}: ${option}`);
      }
    }
    expect(unknown, `CLI が受け取らない option を渡している:\n${unknown.join('\n')}`).toEqual([]);
  });

  it('別 command の option を対象に含めない', () => {
    // 行全体を見ると同じ行の別 command を拾う (実測 = `jq --arg` と `npx --no` の 2 件)。
    // 範囲を `kiwa layers` から pipe までに切る (§ 形 4)。
    const fence = [
      'npx --no kiwa layers --json --layer contract',
      'HITS=$(printf %s "$OUT" | jq -r --arg id "$LAYER" \'.layers\')',
    ].join('\n');
    expect(layersOptions(fence)).toEqual(['--json', '--layer']);
  });
});

describe('USAGE と parser が同じ option を持つ', () => {
  it('`layers options:` の宣言と受理集合が一致する', () => {
    // 向きで症状が違う。 **USAGE 側にだけある option は渡しても黙って無視される** =
    // PR #2029 で塞いだのと同じ silent な向き。 parser 側にだけある option は使えるのに
    // 誰も知らない (loud ではないが実害は小さい)。 集合一致で両向きを見る。
    const script = read('packages/cli/src/runCli.ts');
    const documented = usageOptions(script, 'layers');
    const accepted = cliAcceptedOptions(script);
    // 0 件で通る形を作らない (§ 形 1)。 書式が変わって 1 件も取れなくなると、
    // 空集合どうしが一致して緑になる。
    expect(documented.size, 'USAGE から option を 1 件も読めない').toBeGreaterThan(0);
    expect(accepted.size, 'parser から option を 1 件も読めない').toBeGreaterThan(0);
    expect([...documented].sort(), 'USAGE と parser の option がずれている').toEqual(
      [...accepted].sort(),
    );
  });

  it('block の切り出しが次の block と説明文を含まない', () => {
    // 範囲の 3 点 (先頭から始まる / 次を含まない / 潰れていない) を fixture で固定する。
    // 実装中に範囲が潰れる形を 2 度踏んでいる (PR #2025 / PR #2027)。
    const script = [
      'Usage: kiwa <command>',
      '',
      'layers options:',
      '  --layer L                     Use L instead of the detection.',
      '  --json                        Emit one record per layer.',
      '                                --producer and --project-root add test_paths.',
      '',
      'init options:',
      '  --force                       Overwrite existing files.',
    ].join('\n');
    const options = usageOptions(script, 'layers');
    expect([...options].sort(), '宣言行以外を拾っている').toEqual(['--json', '--layer']);
  });
});
