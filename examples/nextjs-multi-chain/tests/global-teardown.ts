export default async function globalTeardown() {
  const pids = (process.env.ANVIL_PIDS ?? '').split(',').filter(Boolean).map(Number);
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // ignore
    }
  }
}
