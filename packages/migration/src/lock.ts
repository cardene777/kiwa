export interface MigrationLock {
  owner: string;
  acquiredAt: number;
  ttlMs: number;
}

/**
 * migration lock (advisory) を管理する mock。 real Postgres advisory lock /
 * SQLite `PRAGMA locking_mode = EXCLUSIVE` 相当を in-memory で模倣。
 * 並行走行を防ぎ、 duplicate migration apply を排除。
 */
export function createLockRegistry(now: () => number = () => 0) {
  const locks = new Map<string, MigrationLock>();
  return {
    acquire(scope: string, owner: string, ttlMs: number = 60_000): MigrationLock | null {
      const existing = locks.get(scope);
      if (existing && existing.acquiredAt + existing.ttlMs > now()) return null;
      const lock: MigrationLock = { owner, acquiredAt: now(), ttlMs };
      locks.set(scope, lock);
      return lock;
    },
    release(scope: string, owner: string): boolean {
      const existing = locks.get(scope);
      if (!existing || existing.owner !== owner) return false;
      locks.delete(scope);
      return true;
    },
    listActive(): Array<{ scope: string; lock: MigrationLock }> {
      const t = now();
      const out: Array<{ scope: string; lock: MigrationLock }> = [];
      for (const [scope, lock] of locks) {
        if (lock.acquiredAt + lock.ttlMs > t) out.push({ scope, lock });
      }
      return out;
    },
  };
}
