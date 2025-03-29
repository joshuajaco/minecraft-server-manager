import { createClient } from "@libsql/client";

export const client = createClient({ url: "file:local.db" });

export type MinecraftServer = { name: string; dir: string };

await client.execute(
  "CREATE TABLE IF NOT EXISTS 'minecraft-servers' (name TEXT UNIQUE, dir TEXT UNIQUE)",
);
