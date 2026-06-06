// kiwa init --with-deploy で生成された Playwright globalSetup slot。
// playwright.config.ts の `globalSetup` に本 file path を指定する。
import fs from 'node:fs';
import path from 'node:path';
import { prepareEnv } from './prepare-env';

const PID_FILE = path.join(process.cwd(), '.kiwa-anvil.pid');

export default async function globalSetup(): Promise<void> {
  const { anvilStop, contractAddress } = await prepareEnv();
  // anvil PID を pidfile に保存して global-teardown が確実に停止できるようにする
  fs.writeFileSync(PID_FILE, `${process.pid}\n`, 'utf8');
  process.env.KIWA_CONTRACT_ADDRESS = contractAddress;
  // teardown 経由でも停止できるよう anvilStop を global namespace へ
  (globalThis as { __kiwaAnvilStop?: () => Promise<void> }).__kiwaAnvilStop = anvilStop;
}
