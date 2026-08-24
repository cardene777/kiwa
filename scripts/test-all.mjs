#!/usr/bin/env node
/**
 * Run every workspace package's `test`, and report every failure.
 *
 * `pnpm -r test` stops at the first package that fails. One red package hides
 * the rest, and the count is invisible: this repository sat with six red
 * packages while a single error was all anyone ever saw, and two of them had
 * been red since a rewrite nobody noticed.
 *
 * Three things this reports that `pnpm -r test` cannot:
 *
 *   red      the package failed, and its own output does not blame a tool
 *   blocked  the package failed, and its output names a tool that is absent.
 *            It is printed with the line from the package's output that says
 *            so, and it counts as a failure. A package that did not run has
 *            not passed, and a failure that happens to mention a missing tool
 *            may also have failed for a reason of its own; the first signature
 *            found wins, so classification is a hint and never an excuse.
 *            `--allow-missing-tools` exits 0 anyway.
 *   dirty    the package's tests changed a tracked file. A test that writes
 *            into the repository is a test with a side effect, and a
 *            `git add -A` afterwards sweeps it into an unrelated commit. This
 *            is a failure of the package that did it, whatever its exit code.
 *
 * The dirty check reads `git status --porcelain -z -uall` at the repository
 * root. A test that writes outside the repository, or into a path `.gitignore`
 * covers, is invisible to it — and anything *you* change while the sweep runs is
 * blamed on whichever package happened to be running. Do not edit the tree
 * during a sweep; a run of this script reported `packages/lean/tests/async.test.ts`
 * as dirtied by `examples/nextjs-safe-multisig`, which had never heard of it.
 *
 * A package killed for hanging can leave a server running. Its results, and the
 * results of every package after it, are worth less than the ones from a clean
 * run.
 *
 * A line is printed as each package finishes, with how long it took. A sweep of
 * this repository takes the better part of an hour; a script that prints
 * nothing until the end cannot be told apart from one that has hung.
 *
 * Usage:
 *   node scripts/test-all.mjs                       summary, first error per package
 *   node scripts/test-all.mjs --verbose            every error line
 *   node scripts/test-all.mjs --allow-missing-tools  exit 0 even if a tool is absent
 *   node scripts/test-all.mjs --only nextjs        only packages whose path matches
 *   node scripts/test-all.mjs --timeout 600        seconds per package (default 900)
 *   node scripts/test-all.mjs --jobs 4            run four packages at a time
 *
 * Exits 1 when any package is red, blocked, or left the working tree dirty, and
 * 4 when the invocation itself was wrong (a flag with no value, `--jobs 0`, a
 * `--only` that matches nothing). Retrying on 1 can make sense; retrying on 4
 * cannot.
 *
 * Sequential by default. Many `test` scripts build the workspace packages they
 * depend on, so two of them at once rewrite the same `dist` while the other
 * reads it. `typecheck-all.mjs` kept a `--jobs` flag and it invented red
 * packages that passed when run alone.
 *
 * `--jobs N` runs anyway, by removing that cause rather than hoping: the sweep
 * builds the workspace once up front and sets `KIWA_DEPS_PREBUILT=1`, which
 * makes `scripts/build-deps.mjs` a no-op in every child, so no two targets
 * write the same `dist`. What is left is the two groups measured in
 * `docs/quality/test-parallelism.md` that contend on a machine-wide resource —
 * the Docker daemon and Chromium — and each of those gets a lane of its own
 * that stays serial.
 *
 * Parallel mode gives up one thing, and says so while it runs: it cannot tell
 * you *which* package dirtied the tree. Attribution comes from reading
 * `git status` before and after each package, which means nothing when several
 * are running. The sweep still fails on a dirty tree, and names the paths;
 * finding the owner means re-running with `--jobs 1`.
 */

