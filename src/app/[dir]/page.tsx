import { authenticate } from "../../auth";
import { client, MinecraftServer } from "../../db";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";
import { notFound } from "next/navigation";
import { Server } from "../_components/Server";

export default async function DetailsPage({
  params,
}: {
  params: Promise<{ dir: string }>;
}) {
  await authenticate();
  const { dir } = await params;
  const server = await getServer(dir);
  if (!server) notFound();
  return (
    <div>
      <Server {...server} />
    </div>
  );
}

async function getServer(dir: string): Promise<MinecraftServer | null> {
  "use cache";
  cacheTag("server", dir);
  cacheLife("seconds");
  const result = await client.execute({
    sql: "SELECT * FROM 'minecraft-servers' WHERE dir=(?)",
    args: [dir],
  });
  if (!result.rows[0]) return null;
  return { ...result.rows[0] } as unknown as MinecraftServer;
}
