// users-repo.ts — production-shape Postgres repository wrapping Drizzle queries.

import { eq } from 'drizzle-orm';
import type { DrizzlePostgresDb } from '@kiwa-lab/orm';
import { posts, schema, users, type Schema } from './schema.js';

export interface CreateUserInput {
  readonly email: string;
  readonly displayName: string;
}

export class UsersRepository {
  constructor(private readonly db: DrizzlePostgresDb<Schema>) {}

  async create(input: CreateUserInput): Promise<{ ok: true; id: number } | { ok: false; reason: 'duplicate-email' }> {
    try {
      const rows = await this.db.insert(users).values(input).returning({ id: users.id });
      return { ok: true, id: rows[0]!.id };
    } catch (caught) {
      if (caught instanceof Error && /duplicate key value violates unique constraint/.test(caught.message)) {
        return { ok: false, reason: 'duplicate-email' };
      }
      throw caught;
    }
  }

  async findByEmail(email: string): Promise<{ id: number; email: string; displayName: string } | null> {
    const rows = await this.db.select().from(users).where(eq(users.email, email));
    return rows[0] ?? null;
  }

  async deleteCascading(id: number): Promise<{ deletedPosts: number }> {
    const before = await this.db.select().from(posts).where(eq(posts.authorId, id));
    await this.db.delete(users).where(eq(users.id, id));
    return { deletedPosts: before.length };
  }
}

export { schema };
