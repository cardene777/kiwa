#!/usr/bin/env node
/**
 * skill を足したのに配布物の version を据え置いた PR を落とす。
 *
 * Claude Code の plugin cache は version 名の dir で切られ (`cache/<market>/<plugin>/<version>/`)、
 * 更新の判断も version 番号だけを見る。 中身が変わっても version が同じなら
 * `claude plugin update` は「already at the latest version」 を返し、 配布物に届かない。
 *
 * 2026-08-25 に実際に詰まった。 `kiwa-plan-run` を足した #2228 が version を据え置いたため、
 * 取得元は最新なのに手元の cache は前日のままで、 skill が 1 つ欠けていた (#2233)。
 *
 * 生成物の件数ずれ (#2229) は `rebuild-plugin-metadata.mjs --check` が見るが、
 * version は「据え置いても整合が取れてしまう」 ため、 別の判定材料が要る。
 * base branch の skill 一覧と比べて増えているかを見るのがそれにあたる。
 *
 * Usage:
 *   node scripts/check-plugin-version-bump.mjs            # base は main
 *   node scripts/check-plugin-version-bump.mjs --base <ref>
 *
 * 終了 code は 0 = 問題なし / 1 = version 据え置き / 2 = 判定できない。
 * 判定できない場合を 0 に倒さないのは、 「比べていない」 を「問題なし」 と読ませないため。
 * ただし base と HEAD が同一 (main 上での実行) は比較対象が無いだけなので 0 を返す。
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './lib/is-main-module.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '..');

const SKILLS_PREFIX = '.claude/skills/';
const MANIFEST = 'SKILL.md';

/** git を読み取り専用で呼ぶ。 失敗しても throw せず、 呼出側に判断させる。 */
function git(args) {
  const result = spawnSync('git', ['-C', REPO_ROOT, ...args], { encoding: 'utf-8' });
  return { ok: result.status === 0, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/**
 * ある ref が持つ skill 名の集合。
 *
 * 数えるのは `SKILL.md` を持つ dir だけで、 `rebuild-plugin-metadata.mjs` の `readSkills()` と
 * 同じ基準にする。 dir だけ残った跡は skill ではない (`_shared` のような共有部品も、
 * `SKILL.md` を持たないためここに入らない)。
 */
export function skillNamesAt(ref) {
  const listed = git(['ls-tree', '-r', '--name-only', ref, '--', SKILLS_PREFIX]);
  if (!listed.ok) return null;

  const names = new Set();
  for (const line of listed.stdout.split('\n')) {
    if (!line.startsWith(SKILLS_PREFIX)) continue;
    const rest = line.slice(SKILLS_PREFIX.length);
    const slash = rest.indexOf('/');
    if (slash === -1) continue;
    if (rest.slice(slash + 1) !== MANIFEST) continue;
    names.add(rest.slice(0, slash));
  }
  return names;
}

/** ある ref の配布物 version。 読めなければ null。 */
export function versionAt(ref) {
  const shown = git(['show', `${ref}:.claude-plugin/plugin.json`]);
  if (!shown.ok) return null;
  try {
    return JSON.parse(shown.stdout).version ?? null;
  } catch {
    return null;
  }
}

/**
 * 判定そのもの。 git に触らないので、 検査から直接呼べる。
 *
 * 落とすのは「skill が増えた」 かつ「version が同じ」 の組合せだけ。
 * 減った場合と入れ替わった場合は対象にしない = 削除は cache が古いままでも
 * 新しい skill が届かない形にはならず、 別の判断 (major/minor) が要るため。
 */
export function decide({ baseSkills, headSkills, baseVersion, headVersion }) {
  if (baseSkills === null || headSkills === null || baseVersion === null || headVersion === null) {
    return { verdict: 'undecidable', reason: 'skill 一覧か version を読めなかった' };
  }

  const added = [...headSkills].filter((name) => !baseSkills.has(name)).sort();
  if (added.length === 0) {
    return {
      verdict: 'ok',
      reason: `skill の増加なし (base ${baseSkills.size} 件 / head ${headSkills.size} 件)`,
      added,
    };
  }

  if (headVersion === baseVersion) {
    return {
      verdict: 'stale-version',
      reason:
        `skill が ${added.length} 件増えたのに version が ${headVersion} のまま据え置かれている ` +
        `(追加: ${added.join(', ')})`,
      added,
    };
  }

  return {
    verdict: 'ok',
    reason: `skill が ${added.length} 件増え、version は ${baseVersion} から ${headVersion} に上がっている`,
    added,
  };
}

function main() {
  const argv = process.argv.slice(2);
  const baseIndex = argv.indexOf('--base');
  if (baseIndex !== -1 && argv[baseIndex + 1] === undefined) {
    console.error('--base に ref を渡してください');
    process.exit(2);
  }
  const base = baseIndex === -1 ? 'main' : argv[baseIndex + 1];

  const baseSha = git(['rev-parse', base]);
  const headSha = git(['rev-parse', 'HEAD']);
  if (!baseSha.ok || !headSha.ok) {
    console.error(`base (${base}) か HEAD を解決できません。 ref を確認してください`);
    process.exit(2);
  }

  // base 上での実行は比較対象が無い。 「比べたが差が無い」 とは別なので、そう書いて 0 で抜ける。
  if (baseSha.stdout.trim() === headSha.stdout.trim()) {
    console.log(`base (${base}) と HEAD が同一のため比較対象なし`);
    return;
  }

  const result = decide({
    baseSkills: skillNamesAt(base),
    headSkills: skillNamesAt('HEAD'),
    baseVersion: versionAt(base),
    headVersion: versionAt('HEAD'),
  });

  if (result.verdict === 'stale-version') {
    console.error(`${result.reason}\n\n.claude-plugin/plugin.json の version を上げ、`);
    console.error('node scripts/rebuild-plugin-metadata.mjs を実行して commit してください。');
    process.exit(1);
  }

  if (result.verdict === 'undecidable') {
    console.error(`判定できません: ${result.reason}`);
    process.exit(2);
  }

  console.log(result.reason);
}

if (isMainModule(process.argv[1], import.meta.url)) main();
