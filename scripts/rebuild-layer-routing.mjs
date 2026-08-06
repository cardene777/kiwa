#!/usr/bin/env node
/**
 * Render `docs/layers.json` into the skills that route on it.
 *
 * Four `SKILL.md` files used to declare the `--layer` enum independently and a
 * fifth place held the routing table. Nothing compared them, so #1804 deleted
 * two packages and left their routing behind, and three further inconsistencies
 * survived until #1810 read all five side by side.
 *
 * The fix is not a better check. It is making the drift unwritable: every value
 * lives in the table, and this script is the only thing that puts it into a
 * skill. A hand edit inside a generated region is caught by `--check`.
 *
 * Usage:
 *   node scripts/rebuild-layer-routing.mjs           write
 *   node scripts/rebuild-layer-routing.mjs --check   compare, exit 1 on drift
 *
 * The marker shape follows `scripts/sync-library-api-reference.mjs`, and the
 * `--check` contract follows `scripts/rebuild-plugin-metadata.mjs`.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const TABLE = 'docs/layers.json';

/** A generated region, addressed by name so one file can hold several. */
function markers(name) {
  return { start: `<!-- kiwa-layers:${name}:start -->`, end: `<!-- kiwa-layers:${name}:end -->` };
}

function read(rel) {
  return readFileSync(resolve(ROOT, rel), 'utf-8');
}

function loadLayers() {
  const table = JSON.parse(read(TABLE));
  const layers = table.layers;

  // A table that disagrees with itself would be rendered faithfully into every
  // skill, so the contradictions are worth catching before they spread.
  const ids = layers.map((l) => l.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) throw new Error(`${TABLE}: duplicate id: ${[...new Set(dupes)].join(', ')}`);

  for (const l of layers) {
    // Containment is a path question, not a string question. `spec_dir` of
    // "../../docs" produces a spec_path that passes a prefix comparison and
    // resolves outside the repository, and the skills would then be told to
    // write there.
    const root = resolve(ROOT, table.specRoot);
    const dir = resolve(root, l.spec_dir);
    const file = resolve(ROOT, l.spec_path);
    for (const [label, target, base] of [
      ['spec_dir', dir, root],
      ['spec_path', file, dir],
    ]) {
      if (target !== base && !target.startsWith(base + '/')) {
        throw new Error(`${TABLE}: ${l.id}: ${label} escapes "${base}"`);
      }
    }
    if (l.spec_dir.includes('..') || l.spec_path.includes('..')) {
      throw new Error(`${TABLE}: ${l.id}: spec paths may not contain ".."`);
    }
    if (l.backing_package && l.backing_runtime_package) {
      throw new Error(`${TABLE}: ${l.id}: carries both a package and a runtime package`);
    }
  }
  return layers;
}

/** `{a|b|c}` — the body of a `--layer` option, in table order. */
function enumBody(layers, filter) {
  return layers.filter(filter).map((l) => l.id).join('|');
}

/**
 * Replace the body of one named region.
 *
 * A missing marker is an error rather than a silent no-op: it means someone
 * removed the region and the skill now carries a hand-written copy that this
 * script will never correct.
 */
function renderRegion(source, name, body, rel) {
  const { start, end } = markers(name);
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  if (from === -1 || to === -1) throw new Error(`${rel}: missing region "${name}"`);
  if (to < from) throw new Error(`${rel}: region "${name}" has its end before its start`);
  if (source.indexOf(start, from + 1) !== -1) {
    throw new Error(`${rel}: region "${name}" is opened twice`);
  }
  // A second end marker leaves a stray line the renderer would preserve as if
  // it were content. Checking only the start let that through.
  if (source.indexOf(end, to + 1) !== -1) {
    throw new Error(`${rel}: region "${name}" is closed twice`);
  }
  return source.slice(0, from + start.length) + '\n' + body + '\n' + source.slice(to);
}

function renderDesignEnum(layers) {
  return [
    '',
    `- \`--layer {${enumBody(layers, () => true)}|all}\` — 想定 test layer を指定 (default \`all\`)。`,
    '  各値の出力先と消費 skill は下の routing 表を参照する。',
    '',
  ].join('\n');
}

