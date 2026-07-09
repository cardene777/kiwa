import { describe, expect, it } from 'vitest';
import { ConfigError, DEFAULT_CONFIG } from '../src/config.js';
import { USAGE, formatPlan, parseArgs } from '../src/cli.js';

describe('parseArgs', () => {
  it('T-CLI-001 no arguments prints usage', () => {
    expect(parseArgs([])).toEqual({ kind: 'help' });
  });

  it('T-CLI-002 both help flags print usage', () => {
    expect(parseArgs(['-h'])).toEqual({ kind: 'help' });
    expect(parseArgs(['--help'])).toEqual({ kind: 'help' });
    expect(parseArgs(['init', '--help'])).toEqual({ kind: 'help' });
  });

  it('T-CLI-003 bare init uses the defaults', () => {
    expect(parseArgs(['init'])).toEqual({ kind: 'init', force: false, config: DEFAULT_CONFIG });
  });

  it('T-CLI-004 an unknown command is rejected by name', () => {
    expect(() => parseArgs(['setup'])).toThrow(/unknown command "setup"/);
  });

  it('T-CLI-005 an unknown option is rejected rather than ignored', () => {
    expect(() => parseArgs(['init', '--trackr', 'github'])).toThrow(/unknown option "--trackr"/);
  });

  it('T-CLI-006 reads --tracker and --spec-dir', () => {
    const command = parseArgs(['init', '--tracker', 'github', '--spec-dir', 'spec']);
    expect(command).toEqual({
      kind: 'init',
      force: false,
      config: { tracker: 'github', specDir: 'spec', lean: { verify: 'auto' } },
    });
  });

  it('T-CLI-007 --force is recognized anywhere in the arguments', () => {
    expect(parseArgs(['init', '--force']).kind).toBe('init');
    const command = parseArgs(['init', '--force', '--tracker', 'linear']);
    expect(command).toMatchObject({ force: true, config: { tracker: 'linear' } });
    expect(parseArgs(['init', '--tracker', 'linear', '--force'])).toMatchObject({ force: true });
  });

  it('T-CLI-008 a flag with a missing value stops instead of consuming the next flag', () => {
    expect(() => parseArgs(['init', '--tracker'])).toThrow(/--tracker needs a value/);
    expect(() => parseArgs(['init', '--tracker', '--force'])).toThrow(/--tracker needs a value/);
  });

  it('T-CLI-009 a flag value is validated exactly as a config file value is', () => {
    expect(() => parseArgs(['init', '--tracker', 'jira'])).toThrow(ConfigError);
    expect(() => parseArgs(['init', '--tracker', 'jira'])).toThrow(/unknown tracker "jira"/);
    expect(() => parseArgs(['init', '--spec-dir', '/etc'])).toThrow(/absolute specDir/);
    expect(() => parseArgs(['init', '--spec-dir', '../outside'])).toThrow(/escapes the project/);
  });

  it('T-CLI-010 lean verification stays at its default, as init does not expose it', () => {
    const command = parseArgs(['init', '--tracker', 'github']);
    expect(command).toMatchObject({ config: { lean: { verify: 'auto' } } });
  });
});

describe('USAGE', () => {
  it('T-CLI-020 names the command, its options, and the defaults', () => {
    expect(USAGE).toContain('kaname init');
    expect(USAGE).toContain('--spec-dir');
    expect(USAGE).toContain('--tracker');
    expect(USAGE).toContain('--force');
    expect(USAGE).toContain(DEFAULT_CONFIG.specDir);
  });
});

describe('formatPlan', () => {
  it('T-CLI-030 a fresh project reports what was created and what to do next', () => {
    const out = formatPlan([
      { target: 'kaname.config.json', action: 'created' },
      { target: '.claude/rules/dev-flow.md', action: 'created' },
    ]);
    expect(out).toContain('+ kaname.config.json');
    expect(out).toContain('2 created');
    expect(out).toContain('/spec');
    expect(out).not.toContain('left alone');
  });

  it('T-CLI-031 skipped files are marked and counted separately', () => {
    const out = formatPlan([
      { target: 'a', action: 'created' },
      { target: 'b', action: 'skipped' },
    ]);
    expect(out).toContain('+ a');
    expect(out).toContain('. b');
    expect(out).toContain('1 created, 1 left alone');
  });

  it('T-CLI-032 an all-skipped run says how to force it', () => {
    const out = formatPlan([
      { target: 'a', action: 'skipped' },
      { target: 'b', action: 'skipped' },
    ]);
    expect(out).toContain('2 left alone');
    expect(out).toContain('--force');
    expect(out).not.toContain('/spec');
  });

  it('T-CLI-034 a count of zero is left out of the summary', () => {
    const out = formatPlan([
      { target: 'a', action: 'overwritten' },
      { target: 'b', action: 'overwritten' },
    ]);
    expect(out).toContain('2 overwritten');
    expect(out).not.toContain('0 created');
    expect(out).not.toContain('left alone');
  });

  it('T-CLI-035 an empty plan says so rather than printing an empty summary', () => {
    expect(formatPlan([])).toContain('nothing to write');
  });

  it('T-CLI-033 overwritten files are distinguished from created ones', () => {
    const out = formatPlan([
      { target: 'a', action: 'overwritten' },
      { target: 'b', action: 'created' },
    ]);
    expect(out).toContain('~ a');
    expect(out).toContain('+ b');
    expect(out).toContain('1 created, 1 overwritten');
  });
});