import { execFile, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { StringDecoder } from 'node:string_decoder';
import { existsSync, lstatSync, readFileSync, readlinkSync, realpathSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isMainModule } from './lib/is-main-module.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * A failure whose cause is a tool that is not installed, rather than the code.
 *
 * Every `evidence` string below was copied out of a failing package's own
 * output, produced by hiding the tool and running the sweep. None of them is a
 * guess about what a tool "probably prints". The first draft of this table
 * guessed `spawn anvil ENOENT`; what `packages/dapp/src/anvil.ts:119` actually
 * throws is `anvil not found in PATH`, so the guess classified a blocked
 * package as red.
 *
 * Matching is on the package's own output, never on a guess about what a
 * package needs. A static guess — "it depends on testcontainers, so it needs
 * Docker" — put twenty-six examples in a Docker bucket that pass with the
 * daemon unreachable, and put `packages/dapp` in an anvil bucket though its
 * tests never spawn one.
 */
export const TOOL_SIGNATURES = [
  {
    tool: 'Playwright Chromium',
    install: 'pnpm exec playwright install chromium',
    evidence: ["Executable doesn't exist at"],
  },
  {
    tool: 'Foundry (anvil)',
    install: 'curl -L https://foundry.paradigm.xyz | bash && foundryup',
    evidence: ['anvil not found in PATH'],
  },
];

/**
 * Why a failing package failed, as far as its own output admits.
 *
 * Returns `null` when nothing in the output blames a tool — that is a red
 * package, and calling it blocked would be the thing this script exists to
 * prevent.
 */
export function classifyFailure(output) {
  // Walk the output in order and return the first signature that matches. The
  // previous version walked the table in order, so a package that printed
  // `anvil not found in PATH` and then `Executable doesn't exist at` was
  // classified Playwright because Playwright is the first table entry. The
  // documented rule — "the first signature found wins" — is about output
  // order, not table order.
  for (const line of output.split('\n')) {
    for (const { tool, install, evidence } of TOOL_SIGNATURES) {
      for (const needle of evidence) {
        if (line.includes(needle)) return { tool, install, line: line.trim() };
      }
    }
  }
  return null;
}

/**
 * The paths in `git status --porcelain -z` output.
 *
 * The human format quotes any path with a space or a non-ASCII byte, and writes
 * a rename as `R  old -> new`. Splitting that on ` -> ` mangles a file actually
 * named `a -> b.ts`, and unquoting it correctly means reimplementing git's
 * escaping. `-z` does neither: records are NUL-terminated and nothing is quoted.
 * A rename is two records, the new path and then the old one; both count as
 * touched.
 */
export function parsePorcelain(text) {
  const records = text.split('\0').filter((record) => record.length > 0);
  const entries = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (record.length < 4) continue;
    const status = record.slice(0, 2);
    entries.push({ status, path: record.slice(3) });
    // `R` and `C` are followed by a bare record holding the path they came from.
    if (status.includes('R') || status.includes('C')) {
      index += 1;
      if (index < records.length) entries.push({ status, path: records[index] });
    }
  }
  return entries;
}

/**
 * The same, on raw NUL-separated `Buffer` bytes.
 *
 * Git allows any non-NUL byte in a filename on POSIX; decoding to UTF-8 first
 * corrupts a path with `0xFF` or a Shift-JIS byte, and the sweep then either
 * misses a rewrite or prints `�` in the dirty section. Paths come out as
 * `Buffer`s; `absolute` for `fingerprint` is a Buffer too, and `lstatSync`
 * accepts it.
 */
export function parsePorcelainBytes(buf) {
  const records = [];
  let start = 0;
  for (let i = 0; i <= buf.length; i += 1) {
    if (i === buf.length || buf[i] === 0) {
      if (i > start) records.push(buf.subarray(start, i));
      start = i + 1;
    }
  }
  const entries = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (record.length < 4) continue;
    const status = record.subarray(0, 2).toString('utf-8');
    entries.push({ status, path: record.subarray(3) });
    if (status.includes('R') || status.includes('C')) {
      index += 1;
      if (index < records.length) entries.push({ status, path: records[index] });
    }
  }
  return entries;
}

/**
 * The paths a package touched: new since `before`, or changed since `before`.
 *
 * Set membership is not enough. If one package leaves `dist/index.js` modified
 * and the next rewrites the same file, the path is in both snapshots and the
 * second package is reported clean. Both snapshots carry a fingerprint per
 * path — its status letters, size and modification time — so a rewrite of a
 * path that was already dirty is still attributed to whoever rewrote it.
 *
 * Both arguments are `Map<path, fingerprint>`.
 */
export function dirtiedPaths(before, after) {
  const touched = [];
  const paths = new Set([...before.keys(), ...after.keys()]);
  for (const path of paths) {
    // A path that vanished from the snapshot is a change too: `git rm` or a
    // clean of a dirty output directory that was there when the package began.
    if (before.get(path) !== after.get(path)) touched.push(path);
  }
  return touched;
}

/**
 * One verdict per package. The four counters must add up to the number of
 * packages, or the summary is arithmetic rather than a report: a package that
 * failed *and* dirtied the tree used to be counted twice.
 *
 * A package that dirtied the tree is still listed in the dirty section whatever
 * its verdict, because that is where you look to find out what wrote into the
 * repository.
 */
export function verdictOf({ ok, cause, dirty }) {
  if (!ok) return cause ? 'blocked' : 'red';
  return dirty ? 'dirty' : 'green';
}

/**
 * Whether the sweep failed.
 *
 * `dirty` is every package that wrote into the repository, whatever its verdict.
 * Writing into the repository is a failure on its own: `--allow-missing-tools`
 * forgives a package that could not run, not one that left the tree changed.
 * It used to, because a package that was both blocked and dirty was counted
 * only among the blocked.
 */
export function sweepFailed({ red, dirty, blocked, allowMissingTools }) {
  if (red > 0 || dirty > 0) return true;
  return !allowMissingTools && blocked > 0;
}

/**
 * Every workspace project that declares a `test` script, except the root.
 *
 * `projects` is what `pnpm ls -r --depth -1 --json` returns. Asking pnpm rather
 * than walking directories keeps `pnpm-workspace.yaml` the single source of
 * truth: a walk needs a hand-kept list of top directories and a depth limit,
 * and the day someone adds a workspace glob outside that list, the sweep skips
 * it in silence. Both agree today, on 219 packages.
 *
 * The root is excluded because its `test` is `pnpm -r test`, which is the thing
 * this script replaces. Running it here would recurse.
 */
