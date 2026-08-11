// docs の相対 link と site 絶対 link が解決するかを検査する。
//
// package を消した PR が索引の link を残す壊れ方を捕まえる (#1803 と #1873 が同じ形で
// 通過した)。生成物の同期を見る sync-library-doc-links.mjs とは別の関心なので module を
// 分け、生成 script と test の両方から同じ実装を呼ぶ。
import { lstatSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

/**
 * fenced code block と inline code を落とす。
 *
 * TypeScript の index signature (`[k: string]: unknown;`) は reference-style link と
 * 同じ形をしているため、code を残すと API reference が丸ごと誤検出になる (実測で 7 件)。
 *
 * 行単位の状態機械で追う。正規表現で開始行と終了行を対にすると、CommonMark では
 * fence ではない 4 space 字下げの ``` を開始とみなし、後続の本物の fence と対にして
 * 間の正当な link を消す (実測で dead link 1 件が消えた)。fence とみなすのは字下げ
 * 3 space までで、閉じるのは同種かつ同じ長さ以上の行に限る。
 */
function stripCode(content) {
  const lines = content.split('\n');
  const stripped = [];
  let fence = null;

  for (const line of lines) {
    if (fence) {
      const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) fence = null;
      stripped.push('');
      continue;
    }
    const open = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    // backtick fence の info string に backtick は置けない (CommonMark)。
    if (open && !(open[1][0] === '`' && open[2].includes('`'))) {
      fence = { char: open[1][0], length: open[1].length };
      stripped.push('');
      continue;
    }
    stripped.push(line);
  }

  // 閉じない fence は文書末まで code として扱う (CommonMark と同じ)。
  return stripped.join('\n').replace(/`[^`\n]*`/g, '');
}

// inline link と image。destination は素の形と angle-bracket の 2 つ。
//
// title (`"..."` / `'...'` / `(...)`) は対象 corpus に 1 件も無いため覆わない。
// 覆おうとした間、正規表現解析の欠陥が review 3 round 続けて出た一方、実際に壊れる
// link は素の inline link と img だけだった。
//
// 素の destination は **釣り合った括弧を含められる** (CommonMark)。`[^)\s]+` で取ると
// `[x](./a(b).md)` の destination を `./a(b` と読み、実在する `a(b).md` を dead と
// 報告する。逆に `[x](./foo](bar))` は `[x](./foo](bar)` までを消費区間として覆うため、
// 残余の `](` も検出されず未対応としても報告されない = 検査していない範囲を検査済みと
// して通す (#1876 でどちらも実測)。
//
// 入れ子は 2 段まで。`(` を任意深度で釣り合わせる形は正規表現では書けず、対象 corpus に
// 括弧を含む destination は 0 件なので、2 段で足りないことが起きたら未対応として報告
// される側に倒れる (残余方式が拾う)。
const BALANCED_DESTINATION = /(?:[^()\s]|\((?:[^()\s]|\([^()\s]*\))*\))+/;
const INLINE_LINK = new RegExp(
  `!?\\[[^\\]]*\\]\\(\\s*(?:<([^>\\n]*)>|(${BALANCED_DESTINATION.source}))\\s*\\)`,
  'g',
);
// 生 HTML。VitePress は markdown 中の HTML をそのまま出す。
//
// tag 全体を取ってから属性を読む 2 段にする。1 本の正規表現で要素名と属性名を並べると
// 属性名の境界が緩くなって `data-src` を `src` として拾い、`[^>]*?` が引用区間の `>` で
// 止まって後続の属性を見逃す (どちらも実測で再現した)。
//
// tag の中身は引用区間を先に食うので、属性値に `>` があっても tag の終端を取り違えない。
//
// 名前の終端は `\b` では取れない。`<a-b>` の `a` の直後は `-` で単語境界が成立するため、
// static な href を持つ custom element を「生 HTML の a タグ」 として止める。同じ形が
// `<img-x src>` にもある。VUE_ANCHOR_TAG だけを直すと、Vue 判定は通るのに a タグ判定で
// 落ちる (PR #1907 Round 1 で実測)。
const IMG_TAG = /<img(?![-\w:])((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;
const A_TAG = /<a(?![-\w:])((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;
const HTML_ATTRIBUTE =
  /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

// inline link の目印。extractor が消費できなかったものを未対応として拾うために使う。
const INLINE_LINK_OPENER = /\]\(/g;
// reference 定義 (`[label]: destination "title"`)。destination の後に本文が続く行は
// CommonMark では定義にならないので、行末までを条件にする。これを緩めると
// `[note]: this is ordinary prose` のような普通の文が定義として誤検知される。
const REFERENCE_DEFINITION =
  /^ {0,3}\[[^\]]+\]:[ \t]*(?:<[^>\n]*>|\S+)[ \t]*(?:"[^"]*"|'[^']*'|\([^)]*\))?[ \t]*$/gm;

// VitePress は markdown 中の Vue 記法を解釈し、いずれも `<a href="...">` に render する。
// destination が式なので静的には解けず、checker は素通ししてしまう (実測で確認)。
// 解析しようとせず未対応として報告する = 実在しない記法のために解析器を広げると、
// 広げた code 自体が欠陥を生む (PR #1875 で 2 round 溶かした)。
//
// 名前の終端は `\b` では取れない。`<a-b>` の `a` の直後は `-` で単語境界が成立するため、
// custom element を anchor として拾って正当な記述を止める (#1884 で実測)。名前に続けられる
// 文字を否定先読みで外す = `<a>` / `<a href>` は通り、`<a-b>` / `<abbr>` は外れる。
const VUE_ANCHOR_TAG = /<(a|component)(?![-\w:])((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;
// 属性名と、その値 (引用区間を含む) をまとめて食う。値を食わずに名前だけ拾うと、
// 属性値の中の `:href=` を属性と誤認する。空白を境界にしても防げない = 値の中に
// 空白を挟んで `:href=` と書ける (`title="see :href=y"` で実測、誤検知した)。
const HTML_ATTRIBUTE_PAIR =
  /([^\s=/>]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)|([^\s=/>]+)/g;

/**
 * Vue の binding で destination が決まる anchor か。
 *
 * 拾うのは 2 種。`a` / `component` の bind された `href` と、`component` の `is`
 * (静的 / bind の両方)。`<component is="a" href="...">` は anchor に化けるため、
 * `is` は bind されていなくても対象にする。
 *
 * dynamic argument (`:[attr]`) も拾う = 属性名が実行時に決まる以上、`href` になりうる。
 *
 * 素の `<a href>` はここでは拾わない = 既存の「生 HTML の a タグ」 判定が覆っており、
 * 両方で拾うと同じ 1 件が 2 度報告される。
 */
function hasVueBoundAnchor(content) {
  for (const [, tagName, attributes] of content.matchAll(VUE_ANCHOR_TAG)) {
    const isComponent = tagName.toLowerCase() === 'component';
    for (const [, namedWithValue, namedAlone] of attributes.matchAll(HTML_ATTRIBUTE_PAIR)) {
      const name = (namedWithValue ?? namedAlone ?? '').toLowerCase();
      const isBound = name.startsWith(':') || name.startsWith('v-bind:');
      // object 形式 (`v-bind="{ href: url }"`) は属性名に href を持たない。中身を静的に
      // 解くのは方針外 (#1882) なので、href を含みうる形として検知側に倒す。
      if (name === 'v-bind') return true;
      // modifier 付き (`:href.prop`) も同じ binding。名前の完全一致で見ると外れる。
      const plainName = name.replace(/^(?::|v-bind:)/, '').split('.')[0];
      // 属性名が実行時に決まる形。href になりうるので解析できない。
      if (isBound && plainName.startsWith('[')) return true;
      if (isBound && plainName === 'href') return true;
      if (isComponent && plainName === 'is') return true;
    }
  }
  return false;
}

/** 位置 index が、extractor が消費した区間のどれかに入るか。 */
function isCovered(spans, index) {
  return spans.some(([start, end]) => index >= start && index < end);
}

/**
 * 走査から外す directory 名。
 *
 * `.vitepress` は VitePress の作業領域で、`cache/` と `dist/` に build 出力が入る。
 * source markdown は 1 件も無い一方 4065 entry あり、走査 cost の 6 割以上を占める
 * (実測)。生成済み checkout かどうかで cost が変わるのも避けたい。
 *
 * config (`config.mts`) と theme は `.md` ではないので、除いても検査対象は減らない。
 */
const SKIPPED_DIRECTORIES = new Set(['.vitepress', 'node_modules']);

/**
 * VitePress が中身をそのまま配る静的資産の置き場。
 *
 * markdown を page として render しないので、link 検査の対象にしない。実測でも
 * `docs/public` 配下の `.md` は 0 件。対象にすると `docs/public/images -> <repo>/images`
 * (実運用の symlink) が「走査範囲の外を指す」 として報告される = 画像しか無い先を
 * 検査できないと言うことになる (#1888)。
 *
 * **名前ではなく path で見る**。`public` という名前を全階層で外すと、`docs/guide/public/`
 * のような通常の page dir まで 3 つの walk から外れ、そこに置いた link が検査を 1 度も
 * 通らずに gate を抜ける (PR #1907 Round 1 で指摘)。外すのは docsRoot 直下の 1 つだけ。
 */
function staticAssetRoot(docsRoot) {
  return join(docsRoot, 'public');
}

/** その directory へ降りるか。 */
function shouldWalk(entry, entryPath, staticRoot) {
  if (!entry.isDirectory() || entry.isSymbolicLink()) return false;
  if (SKIPPED_DIRECTORIES.has(entry.name)) return false;
  return entryPath !== staticRoot;
}

/** path が root と同じか、その配下にあるか。 */
function isInside(root, path) {
  const fromRoot = relative(root, path);
  return fromRoot === '' || !(fromRoot === '..' || fromRoot.startsWith(`..${sep}`));
}

/**
 * symlink の解決先が走査範囲に留まるか。
 *
 * 見るのは repo 境界ではなく **scanRoot 境界**。repo の中でも走査範囲の外を指す symlink
 * (`docs/alias -> <repo>/packages`) は、その配下の markdown が 1 度も読まれない。repo 内
 * であることは「実体側が別経路で検査される」 保証にならない = 検査するのは scanRoot
 * 配下だけだからで、境界を repo に置いていた間この形が無報告で通っていた (#1888)。
 *
 * 解決できない形 (dangling / 循環) は `'unresolvable'` を返す。`isDirectory()` は
 * どちらにも false を返すため、種別で分岐すると markdown 判定にも directory 判定にも
 * 入らず素通りする (実測)。
 *
 * @returns {'inside' | 'outside' | 'unresolvable'}
 */
function symlinkScope(scanRoot, path) {
  let canonical;
  try {
    canonical = realpathSync(path);
  } catch {
    return 'unresolvable';
  }
  return isInside(realpathSync(scanRoot), canonical) ? 'inside' : 'outside';
}

/**
 * source として読んでよい markdown か。
 *
 * symlink の `.md` は読まない。docs に repo 外を指す symlink を置くだけで、その中身の
 * link destination が dead link の報告として stderr に出る = 走査範囲を `docs/` 全体へ
 * 広げた後は、細工した checkout が runner 上の読める file を読ませて内容由来の文字列を
 * log へ出せる (実測で再現した)。
 *
 * repo 内を指す symlink も読まない。alias 側の相対 link は実体側と解決先が変わるため
 * (`real/page.md` の `./sibling` は `alias/page.md` からは解決しない)、実体を読んで
 * 済ませることはできない。読めない以上、黙って通さず「検査できない」 と報告する
 * (§ symlinkedSourceFiles)。
 */
function isReadableSource(entry) {
  return entry.isFile() && !entry.isSymbolicLink();
}

/**
 * markdown と HTML の link destination を列挙する。
 *
 * 覆うのは inline link (素の形と angle-bracket) と `<img src>` の 2 つ。それ以外の
 * 記法は UNSUPPORTED_SYNTAX が別経路で検知する。
 */
function linkTargets(raw) {
  const content = stripCode(raw);
  const targets = [];
  for (const match of content.matchAll(INLINE_LINK)) targets.push(match[1] ?? match[2]);
  for (const tag of content.matchAll(IMG_TAG)) {
    for (const attribute of tag[1].matchAll(HTML_ATTRIBUTE)) {
      if (attribute[1].toLowerCase() !== 'src') continue;
      targets.push(attribute[2] ?? attribute[3] ?? attribute[4]);
    }
  }
  return targets.filter(Boolean);
}

/**
 * checker が解釈できない link 記法が書かれた file を列挙する。
 *
 * 解析範囲を絞った代償を機械で見える形にする経路。返りが空でなくなったら、checker を
 * 広げるか、その記法を使わないかを決める。
 *
 * 未対応の形を列挙しない。列挙すると、書き方が 1 つ増えるたびに穴が開き、
 * 「検査していないのに破れ無しと報告する」 状態に落ちる (実測で title の空白位置違いと
 * 引用区間を跨ぐ `<a>` が両方とも漏れた)。代わりに **extractor が消費できなかった
 * link 形** を残余として拾う。取りこぼす方向ではなく、多めに報告する方向に倒れる。
 *
 * @param {{repositoryRoot: string, docsRoot: string, scanRoot: string}} roots
 * @returns {string[]} 記法と file を示す説明行。空配列なら未対応記法なし。
 */
export function unsupportedLinkSyntax({ repositoryRoot, docsRoot, scanRoot }) {
  const found = [];
  const staticRoot = staticAssetRoot(docsRoot);

  const reasonsFor = (content) => {
    const spans = [];
    for (const match of content.matchAll(INLINE_LINK)) {
      spans.push([match.index, match.index + match[0].length]);
    }
    for (const match of content.matchAll(IMG_TAG)) {
      spans.push([match.index, match.index + match[0].length]);
    }

    const reasons = new Set();
    for (const match of content.matchAll(INLINE_LINK_OPENER)) {
      if (isCovered(spans, match.index)) continue;
      reasons.add('解析できない inline link');
    }
    for (const tag of content.matchAll(A_TAG)) {
      for (const attribute of tag[1].matchAll(HTML_ATTRIBUTE)) {
        if (attribute[1].toLowerCase() !== 'href') continue;
        reasons.add('生 HTML の a タグ');
        break;
      }
    }
    for (const _ of content.matchAll(REFERENCE_DEFINITION)) {
      reasons.add('reference 定義');
      break;
    }
    if (hasVueBoundAnchor(content)) {
      reasons.add('Vue 記法の anchor');
    }
    return reasons;
  };

  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);
      // symlink は種別より先に見る。`readdirSync` の Dirent は symlink に対して
      // `isDirectory()` も `isFile()` も false を返すため (実測)、種別で分岐した後では
      // どちらの枝にも入らず素通りする。
      if (entry.isSymbolicLink()) {
        // 走査範囲の外を指す symlink を報告する。中身を読まない以上その配下の link は
        // 1 つも検査されず、黙って通すと alias 経路だけで壊れる link が gate を通る。
        //
        // 走査範囲に留まる symlink は報告しない。実体側が同じ走査で読まれるため検査から
        // 漏れない。
        const scope = symlinkScope(scanRoot, entryPath);
        if (scope === 'inside') continue;
        if (scope === 'unresolvable') {
          // 解決できない = 中身があるかも判らない。dangling も循環もここに来る。
          found.push(
            `unsupported link syntax (解決できない symlink): ${relative(repositoryRoot, entryPath)}`,
          );
          continue;
        }
        const kind = isDirectory(entryPath) ? 'directory' : 'markdown';
        // markdown でない file symlink (画像等) は link を持たないので報告しない。
        if (kind === 'directory' || entry.name.endsWith('.md')) {
          found.push(
            `unsupported link syntax (symlink の ${kind}): ${relative(repositoryRoot, entryPath)}`,
          );
        }
        continue;
      }
      if (entry.isDirectory()) {
        if (shouldWalk(entry, entryPath, staticRoot)) walk(entryPath);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;
      if (!isReadableSource(entry)) continue;
      const content = stripCode(readFileSync(entryPath, 'utf8'));
      for (const label of reasonsFor(content)) {
        found.push(`unsupported link syntax (${label}): ${relative(repositoryRoot, entryPath)}`);
      }
    }
  };
  walk(scanRoot);
  return found.sort();
}

/** scheme 付き (http: / mailto:) と protocol-relative は repo の外なので見ない。 */
function isExternal(target) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//');
}

/**
 * 大文字小文字を区別して実体を確かめる。
 *
 * macOS の APFS は既定で case-insensitive なので `existsSync` は `Quickstart.md` を
 * `quickstart.md` として通す (実測)。公開先の filesystem は case-sensitive なため、
 * 手元で通って公開後に 404 になる。segment ごとに親の一覧と完全一致を見る。
 *
 * repositoryRoot の外に出た path は探索せず false を返すので、境界検査を兼ねる。
 */
function makeExistsCaseExact(repositoryRoot) {
  // 同じ directory を link の数だけ読み直さない。
  const listings = new Map();
  const namesOf = (directory) => {
    let names = listings.get(directory);
    if (names) return names;
    try {
      names = new Set(readdirSync(directory));
    } catch {
      names = new Set();
    }
    listings.set(directory, names);
    return names;
  };

  return (absolutePath) => {
    const rel = relative(repositoryRoot, absolutePath);
    if (rel === '') return true;
    if (rel === '..' || rel.startsWith(`..${sep}`)) return false;
    let current = repositoryRoot;
    for (const segment of rel.split(sep)) {
      if (!namesOf(current).has(segment)) return false;
      current = join(current, segment);
      // readdirSync と statSync は symlink を追うため、docs 内の symlink が repo の外を
      // 指していると外部の実在 file が有効扱いになる。段ごとに実体を確かめる。
      // docs/public/images のような repo 内の symlink は通す (実際に使われている)。
      try {
        if (!lstatSync(current).isSymbolicLink()) continue;
        const real = relative(repositoryRoot, realpathSync(current));
        if (real === '..' || real.startsWith(`..${sep}`)) return false;
      } catch {
        return false;
      }
    }
    return true;
  };
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * 生成物として扱う directory を `docs/**\/.gitignore` から集める。
 *
 * 生成物 (`docs/api/typescript/` 等) は checkout に無いのが正常なので、解決しない
 * ことを破れとして報告しない。判定材料を呼出側の hardcode ではなく repo 内の宣言に
 * 置くのは、生成先が増減するたびに手で直すことになり、直し忘れが実際の破れの見逃しか
 * 正常の停止に倒れるため。
 *
 * `git check-ignore` は使わない。ignore 規則は「生成物」 を意味しないので、
 * `*` や `docs/` のような広い規則を 1 行足すだけで全ての破れが生成物に化ける
 * (実測で再現した)。ここで見るのは **directory を名指しする entry だけ** で、
 * `docs/` 配下の `.gitignore` に限る。
 *
 * 対象を directory 宣言に絞るのは、生成されるのが typedoc / forge doc の出力 tree
 * だから。`*.log` のような file pattern は生成物の入口にならない。
 *
 * @param {string} docsRoot
 * @returns {Set<string>} 生成先 directory の絶対 path
 */
/**
 * path が `docs/` の中に収まるかを、解決できる範囲まで実体で確かめる。
 *
 * `realpathSync` を full path に 1 度だけ呼ぶ形では守れない。生成前は実体が無いのが
 * 正常なので失敗を字面に倒す必要があり、その退路を使えば **外を指す親 symlink の
 * 配下** / dangling / 循環 が全て素通りする (4 形とも実測で再現した)。
 *
 * 存在する ancestor までを canonical にし、残りの未生成 suffix だけ字面で継ぐ。
 * 途中の解決が ENOENT 以外 (循環 / 権限) で失敗したら通さない = 判定できないものを
 * 「中にある」 側に倒さない。
 */
function isInsideDocs(docsRoot, target) {
  let canonicalDocsRoot;
  try {
    canonicalDocsRoot = realpathSync(docsRoot);
  } catch {
    return false;
  }

  const segments = relative(docsRoot, target).split(sep).filter(Boolean);
  let resolved = canonicalDocsRoot;

  for (const segment of segments) {
    if (segment === '..') return false;
    const next = join(resolved, segment);

    // 実体の有無より先に、その名前が symlink かを見る。dangling symlink は
    // `realpathSync` が未生成と同じ ENOENT を返すため、解決の失敗だけでは
    // 「まだ無い」 と「外を指す壊れた link」 を区別できない (実測で素通りした)。
    let link = null;
    try {
      link = lstatSync(next);
    } catch (error) {
      // ここから先は実体が無い。字面で継いで最後に境界だけ見る。
      if (error?.code === 'ENOENT') {
        resolved = next;
        continue;
      }
      return false;
    }
    // symlink は解決先を確かめられない限り通さない (dangling / 外向きの両方)。
    if (link.isSymbolicLink()) {
      try {
        resolved = realpathSync(next);
      } catch {
        return false;
      }
      const fromRootAfterLink = relative(canonicalDocsRoot, resolved);
      if (fromRootAfterLink === '..' || fromRootAfterLink.startsWith(`..${sep}`)) return false;
      continue;
    }

    // ここから下は symlink ではない段。外へ出る手段が無いので、通常は解決も境界検査も
    // 結果を変えない (上の symlink 分岐を外すと落ちる形が 2 つ増えることを変異試験で
    // 確認した = この 2 つは symlink 判定に覆われた冗長な防御)。
    // 判定できない失敗を字面に倒さない意図を残すために置いている。
    try {
      resolved = realpathSync(next);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        resolved = next;
        continue;
      }
      // 循環 (ELOOP) / 権限 (EACCES) 等は判定できない。通さない。
      return false;
    }
    const fromRoot = relative(canonicalDocsRoot, resolved);
    if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`)) return false;
  }

  const fromRoot = relative(canonicalDocsRoot, resolved);
  return !(fromRoot === '..' || fromRoot.startsWith(`..${sep}`));
}

/**
 * 生成先の宣言を受け付ける directory。
 *
 * 任意の `docs/**\/.gitignore` を信じると、`gone/` の 1 行を足して `./gone/page` を
 * 参照するだけで本物の欠損 link を gate から隠せる (実測で再現した)。宣言できる場所を
 * 実際の generator が書き出す root に限る。
 *
 * 現状の generator は `/docs-generate` skill で、`docs/api/typescript` と
 * `docs/api/solidity` に出力する。生成先が増えたらここに 1 行足す = 宣言の場所を
 * 増やす判断が review を通る形にする。
 */
const GENERATED_DECLARATION_ROOTS = ['api'];

function collectGeneratedDirectories(docsRoot) {
  const generated = new Set();
  const trustedRoots = GENERATED_DECLARATION_ROOTS.map((name) => join(docsRoot, name));
  const staticRoot = staticAssetRoot(docsRoot);
  const isTrusted = (directory) =>
    trustedRoots.some((root) => directory === root || directory.startsWith(`${root}${sep}`));

  const walk = (directory) => {
    let entries;
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (shouldWalk(entry, entryPath, staticRoot)) walk(entryPath);
        continue;
      }
      if (entry.name !== '.gitignore') continue;
      // 宣言を受け付けるのは generator が書き出す root だけ。任意の場所を信じると
      // 1 行足すだけで欠損 link を隠せる。
      if (!isTrusted(directory)) continue;
      // symlink と hardlink の `.gitignore` は読まない。docs の外に置いた file から
      // 生成先を宣言できてしまい、任意の dead link を生成物として隠せる (実測で再現)。
      // hardlink は link 数で判定する = 実体が 2 箇所以上から参照されている形。
      if (entry.isSymbolicLink()) continue;
      try {
        if (lstatSync(entryPath).nlink > 1) continue;
      } catch {
        continue;
      }

      let content;
      try {
        content = readFileSync(entryPath, 'utf8');
      } catch {
        continue;
      }
      for (const rawLine of content.split('\n')) {
        const line = rawLine.trim();
        // 空行 / comment は対象外。
        if (!line) continue;
        if (line.startsWith('#')) continue;
        // 否定 (`!`) は「無視しない」 宣言なので生成物を示さない。
        //
        // この行と次の glob 除外は **外しても挙動が変わらない** (変異試験で確認)。
        // `!gone/` や `gen-*/` はそのまま文字列として登録されるだけで、実 path とは
        // 一致しないため。意図を code に残すために書いており、覆う test は無い。
        if (line.startsWith('!')) continue;
        // directory を名指しする entry だけを見る。末尾 slash が dir の目印。
        if (!line.endsWith('/')) continue;
        // glob を含む entry は対象を特定できないので採らない。
        if (/[*?[\]]/.test(line)) continue;
        // 先頭 slash は「この .gitignore からの相対」 の意味。
        const relativeTarget = line.replace(/^\//, '').replace(/\/$/, '');
        if (!relativeTarget || relativeTarget.split('/').includes('..')) continue;

        const target = join(directory, relativeTarget);
        // 宣言先が docs/ の外に出る形は採らない。symlink 経由で外へ向けると、
        // docs の外の path を指す link が生成物として通る (実測で再現した)。
        if (!isInsideDocs(docsRoot, target)) continue;

        generated.add(target);
      }
    }
  };

  walk(docsRoot);
  return generated;
}

/**
 * link が解決しない理由。呼出側が「どの壊れ方か」 で絞れるようにする。
 *
 * 文字列だけを返していた間、呼出側が `existsSync` で分類をやり直しており、
 * 本 module が持つ大文字小文字の厳密判定と repo 境界がその再判定で失われていた
 * (実測で case 違いの link が「解決する」 と誤判定された)。分類は本 module に持たせ、
 * 呼出側は理由で絞るだけにする。
 */
export const LINK_FAILURE = Object.freeze({
  /** repo のどこにも実体が無い。 */
  MISSING: 'missing',
  /** 実体はあるが docs/ の外。GitHub では開けるが公開 site には出ない。 */
  OUTSIDE_DOCS: 'outside-docs',
  /** directory はあるが index.md が無い。公開後 404 になる。 */
  DIRECTORY_WITHOUT_INDEX: 'directory-without-index',
  /**
   * git の無視対象を指す。`pnpm docs:api-reference` が生成するため checkout には
   * 無いのが正常で、破れではない。build 後の公開 site には存在する。
   */
  GENERATED: 'generated',
});

/**
 * 報告 1 行の形。並べ替えの key もこれを使い、報告順と並べ替え順を一致させる。
 */
const reportLine = ({ file, target }) => `dead link: ${file} -> ${target}`;

/**
 * link を 1 つずつ解決し、解決しないものを理由付きで列挙する。
 *
 * 解決規則は VitePress に合わせる。末尾 slash と directory は `index.md` を要求し、
 * 拡張子なしは `<path>.md` を見る。directory が在るだけでは解決とみなさない
 * (`index.md` の無い directory への link は公開後 404 になる)。
 *
 * @param {{repositoryRoot: string, docsRoot: string, scanRoot: string}} roots
 * @returns {{file: string, target: string, reason: string}[]} 解決しない link。
 */
export function classifyDocumentLinks({ repositoryRoot, docsRoot, scanRoot }) {
  const existsCaseExact = makeExistsCaseExact(repositoryRoot);
  const generatedDirectories = collectGeneratedDirectories(docsRoot);
  const staticRoot = staticAssetRoot(docsRoot);
  const found = [];

  /** 生成先 directory 自身か、その配下か。 */
  const isGenerated = (absolutePath) => {
    for (const generated of generatedDirectories) {
      if (absolutePath === generated) return true;
      if (absolutePath.startsWith(`${generated}${sep}`)) return true;
    }
    return false;
  };

  /** 解決すれば null、しなければ LINK_FAILURE のいずれかを返す。 */
  const failureOf = (fromDirectory, target) => {
    const [pathPart] = target.split(/[#?]/);
    // 同一 file 内の anchor だけの link。anchor の実在検証は別の関心。
    if (!pathPart) return null;

    // 生成側は directory 名を percent encode して埋めるので、戻してから実体を見る。
    let decoded = pathPart;
    try {
      decoded = decodeURIComponent(pathPart);
    } catch {
      // 壊れた escape は生の文字列で照合する。解決できなければ missing になる。
    }

    // site 絶対 path は docs/ を根とする。VitePress は docs/public/ の中身を site root へ
    // 出すため、docs/ 直下で解決しない時は public/ も見る (画像がここに置かれている)。
    // 相対 path は file の位置から解く。
    const candidates = decoded.startsWith('/')
      ? [join(docsRoot, decoded), join(docsRoot, 'public', decoded)]
      : [join(fromDirectory, decoded)];

    // 候補は最大 2 つ。1 つでも docs/ の中で解決すれば成功、そうでなければ
    // 見つかった中で最も具体的な失敗理由を返す。
    let failure = LINK_FAILURE.MISSING;
    const worse = (reason) => {
      // MISSING より情報が多い理由で上書きする。GENERATED を最上位に置くのは、
      // 「build すれば在る」 が「どこにも無い」 より確度の高い説明だから。
      const rank = {
        [LINK_FAILURE.MISSING]: 0,
        [LINK_FAILURE.OUTSIDE_DOCS]: 1,
        [LINK_FAILURE.DIRECTORY_WITHOUT_INDEX]: 2,
        [LINK_FAILURE.GENERATED]: 3,
      };
      if (rank[reason] > rank[failure]) failure = reason;
    };

    for (const absolute of candidates) {
      // 公開されるのは docs/ の中だけ。repo 内でも外に出た link は解決とみなさない。
      // ただし「repo に実体はある」 ことは呼出側が知りたいので理由に残す。
      const fromDocs = relative(docsRoot, absolute);
      const insideDocs = !(fromDocs === '..' || fromDocs.startsWith(`..${sep}`));

      const asPage = decoded.endsWith('/')
        ? existsCaseExact(join(absolute, 'index.md'))
        : existsCaseExact(`${absolute}.md`) ||
          existsCaseExact(join(absolute, 'index.md')) ||
          (existsCaseExact(absolute) && !isDirectory(absolute));

      if (asPage) {
        if (insideDocs) return null;
        worse(LINK_FAILURE.OUTSIDE_DOCS);
        continue;
      }
      if (existsCaseExact(absolute)) {
        worse(insideDocs ? LINK_FAILURE.DIRECTORY_WITHOUT_INDEX : LINK_FAILURE.OUTSIDE_DOCS);
        continue;
      }
      // 実体が無い時だけ、生成物かを見る。実在する path は上の判定が既に扱っており、
      // 生成先かどうかは解決の可否に関係しない。
      if (insideDocs && isGenerated(absolute)) {
        worse(LINK_FAILURE.GENERATED);
      }
    }
    return failure;
  };

  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (shouldWalk(entry, entryPath, staticRoot)) walk(entryPath);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;
      if (!isReadableSource(entry)) continue;

      const content = readFileSync(entryPath, 'utf8');
      for (const target of linkTargets(content)) {
        if (isExternal(target)) continue;
        const reason = failureOf(dirname(entryPath), target);
        if (!reason) continue;
        found.push({ file: relative(repositoryRoot, entryPath), target, reason });
      }
    }
  };

  walk(scanRoot);
  // 並びは報告文字列そのものの code unit 順で固定する。
  //
  // `localeCompare` は ICU の照合順に従うため、大文字を含む path で並びが変わり
  // 環境によっても揺れる。区切りを変えた key (`file + ' ' + target`) も使えない
  // = 報告文字列は ` -> ` で繋ぐため、空白を含む file 名で 2 つの順序が割れる
  // (`a.md -> zzz` と `a.md b.md -> ./y` で逆転する。実測で確認した)。
  return found.sort((a, b) => {
    const left = reportLine(a);
    const right = reportLine(b);
    if (left < right) return -1;
    return left > right ? 1 : 0;
  });
}

/**
 * 破れた link を 1 行の説明文で列挙する。
 *
 * 理由で絞りたい呼出側は `classifyDocumentLinks` を使う。こちらは生成 script が
 * stderr へ出すための整形版。
 *
 * `generated` は除く。build すれば在るものを「破れ」 として止めると、checkout 直後は
 * 常に落ちる gate になる (実測で `docs/` 全体へ広げた時に 4 件で止まった)。
 * 生成物かどうかを確かめたい呼出側は `classifyDocumentLinks` で理由を見る。
 *
 * @param {{repositoryRoot: string, docsRoot: string, scanRoot: string}} roots
 * @returns {string[]} 破れた link の説明行。空配列なら破れ無し。
 */
export function deadDocumentLinks(roots) {
  return classifyDocumentLinks(roots)
    .filter(({ reason }) => reason !== LINK_FAILURE.GENERATED)
    .map(reportLine);
}
