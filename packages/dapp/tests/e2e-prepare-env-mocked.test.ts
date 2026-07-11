import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// runE2EPrepareEnv は startAnvil に強く依存するため、 anvil 側を mock して
// deploy callback / .env.local Write / .next cleanup / pid file 書出しの分岐をカバー。
vi.mock('../src/anvil.js', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('../src/anvil.js');
  return {
    ...actual,
    startAnvil: vi.fn(),
  };
});

async function loadEnvModule() {
  return await import('../src/e2e-prepare-env.js');
}
async function loadAnvilModule() {
  return await import('../src/anvil.js');
}

describe('runE2EPrepareEnv (mocked startAnvil)', () => {
  let tmp: string;
  let stopMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'kiwa-prep-'));
    stopMock = vi.fn().mockResolvedValue(undefined);
    const anvil = await loadAnvilModule();
    (anvil.startAnvil as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      port: 8545,
      pid: process.pid,
      stop: stopMock,
    });
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('T-EPE-M-001 deploy 成功で .env.local を書き出す (NEXT_PUBLIC_RUNTIME_MODE=test + deployEnv)', async () => {
    const env = await loadEnvModule();
    await env.runE2EPrepareEnv({
      exampleRoot: tmp,
      deploy: async () => ({ NEXT_PUBLIC_TOKEN_ADDRESS: '0xabcd' }),
    });

    const envLocal = join(tmp, '.env.local');
    expect(existsSync(envLocal)).toBe(true);
    const content = readFileSync(envLocal, 'utf8');
    expect(content).toContain('NEXT_PUBLIC_RUNTIME_MODE=test');
    expect(content).toContain('NEXT_PUBLIC_ANVIL_PORT=8545');
    expect(content).toContain('NEXT_PUBLIC_TOKEN_ADDRESS=0xabcd');
  });

  it('T-EPE-M-002 既存 .next ディレクトリは rmSync でクリアされる', async () => {
    const nextDir = join(tmp, '.next');
    const { mkdirSync } = await import('node:fs');
    mkdirSync(nextDir);
    writeFileSync(join(nextDir, 'trace'), 'trace-cache');
    expect(existsSync(nextDir)).toBe(true);

    const env = await loadEnvModule();
    await env.runE2EPrepareEnv({
      exampleRoot: tmp,
      deploy: async () => ({}),
    });

    expect(existsSync(nextDir)).toBe(false);
  });

  it('T-EPE-M-003 pid file が存在すれば書出しで append される (writePidEntry 経路)', async () => {
    const env = await loadEnvModule();
    await env.runE2EPrepareEnv({
      exampleRoot: tmp,
      deploy: async () => ({}),
    });

    const pidFile = join(tmp, '.context/anvil.pid');
    expect(existsSync(pidFile)).toBe(true);
    const line = readFileSync(pidFile, 'utf8').trim();
    const entry = JSON.parse(line);
    expect(entry.pid).toBe(process.pid);
    expect(entry.port).toBe(8545);
  });

  it('T-EPE-M-004 前回の pid file (現存 process の非 anvil pid) は skip される', async () => {
    const pidFile = join(tmp, '.context/anvil.pid');
    const { mkdirSync } = await import('node:fs');
    mkdirSync(join(tmp, '.context'), { recursive: true });
    // 現在の node process pid — anvil でないので matchesPidEntry で skip
    writeFileSync(pidFile, JSON.stringify({ pid: process.pid, command: 'anvil' }) + '\n', 'utf8');

    const env = await loadEnvModule();
    await env.runE2EPrepareEnv({
      exampleRoot: tmp,
      deploy: async () => ({}),
    });

    // pid file は削除されて再作成、 最新 entry のみ残る
    expect(existsSync(pidFile)).toBe(true);
  });

  it('T-EPE-M-005 deploy が throw したら handle.stop() を呼び throw を伝播する', async () => {
    const env = await loadEnvModule();
    await expect(
      env.runE2EPrepareEnv({
        exampleRoot: tmp,
        deploy: async () => {
          throw new Error('deploy failed');
        },
      }),
    ).rejects.toThrow('deploy failed');

    expect(stopMock).toHaveBeenCalledTimes(1);
    // .env.local は書き出されていない
    expect(existsSync(join(tmp, '.env.local'))).toBe(false);
  });

  it('T-EPE-M-006 custom envLocalPath / nextCacheDir / pidFilePath を尊重する', async () => {
    const env = await loadEnvModule();
    await env.runE2EPrepareEnv({
      exampleRoot: tmp,
      envLocalPath: 'config/.env.custom',
      nextCacheDir: 'cache/next',
      pidFilePath: 'state/pid.json',
      deploy: async () => ({}),
    });

    expect(existsSync(join(tmp, 'config/.env.custom'))).toBe(true);
    expect(existsSync(join(tmp, 'state/pid.json'))).toBe(true);
  });

  it('T-EPE-M-007 custom port / chainId / privateKey option が反映される', async () => {
    const env = await loadEnvModule();
    const anvil = await loadAnvilModule();
    const startAnvil = anvil.startAnvil as unknown as ReturnType<typeof vi.fn>;
    startAnvil.mockClear();
    startAnvil.mockResolvedValue({ port: 8600, pid: process.pid, stop: stopMock });

    await env.runE2EPrepareEnv({
      exampleRoot: tmp,
      port: 8600,
      chainId: 4242,
      privateKey: '0x' + '11'.repeat(32) as `0x${string}`,
      deploy: async () => ({}),
    });

    expect(startAnvil).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 8600,
        chainId: 4242,
        detached: true,
        killExistingOnPort: true,
      }),
    );
  });
});
