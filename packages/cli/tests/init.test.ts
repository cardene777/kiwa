import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

type InitModule = {
  InitConflictError: new (conflicts: string[]) => Error & { conflicts: string[] };
  runInit: (options: { force: boolean; cwd: string }) => {
    created: string[];
    updated: string[];
    warnings: string[];
  };
};

let tempDir = '';

function seedPackageJson(
  dir: string,
  content: Record<string, unknown>,
  indent: number | string = 2,
): void {
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    `${JSON.stringify(content, null, indent)}\n`,
    'utf8',
  );
}

function readPackageJson(dir: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as Record<
    string,
    any
  >;
}

function readFile(dir: string, relativePath: string): string {
  return fs.readFileSync(path.join(dir, relativePath), 'utf8');
}

function writeFile(dir: string, relativePath: string, content: string): void {
  fs.mkdirSync(path.dirname(path.join(dir, relativePath)), { recursive: true });
  fs.writeFileSync(path.join(dir, relativePath), content, 'utf8');
}

async function loadInitModule(): Promise<InitModule> {
  return (await import('../src/commands/init.js')) as InitModule;
}

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kiwa-init-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('runInit', () => {
  it('T-INIT-001 通常生成で e2e spec と playwright config を作成する', async () => {
    // Given
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    // When
    const result = runInit({ force: false, cwd: tempDir });

    // Then
    expect(fs.existsSync(path.join(tempDir, 'e2e', 'connect.spec.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'playwright.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'tsconfig.json'))).toBe(true);
    expect(readFile(tempDir, 'e2e/connect.spec.ts')).toContain("from '@kiwa-lab/dapp'");
    expect(readFile(tempDir, 'playwright.config.ts')).toContain('defineConfig');
    expect(readFile(tempDir, 'tsconfig.json')).toContain('"strict": true');
    expect(result.created).toEqual(
      expect.arrayContaining(['e2e/connect.spec.ts', 'playwright.config.ts', 'tsconfig.json']),
    );
  });

  it('T-INIT-002 package.json に scripts と devDependencies を merge 追加する', async () => {
    // Given
    seedPackageJson(tempDir, {
      name: 'host',
      version: '1.0.0',
      scripts: {
        build: 'echo build',
      },
      devDependencies: {
        typescript: '^5.0.0',
      },
    });
    const { runInit } = await loadInitModule();

    // When
    const result = runInit({ force: false, cwd: tempDir });
    const packageJson = readPackageJson(tempDir);

    // Then
    expect(packageJson.scripts['test:e2e']).toBe('playwright test');
    expect(packageJson.scripts.build).toBe('echo build');
    expect(packageJson.devDependencies['@kiwa-lab/dapp']).toBe('^0.1.0');
    expect(packageJson.devDependencies['@playwright/test']).toBe('^1.49.0');
    expect(packageJson.devDependencies.viem).toBe('^2');
    expect(packageJson.devDependencies.typescript).toBe('^5.0.0');
    expect(result.updated).toContain('package.json');
  });

  it('T-INIT-003 既存 spec と衝突した場合は force なしで InitConflictError を投げる', async () => {
    // Given
    const originalContent = '// existing spec\n';
    writeFile(tempDir, 'e2e/connect.spec.ts', originalContent);
    const { InitConflictError, runInit } = await loadInitModule();
    let thrownError: (Error & { conflicts: string[] }) | null = null;

    // When
    expect(() => {
      try {
        runInit({ force: false, cwd: tempDir });
      } catch (error) {
        thrownError = error as Error & { conflicts: string[] };
        throw error;
      }
    }).toThrow(InitConflictError);

    // Then
    expect(thrownError?.conflicts).toContain('e2e/connect.spec.ts');
    expect(readFile(tempDir, 'e2e/connect.spec.ts')).toBe(originalContent);
  });

  it('T-INIT-004 既存 file 衝突でも force=true なら template で上書きする', async () => {
    // Given
    writeFile(tempDir, 'e2e/connect.spec.ts', '// old\n');
    writeFile(tempDir, 'playwright.config.ts', '// old config\n');
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    // When
    expect(() => runInit({ force: true, cwd: tempDir })).not.toThrow();

    // Then
    expect(readFile(tempDir, 'e2e/connect.spec.ts')).toContain("from '@kiwa-lab/dapp'");
    expect(readFile(tempDir, 'playwright.config.ts')).toContain('defineConfig');
  });

  it('T-INIT-005 package.json 更新時に 2 space indent を維持する', async () => {
    // Given
    seedPackageJson(
      tempDir,
      {
        name: 'host',
        version: '1.0.0',
        scripts: {
          build: 'echo build',
        },
      },
      2,
    );
    const { runInit } = await loadInitModule();

    // When
    runInit({ force: false, cwd: tempDir });
    const packageJsonRaw = readFile(tempDir, 'package.json');

    // Then
    expect(packageJsonRaw.split('\n').some((line) => line.startsWith('  "'))).toBe(true);
    expect(packageJsonRaw.split('\n').some((line) => line.startsWith('\t'))).toBe(false);
  });

  it('T-INIT-006 package.json 更新時に tab indent を維持する', async () => {
    // Given
    seedPackageJson(
      tempDir,
      {
        name: 'host',
        version: '1.0.0',
        scripts: {
          build: 'echo build',
        },
      },
      '\t',
    );
    const { runInit } = await loadInitModule();

    // When
    runInit({ force: false, cwd: tempDir });
    const packageJsonRaw = readFile(tempDir, 'package.json');

    // Then
    expect(packageJsonRaw.split('\n').some((line) => line.startsWith('\t"'))).toBe(true);
    expect(packageJsonRaw.split('\n').some((line) => line.startsWith('  "'))).toBe(false);
  });

  it('T-INIT-007 既存 scripts.test:e2e がある場合は保持する (上書きしない)', async () => {
    // Given
    seedPackageJson(tempDir, {
      name: 'host',
      version: '1.0.0',
      scripts: {
        'test:e2e': 'vitest run e2e',
      },
    });
    const { runInit } = await loadInitModule();

    // When
    runInit({ force: false, cwd: tempDir });
    const packageJson = readPackageJson(tempDir);

    // Then
    expect(packageJson.scripts['test:e2e']).toBe('vitest run e2e');
  });

  it('T-INIT-008 既存 devDependencies の version は保持する (上書きしない)', async () => {
    // Given
    seedPackageJson(tempDir, {
      name: 'host',
      version: '1.0.0',
      devDependencies: {
        '@playwright/test': '^1.48.0',
        viem: '^2.21.0',
      },
    });
    const { runInit } = await loadInitModule();

    // When
    runInit({ force: false, cwd: tempDir });
    const packageJson = readPackageJson(tempDir);

    // Then
    expect(packageJson.devDependencies['@playwright/test']).toBe('^1.48.0');
    expect(packageJson.devDependencies.viem).toBe('^2.21.0');
    expect(packageJson.devDependencies['@kiwa-lab/dapp']).toBe('^0.1.0');
  });

  it('T-INIT-009 package.json が invalid JSON の場合は rollback して created file を残さない', async () => {
    // Given
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{ invalid json', 'utf8');
    const { runInit } = await loadInitModule();

    // When + Then
    expect(() => runInit({ force: false, cwd: tempDir })).toThrow();
    // template files should be removed by rollback
    expect(fs.existsSync(path.join(tempDir, 'e2e/connect.spec.ts'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'playwright.config.ts'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'tsconfig.json'))).toBe(false);
    // e2e dir should be removed if it was created by runInit
    expect(fs.existsSync(path.join(tempDir, 'e2e'))).toBe(false);
  });

  it('T-INIT-010 既存 tsconfig.json が strict=false の場合は warning を返し上書きしない', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(
      tempDir,
      'tsconfig.json',
      JSON.stringify(
        {
          compilerOptions: {
            strict: false,
            target: 'ES2020',
          },
        },
        null,
        2,
      ),
    );
    const { runInit } = await loadInitModule();

    const result = runInit({ force: false, cwd: tempDir });

    expect(result.warnings).toContain(
      'Existing tsconfig.json has "strict": false. kiwa init did not modify it.',
    );
    expect(readFile(tempDir, 'tsconfig.json')).toContain('"strict": false');
    expect(result.created).not.toContain('tsconfig.json');
  });

  it('T-INIT-011 --testDir 指定で spec を tests/dapp-e2e/ 配下に生成し playwright.config.ts も同 dir を指す', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    const result = runInit({ force: false, cwd: tempDir, testDir: 'tests/dapp-e2e' });

    expect(fs.existsSync(path.join(tempDir, 'tests/dapp-e2e/connect.spec.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'e2e/connect.spec.ts'))).toBe(false);
    expect(readFile(tempDir, 'playwright.config.ts')).toContain("testDir: './tests/dapp-e2e'");
    expect(result.created).toEqual(
      expect.arrayContaining(['tests/dapp-e2e/connect.spec.ts', 'playwright.config.ts']),
    );
  });

  it('T-INIT-012 --config-suffix 指定で playwright.kiwa.config.ts を生成し script は config 経由 playwright test を指す', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    runInit({
      force: false,
      cwd: tempDir,
      testDir: 'tests/kiwa',
      configSuffix: 'kiwa',
      scriptKey: 'test:kiwa',
    });

    expect(fs.existsSync(path.join(tempDir, 'playwright.kiwa.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'playwright.config.ts'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'tests/kiwa/connect.spec.ts'))).toBe(true);

    const pkg = readPackageJson(tempDir);
    expect(pkg.scripts['test:kiwa']).toBe('playwright test --config=playwright.kiwa.config.ts');
    expect(pkg.scripts['test:e2e']).toBeUndefined();
  });

  it('T-INIT-013 --testDir に絶対 path / ../ を指定すると Error', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    expect(() => runInit({ force: false, cwd: tempDir, testDir: '/etc' })).toThrow(
      /relative path/,
    );
    expect(() => runInit({ force: false, cwd: tempDir, testDir: '../escape' })).toThrow(
      /relative path/,
    );
  });

  it('T-INIT-014 --config-suffix に [a-zA-Z0-9_-]+ 以外を指定すると Error', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    expect(() => runInit({ force: false, cwd: tempDir, configSuffix: 'bad/name' })).toThrow(
      /config-suffix/,
    );
  });

  it('T-INIT-015 --with-deploy 指定で tests/{prepare-env,global-setup,global-teardown,fixture}.ts を生成し FOUNDRY_PATH を埋め込む', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    const result = runInit({
      force: false,
      cwd: tempDir,
      withDeploy: '../contract',
    });

    const generatedFiles = [
      'tests/prepare-env.ts',
      'tests/global-setup.ts',
      'tests/global-teardown.ts',
      'tests/fixture.ts',
    ];
    for (const file of generatedFiles) {
      expect(fs.existsSync(path.join(tempDir, file))).toBe(true);
      expect(result.created).toContain(file);
    }

    const prepareEnv = readFile(tempDir, 'tests/prepare-env.ts');
    expect(prepareEnv).toContain("const FOUNDRY_PATH = '../contract';");
    expect(prepareEnv).toContain("import { startAnvil, deployContract } from '@kiwa-lab/dapp';");

    const fixture = readFile(tempDir, 'tests/fixture.ts');
    expect(fixture).toContain("import { dappE2eTest as baseTest } from '@kiwa-lab/dapp';");
  });

  it('T-INIT-016 --with-deploy 既存 tests/prepare-env.ts と衝突したら InitConflictError', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'tests/prepare-env.ts', '// existing\n');
    const { InitConflictError, runInit } = await loadInitModule();

    let thrown: (Error & { conflicts: string[] }) | null = null;
    expect(() => {
      try {
        runInit({ force: false, cwd: tempDir, withDeploy: '../contract' });
      } catch (e) {
        thrown = e as Error & { conflicts: string[] };
        throw e;
      }
    }).toThrow(InitConflictError);
    expect(thrown?.conflicts).toContain('tests/prepare-env.ts');
  });

  it('T-INIT-017 testDir empty string defaults to "e2e"', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, testDir: '' } as Parameters<typeof runInit>[0]);
    expect(fs.existsSync(path.join(tempDir, 'e2e'))).toBe(true);
  });

  it('T-INIT-018 testDir undefined defaults to "e2e"', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    expect(fs.existsSync(path.join(tempDir, 'e2e'))).toBe(true);
  });

  it('T-INIT-019 testDir relative subdir', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, testDir: 'src/tests/e2e' } as Parameters<typeof runInit>[0]);
    expect(fs.existsSync(path.join(tempDir, 'src/tests/e2e'))).toBe(true);
  });

  it('T-INIT-020 testDir absolute path - rejects', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    expect(() =>
      runInit({ force: false, cwd: tempDir, testDir: '/abs/path' } as Parameters<typeof runInit>[0]),
    ).toThrow(/relative path/);
  });

  it('T-INIT-021 testDir contains ".." - rejects', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    expect(() =>
      runInit({ force: false, cwd: tempDir, testDir: '../outside' } as Parameters<typeof runInit>[0]),
    ).toThrow(/relative path/);
  });

  it('T-INIT-022 testDir trailing slash - normalized', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    const result = runInit({ force: false, cwd: tempDir, testDir: 'e2e/' } as Parameters<typeof runInit>[0]);
    expect(result.created.some((f) => f.startsWith('e2e/'))).toBe(true);
  });

  it('T-INIT-023 testDir "./" prefix - stripped', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, testDir: './tests/e2e' } as Parameters<typeof runInit>[0]);
    expect(fs.existsSync(path.join(tempDir, 'tests/e2e'))).toBe(true);
  });

  it('T-INIT-024 configSuffix - valid alphanumeric "ci"', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, configSuffix: 'ci' } as Parameters<typeof runInit>[0]);
    expect(fs.existsSync(path.join(tempDir, 'playwright.ci.config.ts'))).toBe(true);
  });

  it('T-INIT-025 configSuffix - hyphen and underscore allowed', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, configSuffix: 'my-test_env' } as Parameters<typeof runInit>[0]);
    expect(fs.existsSync(path.join(tempDir, 'playwright.my-test_env.config.ts'))).toBe(true);
  });

  it('T-INIT-026 configSuffix - period rejected', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    expect(() =>
      runInit({ force: false, cwd: tempDir, configSuffix: 'a.b' } as Parameters<typeof runInit>[0]),
    ).toThrow(/config-suffix/);
  });

  it('T-INIT-027 configSuffix - special char rejected', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    expect(() =>
      runInit({ force: false, cwd: tempDir, configSuffix: 'a@b' } as Parameters<typeof runInit>[0]),
    ).toThrow(/config-suffix/);
  });

  it('T-INIT-028 scriptKey custom - script name overrides "test:e2e"', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, scriptKey: 'my-test' } as Parameters<typeof runInit>[0]);
    const pkg = readPackageJson(tempDir);
    expect(pkg.scripts['my-test']).toBeDefined();
  });

  it('T-INIT-029 default scriptKey "test:e2e"', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    const pkg = readPackageJson(tempDir);
    expect(pkg.scripts['test:e2e']).toBeDefined();
  });

  it('T-INIT-030 existing scriptKey not overridden', async () => {
    seedPackageJson(tempDir, {
      name: 'host',
      version: '1.0.0',
      scripts: { 'test:e2e': 'custom-cmd' },
    });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    const pkg = readPackageJson(tempDir);
    expect(pkg.scripts['test:e2e']).toBe('custom-cmd');
  });

  it('T-INIT-031 devDeps not overridden when present', async () => {
    seedPackageJson(tempDir, {
      name: 'host',
      version: '1.0.0',
      devDependencies: { '@kiwa-lab/dapp': '1.2.3' },
    });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    const pkg = readPackageJson(tempDir);
    expect(pkg.devDependencies['@kiwa-lab/dapp']).toBe('1.2.3');
  });

  it('T-INIT-032 indent detection - tab', async () => {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      '{\n\t"name": "host",\n\t"version": "1.0.0"\n}\n',
      'utf8',
    );
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    const raw = fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8');
    expect(raw).toContain('\t"');
  });

  it('T-INIT-033 indent detection - 4 spaces', async () => {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      '{\n    "name": "host",\n    "version": "1.0.0"\n}\n',
      'utf8',
    );
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    const raw = fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8');
    const lines = raw.split('\n');
    expect(lines.find((line) => line.startsWith('    "'))).toBeDefined();
  });

  it('T-INIT-034 tsconfig strict false - warning emitted', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'tsconfig.json', '{ "compilerOptions": { "strict": false } }\n');
    const { runInit } = await loadInitModule();
    const result = runInit({ force: false, cwd: tempDir });
    expect(result.warnings.some((w) => w.includes('strict'))).toBe(true);
  });

  it('T-INIT-035 tsconfig strict true - no warning', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'tsconfig.json', '{ "compilerOptions": { "strict": true } }\n');
    const { runInit } = await loadInitModule();
    const result = runInit({ force: false, cwd: tempDir });
    expect(result.warnings.filter((w) => w.includes('strict')).length).toBe(0);
  });

  it('T-INIT-036 tsconfig with comments - strict false parsed and warning emitted', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(
      tempDir,
      'tsconfig.json',
      '{\n  // comment\n  "compilerOptions": {\n    /* block */\n    "strict": false\n  }\n}\n',
    );
    const { runInit } = await loadInitModule();
    const result = runInit({ force: false, cwd: tempDir });
    expect(result.warnings.some((w) => w.includes('strict'))).toBe(true);
  });

  it('T-INIT-037 with-deploy backslash path - normalized to forward', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, withDeploy: 'contract\\sub' } as Parameters<typeof runInit>[0]);
    const prepareEnv = readFile(tempDir, 'tests/prepare-env.ts');
    expect(prepareEnv).toContain('contract/sub');
  });

  it('T-INIT-038 with-deploy trailing slash stripped', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, withDeploy: 'contract/' } as Parameters<typeof runInit>[0]);
    const prepareEnv = readFile(tempDir, 'tests/prepare-env.ts');
    expect(prepareEnv).toContain("'contract'");
  });

  it('T-INIT-039 InitConflictError message contains file list', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'e2e/connect.spec.ts', '// existing\n');
    const { InitConflictError, runInit } = await loadInitModule();
    let captured: Error | null = null;
    try {
      runInit({ force: false, cwd: tempDir });
    } catch (e) {
      captured = e as Error;
    }
    expect(captured).toBeInstanceOf(InitConflictError);
    expect(captured?.message).toContain('Conflicting files');
    expect(captured?.message).toContain('--force');
  });

  it('T-INIT-040 InitConflictError conflicts property contains expected paths', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'e2e/connect.spec.ts', '// existing\n');
    writeFile(tempDir, 'playwright.config.ts', '// existing\n');
    const { InitConflictError, runInit } = await loadInitModule();
    let captured: (Error & { conflicts: string[] }) | null = null;
    try {
      runInit({ force: false, cwd: tempDir });
    } catch (e) {
      captured = e as Error & { conflicts: string[] };
    }
    expect(captured).toBeInstanceOf(InitConflictError);
    expect(captured?.conflicts).toContain('e2e/connect.spec.ts');
    expect(captured?.conflicts).toContain('playwright.config.ts');
  });

  it('T-INIT-041 force=true - existing file overwritten', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'e2e/connect.spec.ts', '// existing\n');
    const { runInit } = await loadInitModule();
    runInit({ force: true, cwd: tempDir });
    const content = readFile(tempDir, 'e2e/connect.spec.ts');
    expect(content).not.toBe('// existing\n');
  });

  it('T-INIT-042 no package.json - skip script/devDeps update', async () => {
    const { runInit } = await loadInitModule();
    const result = runInit({ force: false, cwd: tempDir });
    expect(result.updated).not.toContain('package.json');
  });

  it('T-INIT-043 with-deploy empty string - rejects', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    expect(() =>
      runInit({ force: false, cwd: tempDir, withDeploy: '' } as Parameters<typeof runInit>[0]),
    ).toThrow(/with-deploy/);
  });

  it('T-INIT-044 with-deploy absolute path - rejects', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    expect(() =>
      runInit({ force: false, cwd: tempDir, withDeploy: '/abs/contract' } as Parameters<typeof runInit>[0]),
    ).toThrow(/relative path/);
  });

  it('T-INIT-045 generated playwright config testDir matches default "./e2e"', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    const content = readFile(tempDir, 'playwright.config.ts');
    expect(content).toMatch(/testDir:\s*['"]\.\/e2e['"]/);
  });

  it('T-INIT-046 generated playwright config testDir uses custom testDir with leading "./"', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, testDir: 'custom/e2e' } as Parameters<typeof runInit>[0]);
    const content = readFile(tempDir, 'playwright.config.ts');
    expect(content).toMatch(/testDir:\s*['"]\.\/custom\/e2e['"]/);
  });

  it('T-INIT-047 generated WITH_DEPLOY tests/prepare-env.ts present', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, withDeploy: 'contract' } as Parameters<typeof runInit>[0]);
    expect(fs.existsSync(path.join(tempDir, 'tests/prepare-env.ts'))).toBe(true);
  });

  it('T-INIT-048 generated WITH_DEPLOY tests/global-setup.ts present', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, withDeploy: 'contract' } as Parameters<typeof runInit>[0]);
    expect(fs.existsSync(path.join(tempDir, 'tests/global-setup.ts'))).toBe(true);
  });

  it('T-INIT-049 generated WITH_DEPLOY tests/global-teardown.ts present', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, withDeploy: 'contract' } as Parameters<typeof runInit>[0]);
    expect(fs.existsSync(path.join(tempDir, 'tests/global-teardown.ts'))).toBe(true);
  });

  it('T-INIT-050 generated WITH_DEPLOY tests/fixture.ts present', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, withDeploy: 'contract' } as Parameters<typeof runInit>[0]);
    expect(fs.existsSync(path.join(tempDir, 'tests/fixture.ts'))).toBe(true);
  });

  it('T-INIT-051 devDeps @kiwa-lab/dapp version = ^0.1.0', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    const pkg = readPackageJson(tempDir);
    expect(pkg.devDependencies['@kiwa-lab/dapp']).toBe('^0.1.0');
  });

  it('T-INIT-052 devDeps @playwright/test version = ^1.49.0', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    const pkg = readPackageJson(tempDir);
    expect(pkg.devDependencies['@playwright/test']).toBe('^1.49.0');
  });

  it('T-INIT-053 devDeps viem version = ^2', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    const pkg = readPackageJson(tempDir);
    expect(pkg.devDependencies.viem).toBe('^2');
  });

  it('T-INIT-054 default script "test:e2e" = "playwright test"', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    const pkg = readPackageJson(tempDir);
    expect(pkg.scripts['test:e2e']).toBe('playwright test');
  });

  it('T-INIT-055 custom configSuffix script uses --config flag', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, configSuffix: 'ci' } as Parameters<typeof runInit>[0]);
    const pkg = readPackageJson(tempDir);
    expect(pkg.scripts['test:e2e']).toBe('playwright test --config=playwright.ci.config.ts');
  });

  it('T-INIT-056 tsconfig.json created when missing', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    const result = runInit({ force: false, cwd: tempDir });
    expect(fs.existsSync(path.join(tempDir, 'tsconfig.json'))).toBe(true);
    expect(result.created).toContain('tsconfig.json');
  });

  it('T-INIT-057 indent default 2 spaces when no leading whitespace lines', async () => {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      '{"name":"host","version":"1.0.0"}\n',
      'utf8',
    );
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir });
    const raw = fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8');
    expect(raw).toContain('  "');
  });

  it('T-INIT-058 InitConflictError preserves error name', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'e2e/connect.spec.ts', '// existing\n');
    const { InitConflictError, runInit } = await loadInitModule();
    try {
      runInit({ force: false, cwd: tempDir });
      expect.fail('should have thrown');
    } catch (e) {
      expect((e as Error).name).toBe('InitConflictError');
    }
  });

  it('T-INIT-059 conflicts joined with ", " in message', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'e2e/connect.spec.ts', '// existing\n');
    writeFile(tempDir, 'playwright.config.ts', '// existing\n');
    const { runInit } = await loadInitModule();
    try {
      runInit({ force: false, cwd: tempDir });
    } catch (e) {
      expect((e as Error).message).toMatch(/, /);
    }
  });

  it('T-INIT-060 with-deploy "./contract" - ./ prefix preserved in foundry path', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, withDeploy: './contract' } as Parameters<typeof runInit>[0]);
    const prepareEnv = readFile(tempDir, 'tests/prepare-env.ts');
    expect(prepareEnv).toMatch(/FOUNDRY_PATH = ['"]\.\/contract['"]/);
  });

  it('T-INIT-061 with-deploy normalized backslash and trailing slash combo', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, withDeploy: 'contract\\foo\\' } as Parameters<typeof runInit>[0]);
    const prepareEnv = readFile(tempDir, 'tests/prepare-env.ts');
    expect(prepareEnv).toContain("'contract/foo'");
  });

  it('T-INIT-062 force overwrites existing playwright.config.ts', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'playwright.config.ts', '// custom\n');
    const { runInit } = await loadInitModule();
    runInit({ force: true, cwd: tempDir });
    const content = readFile(tempDir, 'playwright.config.ts');
    expect(content).not.toBe('// custom\n');
    expect(content).toMatch(/testDir/);
  });

  it('T-INIT-063 tsconfig with strict missing key returns no warning', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'tsconfig.json', '{ "compilerOptions": { "target": "es2022" } }\n');
    const { runInit } = await loadInitModule();
    const result = runInit({ force: false, cwd: tempDir });
    expect(result.warnings.filter((w) => w.includes('strict')).length).toBe(0);
  });

  it('T-INIT-064 tsconfig without compilerOptions - no warning', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'tsconfig.json', '{ "files": ["src/index.ts"] }\n');
    const { runInit } = await loadInitModule();
    const result = runInit({ force: false, cwd: tempDir });
    expect(result.warnings.filter((w) => w.includes('strict')).length).toBe(0);
  });

  it('T-INIT-065 tsconfig with strict non-boolean - no warning', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'tsconfig.json', '{ "compilerOptions": { "strict": "yes" } }\n');
    const { runInit } = await loadInitModule();
    const result = runInit({ force: false, cwd: tempDir });
    expect(result.warnings.filter((w) => w.includes('strict')).length).toBe(0);
  });

  it('T-INIT-066 invalid tsconfig JSON - no error, no warning', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'tsconfig.json', '{ broken json\n');
    const { runInit } = await loadInitModule();
    expect(() => runInit({ force: false, cwd: tempDir })).not.toThrow();
  });

  it('T-INIT-067 with-deploy default value "" handled (rejected)', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    expect(() =>
      runInit({ force: false, cwd: tempDir, withDeploy: '' } as Parameters<typeof runInit>[0]),
    ).toThrow();
  });

  it('T-INIT-068 InitConflictError message includes the literal "Use --force"', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'e2e/connect.spec.ts', '// existing\n');
    const { runInit } = await loadInitModule();
    try {
      runInit({ force: false, cwd: tempDir });
    } catch (e) {
      expect((e as Error).message).toContain('Use --force');
    }
  });

  it('T-INIT-069 InitConflictError message starts with "Conflicting files:"', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'e2e/connect.spec.ts', '// existing\n');
    const { runInit } = await loadInitModule();
    try {
      runInit({ force: false, cwd: tempDir });
    } catch (e) {
      expect((e as Error).message.startsWith('Conflicting files:')).toBe(true);
    }
  });

  it('T-INIT-070 configSuffix "ci" - "playwright.ci.config.ts" exact name', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();
    runInit({ force: false, cwd: tempDir, configSuffix: 'ci' } as Parameters<typeof runInit>[0]);
    expect(fs.existsSync(path.join(tempDir, 'playwright.ci.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'playwright.config.ts'))).toBe(false);
  });
});