function renderRoutingTable(layers) {
  const lines = ['', '| layer | spec 出力先 | 消費 skill | 実行 runtime | provider |', '|---|---|---|---|---|'];
  for (const l of layers) {
    // A provider is a flag value; a variant is an alternative chosen elsewhere.
    // Printing both in one column would claim a `--provider` that only three
    // layers have.
    const providers = l.providers.length
      ? l.providers.map((p) => `\`${p}\``).join(' / ')
      : l.variants.length
        ? `${l.variants.map((p) => `\`${p}\``).join(' / ')} (${l.selected_by})`
        : '—';
    const mode = l.mode ? ` (\`--mode ${l.mode}\`)` : '';
    lines.push(
      `| \`${l.id}\` | \`${l.spec_path}\` | \`/${l.consumer_skill}\`${mode} | ${l.runtime} | ${providers} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

function renderReviewEnum(layers) {
  return [
    '',
    `- \`--layer {${enumBody(layers, () => true)}|all}\` — review 対象の layer を指定 (default \`all\`)。`,
    '  値は `kiwa-design` の enum と同一で、どちらも `docs/layers.json` から生成される。',
    '',
  ].join('\n');
}

function renderResolver(layers) {
  const lines = ['', '| layer | 対応 test file |', '|---|---|'];
  for (const l of layers) {
    lines.push(`| \`${l.id}\` | \`${l.test_output}\` |`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderPolyglotEnum(layers, runtime) {
  const own = layers.filter((l) => l.runtime === runtime);
  const modes = own.filter((l) => l.mode).map((l) => l.mode);
  return [
    '',
    `- \`--layer {${own.map((l) => l.id).join('|')}}\` — 対象 layer。`,
    `- \`--mode {${modes.join('|')}}\` — framework 別 helper の選択 (layer が \`--mode\` を持つ時のみ)。`,
    '',
  ].join('\n');
}

const PLAN = [
  {
    rel: '.claude/skills/kiwa-design/SKILL.md',
    regions: [
      { name: 'design-enum', render: renderDesignEnum },
      { name: 'routing-table', render: renderRoutingTable },
    ],
  },
  {
    rel: '.claude/skills/kiwa-review/SKILL.md',
    regions: [
      { name: 'review-enum', render: renderReviewEnum },
      { name: 'resolver', render: renderResolver },
    ],
  },
  {
    rel: '.claude/skills/kiwa-rust/SKILL.md',
    regions: [{ name: 'rust-enum', render: (l) => renderPolyglotEnum(l, 'rust') }],
  },
  {
    rel: '.claude/skills/kiwa-go/SKILL.md',
    regions: [{ name: 'go-enum', render: (l) => renderPolyglotEnum(l, 'go') }],
  },
];

function main() {
  const check = process.argv.includes('--check');
  const layers = loadLayers();
  const drifted = [];

  // Render every file before writing any. Writing as we go left the worktree
  // half-updated when a later file turned out to have a malformed marker: the
  // command failed, and the first file had already changed.
  const pending = [];
  for (const file of PLAN) {
    const before = read(file.rel);
    let after = before;
    for (const region of file.regions) {
      after = renderRegion(after, region.name, region.render(layers), file.rel);
    }
    if (after !== before) pending.push({ rel: file.rel, after });
  }

  for (const { rel, after } of pending) {
    if (check) drifted.push(rel);
    else writeFileSync(resolve(ROOT, rel), after, 'utf-8');
  }

  if (check) {
    if (drifted.length) {
      console.error('Generated regions are out of date:');
      for (const rel of drifted) console.error(`  ${rel}`);
      console.error('Run `node scripts/rebuild-layer-routing.mjs` and commit the result.');
      process.exit(1);
    }
    console.log(`${layers.length} layers, all generated regions up to date`);
    return;
  }

  console.log(`${layers.length} layers rendered into ${PLAN.length} skills`);
}

main();
