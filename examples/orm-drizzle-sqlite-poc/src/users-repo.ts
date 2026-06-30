// users-repo.ts — production-shape repository wrapping Drizzle queries.
//
// kiwa unit test では setupOrmEnv で env.db を取得して `new UsersRepository(env.db)`
// として直接 invoke できる。 production code では同じ class を実 Drizzle client で生成。

import { eq } from 'drizzle-orm';
import type { DrizzleSqliteDb } from '@kiwa-test/orm';
import { posts, schema, users, type Schema } from './schema.js';

export interface CreateUserInput {
  readonly id: number;
  readonly email: string;
  readonly displayName: string;
}

export class UsersRepository {
  constructor(private readonly db: DrizzleSqliteDb<Schema>) {}

  create(input: CreateUserInput): { ok: true } | { ok: false; reason: 'duplicate-email' } {
    try {
      this.db.insert(users).values(input).run();
      return { ok: true };
    } catch (caught) {
      if (caught instanceof Error && /UNIQUE constraint failed: users\.email/.test(caught.message)) {
        return { ok: false, reason: 'duplicate-email' };
      }
      throw caught;
    }
  }

  findByEmail(email: string): { id: number; email: string; displayName: string } | null {
    const rows = this.db.select().from(users).where(eq(users.email, email)).all();
    return rows[0] ?? null;
  }

  deleteCascading(id: number): { deletedPosts: number } {
    const before = this.db.select().from(posts).where(eq(posts.authorId, id)).all().length;
    this.db.delete(users).where(eq(users.id, id)).run();
    return { deletedPosts: before };
  }
}
// Re-export schema so tests can import everything from one place.
export { schema };
