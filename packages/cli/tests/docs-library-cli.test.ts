import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { runInit } from '../src/commands/init.js';
import { runSpecToTest } from '../src/commands/spec-to-test.js';
import { planRunWatch } from '../src/commands/run-watch.js';

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function createProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'kiwa-cli-docs-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'docs-example', version: '1.0.0' }));
  return dir;
}

test('the quickstart scaffolds the expected files without overwriting existing input', () => {
  const dir = createProject();
  const result = runInit({ force: false, cwd: dir });
  expect(result.created).toEqual(expect.arrayContaining(['e2e/connect.spec.ts', 'playwright.config.ts']));
  expect(existsSync(join(dir, 'e2e', 'connect.spec.ts'))).toBe(true);
  expect(readFileSync(join(dir, 'package.json'), 'utf8')).toContain('test:e2e');
});

test('the how-to generates an API test draft and plans watch commands without starting them', () => {
  const dir = createProject();
  const specPath = join(dir, 'tests', 'profile.spec.md');
  const outPath = join(dir, 'tests', 'profile.spec.test.ts');
  mkdirSync(join(dir, 'tests'), { recursive: true });
  writeFileSync(
    specPath,
    `- module: profile\n- layer: api\n\n| id | observation | given | when | then | automation | mode | route |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| T-PROFILE-001 | reads profile | user exists | GET /profile | returns 200 | yes | live | /profile |\n`,
  );
  const generated = runSpecToTest({ inPath: specPath, outPath, cwd: dir, layer: 'api' });
  expect(generated).toMatchObject({ module: 'profile', layer: 'api', count: 1 });
  expect(readFileSync(outPath, 'utf8')).toContain("env.request.get('/profile')");
  expect(planRunWatch(['api'])).toHaveLength(1);
});
