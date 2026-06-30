// users-repo.ts — production-shape Kysely repository.

import type { Kysely } from 'kysely';
import type { Database } from './schema.js';

export interface CreateUserInput {
  readonly email: string;
  readonly displayName: string;
}

export class UsersRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(input: CreateUserInput): Promise<{ ok: true; id: number } | { ok: false; reason: 'duplicate-email' }> {
    try {
      const result = await this.db
        .insertInto('users')
        .values({ email: input.email, display_name: input.displayName })
        .returning('id')
        .executeTakeFirstOrThrow();
      return { ok: true, id: result.id };
    } catch (caught) {
      if (caught instanceof Error && /UNIQUE constraint failed: users\.email/.test(caught.message)) {
        return { ok: false, reason: 'duplicate-email' };
      }
      throw caught;
    }
  }

  async findByEmail(email: string): Promise<{ id: number; email: string; display_name: string } | null> {
    const row = await this.db.selectFrom('users').selectAll().where('email', '=', email).executeTakeFirst();
    return row ?? null;
  }

  async deleteCascading(id: number): Promise<{ deletedPosts: number }> {
    const before = await this.db.selectFrom('posts').select(['id']).where('author_id', '=', id).execute();
    await this.db.deleteFrom('users').where('id', '=', id).execute();
    return { deletedPosts: before.length };
  }
}
