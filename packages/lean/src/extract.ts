/**
 * Ask Lean what its transition table says, and compare it with the spec.
 *
 * Three things are supposed to agree: the spec, the TypeScript implementation,
 * and the Lean file. `checkConformance` ties the first two together. The third
 * edge went through the generator and nobody checked it.
 *
 * A generator that renders one cell to the wrong target produces a Lean file that
 * compiles, whose theorems all prove, and whose table is wrong. Lean's
 * exhaustiveness checker catches a *dropped* cell and says nothing about a
 * *flipped* one, because the theorems are derived from the same table the
 * generator got wrong. Nothing in this package would have noticed.
 *
 * So Lean is made to print the table it computes, and the printout is compared
 * with the spec. The check is not circular: `dispatch` is what is under test, and
 * the spec is read independently of it.
 */

import { generateLeanSpec } from './generator.js';
import { runLeanSource, type LeanRunOptions } from './lean-runner.js';
import { cellKey, quoteIdentifier, resolveTable, type Table } from './table.js';
import type { OrchestratorSpec } from './types.js';

const toPascalCase = (input: string): string =>
  input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('');

/** Lean prints this for a cell it refuses. No state may be named this. */
const REJECTED = 'invalid';

/**
 * Marks a line of the printed table.
 *
 * Lean and the source under it share stdout: an `#eval`, a `dbg_trace`, a warning
 * Lean decides to print. Reading every line as a cell turns any of those into
 * `unreadable line from Lean`, which fails a correct spec and names the wrong
 * problem. Reading only the marked lines leaves the count as the thing that says
 * whether the whole table arrived.
 */
const CELL_PREFIX = 'kiwa-lean-cell:';

/**
 * A Lean program that prints one marked line per cell: `state,event,target`,
 * where the target is a state name or `invalid`.
 *
 * The constructor-to-name maps are generated from the spec, as the machine's
 * names only exist there. They are not what is under test — `dispatch` is — and a
 * map that named two states wrongly would show up as two wrong lines.
 */
export function renderTableProgram(spec: OrchestratorSpec): string {
  const { namespace, states, events } = spec;
  // The generator writes the namespace the same way. `open end` would close the
  // file rather than open a namespace.
  const ns = quoteIdentifier(namespace);

  const stateArm = (s: string) => `  | .${toPascalCase(s)} => ${JSON.stringify(s)}`;
  const eventArm = (e: string) => `  | .${toPascalCase(e)} => ${JSON.stringify(e)}`;
  const listOf = (xs: readonly string[]) => xs.map((x) => `.${toPascalCase(x)}`).join(', ');

  return `
open ${ns}

def stateName : ${ns}.State → String
${states.map(stateArm).join('\n')}

def eventName : ${ns}.Event → String
${events.map(eventArm).join('\n')}

def allStates : List ${ns}.State := [${listOf(states)}]
def allEvents : List ${ns}.Event := [${listOf(events)}]

def main : IO Unit := do
  for s in allStates do
    for e in allEvents do
      let target := match ${ns}.dispatch s e with
        | .to next => stateName next
        | .invalid => ${JSON.stringify(REJECTED)}
      IO.println s!"${CELL_PREFIX}{stateName s},{eventName e},{target}"
`;
}

export type ExtractStatus =
  | 'ok'
  | 'lean-not-installed'
  /**
   * Lean refused the source: it does not parse, does not elaborate, or one of its
   * theorems is false. No table was printed, because Lean never ran the program.
   *
   * This is the status a checked-in `.lean` file earns when it stops being true,
   * and it is the same word `VerifyStatus` uses for it.
   */
  | 'verification-failed'
  /**
   * Lean accepted the source and ran it, and what came back is not this machine's
   * table: a cell short, a cell twice, a line that does not parse.
   *
   * The source is sound; its table is not the one the spec describes.
   */
  | 'extraction-failed'
  /** Lean was still working when `timeoutMs` ran out. Nothing was established. */
  | 'timed-out'
  /** `opts.skip` or `KIWA_LEAN_SKIP_VERIFY=1`. Nothing was established. */
  | 'skipped-by-env'
  /** Lean printed more cells than the buffer holds. Nothing was established. */
  | 'output-too-large';

export interface ExtractResult {
  status: ExtractStatus;
  /** `null` marks a rejected cell. Present only when `status === 'ok'`. */
  table?: Table;
  /** What Lean said, when it refused or printed something unreadable. */
  diagnostics?: string;
}

export interface ExtractOptions extends LeanRunOptions {
  /**
   * Do not run Lean; report `skipped-by-env`.
   *
   * `verifyLeanSpec` has always read `KIWA_LEAN_SKIP_VERIFY`. This did not, so a
   * caller who turned Lean off for a run turned it off for one of the two things
   * that use it, and the other one went and ran Lean anyway.
   */
  skip?: boolean;
}

