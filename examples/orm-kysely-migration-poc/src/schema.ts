// schema.ts — Kysely Database interface for the orm-kysely-migration-poc.
//
// Kysely Migrator は migration file 内で `up(db)` / `down(db)` を実行する。
// この `db` は `Kysely<any>` shape のため、 schema interface は callerが
// 手書きで保持し、 test 側で `Kysely<Database>` 型を narrow する。

import type { Generated } from 'kysely';

export interface UsersTable {
  id: Generated<number>;
  email: string;
  display_name: string;
}

export interface PostsTable {
  id: Generated<number>;
  author_id: number;
  title: string;
  published: 0 | 1;
}

export interface Database {
  users: UsersTable;
  posts: PostsTable;
}

export const schema = {} as Database;
