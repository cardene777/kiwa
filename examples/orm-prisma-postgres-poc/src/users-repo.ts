// users-repo.ts — production-shape Prisma + Postgres repository.

import type { PrismaClient } from '../prisma/generated/index.js';

export interface CreateUserInput {
  readonly email: string;
  readonly displayName: string;
}

export class UsersRepository {
  constructor(private readonly client: PrismaClient) {}

  async create(input: CreateUserInput): Promise<{ ok: true; id: number } | { ok: false; reason: 'duplicate-email' }> {
    try {
      const created = await this.client.user.create({ data: input });
      return { ok: true, id: created.id };
    } catch (caught) {
      if (typeof caught === 'object' && caught !== null && (caught as { code?: string }).code === 'P2002') {
        return { ok: false, reason: 'duplicate-email' };
      }
      throw caught;
    }
  }

  async findByEmail(email: string): Promise<{ id: number; email: string; displayName: string } | null> {
    return this.client.user.findUnique({ where: { email } });
  }

  async deleteCascading(id: number): Promise<{ deletedPosts: number }> {
    const before = await this.client.post.count({ where: { authorId: id } });
    await this.client.user.delete({ where: { id } });
    return { deletedPosts: before };
  }
}
