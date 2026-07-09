/**
 * A spec is user input, and the generated Lean is text.
 *
 * Every rule checked here was found by handing the generator something a caller
 * could plausibly write, and watching what came out the other end: a Lean kernel
 * error naming a constructor nobody wrote, a file path climbing out of its
 * directory, two cells of the table quietly becoming one.
 */

import { describe, expect, it } from 'vitest';
import { generateLakeProject } from '../src/lake.js';
import { generateLeanSpec } from '../src/generator.js';
import { checkConformance } from '../src/conformance.js';
import { LeanError, SpecError, UsageError } from '../src/errors.js';
import { verifyLeanSpec } from '../src/verify.js';
import type { OrchestratorSpec } from '../src/types.js';

const BASE = { moduleName: 'M', namespace: 'M', unspecified: 'invalid' } as const;

const spec = (over: Partial<OrchestratorSpec>): OrchestratorSpec => ({
  ...BASE,
  states: ['a'],
  events: ['e'],
  transitions: [],
  ...over,
});

describe('a name that cannot be a Lean identifier is refused', () => {
  it.each([
    ['empty', ''],
    ['leading digit', '1st'],
    ['a space', 'a b'],
    ['a quote', 'a"b'],
    ['a backslash', 'a\\b'],
    ['a colon pair, which keys the table', 'a::b'],
    ['a dot', 'a.b'],
  ])('T-VALID-001 a state named with %s', (_why, name) => {
    expect(() => generateLeanSpec(spec({ states: [name, 'z'] }))).toThrow(SpecError);
    expect(() => generateLeanSpec(spec({ states: [name, 'z'] }))).toThrow(/is not usable/);
  });

  it('T-VALID-002 the same rules hold for events', () => {
    expect(() => generateLeanSpec(spec({ events: ['1st'] }))).toThrow(/event name "1st"/);
  });

  it('T-VALID-003 kebab-case and underscores are allowed, as tables use them', () => {
    expect(() =>
      generateLeanSpec(spec({ states: ['savepoint-nested', 'a_b'], events: ['e'] })),
    ).not.toThrow();
  });
});

describe('two names that collide downstream are refused where they are written', () => {
  it('T-VALID-010 a state listed twice', () => {
    expect(() => generateLeanSpec(spec({ states: ['a', 'a'] }))).toThrow(/state a is listed twice/);
  });

  it('T-VALID-011 an event listed twice', () => {
    expect(() => generateLeanSpec(spec({ events: ['e', 'e'] }))).toThrow(/event e is listed twice/);
  });

  it('T-VALID-012 two states that become one Lean constructor', () => {
    // Lean said `duplicate constructor name M.State.AB`, naming an identifier
    // that appears nowhere in the spec.
    expect(() => generateLeanSpec(spec({ states: ['a-b', 'aB'] }))).toThrow(
      /both become the Lean constructor AB/,
    );
  });

  it('T-VALID-013 two events that become one Lean constructor', () => {
    expect(() => generateLeanSpec(spec({ events: ['x-y', 'xY'] }))).toThrow(
      /both become the Lean constructor XY/,
    );
  });

  it('T-VALID-014 two states that name one theorem', () => {
    // `ab` and `aB` are distinct constructors, `Ab` and `AB`. Both states name
    // the theorems `ab_absorbing` and `ab_can_leave`.
    expect(() => generateLeanSpec(spec({ states: ['ab', 'aB'] }))).toThrow(
      /both name the theorems ab_absorbing/,
    );
  });

  it('T-VALID-016 a-b and a_b collide as constructors before they collide as theorems', () => {
    expect(() => generateLeanSpec(spec({ states: ['a-b', 'a_b'] }))).toThrow(
      /both become the Lean constructor AB/,
    );
  });

  it('T-VALID-015 a state and an event may share a name, being different types', () => {
    expect(() => generateLeanSpec(spec({ states: ['tick'], events: ['tick'] }))).not.toThrow();
  });
});

describe('a name that would become a path or syntax is refused', () => {
  it('T-VALID-020 a moduleName that climbs out of its directory', () => {
    // `path` is what a caller writes the file to, and `verifiedFiles` reports.
    expect(() => generateLeanSpec(spec({ moduleName: '../../etc/passwd' }))).toThrow(
      /is not a plain module name/,
    );
  });

  it('T-VALID-021 a moduleName with a hyphen, which Lake cannot import', () => {
    expect(() => generateLeanSpec(spec({ moduleName: 'a-b' }))).toThrow(/is not a plain module name/);
  });

  it('T-VALID-022 a namespace that is not an identifier', () => {
    expect(() => generateLeanSpec(spec({ namespace: '' }))).toThrow(/is not a Lean identifier/);
    expect(() => generateLeanSpec(spec({ namespace: 'My Space' }))).toThrow(
      /is not a Lean identifier/,
    );
  });
});

