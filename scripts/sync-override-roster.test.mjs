// The roster generator, exercised without touching the real doc.
//
// The check that runs in release-smoke only ever sees a repo where the roster
// is already correct, so it passes whether the generator builds the table or
// returns the input unchanged. These cases pin what it actually produces.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BEGIN, END, cell, replaceBlock, rosterTable } from './sync-override-roster.mjs';

const TIERS = { core: 80, framework: 70, saas: 65, 'test-type': 60 };

test('an empty roster renders the (none) row', () => {
  const table = rosterTable({ '@kiwa-lab/core': { tier: 'core' } }, TIERS);
  assert.match(table, /\| \(none\) \| — \| — \| — \| — \|/);
});

test('a lowered override renders as looser, a raised one as stricter', () => {
  const table = rosterTable(
    {
      '@kiwa-lab/auth': { tier: 'framework', override: 65, reason: 'session.js follow-up' },
      '@kiwa-lab/api': { tier: 'core', override: 90 },
    },
    TIERS,
  );
  assert.match(table, /\| `@kiwa-lab\/api` \| core \| 90 \| stricter \|  \|/);
  assert.match(table, /\| `@kiwa-lab\/auth` \| framework \| 65 \| looser \| session\.js follow-up \|/);
  // Sorted by name, so the same map always renders the same table.
  assert.ok(table.indexOf('@kiwa-lab/api') < table.indexOf('@kiwa-lab/auth'));
});

test('a package without an override is left out', () => {
  const table = rosterTable(
    { '@kiwa-lab/core': { tier: 'core' }, '@kiwa-lab/auth': { tier: 'framework', override: 65 } },
    TIERS,
  );
  assert.ok(!table.includes('@kiwa-lab/core'));
  assert.ok(table.includes('@kiwa-lab/auth'));
});

test('a reason cannot break the table out of its columns', () => {
  // A reason is a sentence someone wrote, so it can carry a pipe or wrap onto a
  // second line. Either one ends the cell early and every row below renders in
  // the wrong column.
  const table = rosterTable(
    { '@kiwa-lab/x': { tier: 'saas', override: 60, reason: 'a | b\n  second line' } },
    TIERS,
  );
  const rows = table.split('\n');
  const columns = (row) => row.split(/(?<!\\)\|/).length;
  assert.equal(columns(rows[2]), columns(rows[0]));
  assert.match(rows[2], /a \\\| b second line/);
});

test('cell leaves an ordinary value alone', () => {
  assert.equal(cell('session.js follow-up'), 'session.js follow-up');
  assert.equal(cell(65), '65');
});

test('the block is replaced in place, leaving the surrounding text alone', () => {
  const doc = `before\n\n${BEGIN}\nold table\n${END}\n\nafter\n`;
  const out = replaceBlock(doc, 'new table');
  assert.equal(out, `before\n\n${BEGIN}\nnew table\n${END}\n\nafter\n`);
});

test('missing or malformed markers throw rather than appending a second table', () => {
  const cases = [
    ['no markers', 'plain text'],
    ['only the begin marker', `${BEGIN}\ntable\n`],
    ['only the end marker', `table\n${END}\n`],
    ['end before begin', `${END}\ntable\n${BEGIN}\n`],
    ['begin twice', `${BEGIN}\nt\n${END}\n${BEGIN}\n`],
    ['end twice', `${BEGIN}\nt\n${END}\n${END}\n`],
  ];
  for (const [label, doc] of cases) {
    assert.throws(() => replaceBlock(doc, 'new'), undefined, label);
  }
});
