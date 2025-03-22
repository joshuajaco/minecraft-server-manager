import { createClient } from "@libsql/client";

export const client = createClient({ url: "file:local.db" });

export type Server = { name: string };

await client.execute(
  "CREATE TABLE IF NOT EXISTS 'minecraft-servers' (name TEXT UNIQUE)",
);
