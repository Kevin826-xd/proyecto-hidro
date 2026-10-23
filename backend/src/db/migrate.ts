import { database } from "./connection";
import { migrations } from "./migrations";

// Número arbitrario para que dos servidores no apliquen migraciones al mismo tiempo.
const MIGRATION_LOCK_ID = 727001;

export async function runMigrations(): Promise<void> {
  const client = await database.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const applied = await client.query<{ name: string }>("SELECT name FROM schema_migrations");
    const appliedNames = new Set(applied.rows.map((row) => row.name));

    for (const migration of migrations) {
      if (appliedNames.has(migration.name)) continue;

      // Si una migración falla, se deshace completa y el servidor no inicia.
      try {
        await client.query("BEGIN");
        await client.query(migration.sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [migration.name]);
        await client.query("COMMIT");
        console.log(`Migración aplicada: ${migration.name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Falló la migración ${migration.name}: ${(error as Error).message}`);
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]).catch(() => undefined);
    client.release();
  }
}
