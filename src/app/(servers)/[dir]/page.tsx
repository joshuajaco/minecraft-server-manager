import { authenticate } from "../../../auth";
import { client, MinecraftServer } from "../../../db";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";
import { notFound } from "next/navigation";
import { Server } from "../../_components/Server";
import { Button, TextField } from "../../../components";
import { Err, Ok, Result } from "../../../result";
import { getLogs, run } from "../../../minecraft-server";
import { Form } from "../../../form";

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
    <div className="border rounded-lg flex flex-col overflow-auto grow">
      <Server {...server} />
      <Logs dir={dir} />
      <Form
        reset
        action={runCommand}
        validate={runCommand.validate}
        className="flex gap-2 p-4"
      >
        <input type="hidden" name="dir" value={dir} />
        <TextField name="command" />
        <Button type="submit" variant="secondary">
          Run
        </Button>
      </Form>
    </div>
  );
}

async function Logs({ dir }: { dir: string }) {
  const logs = await getLogs(dir);
  return <pre className="overflow-auto grow px-4 py-2 border-b">{logs}</pre>;
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

async function runCommand({
  dir,
  command,
}: {
  dir: string;
  command: string;
}): Promise<Result<void, string>> {
  "use server";
  const result = await client.execute({
    sql: "SELECT dir FROM 'minecraft-servers' WHERE dir=(?)",
    args: [dir],
  });
  if (result.rows[0]?.dir !== dir) return Err("Invalid dir");
  await run(dir, command);
  return Ok();
}

runCommand.validate = async (
  formData: FormData,
): Promise<Result<{ command: string; dir: string }, string>> => {
  "use server";
  await authenticate();
  if (!(formData instanceof FormData)) return Err("Invalid form data");
  const command = formData.get("command");
  if (typeof command !== "string") return Err("Invalid form data");
  const dir = formData.get("dir");
  if (typeof dir !== "string") return Err("Invalid form data");
  if (!dir.match(/^[a-zA-Z0-9-_]+$/)) return Err("Invalid directory");
  return Ok({ command, dir });
};
