// Behavior test for v1.58-4 publish PR。
// v1.58 = @kiwa-test/desktop v0.3 advanced III 4 axis (Screen recording + Global shortcut + Clipboard + Dark-mode)
// systematic root cause pattern SSOT 33rd application.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

function readText(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

function readJson<T = unknown>(rel: string): T {
  return JSON.parse(readText(rel)) as T;
}

describe('v1.58-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.58.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.58.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.58/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.58/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.58');
    }
  });

  it('VitePress config.mts wires v1.58 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.58');
    for (const link of [
      '/tutorials/118-desktop-advanced-iii',
      '/concepts/desktop-advanced-iii',
      '/migrations/v1.57-to-v1.58',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/desktop package.json is v0.3.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/desktop/package.json');
    expect(pkg.name).toBe('@kiwa-test/desktop');
    expect(pkg.version).toBe('0.3.0');
  });

  it('v0.3 4 axis semantics file 全存在 (screen-recording + global-shortcut + clipboard + dark-mode)', () => {
    for (const rel of [
      'packages/desktop/src/semantics/screen-recording.ts',
      'packages/desktop/src/semantics/global-shortcut.ts',
      'packages/desktop/src/semantics/clipboard.ts',
      'packages/desktop/src/semantics/dark-mode.ts',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
    }
  });

  it('release script filter contains @kiwa-test/desktop (33rd application、 v1.57 継承)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/desktop');
    expect(release).toContain('--filter @kiwa-test/desktop');
  });

  it('dogfood-desktop-electron-app has v0.3 4 axis workflow runners', () => {
    const workflow = readText('examples/dogfood-desktop-electron-app/src/workflow.ts');
    for (const runner of [
      'runScreenRecordingAxis',
      'runGlobalShortcutAxis',
      'runClipboardAxis',
      'runDarkModeAxis',
      'runFullDesktopWorkflowV03',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v1.58.test.ts snippet exists (36 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/tests/docs-tutorial-v1.58.test.ts'))).toBe(true);
  });
});