export function discoverPackages(projects, rootDir, readManifest = defaultReadManifest, canonical = canonicalPath) {
  const root = canonical(rootDir);
  const found = [];
  for (const project of projects) {
    // String equality let the root back in through a trailing slash or a
    // symlinked checkout, and the sweep then ran the root's `test`, which is
    // `pnpm -r test`, from inside one of its own steps.
    if (canonical(project.path) === root) continue;
    const json = readManifest(join(project.path, 'package.json'));
    if (json?.scripts?.test) {
      found.push({ dir: project.path, name: json.name ?? relative(rootDir, project.path) });
    }
  }
  return found.sort((a, b) => a.dir.localeCompare(b.dir));
}

/** A path with its symlinks resolved and its trailing slash gone. */
export function canonicalPath(path, real = realpathSync) {
  try {
    return real(path);
  } catch {
    // Not on disk; normalise what we were given.
    return resolve(path);
  }
}

function defaultReadManifest(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * The JSON array in `text`, ignoring anything printed before it.
 *
 * `pnpm` sometimes prints an update notice or a warning to stdout before the
 * document it was asked for, and `JSON.parse` has no tolerance for it. A sweep
 * that dies before running a single package because of a version banner is a
 * bad way to learn this.
 */
export function parseProjectList(text) {
  // Every `[` is a candidate, because a banner can contain one — `warning [pnpm]`
  // is a bracket that is not the start of a document. Take the first that parses.
  for (let start = text.indexOf('['); start !== -1; start = text.indexOf('[', start + 1)) {
    try {
      const parsed = JSON.parse(text.slice(start));
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not the document. Keep looking.
    }
  }
  throw new Error('pnpm ls printed no JSON array');
}

/** Ask pnpm which projects the workspace has. */
function listProjects() {
  return new Promise((resolve, reject) => {
    const options = { cwd: ROOT, maxBuffer: 32 * 1024 * 1024 };
    execFile('pnpm', ['ls', '-r', '--depth', '-1', '--json'], options, (error, stdout) => {
      if (error) return reject(new Error(`pnpm ls failed: ${error.message}`));
      try {
        resolve(parseProjectList(stdout));
      } catch (e) {
        reject(new Error(`pnpm ls did not return JSON: ${e.message}`));
      }
    });
  });
}

/**
 * What a dirty path looked like: its git status, and the file on disk.
 *
 * Status matters because `git add` changes it without touching a byte. Size and
 * modification time catch a rewrite. On this machine `mtimeMs` carries
 * nanoseconds and separated two hundred back-to-back rewrites of the same
 * length, two hundred times out of two hundred. A filesystem whose timestamps
 * resolve to the second would not, and a package that rewrote a file to the
 * same length within one second would be reported clean. Hashing the bytes
 * would close that; nothing here has met a filesystem that needs it.
 */
export function fingerprint(
  status,
  absolute,
  stat = lstatSync,
  readLink = readlinkSync,
  read = readFileSync,
) {
  let info;
  try {
    info = stat(absolute);
  } catch {
    // Deleted, or a path git names that no longer exists.
    return `${status}:gone`;
  }
  if (info.isSymbolicLink?.()) {
    // `statSync` follows the link and fingerprints whatever it points at, so
    // retargeting it at a file of the same size and time looked like nothing
    // happened — and two broken links both looked `gone`. What changed is the
    // link, so read the link.
    try {
      return `${status}:link:${readLink(absolute)}`;
    } catch {
      return `${status}:link:unreadable`;
    }
  }
  // For directories, `size` and `mtimeMs` are all we have; hashing the bytes
  // would mean hashing the dir listing, which is `-uall`'s job.
  if (!info.isFile?.()) return `${status}:${info.size}:${info.mtimeMs}`;

  // A rewrite that preserves size and mtime — a tool that touches the atime,
  // a coarse timestamp filesystem, or a package that deliberately fakes it —
  // must not look untouched. Hash the bytes. Dirty paths are usually a handful
  // per sweep; the cost is not one worth arguing about.
  let hash = 'unreadable';
  try {
    hash = createHash('sha1').update(read(absolute)).digest('hex').slice(0, 12);
  } catch {
    // A path git named but the reader cannot open (a race, a permission
    // problem). Fall back to size + mtime; the caller sees enough of a change.
  }
  return `${status}:${info.size}:${info.mtimeMs}:${hash}`;
}

/**
 * `git status --porcelain -z -uall`, as `Map<path, fingerprint>`.
 *
 * Without `-uall`, git collapses an untracked directory to a single `?? dir/`
 * record. Rewriting a file inside it changes neither the directory's size nor
 * its modification time, so a package that rewrote `coverage/report.json` after
 * another package created `coverage/` was reported clean. `-uall` names every
 * file, and every file gets its own fingerprint.
 */
/**
 * `git status --porcelain -z -uall`, as `Map<path, fingerprint>`.
 *
 * `exec` is a seam. In the sweep it runs `git`. In a test it returns whatever
 * output — or error — the case wants. The previous implementation ignored
 * `execFile`'s error and parsed `out ?? ''`, so an index lock, an unsafe-repo
 * refusal or a missing `git` came back as an empty map and the sweep reported
 * `dirty: 0` without ever having looked at the tree.
 */
export function readPorcelain(root, exec) {
  return new Promise((done, fail) => {
    exec((error, out) => {
      if (error) return fail(new Error(`git status failed: ${error.message.trim()}`));
      const snapshot = new Map();
      // Paths are raw bytes: a Shift-JIS or Latin-1 filename would otherwise
      // decode to `�` and be lost. The Map keys them by their UTF-8 form for
      // display and comparison; `fingerprint` gets the original bytes.
      const rootBuf = Buffer.from(root);
      const sep = Buffer.from('/');
      for (const { status, path } of parsePorcelainBytes(out ?? Buffer.alloc(0))) {
        const key = path.toString('utf-8');
        const absolute = Buffer.concat([rootBuf, sep, path]);
        snapshot.set(key, fingerprint(status, absolute));
      }
      done(snapshot);
    });
  });
}

function porcelain() {
  const options = { cwd: ROOT, maxBuffer: 32 * 1024 * 1024, encoding: 'buffer' };
  const args = ['status', '--porcelain', '-z', '--untracked-files=all'];
  return readPorcelain(ROOT, (cb) => execFile('git', args, options, cb));
}

/** The last `n` bytes of `text` as UTF-8, without splitting a codepoint. */
export function keepLastBytes(text, n) {
  const buf = Buffer.from(text, 'utf-8');
  if (buf.length <= n) return text;
  // A leading byte matches `0xxxxxxx` or `11xxxxxx`; a continuation `10xxxxxx`.
  // Walk forward from the cut until a leading byte, so decoding is clean.
  let cut = buf.length - n;
  while (cut < buf.length && (buf[cut] & 0xc0) === 0x80) cut += 1;
  return buf.subarray(cut).toString('utf-8');
}

/**
 * SIGKILL the child's process group.
 *
 * Only ever called while the child is known to be running. Once a child has
 * exited and been reaped, its pid is free, and the operating system will hand
 * it to somebody else. `process.kill(-pid)` then signals a process group this
 * script never started — a dev server, an editor, another sweep. The window is
 * small and hard to hit on purpose; forty thousand spawns did not reuse a pid
 * on this machine. It is not a window worth standing in.
 */
export function killGroup(child) {
  if (typeof child.pid !== 'number') return false;
  try {
    // Negative pid: the whole process group, which `detached` gave us.
    process.kill(-child.pid, 'SIGKILL');
    return true;
  } catch {
    // The group went between the check and here. There used to be a fallback
    // to `child.kill('SIGKILL')`, a *positive* pid — and a positive pid that
    // has been released belongs to whoever the operating system gave it to.
    // Node happens to refuse it once the child is reaped (`child.kill()`
    // returns false and signals nothing), but the window before reaping is not
    // one worth arguing about. Losing the group means sending nothing.
    return false;
  }
}

/**
 * Why this script will not run here, or `null`.
 *
 * On Windows `detached` does not create a process group, and `process.kill`
 * throws when handed a negative pid. `groupAlive` would answer no for a child
 * that is running, and `killGroup` would signal nothing: a hung package would
 * be left alive to poison the packages after it, and reported green if it
 * happened to finish inside the grace period. Refusing is honest. Pretending
 * the timeout works is not.
 */
export function unsupportedPlatform(platform) {
  if (platform !== 'win32') return null;
  return 'test-all.mjs enforces its per-package timeout with POSIX process groups, which Windows does not have. Run it under WSL.';
}

/**
 * Whether the process group led by `pid` is still ours to signal. Signal 0 asks
 * without sending.
 *
 * The group's id is the leader's pid, so this is only meaningful for a process
 * that leads one. Every child here is spawned `detached`, which makes it a
 * leader. Asking about a process that leads no group — this one, for instance —
 * correctly answers no.
 *
 * Three answers, not two. `ESRCH` is a group that has gone. `EPERM` is a group
 * whose leader has exited but not yet been reaped: the pid is taken, the
 * process is a zombie, and there is nothing there to kill. Only success means
 * something is running. Reading `EPERM` as "alive" would mark a package that
 * finished in a millisecond as a hang.
 */
export function groupAlive(pid) {
  if (typeof pid !== 'number') return false;
  try {
    process.kill(-pid, 0);
    return true;
  } catch {
    // `ESRCH`, `EPERM`, or anything else: not a group we may signal.
    return false;
  }
}

/**
 * Run a command, and decide for ourselves whether it ran out of time.
 *
 * `execFile`'s own `timeout` cannot be trusted here. It sends `SIGTERM` and
 * then reports whatever the child's exit code turned out to be. `pnpm` catches
 * `SIGTERM` and exits 0, so `error` arrives as `null` and a package killed for
 * hanging is indistinguishable from one that passed. A sweep of this repository
 * reported `examples/nextjs-safe-multisig` as taking 420.5 seconds and passing,
 * with the per-package limit set to 420 seconds.
 *
 * So: our timer, our verdict.
 *
 * We settle on `exit`, not on `close`. `close` waits for the stdio pipes, and a
 * grandchild that outlives its parent — a dev server, a watcher — inherits them
 * and holds them open. Waiting for `close` means a package whose tests passed
 * in a second sits until the timer kills it and is then reported as a hang; and
 * a grandchild that has left the process group (`setsid`) survives the kill and
 * holds the pipes forever, so the promise never settles and the sweep, which
 * has no outer timeout, stops.
 *
 * After `exit` we give the pipes `flushMs` to deliver what the child already
 * wrote, then stop waiting. `killGraceMs` is the backstop for a child that
 * never reports having exited at all.
 */
export function runCommand({
  command,
  args,
  cwd,
  env,
  timeoutMs,
  maxBytes = 64 * 1024 * 1024,
  tailBytes = 256 * 1024,
  flushMs = 500,
  killGraceMs = 5000,
  classify = classifyFailure,
}) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, { cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      resolve({
        ok: false,
        timedOut: false,
        overflowed: false,
        output: String(error.message),
        cause: null,
      });
      return;
    }

    let output = '';
    let bytes = 0;
    let overflowed = false;
    let timedOut = false;
    let exitCode = null;
    let exited = false;
    let settled = false;
    let timer;
    let flushTimer;
    let graceTimer;

    // No signal is sent from here. By the time a child has exited, its pid
    // belongs to whoever the operating system gives it to next. Anything the
    // child left running outlives the sweep, and the sweep says so rather than
    // firing a signal into a pid it no longer owns.
    const settle = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(flushTimer);
      clearTimeout(graceTimer);
      const text = overflowed ? `${output}\n[... output truncated ...]\n${tail}` : output;
      resolve({
        ok: !timedOut && !overflowed && exitCode === 0,
        timedOut,
        overflowed,
        output: text,
        cause,
      });
    };

    // Look for the tool signature as the output streams past, and remember the
    // first one. Reading it out of what survives truncation is not enough: it
    // can land in the head, at the seam, or in the middle that gets dropped.
    // Every one of those was a blocked package reported red.
    //
    // `window` carries the end of the previous chunk so a line split across a
    // chunk boundary is still whole somewhere.
    let tail = '';
    let window = '';
    let cause = null;
    const OVERLAP = 4096;

    // A child can split one UTF-8 codepoint across two writes: `0xC3` in one
    // chunk, `0xA9` in the next. `String(chunk)` on each half writes `�` twice
    // — two bytes reported as six — so `maxBytes: 4` could false-trip on 2
    // bytes of `é`. `StringDecoder` holds partial trail bytes back until the
    // next chunk completes them.
    const decoder = new StringDecoder('utf-8');

    const collect = (chunk) => {
      const text = decoder.write(chunk);
      if (cause === null) {
        const seen = window + text;
        cause = classify(seen);
        window = seen.slice(-OVERLAP);
      }

      // Bytes, not characters, and using the raw chunk length so the accounting
      // never depends on how the codepoints landed in `text`.
      bytes += chunk.length;
      if (bytes > maxBytes) {
        if (!overflowed) tail = keepLastBytes(output, tailBytes);
        overflowed = true;
        tail = keepLastBytes(tail + text, tailBytes);
        return;
      }
      output += text;
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);

    child.on('error', (error) => {
      output += error.message;
      exitCode = -1;
      exited = true;
      settle();
    });

    child.on('exit', (code) => {
      // Signal termination arrives here as `code = null, signal = 'SIGTERM'`.
      // Reading only `code` used to mean a shell that self-terminated was seen
      // as "still running", so the timer path called it timed out and the
      // sweep reported `(killed after 900s)` for a package that died in one.
      exitCode = code;
      exited = true;
      flushTimer = setTimeout(settle, flushMs);
    });

    // Everything the child held is closed. Nothing left to wait for.
    child.on('close', (code) => {
      if (exitCode === null) exitCode = code;
      exited = true;
      settle();
    });

    timer = setTimeout(() => {
      if (settled || exited) return;

      // `exitCode === null` says our handler has not run. It says nothing about
      // the child, because a busy event loop delivers this timer before it
      // delivers the child's exit.
      //
      // So ask the operating system. A zombie group answers `EPERM`, a gone one
      // `ESRCH`, and only success means something is running there. Reaping is
      // event-loop work, so a loop that was too busy to run our handler was
      // also too busy to reap, and a child that died during the block is a
      // zombie when this timer fires — measured, two hundred times out of two
      // hundred. A zombie's pid is taken. Nobody else can have been given it.
      //
      // That is what keeps the window shut between "it exited" and "we
      // signalled its pid". A guard on `child.exitCode` was here too, on the
      // theory that Node's own view of reaping is earlier than ours. It is not:
      // removing it fails no test, and removing `groupAlive` fails one. Two
      // hundred samples found no moment where Node had reaped and our `exit`
      // handler had not run. A defence nothing can reach is a defence nothing
      // has checked.
      // Reaching this timer callback without an `exit` handler having run
      // means the child had not been observed to exit by the deadline. That is
      // late, whether or not it is still alive right this instant. Kill only
      // if the group is still there.
      //
      // This is a deliberate choice between two indistinguishable cases. Node
      // does not tell us when the child actually exited; all we have is which
      // handler the event loop delivered first, and a blocked loop delivers
      // neither on time. So a fast child + a blocked parent looks the same as
      // a slow child + a blocked parent, and this rule calls both late. False
      // red on a package that finished at the edge is a signal worth checking;
      // false green on one that overshot is the failure the sweep exists to
      // catch. The trade-off was reviewed twice.
      timedOut = true;
      if (groupAlive(child.pid)) killGroup(child);
      graceTimer = setTimeout(settle, killGraceMs);
    }, timeoutMs);
  });
}

