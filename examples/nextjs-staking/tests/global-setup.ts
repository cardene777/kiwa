// prepare-env.ts (webServer.command 前段) で anvil 起動 + contract deploy 完了済み。
// global-setup は no-op で保持 (Playwright config から referenced)。
export default async function globalSetup(): Promise<void> {
  // intentionally empty
}