/**
 * Run a generated Lean source and read back the table it computes.
 *
 * `source` is taken rather than generated so that a test can hand in a file with
 * one cell moved, which is the only way to know this function can fail.
 */
export function extractLeanTable(
  source: string,
  spec: OrchestratorSpec,
  opts: ExtractOptions = {},
): ExtractResult {
  if (opts.skip === true || process.env.KIWA_LEAN_SKIP_VERIFY === '1') {
    return {
      status: 'skipped-by-env',
      diagnostics: opts.skip === true ? 'opts.skip=true' : 'KIWA_LEAN_SKIP_VERIFY=1',
    };
  }

  const run = runLeanSource(`${source}${renderTableProgram(spec)}`, ['--run'], opts);
  if (run === 'lean-not-installed') return { status: 'lean-not-installed' };
  // Lean exited non-zero. The program appended below only prints, so it is Lean
  // that refused: the source does not elaborate, or a theorem in it is false.
  // Nothing was extracted, and calling that an extraction failure sends the
  // reader to look at the printer.
  if (!run.ok) {
    return {
      status: run.timedOut
        ? 'timed-out'
        : run.overflowed
          ? 'output-too-large'
          : 'verification-failed',
      diagnostics: run.diagnostics,
    };
  }

  const table = new Map<string, string | null>();
  const cells = run.stdout
    .split('\n')
    .filter((line) => line.startsWith(CELL_PREFIX))
    .map((line) => line.slice(CELL_PREFIX.length));

  for (const cell of cells) {
    const [state, event, target] = cell.split(',');
    if (state === undefined || event === undefined || target === undefined) {
      return { status: 'extraction-failed', diagnostics: `unreadable cell from Lean: ${cell}` };
    }
    const key = cellKey(state, event);
    // A cell printed twice would overwrite the first, and the count would not
    // notice: the second value could come from anywhere, dispatch included.
    if (table.has(key)) {
      return {
        status: 'extraction-failed',
        diagnostics: `Lean printed ${state} + ${event} twice. Only one answer per cell is a table.`,
      };
    }
    table.set(key, target === REJECTED ? null : target);
  }

  // Names are identifiers, so no two cells share a key, and with duplicates ruled
  // out above the count is the whole check: a table missing a cell would silently
  // agree with the spec about it.
  const expected = spec.states.length * spec.events.length;
  if (table.size !== expected) {
    return {
      status: 'extraction-failed',
      diagnostics:
        `Lean printed ${table.size} cells, expected ${expected}. ` +
        'The source does not hold the machine this spec describes.',
    };
  }
  return { status: 'ok', table };
}

export interface TableDisagreement {
  state: string;
  event: string;
  /** The target the spec names, or `null` when it refuses the cell. */
  spec: string | null;
  /** The target Lean computes, or `null` when it refuses the cell. */
  lean: string | null;
  message: string;
}

export interface LeanTableReport {
  status: ExtractStatus;
  ok: boolean;
  checked: number;
  disagreements: readonly TableDisagreement[];
  diagnostics?: string;
}

export interface CheckLeanTableOptions extends ExtractOptions {
  /**
   * The Lean source to check. Defaults to what the generator produces for this
   * spec.
   *
   * Pass a file you have on disk to check that it still holds the table the spec
   * describes — a generated file, checked in, drifts the moment either side
   * moves. Passing one is also the only way to see this function disagree, since
   * a source it generated itself always agrees with the spec it came from.
   */
  source?: string;
}

/**
 * Ask Lean what table a source holds, and compare it with the spec.
 *
 * `ok` is false when Lean could not be run, since a check that did not happen has
 * established nothing. `status` says which it was.
 */
export function checkLeanTable(
  spec: OrchestratorSpec,
  opts: CheckLeanTableOptions = {},
): LeanTableReport {
  const { source = generateLeanSpec(spec).source, ...runOpts } = opts;
  const extracted = extractLeanTable(source, spec, runOpts);
  const checked = spec.states.length * spec.events.length;

  if (extracted.status !== 'ok' || extracted.table === undefined) {
    const report: LeanTableReport = {
      status: extracted.status,
      ok: false,
      checked: 0,
      disagreements: [],
    };
    if (extracted.diagnostics !== undefined) report.diagnostics = extracted.diagnostics;
    return report;
  }

  const declared = resolveTable(spec, 'checkLeanTable');
  const disagreements: TableDisagreement[] = [];
  for (const state of spec.states) {
    for (const event of spec.events) {
      const key = cellKey(state, event);
      const fromSpec = declared.get(key) ?? null;
      const fromLean = extracted.table.get(key) ?? null;
      if (fromSpec === fromLean) continue;
      disagreements.push({
        state,
        event,
        spec: fromSpec,
        lean: fromLean,
        message: `${state} + ${event}: the spec says ${fromSpec ?? REJECTED}, the generated Lean says ${fromLean ?? REJECTED}`,
      });
    }
  }

  return { status: 'ok', ok: disagreements.length === 0, checked, disagreements };
}
