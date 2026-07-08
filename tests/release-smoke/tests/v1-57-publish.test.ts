// Behavior test for v1.57-4 publish PR。
// v1.57 = @kiwa-test/desktop v0.2 advanced 5 axis (Auto-updater + FS permissions + Notification + Menu-bar + Tray-icon)
// systematic root cause pattern SSOT 32nd application.
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

describe('v1.57-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.57.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.57.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.57/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.57/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.57');
    }
  });

  it('VitePress config.mts wires v1.57 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.57');
    for (const link of [
      '/tutorials/117-desktop-advanced-axis',
      '/concepts/desktop-advanced-axis',
      '/migrations/v1.56-to-v1.57',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/desktop package.json is v0.2.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/desktop/package.json');
    expect(pkg.name).toBe('@kiwa-test/desktop');
    expect(pkg.version).toBe('0.2.0');
  });

  it('v0.2 5 axis semantics file 全存在 (auto-updater + fs-permissions + notification + menu-bar + tray-icon)', () => {
    for (const rel of [
      'packages/desktop/src/semantics/auto-updater.ts',
      'packages/desktop/src/semantics/fs-permissions.ts',
      'packages/desktop/src/semantics/notification.ts',
      'packages/desktop/src/semantics/menu-bar.ts',
      'packages/desktop/src/semantics/tray-icon.ts',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
    }
  });

  it('release script filter contains @kiwa-test/desktop (32nd application、 v1.56 継承)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/desktop');
    expect(release).toContain('--filter @kiwa-test/desktop');
  });

  it('dogfood-desktop-electron-app has v0.2 5 axis workflow runners', () => {
    const workflow = readText('examples/dogfood-desktop-electron-app/src/workflow.ts');
    for (const runner of [
      'runAutoUpdaterAxis',
      'runFsPermissionsAxis',
      'runNotificationAxis',
      'runMenuBarAxis',
      'runTrayIconAxis',
      'runFullDesktopWorkflowV02',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v1.57.test.ts snippet exists (35 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/tests/docs-tutorial-v1.57.test.ts'))).toBe(true);
  });
});