/** Run one package's `test`. Resolves with the result rather than throwing. */
async function runTest({ dir, name }, timeoutMs, env) {
  const run = await runCommand({ command: 'pnpm', args: ['test'], cwd: dir, env, timeoutMs });
  return { name, dir: relative(ROOT, dir), ...run };
}

/**
 * The lines of `output` that look like a test failure.
 *
 * Falls back to the tail of the output when nothing matches. A package reported
 * red with no reason underneath it is not evidence of anything: the sweep did
 * that to `examples/nextjs-token-gating`, whose failure is a stack trace from
 * `tsx` that matches none of these shapes.
 */
export function failureLines(output) {
  const matched = output
    .split('\n')
    .filter((line) => /^\s*(×|✕|✘|FAIL|Error:|AssertionError)/.test(line) || / → /.test(line))
    .map((line) => line.trim());
  if (matched.length > 0) return matched;
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(-3);
}

/**
 * The value after `flag`, or `fallback` when the flag is absent.
 *
 * A flag with nothing after it, or with another flag after it, is an error and
 * not a default. `--only --verbose` used to filter for the string `--verbose`,
 * match no package, and exit 0 having run nothing.
 *
 * `-5` is a value, not a flag. Refusing it here would tell the caller of
 * `--timeout -5` that the flag "needs a value", when what it needs is a
 * positive number, and only the caller's own validation can say so.
 */
