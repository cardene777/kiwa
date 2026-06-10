// kiwa init --with-deploy で生成された boilerplate。
// 用途: anvil 起動 → forge build → forge create → .env.local 書き込みまでを一連で行う。
// 試用者カスタマイズ箇所:
//   1. CONTRACT_NAME / CONTRACT_ARGS を deploy したい contract に合わせて変更
//   2. ENV_VAR_NAME を dApp 側が読む env 変数名に合わせて変更
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { startAnvil, deployContract } from '@kiwa-test/core';

const FOUNDRY_PATH = '{{FOUNDRY_PATH}}';
const CONTRACT_NAME = 'YourContract';
const CONTRACT_ARGS: unknown[] = [];
const ENV_VAR_NAME = 'NEXT_PUBLIC_CONTRACT_ADDRESS';
const ANVIL_PORT = 8545;
const ANVIL_DEFAULT_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

export interface PreparedEnv {
  anvilStop: () => Promise<void>;
  contractAddress: `0x${string}`;
}

export async function prepareEnv(cwd: string = process.cwd()): Promise<PreparedEnv> {
  const foundryDir = path.resolve(cwd, FOUNDRY_PATH);
  if (!fs.existsSync(foundryDir)) {
    throw new Error(`prepare-env: foundry project not found at ${foundryDir}`);
  }

  const anvil = await startAnvil({ port: ANVIL_PORT });

  execSync('forge build', { cwd: foundryDir, stdio: 'inherit' });

  const abiPath = path.join(
    foundryDir,
    'out',
    `${CONTRACT_NAME}.sol`,
    `${CONTRACT_NAME}.json`,
  );

  const deployed = await deployContract({
    rpcUrl: `http://127.0.0.1:${ANVIL_PORT}`,
    privateKey: ANVIL_DEFAULT_KEY,
    abiPath,
    args: CONTRACT_ARGS,
  });

  const envPath = path.join(cwd, '.env.local');
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const filtered = existing
    .split('\n')
    .filter((line) => !line.startsWith(`${ENV_VAR_NAME}=`))
    .join('\n');
  const trailing = filtered.length === 0 || filtered.endsWith('\n') ? '' : '\n';
  fs.writeFileSync(envPath, `${filtered}${trailing}${ENV_VAR_NAME}=${deployed.address}\n`, 'utf8');

  return {
    anvilStop: anvil.stop,
    contractAddress: deployed.address as `0x${string}`,
  };
}
