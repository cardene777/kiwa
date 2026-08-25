/**
 * How many packages this machine should run at once, and why.
 *
 * `scripts/test-all.mjs --jobs N` takes the number as given. Choosing it by
 * counting cores is wrong often enough to matter: measured on a 12-core machine
 * with 48 GB, `--jobs 4` made every target 3-4× slower
 * (`examples/nextjs-bridge` 49.6 s → 195.9 s) because swap was at 95% and the
 * one-minute load average was 24.
 *
 * ## Why the decision is not in `test-all.mjs`
 *
 * The sweep's default stays 1. A command that behaves differently depending on
 * what else the machine is doing cannot be compared against its own earlier
 * runs, and comparing runs is what the sweep is for. The script does as it is
 * told; this module decides what to tell it.
 *
 * ## Which memory signal
 *
 * Four of them disagreed at the same instant on the machine above:
 *
 * | signal | value | reads as |
 * |---|---|---|
 * | `os.freemem()` | 1.59 GB | critical |
 * | `vm_stat` free + inactive + speculative | 15.1 GB | fine |
 * | `memory_pressure -Q` | 60% free | fine |
 * | `sysctl vm.swapusage` | 21.4 of 22.5 GB used | critical |
 *
 * `os.freemem()` on macOS counts little more than free pages and ignores
 * reclaimable inactive ones; `memory_pressure` counts compression, so it looks
 * comfortable while swap fills. **Swap is the primary signal** — once it is
 * nearly full, more concurrency trades CPU for paging — and reclaimable memory
 * bounds how many targets fit.
 *
 * ## Unknowns
 *
 * A cap whose input is missing becomes 1. "Could not measure" is not "plenty of
 * room": the cost of running one at a time is minutes, and the cost of running
 * eight on a machine that cannot hold them is a sweep that is slower than
 * serial and results that describe contention rather than the code.
 *
 * The one exception is the serial-lane ceiling, which only ever *lowers* the
 * number and describes waste rather than danger. Missing that input skips that
 * cap and says so.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { cpus, loadavg } from 'node:os';
import { join } from 'node:path';

/** Memory a single target needs while its vitest workers run, in GB. */
export const PER_TARGET_GB = 1.5;

/** Above this swap ratio, added concurrency buys paging rather than progress. */
export const SWAP_CRITICAL = 0.8;

/** Above this, concurrency still helps but the machine is already trading. */
export const SWAP_STRAINED = 0.5;

/**
 * The caps that apply to a snapshot, each with the number it allows.
 *
 * Returned separately from the decision so a caller can report which one bound
 * the result rather than only the result.
 *
 * @param {object} s snapshot
 * @returns {{ name: string, jobs: number, why: string }[]}
 */
export function caps(s) {
  const out = [];

  // Leave two for the OS and for the sweep's own process. On 12 cores that is
  // 10, which no other cap has yet allowed — cores are rarely what binds.
  out.push(
    s.cores == null
      ? { name: 'cores', jobs: 1, why: 'コア数を測れなかった' }
      : { name: 'cores', jobs: Math.max(1, s.cores - 2), why: `論理コア ${s.cores}` },
  );

  out.push(
    s.reclaimableGb == null
      ? { name: 'memory', jobs: 1, why: 'メモリ余力を測れなかった' }
      : {
          name: 'memory',
          jobs: Math.max(1, Math.floor(s.reclaimableGb / PER_TARGET_GB)),
          why: `再利用可能 ${s.reclaimableGb.toFixed(1)}GB / 1 target ${PER_TARGET_GB}GB`,
        },
  );

  if (s.swapRatio == null) {
    out.push({ name: 'swap', jobs: 1, why: 'swap の使用率を測れなかった' });
  } else if (s.swapRatio >= SWAP_CRITICAL) {
    out.push({ name: 'swap', jobs: 1, why: `swap ${Math.round(s.swapRatio * 100)}% 使用` });
  } else if (s.swapRatio >= SWAP_STRAINED) {
    const half = Math.max(1, Math.floor((s.cores ?? 2) / 2));
    out.push({ name: 'swap', jobs: half, why: `swap ${Math.round(s.swapRatio * 100)}% 使用` });
  }

  if (s.load1 == null) {
    out.push({ name: 'load', jobs: 1, why: 'load average を測れなかった' });
  } else if (s.cores != null) {
    // The machine is already running this much. Asking for more than the
    // remainder means queuing behind work that is not ours.
    const spare = Math.max(1, Math.round(s.cores - s.load1));
    out.push({ name: 'load', jobs: spare, why: `load ${s.load1.toFixed(1)} / コア ${s.cores}` });
  }

  // Beyond this the serial lanes are the wall clock, so more concurrency only
  // adds contention. Missing inputs skip it: this cap describes waste, not risk.
  if (
    s.freeLaneSeconds != null &&
    s.serialLaneSeconds != null &&
    s.serialWorkSeconds != null &&
    s.serialLaneSeconds > 0
  ) {
    out.push({
      name: 'floor',
      jobs: Math.max(
        1,
        Math.ceil((s.freeLaneSeconds + s.serialWorkSeconds) / s.serialLaneSeconds),
      ),
      why: `最長直列車線 ${s.serialLaneSeconds}秒 が床`,
    });
  }

  return out;
}

