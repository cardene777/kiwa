import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ConfigError } from '../src/config.js';
import { loadConfig, loadConfigFile } from '../src/config-file.js';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'kaname-config-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function writeConfig(body: string): void {
  writeFileSync(join(root, 'kaname.config.json'), body, 'utf-8');
}

describe('loadConfigFile', () => {
  it('T-CFGF-001 a missing file is not an error', () => {
    expect(loadConfigFile(root)).toEqual({});
  });

  it('T-CFGF-002 reads a valid file', () => {
    writeConfig('{"tracker":"github","specDir":"spec"}');
    expect(loadConfigFile(root)).toEqual({ tracker: 'github', specDir: 'spec' });
  });

  it('T-CFGF-003 malformed JSON names the file and the parse failure', () => {
    writeConfig('{"tracker": }');
    expect(() => loadConfigFile(root)).toThrow(ConfigError);
    expect(() => loadConfigFile(root)).toThrow(/kaname\.config\.json is not valid JSON/);
  });

  it('T-CFGF-004 an invalid value names the file path', () => {
    writeConfig('{"tracker":"jira"}');
    expect(() => loadConfigFile(root)).toThrow(/kaname\.config\.json has an unknown tracker/);
  });

  it('T-CFGF-005 an empty JSON object contributes nothing', () => {
    writeConfig('{}');
    expect(loadConfigFile(root)).toEqual({});
  });
});

describe('loadConfig precedence with a real file', () => {
  it('T-CFGF-010 defaults apply with no file and no environment', () => {
    expect(loadConfig(root, { env: {} })).toEqual({
      tracker: 'none',
      specDir: 'docs/spec',
      lean: { verify: 'auto' },
    });
  });

  it('T-CFGF-011 the file overrides defaults', () => {
    writeConfig('{"tracker":"linear","specDir":"spec"}');
    const cfg = loadConfig(root, { env: {} });
    expect(cfg.tracker).toBe('linear');
    expect(cfg.specDir).toBe('spec');
  });

  it('T-CFGF-012 the environment overrides the file', () => {
    writeConfig('{"tracker":"linear"}');
    const cfg = loadConfig(root, { env: { KANAME_TRACKER: 'github' } });
    expect(cfg.tracker).toBe('github');
  });

  it('T-CFGF-013 explicit overrides beat the environment', () => {
    writeConfig('{"tracker":"linear"}');
    const cfg = loadConfig(root, {
      env: { KANAME_TRACKER: 'github' },
      overrides: { tracker: 'none' },
    });
    expect(cfg.tracker).toBe('none');
  });

  it('T-CFGF-014 layers combine rather than replace wholesale', () => {
    writeConfig('{"specDir":"spec"}');
    const cfg = loadConfig(root, { env: { KANAME_LEAN_VERIFY: 'never' } });
    expect(cfg).toEqual({ tracker: 'none', specDir: 'spec', lean: { verify: 'never' } });
  });

  it('T-CFGF-015 a broken file fails even when the environment would supply the value', () => {
    writeConfig('{"tracker":"jira"}');
    expect(() => loadConfig(root, { env: { KANAME_TRACKER: 'github' } })).toThrow(ConfigError);
  });
});
