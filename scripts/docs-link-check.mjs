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
const INLINE_LINK = /!?\[[^\]]*\]\(\s*(?:<([^>\n]*)>|([^)\s]+))\s*\)/g;
// 生 HTML。VitePress は markdown 中の HTML をそのまま出す。
//
// tag 全体を取ってから属性を読む 2 段にする。1 本の正規表現で要素名と属性名を並べると
// 属性名の境界が緩くなって `data-src` を `src` として拾い、`[^>]*?` が引用区間の `>` で
// 止まって後続の属性を見逃す (どちらも実測で再現した)。
//
// tag の中身は引用区間を先に食うので、属性値に `>` があっても tag の終端を取り違えない。
const IMG_TAG = /<img\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;
const A_TAG = /<a\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;
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
const VUE_ANCHOR_TAG = /<(a|component)\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;
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
      const plainName = name.replace(/^(?::|v-bind:)/, '');
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
 * @param {{repositoryRoot: string, scanRoot: string}} roots
 * @returns {string[]} 記法と file を示す説明行。空配列なら未対応記法なし。
 */
export function unsupportedLinkSyntax({ repositoryRoot, scanRoot }) {
  const found = [];

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
      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;
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
  const found = [];

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
      // MISSING より OUTSIDE_DOCS、それより DIRECTORY_WITHOUT_INDEX の方が情報が多い。
      const rank = {
        [LINK_FAILURE.MISSING]: 0,
        [LINK_FAILURE.OUTSIDE_DOCS]: 1,
        [LINK_FAILURE.DIRECTORY_WITHOUT_INDEX]: 2,
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
      }
    }
    return failure;
  };

  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;

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
 * 解決しない link を 1 行の説明文で列挙する。
 *
 * 理由で絞りたい呼出側は `classifyDocumentLinks` を使う。こちらは生成 script が
 * stderr へ出すための整形版。
 *
 * @param {{repositoryRoot: string, docsRoot: string, scanRoot: string}} roots
 * @returns {string[]} 解決しない link の説明行。空配列なら破れ無し。
 */
export function deadDocumentLinks(roots) {
  return classifyDocumentLinks(roots).map(reportLine);
}