/**
 * The number to pass to `--jobs`, and the reason it is that number.
 *
 * @param {object} snapshot
 * @returns {{ jobs: number, reason: string, binding: string }}
 */
export function planJobs(snapshot) {
  const all = caps(snapshot);
  const lowest = all.reduce((a, b) => (b.jobs < a.jobs ? b : a));
  const jobs = Math.max(1, lowest.jobs);

  const others = all
    .filter((c) => c.name !== lowest.name)
    .map((c) => `${c.name} ${c.jobs}`)
    .join(' / ');
  let reason = `${lowest.name} が上限 (${lowest.why}) → ${jobs}。 他: ${others}`;

  if (snapshot.dockerUp === false) {
    reason += '。 docker daemon が落ちているので docker 車線は blocked になる';
  } else if (snapshot.dockerUp == null) {
    reason += '。 docker daemon の可否を測れなかった';
  }
  return { jobs, reason, binding: lowest.name };
}

/** Run a command and return its output, or `null` if it did not answer. */
function ask(command, args, io = {}) {
  const run = io.execFileSync ?? execFileSync;
  try {
    // A daemon that is down can take seconds to say so. The planner must not
    // become the slow part of deciding how to go fast.
    return run(command, args, { encoding: 'utf-8', stdio: 'pipe', timeout: 3000 });
  } catch {
    return null;
  }
}

/**
 * Memory that could be handed to a new process, in GB.
 *
 * Free pages alone understate it by a wide margin — inactive pages are
 * reclaimable and are most of what is available on a machine that has been up
 * for a while (measured: 0.2 GB free against 12.6 GB reclaimable).
 */
export function readReclaimableGb(io = {}) {
  const out = ask('vm_stat', [], io);
  if (out === null) return null;
  const pageSize = Number((out.match(/page size of (\d+) bytes/) ?? [])[1]);
  if (!Number.isFinite(pageSize) || pageSize <= 0) return null;
  const pages = (name) => Number((out.match(new RegExp(`Pages ${name}:\\s+(\\d+)`)) ?? [])[1] ?? NaN);
  const parts = [pages('free'), pages('inactive'), pages('speculative')];
  if (parts.some((n) => !Number.isFinite(n))) return null;
  return (parts.reduce((a, b) => a + b, 0) * pageSize) / 2 ** 30;
}

/** How full swap is, 0..1, or `null` when it cannot be read. */
export function readSwapRatio(io = {}) {
  const out = ask('sysctl', ['-n', 'vm.swapusage'], io);
  if (out === null) return null;
  const m = out.match(/total = ([\d.]+)M\s+used = ([\d.]+)M/);
  if (!m) return null;
  const total = Number(m[1]);
  const used = Number(m[2]);
  // No swap configured is not "swap is full"; it means the cap does not apply.
  if (!Number.isFinite(total) || !Number.isFinite(used) || total <= 0) return 0;
  return used / total;
}

