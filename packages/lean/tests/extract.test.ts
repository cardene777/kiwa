/**
 * The third edge: does the Lean file hold the table the spec describes?
 *
 * `checkConformance` compares the spec with the implementation. Lean proves
 * things about the table the generator gave it. Nothing compared the generator's
 * output with the spec it came from, and the theorems cannot: they are derived
 * from the same table, so a generator that renders one cell to the wrong target
 * produces a file that compiles, whose theorems all prove, and whose table is
 * wrong.
 *
 * Lean's exhaustiveness checker catches a cell that was *dropped*. Nothing caught
 * a cell that was *moved*.
 */

import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { checkLeanTable, extractLeanTable, renderTableProgram } from '../src/extract.js';
import { generateLeanSpec } from '../src/generator.js';
import { verifyLeanSpec } from '../src/verify.js';
import type { OrchestratorSpec } from '../src/types.js';

function leanInstalled(): boolean {
  try {
    execFileSync('lean', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const HAS_LEAN = leanInstalled();

const SPEC: OrchestratorSpec = {
  moduleName: 'Probe',
  namespace: 'Probe',
  states: ['init', 'authed', 'expired'],
  events: ['auth-succeeded', 'session-expired', 'timeout'],
  unspecified: 'invalid',
  initial: 'init',
  terminal: ['expired'],
  transitions: [
    { from: 'init', event: 'auth-succeeded', to: 'authed' },
    { from: 'init', event: 'timeout', to: 'expired' },
    { from: 'authed', event: 'session-expired', to: 'expired' },
    { from: 'authed', event: 'timeout', to: 'expired' },
  ],
};

/**
 * `authed + timeout` appears in no theorem: it is not on a reachability witness
 * path, `authed` can leave by `session-expired`, and `expired` stays terminal.
 * Moving it is invisible to every proof the generator emits.
 */
const INVISIBLE_FLIP = {
  from: '| .Authed,  .Timeout        => .to .Expired',
  to: '| .Authed,  .Timeout        => .to .Authed',
};

/** `init + auth-succeeded` carries the witness for `authed_reachable`. */
const VISIBLE_FLIP = {
  from: '| .Init,    .AuthSucceeded  => .to .Authed',
  to: '| .Init,    .AuthSucceeded  => .to .Expired',
};

function flip(source: string, change: { from: string; to: string }): string {
  const flipped = source.replace(change.from, change.to);
  expect(flipped).not.toBe(source);
  return flipped;
}

describe('renderTableProgram builds a program that prints the table', () => {
  it('T-EXTRACT-001 names every state and event, and enumerates them', () => {
    const program = renderTableProgram(SPEC);

    expect(program).toContain('| .Init => "init"');
    expect(program).toContain('| .SessionExpired => "session-expired"');
    expect(program).toContain('def allStates : List «Probe».State := [.Init, .Authed, .Expired]');
    expect(program).toContain('def main : IO Unit');
  });

  it('T-EXTRACT-002 reads the table through dispatch, which is what is under test', () => {
    // The name maps come from the spec, so they cannot disagree with it. The
    // table does, and it is read by evaluating `dispatch`.
    expect(renderTableProgram(SPEC)).toContain('match «Probe».dispatch s e with');
  });
});

describe.skipIf(!HAS_LEAN)('Lean prints the table it actually computes', () => {
  it('T-EXTRACT-010 a generated spec yields exactly its own table', () => {
    const report = checkLeanTable(SPEC);

    expect(report.status).toBe('ok');
    expect(report.ok).toBe(true);
    expect(report.checked).toBe(9);
    expect(report.disagreements).toEqual([]);
  });

  it('T-EXTRACT-011 every cell comes back, rejections included', () => {
    const { table, status } = extractLeanTable(generateLeanSpec(SPEC).source, SPEC);

    expect(status).toBe('ok');
    expect(table?.size).toBe(9);
    expect(table?.get('init::auth-succeeded')).toBe('authed');
    expect(table?.get('authed::auth-succeeded')).toBe(null);
    expect(table?.get('expired::timeout')).toBe(null);
  });

  it('T-EXTRACT-012 a self-loop is a target, not a rejection', () => {
    const looping: OrchestratorSpec = {
      ...SPEC,
      transitions: [...SPEC.transitions, { from: 'authed', event: 'auth-succeeded', to: 'authed' }],
    };
    const { table } = extractLeanTable(generateLeanSpec(looping).source, looping);

    expect(table?.get('authed::auth-succeeded')).toBe('authed');
  });
});

describe.skipIf(!HAS_LEAN)('a moved cell is invisible to Lean and visible in the table', () => {
  it('T-EXTRACT-020 Lean accepts a file whose table has one cell moved', () => {
    // This is the gap. Type-correct, every theorem proves, table wrong.
    const flipped = flip(generateLeanSpec(SPEC).source, INVISIBLE_FLIP);

    const verified = verifyLeanSpec([
      { source: flipped, path: 'Probe.lean', meta: generateLeanSpec(SPEC).meta },
    ]);

    expect(verified.status).toBe('ok');
  });

  it('T-EXTRACT-021 the extracted table shows the moved cell', () => {
    const flipped = flip(generateLeanSpec(SPEC).source, INVISIBLE_FLIP);

    const { status, table } = extractLeanTable(flipped, SPEC);

    expect(status).toBe('ok');
    expect(table?.get('authed::timeout')).toBe('authed');
  });

  it('T-EXTRACT-022 checkLeanTable names the cell, the spec and the Lean', () => {
    const source = flip(generateLeanSpec(SPEC).source, INVISIBLE_FLIP);

    const report = checkLeanTable(SPEC, { source });

    expect(report.status).toBe('ok');
    expect(report.ok).toBe(false);
    expect(report.checked).toBe(9);
    expect(report.disagreements).toEqual([
      {
        state: 'authed',
        event: 'timeout',
        spec: 'expired',
        lean: 'authed',
        message: 'authed + timeout: the spec says expired, the generated Lean says authed',
      },
    ]);
  });

  it('T-EXTRACT-024 a cell the Lean refuses but the spec allows is a disagreement', () => {
    const source = flip(generateLeanSpec(SPEC).source, {
      from: '| .Authed,  .Timeout        => .to .Expired',
      to: '| .Authed,  .Timeout        => .invalid',
    });

    const report = checkLeanTable(SPEC, { source });

    expect(report.ok).toBe(false);
    expect(report.disagreements[0]).toMatchObject({ spec: 'expired', lean: null });
    expect(report.disagreements[0]?.message).toContain('the generated Lean says invalid');
  });

  it('T-EXTRACT-025 a source the generator wrote for this spec always agrees', () => {
    const report = checkLeanTable(SPEC, { source: generateLeanSpec(SPEC).source });

    expect(report.ok).toBe(true);
    expect(report.disagreements).toEqual([]);
  });

  it('T-EXTRACT-023 a cell a theorem does touch is caught by Lean already', () => {
    // Moving the cell that carries `authed_reachable`'s witness breaks the proof,
    // so this half of the table was never unguarded.
    const flipped = flip(generateLeanSpec(SPEC).source, VISIBLE_FLIP);

    const extracted = extractLeanTable(flipped, SPEC);

    expect(extracted.status).toBe('extraction-failed');
    expect(extracted.diagnostics).toContain('error');
  });
});

describe('a check that did not run is not a check that passed', () => {
  it.skipIf(HAS_LEAN)('T-EXTRACT-030 without a toolchain the report is not ok', () => {
    const report = checkLeanTable(SPEC);

    expect(report.status).toBe('lean-not-installed');
    expect(report.ok).toBe(false);
  });

  it.skipIf(!HAS_LEAN)('T-EXTRACT-031 a missing binary is reported, not treated as agreement', () => {
    const report = checkLeanTable(SPEC, { leanBin: '/definitely/not/lean/xyz' });

    expect(report.status).toBe('lean-not-installed');
    expect(report.ok).toBe(false);
    expect(report.checked).toBe(0);
  });

  it.skipIf(!HAS_LEAN)('T-EXTRACT-032 a spec Lean cannot elaborate fails rather than agreeing', () => {
    const broken = 'namespace Probe\ndef bad : Nat := "x"\nend Probe\n';

    const extracted = extractLeanTable(broken, SPEC);

    expect(extracted.status).toBe('extraction-failed');
    expect(extracted.table).toBeUndefined();
  });

  it.skipIf(!HAS_LEAN)('T-EXTRACT-034 the source and Lean may print, and the table still arrives', () => {
    // Lean and the source share stdout. Reading every line as a cell turned an
    // `#eval` into `unreadable line from Lean`, failing a spec that was fine.
    const noisy = generateLeanSpec(SPEC).source.replace(
      /^end «Probe»$/m,
      '#eval IO.println "a line from the source"\n#eval IO.println "another,with,commas"\n\nend «Probe»',
    );
    expect(noisy).toContain('#eval');

    const { status, table } = extractLeanTable(noisy, SPEC);

    expect(status).toBe('ok');
    expect(table?.size).toBe(9);
  });

  it.skipIf(!HAS_LEAN)('T-EXTRACT-037 a cell printed twice is not a table either', () => {
    // The count does not notice a repeated key: the second line overwrites the
    // first, and its value could have come from anywhere. `dispatch` says
    // `init + auth-succeeded` goes to `authed`; this line says it is rejected,
    // and the table would carry the lie with the right number of cells.
    const source = generateLeanSpec(SPEC).source.replace(
      /^end «Probe»$/m,
      '#eval IO.println "kiwa-lean-cell:init,auth-succeeded,invalid"\n\nend «Probe»',
    );

    const { status, diagnostics } = extractLeanTable(source, SPEC);

    expect(status).toBe('extraction-failed');
    expect(diagnostics).toContain('Lean printed init + auth-succeeded twice');
  });

  it.skipIf(!HAS_LEAN)('T-EXTRACT-035 a cell the machine does not have is not a table', () => {
    // The count is the whole check, since names are identifiers and no two cells
    // share a key. A source that prints a cell of its own has stopped describing
    // the machine the spec describes.
    const source = generateLeanSpec(SPEC).source.replace(
      /^end «Probe»$/m,
      '#eval IO.println "kiwa-lean-cell:ghost,ghost,invalid"\n\nend «Probe»',
    );

    const { status, diagnostics } = extractLeanTable(source, SPEC);

    expect(status).toBe('extraction-failed');
    expect(diagnostics).toContain('Lean printed 10 cells, expected 9');
    expect(diagnostics).toContain('does not hold the machine this spec describes');
  });

  it.skipIf(!HAS_LEAN)('T-EXTRACT-036 a spec whose machine the source does not hold fails', () => {
    // The Lean file defines two states; the spec names three. The printer asks
    // for a constructor the file has no equivalent of, and nothing is read.
    const smaller: OrchestratorSpec = {
      ...SPEC,
      states: ['init', 'authed'],
      initial: 'init',
      terminal: [],
      transitions: [
        { from: 'init', event: 'auth-succeeded', to: 'authed' },
        { from: 'authed', event: 'timeout', to: 'init' },
      ],
    };

    const report = checkLeanTable(SPEC, { source: generateLeanSpec(smaller).source });

    expect(report.ok).toBe(false);
    expect(report.status).not.toBe('ok');
  });

  it.skipIf(!HAS_LEAN)('T-EXTRACT-033 the failure carries what Lean said, not a parse complaint', () => {
    // Lean prints its errors to stdout, the same stream the table comes back on.
    // Reading that stream as a table first turns "the proof failed" into
    // "unreadable line", which names the wrong problem.
    const flipped = flip(generateLeanSpec(SPEC).source, VISIBLE_FLIP);

    const extracted = extractLeanTable(flipped, SPEC);

    expect(extracted.status).toBe('extraction-failed');
    expect(extracted.diagnostics).toContain('error:');
    expect(extracted.diagnostics).not.toContain('unreadable line');
    expect(extracted.diagnostics).not.toContain('cells, expected');
  });
});