describe('the separator that keys the table cannot be smuggled into a name', () => {
  it('T-VALID-030 two cells used to become one', () => {
    // cellKey(state, event) is `state::event`. ("a", "b::c") and ("a::b", "c")
    // keyed the same cell: the second inherited the first's target, and the
    // undeclared-cell check thought it had been declared.
    const collide = spec({
      states: ['a', 'a::b'],
      events: ['b::c', 'c'],
      transitions: [{ from: 'a', event: 'b::c', to: 'a' }],
    });

    expect(() => generateLeanSpec(collide)).toThrow(SpecError);
    expect(() => generateLeanSpec(collide)).toThrow(/is not usable/);
  });
});

describe('initial and terminal name states of this machine', () => {
  it('T-VALID-040 an unknown initial state', () => {
    expect(() => generateLeanSpec(spec({ initial: 'nowhere' }))).toThrow(
      /unknown state in initial: nowhere/,
    );
  });

  it('T-VALID-041 an unknown terminal state', () => {
    expect(() => generateLeanSpec(spec({ terminal: ['nowhere'] }))).toThrow(
      /unknown state in terminal: nowhere/,
    );
  });
});

describe('every reader of a spec checks it', () => {
  it('T-VALID-050 checkConformance refuses what generateLeanSpec refuses', () => {
    const bad = spec({ states: ['a-b', 'aB'] });
    expect(() => checkConformance(bad, () => ({ kind: 'rejected' }))).toThrow(SpecError);
    expect(() => checkConformance(bad, () => ({ kind: 'rejected' }))).toThrow(/checkConformance/);
  });

  it('T-VALID-051 the origin names the function that was called', () => {
    expect(() => generateLeanSpec(spec({ states: ['a', 'a'] }))).toThrow(/^generateLeanSpec:/);
  });
});

describe('generateLakeProject writes files and Lean syntax, and checks its inputs', () => {
  it('T-VALID-060 a rootNamespace that is not an identifier', () => {
    // It became the file name `My Space.lean`, which then failed to parse.
    expect(() => generateLakeProject({ packageName: 'p', rootNamespace: 'My Space' })).toThrow(
      /is not a Lean identifier/,
    );
  });

  it('T-VALID-061 a module that climbs out of the library root', () => {
    expect(() =>
      generateLakeProject({ packageName: 'p', rootNamespace: 'N', modules: ['../../evil'] }),
    ).toThrow(/is not a module name/);
  });

  it('T-VALID-062 a module listed twice, which would be imported twice', () => {
    expect(() =>
      generateLakeProject({ packageName: 'p', rootNamespace: 'N', modules: ['A', 'A'] }),
    ).toThrow(/module A is listed twice/);
  });

  it('T-VALID-063 a packageName that is not a package name', () => {
    expect(() => generateLakeProject({ packageName: 'p q', rootNamespace: 'N' })).toThrow(
      /packageName "p q"/,
    );
  });

  it('T-VALID-064 a toolchain that is not one', () => {
    expect(() =>
      generateLakeProject({ packageName: 'p', rootNamespace: 'N', leanToolchain: 'not a toolchain' }),
    ).toThrow(/does not look like/);
  });

  it('T-VALID-065 the shapes a real project uses are accepted', () => {
    const lake = generateLakeProject({
      packageName: 'kiwa-specs',
      rootNamespace: 'KiwaSpecs',
      modules: ['TransactionOrchestrator'],
    });
    expect(Object.keys(lake.files)).toContain('KiwaSpecs.lean');
  });
});

describe('the errors survive a catch', () => {
  it('T-VALID-070 a bad spec throws SpecError, which is a LeanError', () => {
    try {
      generateLeanSpec(spec({ states: ['a', 'a'] }));
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(SpecError);
      expect(error).toBeInstanceOf(LeanError);
      expect(error).not.toBeInstanceOf(UsageError);
      expect((error as Error).name).toBe('SpecError');
    }
  });

  it('T-VALID-071 a bad call throws UsageError, which is a LeanError', () => {
    try {
      verifyLeanSpec([]);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UsageError);
      expect(error).toBeInstanceOf(LeanError);
      expect(error).not.toBeInstanceOf(SpecError);
      expect((error as Error).name).toBe('UsageError');
    }
  });

  it('T-VALID-072 a caller can tell a bad spec from a bad call', () => {
    // Matching on message text is what a caller does when the types do not
    // distinguish them, and it breaks the moment the wording improves.
    const errors: unknown[] = [];
    try {
      generateLeanSpec(spec({ namespace: '' }));
    } catch (e) {
      errors.push(e);
    }
    try {
      verifyLeanSpec([]);
    } catch (e) {
      errors.push(e);
    }

    expect(errors.filter((e) => e instanceof SpecError)).toHaveLength(1);
    expect(errors.filter((e) => e instanceof UsageError)).toHaveLength(1);
    expect(errors.every((e) => e instanceof LeanError)).toBe(true);
  });
});