/**
 * Whether the Docker daemon answers.
 *
 * Not installed and not running are different situations with the same
 * consequence here — the docker lane will report every target as blocked — so
 * both come back `false`.
 */
export function readDockerUp(io = {}) {
  const out = ask('docker', ['info', '--format', '{{.ServerVersion}}'], io);
  if (out === null) return false;
  return out.trim().length > 0;
}

/**
 * Lane durations from the most recent sweep log, if one was kept.
 *
 * These bound waste rather than risk, so a repository with no past sweep simply
 * does without the cap. Reading them from a log rather than from a written
 * number keeps them from going stale in prose.
 */
export function readLaneSeconds(repoRoot, serialLaneGroups, io = {}) {
  const dir = join(repoRoot, '.context/scratch/sweep');
  const read = io.readFileSync ?? readFileSync;
  const exists = io.existsSync ?? existsSync;
  const list = io.readdirSync ?? readdirSync;
  const stat = io.statSync ?? statSync;
  const none = {
    freeLaneSeconds: null,
    serialLaneSeconds: null,
    serialWorkSeconds: null,
  };
  if (!exists(dir)) return none;

  let body = '';
  try {
    const logs = list(dir).filter((n) => n.startsWith('jobs-') && n.endsWith('.log'));
    if (logs.length === 0) return none;
    const latest = logs
      .map((name) => ({ name, mtimeMs: stat(join(dir, name)).mtimeMs }))
      .sort((a, b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name))[0];
    body = read(join(dir, latest.name), 'utf-8');
  } catch {
    return none;
  }

  // **A log that stops part way is not a shorter measurement, it is a different
  // one.** The sweep prints its verdict line last, so its absence means the run
  // was killed and the totals below would describe whatever it got through.
  // Measured: a run killed at 79 of 166 targets yielded a 12 s "serial lane",
  // which would have allowed twelve times the concurrency the machine wanted.
  const verdict = body.match(
    /^green:\s+(\d+)\s+red:\s+(\d+)\s+dirty:\s+(\d+)\s+not run:\s+(\d+)\s*$/m,
  );
  if (!verdict) return none;

  const laneByTarget = new Map();
  for (const [index, group] of serialLaneGroups.entries()) {
    for (const target of group) laneByTarget.set(target, index);
  }
  const serial = serialLaneGroups.map(() => 0);
  let free = 0;
  let seen = 0;
  for (const m of body.matchAll(/^\[[^\]]+\]\s+\w+\s+(\S+)\s+([\d.]+)s\s*$/gm)) {
    const [, target, secs] = m;
    const value = Number(secs);
    if (!Number.isFinite(value)) continue;
    seen += 1;
    const lane = laneByTarget.get(target);
    if (lane === undefined) free += value;
    else serial[lane] += value;
  }
  const expected = verdict.slice(1).reduce((sum, count) => sum + Number(count), 0);
  // A verdict that does not agree with the parsed target lines is not a complete
  // measurement in a format this module understands.
  if (seen < 10 || seen !== expected) return none;
  const serialWorkSeconds = serial.reduce((sum, seconds) => sum + seconds, 0);
  const serialLaneSeconds = Math.max(0, ...serial);
  return {
    freeLaneSeconds: free,
    serialLaneSeconds: serialLaneSeconds > 0 ? serialLaneSeconds : null,
    serialWorkSeconds: serialWorkSeconds > 0 ? serialWorkSeconds : null,
  };
}

/** Everything `planJobs` needs, measured from this machine. */
export function measure({ repoRoot, serialLaneGroups = [] }, io = {}) {
  const lanes = readLaneSeconds(repoRoot, serialLaneGroups, io);
  return {
    cores: (io.cpus ?? cpus)().length || null,
    reclaimableGb: readReclaimableGb(io),
    swapRatio: readSwapRatio(io),
    load1: (io.loadavg ?? loadavg)()[0] ?? null,
    dockerUp: readDockerUp(io),
    ...lanes,
  };
}
