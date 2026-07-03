export default async function globalSetup(): Promise<void> {
  // prepare-env.ts is invoked by playwright.config.ts webServer.command
  // before pnpm build, so nothing to do here.
}
