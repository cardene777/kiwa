// schema.ts — Drizzle Postgres schema for the orm-drizzle-postgres-poc.

import { pgTable, serial, text, integer, boolean, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
});

export const posts = pgTable(
  'posts',
  {
    id: serial('id').primaryKey(),
    authorId: integer('author_id').notNull(),
    title: text('title').notNull(),
    published: boolean('published').notNull().default(false),
  },
  (t) => ({
    authorIdx: index('posts_author_idx').on(t.authorId),
  }),
);

export const schema = { users, posts };
export type Schema = typeof schema;
