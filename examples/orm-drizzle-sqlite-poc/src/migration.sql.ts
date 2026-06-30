// migration.sql.ts — initial schema as a SQL string for setupOrmEnv({ migrations }).
//
// MVP では SQL string で直接渡す形を採用。 follow-up Issue で drizzle-orm/migrator
// の file-based migration 統合パスを examples-orm-drizzle-postgres-poc で示す予定。

export const INITIAL_MIGRATION = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL
  );

  CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX posts_author_idx ON posts(author_id);
`;
