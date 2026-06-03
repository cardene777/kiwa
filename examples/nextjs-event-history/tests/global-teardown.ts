export default async function globalTeardown() {
  const pid = Number(process.env.ANVIL_PID ?? 0);
  if (pid > 0) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // ignore
    }
  }
}
