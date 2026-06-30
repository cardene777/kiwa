// migration.sql.ts — initial Postgres schema as SQL strings.

export const INITIAL_MIGRATION = `
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL
  );

  CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE
  );

  CREATE INDEX posts_author_idx ON posts(author_id);
`;
