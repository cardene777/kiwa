// migration.sql.ts — initial SQLite schema for Kysely.

export const INITIAL_MIGRATION = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL
  );

  CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX posts_author_idx ON posts(author_id);
`;