/**
 * The invocation was wrong, as opposed to the sweep having found failures.
 *
 * Both used to exit 1, so a typo in a flag and six red packages were the same
 * event to anything reading the exit code. A caller that retries on failure
 * would retry the typo forever.
 */
export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UsageError';
  }
}

/**
 * Parse `--timeout` and refuse values that `setTimeout` would silently clamp.
 *
 * `setTimeout` takes a 32-bit signed integer of milliseconds. Larger values
 * emit a `TimeoutOverflowWarning` and behave like `1`, so a caller who asked
 * for a very long deadline would find every package timing out in a
 * millisecond. Say so instead.
 */
export function validateTimeout(raw) {
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) throw new UsageError('--timeout takes seconds');
  if (seconds * 1000 > 2_147_483_647) throw new UsageError('--timeout exceeds 2147483 seconds');
  return seconds;
}

/**
 * Parse `--jobs` and refuse anything that is not a count of workers.
 *
 * A zero or a fraction would produce a pool that never starts a task, and the
 * sweep would sit there reporting nothing. Say so instead of hanging.
 */
export function validateJobs(raw) {
  const jobs = Number(raw);
  if (!Number.isInteger(jobs) || jobs < 1) throw new UsageError('--jobs takes a positive integer');
  return jobs;
}

