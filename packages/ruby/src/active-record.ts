import type { RubyAppEnv } from './env.js';

export type ActiveRecordOp = 'find' | 'where' | 'create' | 'update' | 'destroy' | 'all';

export interface ActiveRecordQuery {
  op: ActiveRecordOp;
  model: string;
  args: unknown;
  sql?: string;
}

export interface ActiveRecordSnapshot {
  total: number;
  byOp: Record<ActiveRecordOp, number>;
  byModel: Record<string, number>;
  queries: ActiveRecordQuery[];
}

/**
 * activeRecordLog の集計 snapshot。 op 別 / model 別 count を assertion で使える shape で
 * 露出、 「Post.where 3 回 + User.find 1 回」 等の invariant を書ける。
 */
export function captureActiveRecord(env: RubyAppEnv): ActiveRecordSnapshot {
  const byOp = { find: 0, where: 0, create: 0, update: 0, destroy: 0, all: 0 } as Record<ActiveRecordOp, number>;
  const byModel: Record<string, number> = {};
  for (const q of env.activeRecordLog) {
    byOp[q.op] += 1;
    byModel[q.model] = (byModel[q.model] ?? 0) + 1;
  }
  return {
    total: env.activeRecordLog.length,
    byOp,
    byModel,
    queries: [...env.activeRecordLog],
  };
}
