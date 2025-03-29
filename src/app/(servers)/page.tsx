import fs from "node:fs/promises";
import { Suspense } from "react";
import {
  unstable_cacheTag as cacheTag,
  unstable_cacheLife as cacheLife,
  revalidateTag,
} from "next/cache";
import { Err, Ok, Result } from "../../result";
import { env } from "../../env";
import { client, MinecraftServer } from "../../db";
import { authenticate } from "../../auth";
import { Form } from "../../form";
import { _import, create } from "../../minecraft-server";
import {
  Button,
  Modal,
  DialogTrigger,
  Dialog,
  Heading,
  TextField,
  Select,
  SelectItem,
} from "../../components";
import { Server } from "../_components/Server";
import { Autofill, capitalize, sanitize } from "../_components/Autofill";
import { Refresh } from "../_components/Refresh";

export default async function HomePage() {
  await authenticate();
  return (
    <>
      <div className="flex gap-4">
        <h2 className="text-3xl">Servers</h2>
        <DialogTrigger>
          <Button variant="secondary">Create</Button>
          <Modal isDismissable>
            <Dialog>
              <Form
                action={createServer}
                validate={createServer.validate}
                className="px-2 grid gap-4"
              >
                <Heading slot="title" className="text-3xl">
                  Create Server
                </Heading>
                <Autofill transform={sanitize}>
                  <TextField slot="source" autoFocus label="Name" name="name" />
                  <TextField slot="target" label="Directory" name="dir" />
                </Autofill>
                <div className="flex gap-2">
                  <Button type="submit">Create</Button>
                  <Button slot="close" variant="secondary">
                    Cancel
                  </Button>
                </div>
              </Form>
            </Dialog>
          </Modal>
        </DialogTrigger>
        <Suspense
          fallback={
            <Button variant="secondary" isDisabled>
              Import
            </Button>
          }
        >
          <ServerImportButton />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <ServerList />
      </Suspense>
    </>
  );
}

async function ServerImportButton() {
  const [allDirs, servers] = await Promise.all([
    getDirectories(),
    getServers(),
  ]);
  const dirs = allDirs.filter(
    (dir) =>
      !dir.startsWith(".") && !servers.some((server) => server.dir === dir),
  );
  return (
    <DialogTrigger>
      <Button variant="secondary" isDisabled={dirs.length === 0}>
        Import
      </Button>
      <Modal isDismissable>
        <Dialog>
          <Form
            action={importServer}
            validate={importServer.validate}
            className="px-2 grid gap-4"
          >
            <Heading slot="title" className="text-3xl">
              Import Server
            </Heading>
            <Autofill transform={capitalize}>
              <Select label="Directory" name="dir" slot="source">
                {dirs.map((dir) => (
                  <SelectItem key={dir} id={dir}>
                    {dir}
                  </SelectItem>
                ))}
              </Select>
              <TextField label="Name" name="name" slot="target" />
            </Autofill>
            <div className="flex gap-2">
              <Button type="submit">Import</Button>
              <Button slot="close" variant="secondary">
                Cancel
              </Button>
            </div>
          </Form>
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}

async function ServerList() {
  const servers = await getServers();
  return (
    <div className="border rounded-lg">
      <Refresh tags={["servers"]} />
      {servers.map((server) => (
        <Server key={server.name} {...server} />
      ))}
    </div>
  );
}

async function getServers(): Promise<MinecraftServer[]> {
  "use cache";
  cacheTag("servers");
  cacheLife("seconds");
  const result = await client.execute("SELECT * FROM 'minecraft-servers'");
  return result.rows.map((r) => ({ ...r })) as unknown as MinecraftServer[];
}

async function getDirectories() {
  const entries = await fs.readdir(env.MINECRAFT_PATH, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

async function createServer({
  name,
  dir,
}: {
  name: string;
  dir: string;
}): Promise<Result<string, string>> {
  "use server";
  const result = await create(name, dir);
  if (!result.ok) return result;
  revalidateTag("servers");
  return Ok("Server created");
}

createServer.validate = async (
  formData: FormData,
): Promise<Result<{ name: string; dir: string }, string>> => {
  "use server";
  await authenticate();
  if (!(formData instanceof FormData)) return Err("Invalid form data");
  const name = formData.get("name");
  if (typeof name !== "string") return Err("Invalid form data");
  const dir = formData.get("dir");
  if (typeof dir !== "string") return Err("Invalid form data");
  if (!dir.match(/^[a-zA-Z0-9-_]+$/)) return Err("Invalid directory");
  return Ok({ name, dir: sanitizeDir(dir) });
};

async function importServer({
  dir,
  name,
}: {
  dir: string;
  name: string;
}): Promise<Result<string, string>> {
  "use server";
  const result = await _import(dir, name);
  if (!result.ok) return result;
  revalidateTag("servers");
  return Ok("Server imported");
}

importServer.validate = async (
  formData: FormData,
): Promise<Result<{ dir: string; name: string }, string>> => {
  "use server";
  await authenticate();
  if (!(formData instanceof FormData)) return Err("Invalid form data");
  const name = formData.get("name");
  if (typeof name !== "string") return Err("Invalid form data");
  const dir = formData.get("dir");
  if (typeof dir !== "string") return Err("Invalid form data");
  if (!dir.match(/^[a-zA-Z0-9-_]+$/)) return Err("Invalid directory");
  return Ok({ name, dir: sanitizeDir(dir) });
};

function sanitizeDir(value: string): string {
  return value
    .trim()
    .replace(/ /g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
}
