// migrations/20260101_create_users.mjs — Kysely Migrator file-based migration.

export async function up(db) {
  await db.schema
    .createTable('users')
    .addColumn('id', 'integer', (c) => c.primaryKey().autoIncrement())
    .addColumn('email', 'text', (c) => c.notNull().unique())
    .addColumn('display_name', 'text', (c) => c.notNull())
    .execute();
}

export async function down(db) {
  await db.schema.dropTable('users').execute();
}