/**
 * Targets that must not run beside another target in the same lane.
 *
 * The docker lane is read from the dependency list: a target that pulls
 * `testcontainers` starts a container, and the daemon is one per machine.
 * Reading it keeps the lane correct when a package starts using containers.
 *
 * The chromium lane cannot be read the same way. 46 targets depend on
 * `@playwright/test`, and all but three keep their Playwright specs out of the
 * vitest run — the dependency says nothing about whether `pnpm test` launches a
 * browser. These three are the ones measured to launch one
 * (`docs/quality/test-parallelism.md` group 5), so they are named here.
 *
 * Naming them means a rename can empty the lane silently, so `laneMembership`
 * reports the names it could not find and the caller refuses to run.
 */
export const CHROMIUM_LANE = ['packages/e2e', 'packages/ui', 'examples/full-stack-poc'];

function dependsOnContainers(dir) {
  try {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    return deps.some((name) => name === 'testcontainers' || name.startsWith('@testcontainers/'));
  } catch {
    return false;
  }
}

/**
 * Split the targets into one free set and the serial lanes.
 *
 * `missing` names the chromium entries that matched nothing, and it is measured
 * against `roster` — every package in the workspace — rather than against the
 * targets being run. An empty lane is not the same as a lane whose members were
 * renamed, and only the second one means the sweep is about to run browsers side
 * by side; measuring it against a `--only` selection would confuse the two and
 * make `--only lean --jobs 4` refuse to start.
 */
export function laneMembership(packages, root, { roster = packages, dependsOn = dependsOnContainers } = {}) {
  const chromium = [];
  const docker = [];
  const free = [];
  for (const pkg of packages) {
    const rel = relative(root, pkg.dir);
    if (CHROMIUM_LANE.includes(rel)) chromium.push(pkg);
    else if (dependsOn(pkg.dir)) docker.push(pkg);
    else free.push(pkg);
  }
  const known = new Set(roster.map((pkg) => relative(root, pkg.dir)));
  const missing = CHROMIUM_LANE.filter((name) => !known.has(name));
  return { free, docker, chromium, missing };
}

/**
 * Run `task` over `items`, at most `limit` at a time, in the order given.
 *
 * Results come back in the order of `items`, not the order they finished, so
 * the summary reads the same whatever the machine did.
 */
