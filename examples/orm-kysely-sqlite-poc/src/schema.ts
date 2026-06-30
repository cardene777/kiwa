// schema.ts — Kysely Database interface for the orm-kysely-sqlite-poc.
//
// Kysely は ORM ではなく query builder のため、 schema は phantom-typed
// `Database` interface を手書きする (kysely-codegen で自動生成も可)。

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
  published: 0 | 1; // SQLite boolean as integer
}

export interface Database {
  users: UsersTable;
  posts: PostsTable;
}

// kiwa の setupOrmEnv が `schema` を phantom 型として受けるため、 空オブジェクトを export。
export const schema = {} as Database;
