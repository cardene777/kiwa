// schema.ts — Drizzle schema for the orm-drizzle-sqlite-poc.
//
// 2 関連 table (users + posts) で多くの観点を 1 schema で cover。
// posts.author_id は users.id への FK で、 SQLite FK 制約検証経路にも使う。

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey(),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
});

export const schema = { users, posts };
export type Schema = typeof schema;