export async function pool(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await task(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export function argValue(argv, flag, fallback) {
  const at = argv.indexOf(flag);
  if (at === -1) return fallback;
  // `--only nextjs --only safe` used to run the `nextjs` subset and say nothing.
  if (argv.indexOf(flag, at + 1) !== -1) throw new UsageError(`${flag} given more than once`);
  const value = argv[at + 1];
  const looksLikeFlag = value !== undefined && value.startsWith('-') && Number.isNaN(Number(value));
  // An empty string is a value the caller supplied, and it is not one that
  // means anything here. `--only ""` used to filter for the empty string, match
  // every path, and run the full sweep.
  if (value === undefined || value === '' || looksLikeFlag) throw new UsageError(`${flag} needs a value`);
  return value;
}

async function main() {
  const refuse = unsupportedPlatform(process.platform);
  if (refuse) throw new UsageError(refuse);

  const verbose = process.argv.includes('--verbose');
  const allowMissingTools = process.argv.includes('--allow-missing-tools');
  const only = argValue(process.argv, '--only', null);
  const timeoutSec = validateTimeout(argValue(process.argv, '--timeout', '900'));
  const jobs = validateJobs(argValue(process.argv, '--jobs', '1'));

  const all = discoverPackages(await listProjects(), ROOT);
  const packages = only ? all.filter((p) => relative(ROOT, p.dir).includes(only)) : all;
  // Running nothing is not the same as everything passing. A typo in `--only`
  // used to print `testing 0 packages` and exit 0.
  if (packages.length === 0) {
    throw new UsageError(only ? `--only ${only} matched none of ${all.length} packages` : 'no packages have a test script');
  }

  // Dirt that is already here cannot be blamed on the package that runs first,
  // so the sweep ignores it — and therefore cannot see it. Say so, rather than
  // report `dirty: 0` about a tree that is not clean.
  const startingDirt = await porcelain();
  if (startingDirt.size > 0) {
    const paths = [...startingDirt.keys()];
    process.stdout.write(`the working tree is not clean. ${paths.length} paths already changed:\n`);
    for (const path of paths.slice(0, 10)) process.stdout.write(`  ${path}\n`);
    if (paths.length > 10) process.stdout.write(`  ... and ${paths.length - 10} more\n`);
    process.stdout.write('a package that rewrites one of these is still reported, by its fingerprint.\n\n');
  }

  const lanes = jobs === 1 ? null : laneMembership(packages, ROOT, { roster: all });
  if (lanes && lanes.missing.length > 0) {
    // An empty lane and a renamed lane look the same from the outside, and only
    // the second one means browsers are about to run side by side.
    throw new Error(`chromium lane names ${lanes.missing.join(', ')}, which matched no package`);
  }

  if (jobs === 1) {
    process.stdout.write(`testing ${packages.length} packages, one at a time\n\n`);
  } else {
    process.stdout.write(
      `testing ${packages.length} packages, ${jobs} at a time ` +
        `(${lanes.docker.length} in the docker lane, ${lanes.chromium.length} in the chromium lane, both serial)\n`,
    );
    // Lines arrive as packages finish, so the order is not the order above.
    process.stdout.write('lines are in finishing order, and the tree is checked once at the end\n\n');
  }

  const red = [];
  const blocked = [];
  const dirty = [];
  let green = 0;
  let dirtyOnly = 0;
  const width = String(packages.length).length;
  let finished = 0;

  const render = (result, touched, took) => {
    finished += 1;
    const counter = `[${String(finished).padStart(width)}/${packages.length}]`;

    // Listed wherever it lands, so the dirty section names every package that
    // wrote into the repository, red or not.
    if (touched.length > 0) dirty.push({ ...result, touched });

    // `result.cause` was found while the output streamed, before anything was
    // truncated. `result.output` is only a fallback for the `spawn` error path,
    // which produces no chunks at all.
    const cause = result.timedOut ? null : (result.cause ?? classifyFailure(result.output));
    const verdict = verdictOf({ ok: result.ok, cause, dirty: touched.length > 0 });

    if (verdict === 'green') {
      green += 1;
      process.stdout.write(`${counter} ok    ${result.dir}  ${took}\n`);
      return;
    }
    if (verdict === 'dirty') {
      dirtyOnly += 1;
      process.stdout.write(`${counter} DIRTY ${result.dir}  ${took}\n`);
      return;
    }
    if (verdict === 'blocked') {
      blocked.push({ ...result, cause });
      process.stdout.write(`${counter} SKIP  ${result.dir}  (needs ${cause.tool})  ${took}\n`);
      return;
    }

    red.push(result);
    const why = result.timedOut
      ? `  (killed after ${timeoutSec}s)`
      : result.overflowed
        ? '  (output too large)'
        : '';
    const alsoDirty = touched.length > 0 ? '  (and it dirtied the tree)' : '';
    process.stdout.write(`${counter} RED   ${result.dir}${why}${alsoDirty}  ${took}\n`);
    if (result.timedOut) {
      // A killed package can leave a server behind. `examples/nextjs-safe-multisig`
      // hangs, and the `next-server` its Playwright config starts survives the
      // SIGKILL to the process group and keeps port 3046. The next package to
      // want that port — `examples/nextjs-zk-verifier` uses the same one — then
      // fails for a reason that has nothing to do with it.
      process.stdout.write('        anything it leaked outlives it. Later packages may fail because of this one.\n');
    }
    for (const line of verbose ? failureLines(result.output) : failureLines(result.output).slice(0, 1)) {
      process.stdout.write(`        ${line.slice(0, 150)}\n`);
    }
  };

  let sweepDirt = [];
  if (jobs === 1) {
    for (const pkg of packages) {
      const started = Date.now();
      const before = await porcelain();
      const result = await runTest(pkg, timeoutSec * 1000);
      const after = await porcelain();
      render(result, dirtiedPaths(before, after), `${((Date.now() - started) / 1000).toFixed(1)}s`);
    }
  } else {
    // **Build the shared dependencies once, up front.** That is the whole reason
    // this can run in parallel at all: `scripts/build-deps.mjs` does nothing when
    // `KIWA_DEPS_PREBUILT` is set, so no two targets rewrite the same `dist`.
    process.stdout.write('building the workspace once, so no target rebuilds a shared dist\n');
    const build = await runCommand({
      command: 'pnpm',
      args: ['--filter', './packages/**', 'build'],
      cwd: ROOT,
      timeoutMs: timeoutSec * 1000,
    });
    if (!build.ok) throw new Error('the up-front build failed; parallel mode needs it to succeed');
    const env = { ...process.env, KIWA_DEPS_PREBUILT: '1' };

    // The tree is measured once around the whole phase. Which target wrote a
    // path cannot be told when several run at once, so the sweep reports the
    // paths without a name and says to re-run with `--jobs 1` to find the owner.
    const before = await porcelain();
    const runOne = async (pkg) => {
      const started = Date.now();
      const result = await runTest(pkg, timeoutSec * 1000, env);
      render(result, [], `${((Date.now() - started) / 1000).toFixed(1)}s`);
    };
    const serially = async (list) => {
      for (const pkg of list) await runOne(pkg);
    };
    await Promise.all([
      pool(lanes.free, jobs, runOne),
      serially(lanes.docker),
      serially(lanes.chromium),
    ]);
    sweepDirt = dirtiedPaths(before, await porcelain());
  }

  if (blocked.length > 0) {
    process.stdout.write('\nnot run, because a tool is missing. This is not "passed".\n');
    if (allowMissingTools) process.stdout.write('(--allow-missing-tools: not counted against the exit code)\n');
    const byTool = new Map();
    for (const b of blocked) {
      if (!byTool.has(b.cause.tool)) byTool.set(b.cause.tool, []);
      byTool.get(b.cause.tool).push(b);
    }
    for (const [tool, list] of byTool) {
      process.stdout.write(`\n  ${tool}  (${list.length} packages)   install: ${list[0].cause.install}\n`);
      for (const b of list) process.stdout.write(`    ${b.dir}\n`);
      process.stdout.write(`    evidence: ${list[0].cause.line.slice(0, 120)}\n`);
    }
  }

  if (dirty.length > 0) {
    process.stdout.write('\nthese packages changed the working tree. A test that writes into the\n');
    process.stdout.write('repository is a test with a side effect.\n\n');
    for (const d of dirty) {
      process.stdout.write(`  ${d.dir}\n`);
      for (const p of d.touched.slice(0, 5)) process.stdout.write(`    ${p}\n`);
      if (d.touched.length > 5) process.stdout.write(`    ... and ${d.touched.length - 5} more\n`);
    }
  }

  // One verdict per package, so the four add up. `dirty` here is the count of
  // packages whose only complaint is that they wrote into the repository; a
  // package that also failed is counted red, and named in the section above.
  const counted = green + red.length + dirtyOnly + blocked.length;
  if (counted !== packages.length) {
    throw new Error(`verdicts do not add up: ${counted} of ${packages.length} packages`);
  }

  if (sweepDirt.length > 0) {
    process.stdout.write('\nthe working tree changed during the sweep, and with several packages\n');
    process.stdout.write('running at once there is no way to say which one wrote these:\n\n');
    for (const path of sweepDirt.slice(0, 20)) process.stdout.write(`  ${path}\n`);
    if (sweepDirt.length > 20) process.stdout.write(`  ... and ${sweepDirt.length - 20} more\n`);
    process.stdout.write('\nre-run with --jobs 1 to find the package responsible.\n');
  }

  const failed = sweepFailed({
    red: red.length,
    // Unattributed dirt still fails the sweep. Parallel mode gives up the name,
    // not the verdict.
    dirty: dirty.length + sweepDirt.length,
    blocked: blocked.length,
    allowMissingTools,
  });
  process.stdout.write(
    `\ngreen: ${green}   red: ${red.length}   dirty: ${dirtyOnly}   not run: ${blocked.length}\n`,
  );
  if (sweepDirt.length > 0) {
    // The four counters are per package, and unattributed dirt belongs to no
    // package. Printing it beside them keeps a reader who only looks at the last
    // line from reading `dirty: 0` on a run that failed because of dirt.
    process.stdout.write(`unattributed dirt: ${sweepDirt.length} path(s)\n`);
  }
  if (dirty.length > dirtyOnly) {
    process.stdout.write(
      `${dirty.length - dirtyOnly} package(s) counted red or blocked also dirtied the tree.\n`,
    );
  }
  process.exit(failed ? 1 : 0);
}

// Only run as CLI when invoked directly (not when imported by tests).
const isEntry = isMainModule(process.argv[1], import.meta.url);
if (isEntry) {
  main().catch((err) => {
    // A usage error prints its message alone: a stack trace of the argument
    // parser tells the reader nothing about the flag they mistyped.
    const usage = err instanceof UsageError;
    process.stderr.write(`[test-all] ${usage ? err.message : (err.stack ?? err.message ?? err)}\n`);
    process.exit(usage ? 4 : 1);
  });
}
