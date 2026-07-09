import { describe, expect, it } from 'vitest';
import {
  CONFIG_FILENAME,
  ConfigError,
  DEFAULT_CONFIG,
  configFromEnv,
  parseConfigFile,
  resolveConfig,
} from '../src/config.js';

describe('defaults', () => {
  it('T-CFG-001 a project with no configuration still resolves', () => {
    expect(resolveConfig()).toEqual({
      tracker: 'none',
      specDir: 'docs/spec',
      lean: { verify: 'auto' },
    });
  });

  it('T-CFG-002 the default tracker keeps everything local', () => {
    expect(DEFAULT_CONFIG.tracker).toBe('none');
  });
});

describe('configFromEnv', () => {
  it('T-CFG-010 an empty environment contributes nothing', () => {
    expect(configFromEnv({})).toEqual({});
  });

  it('T-CFG-011 blank variables are treated as unset', () => {
    expect(configFromEnv({ KANAME_TRACKER: '', KANAME_SPEC_DIR: '' })).toEqual({});
  });

  it('T-CFG-012 reads each variable', () => {
    expect(
      configFromEnv({
        KANAME_TRACKER: 'github',
        KANAME_SPEC_DIR: 'spec',
        KANAME_LEAN_VERIFY: 'never',
      }),
    ).toEqual({ tracker: 'github', specDir: 'spec', lean: { verify: 'never' } });
  });

  it('T-CFG-013 rejects an unknown tracker and names the variable', () => {
    expect(() => configFromEnv({ KANAME_TRACKER: 'jira' })).toThrow(
      /KANAME_TRACKER has an unknown tracker "jira".*none, github, linear/,
    );
  });

  it('T-CFG-014 rejects an unknown lean mode', () => {
    expect(() => configFromEnv({ KANAME_LEAN_VERIFY: 'maybe' })).toThrow(ConfigError);
  });
});

describe('parseConfigFile', () => {
  it('T-CFG-020 accepts a complete file', () => {
    expect(
      parseConfigFile({ tracker: 'linear', specDir: 'docs/spec', lean: { verify: 'always' } }),
    ).toEqual({ tracker: 'linear', specDir: 'docs/spec', lean: { verify: 'always' } });
  });

  it('T-CFG-021 accepts a partial file', () => {
    expect(parseConfigFile({ tracker: 'github' })).toEqual({ tracker: 'github' });
  });

  it('T-CFG-022 rejects a non-object body', () => {
    expect(() => parseConfigFile([])).toThrow(/must contain a JSON object/);
    expect(() => parseConfigFile('tracker=none')).toThrow(/must contain a JSON object/);
  });

  it('T-CFG-023 rejects unknown keys instead of ignoring them', () => {
    expect(() => parseConfigFile({ trackr: 'github' })).toThrow(/unknown key\(s\): trackr/);
  });

  it('T-CFG-024 rejects unknown keys nested under lean', () => {
    expect(() => parseConfigFile({ lean: { verifiy: 'auto' } })).toThrow(
      /lean has unknown key\(s\): verifiy/,
    );
  });

  it('T-CFG-025 rejects wrong types', () => {
    expect(() => parseConfigFile({ tracker: 1 })).toThrow(/tracker must be a string/);
    expect(() => parseConfigFile({ lean: 'auto' })).toThrow(/lean must be an object/);
  });

  it('T-CFG-026 names the file in the error when given an origin', () => {
    expect(() => parseConfigFile({ tracker: 'jira' }, '/tmp/kaname.config.json')).toThrow(
      /\/tmp\/kaname\.config\.json has an unknown tracker/,
    );
  });
});

describe('specDir validation', () => {
  it('T-CFG-030 rejects an empty directory', () => {
    expect(() => parseConfigFile({ specDir: '   ' })).toThrow(/empty specDir/);
  });

  it('T-CFG-031 rejects an absolute path', () => {
    expect(() => parseConfigFile({ specDir: '/etc/spec' })).toThrow(/absolute specDir/);
  });

  it('T-CFG-032 rejects a Windows absolute path', () => {
    expect(() => parseConfigFile({ specDir: 'C:\\spec' })).toThrow(/absolute specDir/);
  });

  it('T-CFG-033 rejects a path escaping the project root', () => {
    expect(() => parseConfigFile({ specDir: '../outside' })).toThrow(/escapes the project root/);
    expect(() => parseConfigFile({ specDir: 'docs/../../outside' })).toThrow(
      /escapes the project root/,
    );
  });

  it('T-CFG-034 trims surrounding whitespace', () => {
    expect(parseConfigFile({ specDir: '  docs/spec  ' })).toEqual({ specDir: 'docs/spec' });
  });

  it('T-CFG-035 accepts a nested relative path', () => {
    expect(parseConfigFile({ specDir: 'a/b/c' })).toEqual({ specDir: 'a/b/c' });
  });
});

describe('resolveConfig precedence', () => {
  it('T-CFG-040 a later layer overrides an earlier one', () => {
    const merged = resolveConfig({ tracker: 'github' }, { tracker: 'linear' });
    expect(merged.tracker).toBe('linear');
  });

  it('T-CFG-041 an empty layer changes nothing', () => {
    const merged = resolveConfig({ tracker: 'github' }, {});
    expect(merged.tracker).toBe('github');
  });

  it('T-CFG-042 setting lean does not erase specDir from an earlier layer', () => {
    const merged = resolveConfig({ specDir: 'spec' }, { lean: { verify: 'never' } });
    expect(merged).toEqual({ tracker: 'none', specDir: 'spec', lean: { verify: 'never' } });
  });

  it('T-CFG-043 file loses to env, env loses to overrides', () => {
    const file = { tracker: 'none' } as const;
    const env = { tracker: 'github' } as const;
    const overrides = { tracker: 'linear' } as const;
    expect(resolveConfig(file, env, overrides).tracker).toBe('linear');
    expect(resolveConfig(file, env).tracker).toBe('github');
    expect(resolveConfig(file).tracker).toBe('none');
  });

  it('T-CFG-044 the returned lean object is not shared with DEFAULT_CONFIG', () => {
    const a = resolveConfig();
    a.lean.verify = 'never';
    expect(DEFAULT_CONFIG.lean.verify).toBe('auto');
    expect(resolveConfig().lean.verify).toBe('auto');
  });
});

describe('exported constants', () => {
  it('T-CFG-050 the config filename is stable', () => {
    expect(CONFIG_FILENAME).toBe('kaname.config.json');
  });
});
