// migrations/20260102_create_posts.mjs — Kysely Migrator file-based migration.

export async function up(db) {
  await db.schema
    .createTable('posts')
    .addColumn('id', 'integer', (c) => c.primaryKey().autoIncrement())
    .addColumn('author_id', 'integer', (c) =>
      c.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('title', 'text', (c) => c.notNull())
    .addColumn('published', 'integer', (c) => c.notNull().defaultTo(0))
    .execute();
  await db.schema.createIndex('posts_author_idx').on('posts').column('author_id').execute();
}

export async function down(db) {
  await db.schema.dropTable('posts').execute();
}
