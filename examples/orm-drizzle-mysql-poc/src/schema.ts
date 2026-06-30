// schema.ts — Drizzle MySQL schema for the orm-drizzle-mysql-poc.

import { mysqlTable, int, varchar, boolean, index } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
});

export const posts = mysqlTable(
  'posts',
  {
    id: int('id').autoincrement().primaryKey(),
    authorId: int('author_id').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    published: boolean('published').notNull().default(false),
  },
  (t) => ({ authorIdx: index('posts_author_idx').on(t.authorId) }),
);

export const schema = { users, posts };
export type Schema = typeof schema;
