// kiwa init --with-deploy で生成された Playwright globalTeardown slot。
// playwright.config.ts の `globalTeardown` に本 file path を指定する。
import fs from 'node:fs';
import path from 'node:path';

const PID_FILE = path.join(process.cwd(), '.kiwa-anvil.pid');

export default async function globalTeardown(): Promise<void> {
  const stop = (globalThis as { __kiwaAnvilStop?: () => Promise<void> }).__kiwaAnvilStop;
  if (typeof stop === 'function') {
    await stop();
  }
  if (fs.existsSync(PID_FILE)) {
    try {
      fs.unlinkSync(PID_FILE);
    } catch {
      // already removed; ignore
    }
  }
}
