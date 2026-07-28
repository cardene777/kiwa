// Behaviour tests for docs-sync-safety.mjs (documentation generator guards).
// Runs with Node's built-in test runner (no vitest dependency at repo root):
//   node --test scripts/docs-sync-safety.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  DocsSyncError,
  codeBlock,
  countOccurrences,
  escapeMarkdownText,
  fenceFor,
  findManagedBlock,
  inlineCode,
  insideRoot,
  neutralizeLeadingFence,
  linkUrl,
  prepareWritePath,
  replaceManagedBlock,
  resolveReadPath,
  tableCell,
  tableCodeCell,
  writeFileAtomic,
} from './docs-sync-safety.mjs';

const START = '<!-- x:start -->';
const END = '<!-- x:end -->';
const block = (content, label = 'README.md') =>
  findManagedBlock(content, { startMarker: START, endMarker: END, label });

/** A scratch directory that is removed when `body` returns. */
function withTempDir(body) {
  // `realpathSync` because /tmp is a symlink to /private/tmp on macOS, and a
  // root that is not canonical makes every containment check fail.
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'docs-sync-safety-')));
  try {
    return body(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('importing the module does not run anything', () => {
  assert.equal(typeof findManagedBlock, 'function');
});

test('countOccurrences counts every non-overlapping hit', () => {
  assert.equal(countOccurrences('a-b-c', '-'), 2);
  assert.equal(countOccurrences('aaa', 'aa'), 1, 'the second hit starts after the first one ends');
  assert.equal(countOccurrences('abc', 'z'), 0);
});

test('findManagedBlock reports the span of a well formed block', () => {
  const content = `head\n${START}\nbody\n${END}\ntail`;
  const found = block(content);
  assert.equal(content.slice(found.start, found.end), `${START}\nbody\n${END}`);
});

test('findManagedBlock reports absence when neither marker is there', () => {
  assert.equal(block('# title\n\nnothing managed here\n'), null);
});

// The three shapes named in the issue. Each one used to be repaired silently:
// a lone end marker grew a new block on every run, a lone start marker ate the
// rest of the file, and a stray pair deleted whatever sat between the strays.
test('findManagedBlock refuses a file that has only the end marker', () => {
  assert.throws(
    () => block(`# title\n\n${END}\n`),
    (error) => {
      assert.ok(error instanceof DocsSyncError);
      assert.match(error.message, /README\.md/);
      assert.match(error.message, /0 start marker/);
      assert.match(error.message, /1 end marker/);
      return true;
    },
  );
});

test('findManagedBlock refuses a file that has only the start marker', () => {
  assert.throws(() => block(`# title\n\n${START}\n\nhand written\n`), /1 start marker.*0 end marker/s);
});

test('findManagedBlock refuses duplicated markers', () => {
  const content = `${START}\nstray\n${END}\n\nhand written\n\n${START}\nreal\n${END}\n`;
  assert.throws(() => block(content), /2 start marker.*2 end marker/s);
});

test('findManagedBlock refuses markers that appear in the wrong order', () => {
  assert.throws(() => block(`${END}\nhand written\n${START}\n`), /before the start marker/);
});

test('replaceManagedBlock swaps the block in place and leaves the rest alone', () => {
  const content = `head\n\n${START}\nold\n${END}\n\ntail\n`;
  const updated = replaceManagedBlock(content, {
    startMarker: START,
    endMarker: END,
    block: `${START}\nnew\n${END}`,
    insert: () => assert.fail('the block was there; nothing should be inserted'),
    label: 'README.md',
  });
  assert.equal(updated, `head\n\n${START}\nnew\n${END}\n\ntail\n`);
});

// The old implementation called itself after stripping a block, so a file with
// two blocks was repaired by deleting both and appending one. Replacement is
// now a single pass over a validated span.
test('replaceManagedBlock never rewrites more than one block', () => {
  const content = `${START}\na\n${END}\n${START}\nb\n${END}\n`;
  assert.throws(
    () =>
      replaceManagedBlock(content, {
        startMarker: START,
        endMarker: END,
        block: `${START}\nnew\n${END}`,
        insert: () => 'inserted',
        label: 'README.md',
      }),
    DocsSyncError,
  );
});

test('replaceManagedBlock delegates to insert when the file has no block', () => {
  const updated = replaceManagedBlock('# title\n', {
    startMarker: START,
    endMarker: END,
    block: 'BLOCK',
    insert: (content, blockText) => `${content}\n${blockText}\n`,
    label: 'README.md',
  });
  assert.equal(updated, '# title\n\nBLOCK\n');
});

test('insideRoot accepts the root itself and what is under it', () => {
  assert.equal(insideRoot('/repo', '/repo'), true);
  assert.equal(insideRoot('/repo', '/repo/packages/core/README.md'), true);
});

test('insideRoot rejects a parent, a sibling and an unrelated path', () => {
  assert.equal(insideRoot('/repo', '/'), false);
  assert.equal(insideRoot('/repo', '/repo-other/README.md'), false);
  assert.equal(insideRoot('/repo', '/etc/passwd'), false);
});

// relative(/repo, /repo-evil) is ../repo-evil, but relative(/repo,
// /repo/..hidden) is ..hidden. A prefix test on two dots rejects the second
// one, which is an ordinary file inside the root.
test('insideRoot accepts a name that merely begins with two dots', () => {
  assert.equal(insideRoot('/repo', '/repo/..hidden'), true);
});

test('resolveReadPath returns the canonical path of a file inside the root', () => {
  withTempDir((root) => {
    const file = join(root, 'README.md');
    writeFileSync(file, 'hello');
    assert.equal(resolveReadPath(file, root, 'README.md'), file);
  });
});

// A link is followed by readFileSync, so a checkout that contains one can
// feed any readable file on the machine into the published documentation.
test('resolveReadPath refuses a symlink that leaves the root', () => {
  withTempDir((parent) => {
    const root = join(parent, 'repo');
    mkdirSync(root);
    const outside = join(parent, 'secret.md');
    writeFileSync(outside, 'secret');
    const link = join(root, 'README.md');
    symlinkSync(outside, link);
    assert.throws(
      () => resolveReadPath(link, root, 'README.md'),
      (error) => {
        assert.ok(error instanceof DocsSyncError);
        assert.match(error.message, /outside/);
        return true;
      },
    );
  });
});

test('resolveReadPath accepts a symlink that stays inside the root', () => {
  withTempDir((root) => {
    const real = join(root, 'real.md');
    writeFileSync(real, 'hello');
    const link = join(root, 'README.md');
    symlinkSync(real, link);
    assert.equal(resolveReadPath(link, root, 'README.md'), real);
  });
});

test('prepareWritePath returns a canonical path for an ordinary target', () => {
  withTempDir((root) => {
    const target = join(root, 'docs', 'README.md');
    mkdirSync(join(root, 'docs'));
    assert.equal(prepareWritePath(target, root, 'docs README'), target);
  });
});

// The write target itself. An atomic rename would either replace a file
// outside the root or destroy the link; neither is a thing to do silently.
test('prepareWritePath refuses a symlink at the target path', () => {
  withTempDir((parent) => {
    const root = join(parent, 'repo');
    mkdirSync(root);
    const outside = join(parent, 'outside.md');
    writeFileSync(outside, 'original');
    const link = join(root, 'README.md');
    symlinkSync(outside, link);
    assert.throws(
      () => prepareWritePath(link, root, 'README'),
      (error) => {
        assert.ok(error instanceof DocsSyncError);
        assert.match(error.message, /symlink/);
        return true;
      },
    );
    assert.equal(readFileSync(outside, 'utf8'), 'original');
  });
});

test('prepareWritePath refuses a target whose directory leaves the root', () => {
  withTempDir((parent) => {
    const root = join(parent, 'repo');
    mkdirSync(root);
    mkdirSync(join(parent, 'elsewhere'));
    symlinkSync(join(parent, 'elsewhere'), join(root, 'docs'));
    assert.throws(
      () => prepareWritePath(join(root, 'docs', 'README.md'), root, 'docs README'),
      /outside/,
    );
  });
});

test('prepareWritePath refuses a target whose directory does not exist', () => {
  withTempDir((root) => {
    assert.throws(
      () => prepareWritePath(join(root, 'gone', 'README.md'), root, 'README'),
      DocsSyncError,
    );
  });
});

test('writeFileAtomic leaves the file with the new content and no leftovers', () => {
  withTempDir((root) => {
    const target = join(root, 'README.md');
    writeFileSync(target, 'old');
    writeFileAtomic(target, 'new');
    assert.equal(readFileSync(target, 'utf8'), 'new');
    assert.deepEqual(readdirSync(root), ['README.md'], 'the temporary file is gone');
  });
});

// A failed write must not leave a half written file behind under a name the
// next run would read back as documentation.
test('writeFileAtomic removes its temporary file when the rename fails', () => {
  withTempDir((root) => {
    const target = join(root, 'a-directory');
    mkdirSync(target);
    assert.throws(() => writeFileAtomic(target, 'new'));
    assert.deepEqual(readdirSync(root), ['a-directory']);
  });
});

// The write never goes through a link. The content lands in a fresh temporary
// name, and the rename replaces the link itself rather than following it, so a
// link left at the target cannot redirect the write out of the repository.
// Refusing such a target outright is prepareWritePath's job, tested above.
test('writeFileAtomic replaces a link at the target instead of writing through it', () => {
  withTempDir((parent) => {
    const root = join(parent, 'repo');
    mkdirSync(root);
    const outside = join(parent, 'victim.md');
    writeFileSync(outside, 'original');
    const target = join(root, 'README.md');
    symlinkSync(outside, target);

    writeFileAtomic(target, 'new');

    assert.equal(readFileSync(outside, 'utf8'), 'original', 'the file outside is untouched');
    assert.equal(readFileSync(target, 'utf8'), 'new');
    assert.equal(lstatSync(target).isSymbolicLink(), false, 'the link was replaced by a file');
  });
});

test('writeFileAtomic creates a file that was not there', () => {
  withTempDir((root) => {
    const target = join(root, 'new.md');
    writeFileAtomic(target, 'content');
    assert.equal(existsSync(target), true);
    assert.equal(readFileSync(target, 'utf8'), 'content');
  });
});

// Everything below is about what a table cell can carry. The cell holds source
// text copied out of a throw expression, and the site renders markdown with
// HTML enabled, so an unescaped cell is an injection point.
test('escapeMarkdownText neutralises raw HTML', () => {
  const escaped = escapeMarkdownText('<script>alert(1)</script>');
  assert.equal(escaped.includes('<'), false);
  assert.equal(escaped.includes('>'), false);
  assert.match(escaped, /^&lt;script&gt;/);
});

test('escapeMarkdownText escapes the ampersand before anything else', () => {
  assert.equal(escapeMarkdownText('&lt;'), '&amp;lt;');
});

// The Vue compiler runs over the rendered page, so a pair of braces in a cell
// is an expression, not text.
test('escapeMarkdownText neutralises Vue interpolation', () => {
  const escaped = escapeMarkdownText('{{ constructor.constructor("x")() }}');
  assert.equal(escaped.includes('{'), false);
  assert.equal(escaped.includes('}'), false);
});

// A pipe ends the cell. The entity carries no pipe character, so the table
// parser cannot see it, and the browser still renders a pipe.
test('escapeMarkdownText keeps a pipe out of the table parser', () => {
  const escaped = escapeMarkdownText('a | b');
  assert.equal(escaped.includes('|'), false);
  assert.match(escaped, /&#124;/);
});

test('escapeMarkdownText neutralises inline markdown syntax', () => {
  for (const character of ['`', '[', ']', '*', '_', '\\']) {
    const escaped = escapeMarkdownText(`x${character}y`);
    assert.equal(escaped.includes(character), false, `${character} survived escaping`);
  }
});

test('escapeMarkdownText leaves ordinary text alone', () => {
  assert.equal(
    escapeMarkdownText('session is not anomaly-detected'),
    'session is not anomaly-detected',
  );
});

test('tableCell folds every run of whitespace into one space', () => {
  assert.equal(tableCell('  a\n\tb  \n c '), 'a b c');
});

test('tableCell escapes what it folds', () => {
  assert.equal(tableCell('`a\nb`'), '&#96;a b&#96;');
});

// VitePress adds v-pre to fenced code blocks only (it decides from the language
// tag). Inline code is left as an ordinary element, so Vue compiles its content
// and runs any interpolation it finds. The attribute has to be written by hand.
test('inlineCode carries v-pre so Vue does not compile the content', () => {
  assert.equal(inlineCode('createClient'), '<code v-pre>createClient</code>');
});

test('inlineCode escapes the content as well as stopping interpolation', () => {
  const rendered = inlineCode('{{ constructor.constructor("x")() }}');
  assert.match(rendered, /^<code v-pre>/);
  assert.equal(rendered.includes('{{'), false, 'the braces never reach the compiler');
  assert.equal(rendered.includes('<script'), false);
});

test('inlineCode neutralises raw HTML in an export name', () => {
  const rendered = inlineCode('<img src=x onerror=alert(1)>');
  assert.equal(rendered.slice('<code v-pre>'.length, -'</code>'.length).includes('<'), false);
});

test('tableCodeCell folds whitespace and keeps the pipe out of the table parser', () => {
  const rendered = tableCodeCell('a\n  |  b');
  assert.equal(rendered, '<code v-pre>a &#124; b</code>');
});

test('fenceFor opens with three backticks when the code has none', () => {
  assert.equal(fenceFor('export declare const a: number;'), '```');
});

// A declaration that contains a fence used to close the block early, and
// everything after it was rendered as prose.
test('fenceFor outruns the longest backtick run in the code', () => {
  assert.equal(fenceFor('const a = "```";'), '````');
  assert.equal(fenceFor('const a = "````````";'), '`````````');
  assert.equal(fenceFor('const a = "`" + "``";'), '```', 'runs are counted, not backticks');
});

// The generated reference embeds declarations copied out of .d.ts. A declaration
// that contains a closing fence used to end the block early, so every later
// declaration on the page was rendered as prose.
test('codeBlock encloses a declaration that contains a closing fence', () => {
  const code = 'declare const sql: "```";';
  const rendered = codeBlock(code, 'ts');
  assert.equal(rendered, '````ts\ndeclare const sql: "```";\n````');
  // The block opens and closes with the same run, and that run appears nowhere
  // in the code, so the fence cannot be closed from inside.
  const [opening] = rendered.split('\n');
  const fence = opening.slice(0, opening.length - 'ts'.length);
  assert.equal(rendered.endsWith(`\n${fence}`), true);
  assert.equal(code.includes(fence), false);
});

test('codeBlock uses three backticks for ordinary code and keeps the language tag', () => {
  assert.equal(codeBlock('declare const a: number;', 'ts'), '```ts\ndeclare const a: number;\n```');
  assert.equal(codeBlock('plain'), '```\nplain\n```');
});

// The description sits on its own line just above the generated code block. A
// leading fence there opens a block that swallows the declaration below it.
test('neutralizeLeadingFence stops a leading fence from opening a block', () => {
  assert.equal(neutralizeLeadingFence('```ts is the language'), '&#96;&#96;&#96;ts is the language');
  assert.equal(neutralizeLeadingFence('````lean'), '&#96;&#96;&#96;&#96;lean');
});

test('neutralizeLeadingFence leaves inline code alone', () => {
  assert.equal(neutralizeLeadingFence('use `foo` here'), 'use `foo` here');
  assert.equal(neutralizeLeadingFence('`foo` at the start'), '`foo` at the start');
  assert.equal(neutralizeLeadingFence('a ``` in the middle'), 'a ``` in the middle');
});

test('linkUrl encodes the characters that would end the link early', () => {
  assert.equal(linkUrl('https://example.com/a(b)c'), 'https://example.com/a%28b%29c');
  assert.equal(linkUrl('https://example.com/a b'), 'https://example.com/a%20b');
  assert.equal(linkUrl('https://example.com/a.ts#L1'), 'https://example.com/a.ts#L1');
});