/**
 * A template is what a user ends up with, and it is not TypeScript until `init`
 * writes it out. Three of them imported `@kiwa-test/dapp` — the scope this
 * repository left in v2.13 — for as long as nobody ran these tests. The rename
 * updated the assertions above and missed the `.tpl` files; the sweep that caught
 * the same leftover elsewhere searched `*.ts` and `*.tsx`.
 *
 * So these read every file under `templates/`, whatever it is named.
 */
describe('the templates name packages that exist', () => {
  const TEMPLATE_DIR = path.resolve(process.cwd(), 'src', 'templates');

  function everyTemplate(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? everyTemplate(full) : [full];
    });
  }

  it('T-INIT-100 the template directory is read, and it is not empty', () => {
    // A search that finds nothing passes every test below it.
    expect(everyTemplate(TEMPLATE_DIR).length).toBeGreaterThanOrEqual(7);
  });

  it('T-INIT-101 no template names the scope this repository left', () => {
    const named = everyTemplate(TEMPLATE_DIR).filter((file) =>
      fs.readFileSync(file, 'utf-8').includes('@kiwa-test'),
    );

    expect(named.map((file) => path.relative(TEMPLATE_DIR, file))).toEqual([]);
  });

  it('T-INIT-102 every kiwa package a template imports is one the project declares', () => {
    // `init` writes a `package.json` naming its devDependencies. A template that
    // imports anything else leaves the user with an import resolving to nothing
    // they installed.
    const imported = new Set<string>();
    for (const file of everyTemplate(TEMPLATE_DIR)) {
      const body = fs.readFileSync(file, 'utf-8');
      for (const match of body.matchAll(/from '(@kiwa[^']+)'/g)) imported.add(match[1] as string);
    }

    expect([...imported].sort()).toEqual(['@kiwa-lab/dapp']);
  });
});
