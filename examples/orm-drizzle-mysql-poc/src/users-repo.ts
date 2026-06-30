// users-repo.ts — production-shape MySQL repository wrapping Drizzle queries.

import { eq } from 'drizzle-orm';
import type { DrizzleMysqlDb } from '@kiwa-test/orm';
import { posts, schema, users, type Schema } from './schema.js';

export interface CreateUserInput {
  readonly email: string;
  readonly displayName: string;
}

export class UsersRepository {
  constructor(private readonly db: DrizzleMysqlDb<Schema>) {}

  async create(input: CreateUserInput): Promise<{ ok: true; insertId: number } | { ok: false; reason: 'duplicate-email' }> {
    try {
      const result = await this.db.insert(users).values(input).$returningId();
      return { ok: true, insertId: result[0]!.id };
    } catch (caught) {
      if (caught instanceof Error && /Duplicate entry/.test(caught.message)) {
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
