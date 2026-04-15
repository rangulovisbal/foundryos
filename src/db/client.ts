import fs from "node:fs/promises";
import path from "node:path";

import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { env } from "@/lib/env";
import { ConfigurationError } from "@/lib/errors";

type AppDb =
  | ReturnType<typeof drizzleNeon<typeof schema>>
  | ReturnType<typeof drizzlePostgres<typeof schema>>;

let dbPromise: Promise<AppDb | null> | null = null;

async function createEmbeddedDevelopmentDb() {
  const nodeRequire = eval("require") as NodeRequire;
  const { PGlite } =
    nodeRequire("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } =
    nodeRequire("drizzle-orm/pglite") as typeof import("drizzle-orm/pglite");
  const { migrate: migratePglite } = nodeRequire(
    "drizzle-orm/pglite/migrator"
  ) as typeof import("drizzle-orm/pglite/migrator");
  const dataDir = path.join(process.cwd(), "data", "foundation-db");
  await fs.mkdir(dataDir, { recursive: true });

  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema }) as unknown as AppDb;

  await migratePglite(db as never, {
    migrationsFolder: path.join(process.cwd(), "drizzle")
  });

  return db;
}

async function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (env.vercelEnv === "development") {
      return createEmbeddedDevelopmentDb();
    }

    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new ConfigurationError(
      "DATABASE_URL must be a valid Postgres connection string, for example postgresql://user:password@host/dbname?sslmode=require."
    );
  }

  if (!["postgresql:", "postgres:"].includes(parsedUrl.protocol)) {
    throw new ConfigurationError(
      "DATABASE_URL must use the postgresql:// or postgres:// protocol."
    );
  }

  if (parsedUrl.hostname.endsWith(".neon.tech")) {
    const sql = neon(databaseUrl);
    return drizzleNeon(sql, { schema });
  }

  const sql = postgres(databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 5,
    prepare: false,
    ssl: "require"
  });

  return drizzlePostgres(sql, { schema });
}

export async function getDb() {
  if (!dbPromise) {
    dbPromise = createDb();
  }

  return dbPromise;
}

export async function requireDb(purpose: string) {
  const db = await getDb();

  if (!db) {
    throw new ConfigurationError(
      `DATABASE_URL is required for ${purpose}. Local development uses an embedded Postgres-compatible database automatically, but preview and production auth/workspace persistence need a real database.`
    );
  }

  return db;
}
