import fs from "node:fs/promises";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  unstable_cacheTag as cacheTag,
  unstable_cacheLife as cacheLife,
  revalidateTag,
} from "next/cache";
import Image from "next/image";
import { Err, Ok, Result } from "../result";
import { client, MinecraftServer } from "../db";
import { authenticate } from "../auth";
import { Form } from "../form";
import { _import, create } from "../minecraft-server";
import {
  Button,
  Modal,
  DialogTrigger,
  Dialog,
  Heading,
  TextField,
  Select,
  SelectItem,
} from "../components";
import Logo from "./icon1.svg";
import { Server } from "./_components/Server";
import { env } from "../env";
import Link from "next/link";

export default async function HomePage() {
  await authenticate();
  return (
    <div className="grid gap-6 p-4 container mx-auto">
      <div className="flex items-center gap-2">
        <Image alt="logo" src={Logo} height={48} />
        <h1 className="text-xl">Minecraft Server Manager</h1>
        <form className="ml-auto" action={logout}>
          <Button variant="ghost" type="submit">
            Logout
          </Button>
        </form>
      </div>
      <div className="px-2 grid gap-4">
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
                  <TextField autoFocus label="Name" name="name" />
                  <TextField label="Directory" name="dir" />
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
      </div>
    </div>
  );
}

async function ServerImportButton() {
  const [allDirs, servers] = await Promise.all([
    getDirectories(),
    getServers(),
  ]);
  const dirs = allDirs.filter(
    (dir) => !servers.some((server) => server.dir === dir),
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
            <Select label="Directory" name="dir">
              {dirs.map((dir) => (
                <SelectItem key={dir} id={dir}>
                  {dir}
                </SelectItem>
              ))}
            </Select>
            <TextField label="Name" name="name" />
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

async function logout() {
  "use server";
  await authenticate();
  (await cookies()).delete("session");
  redirect("/login");
}

async function createServer({
  name,
  dir,
}: {
  name: string;
  dir: string;
}): Promise<Result<string, string>> {
  "use server";
  await authenticate();
  await create(name, dir);
  revalidateTag("servers");
  return Ok("Server created");
}

createServer.validate = async (
  formData: FormData,
): Promise<Result<{ name: string; dir: string }, string>> => {
  "use server";
  if (!(formData instanceof FormData)) return Err("Invalid form data");
  const name = formData.get("name");
  if (typeof name !== "string") return Err("Invalid form data");
  const dir = formData.get("dir");
  if (typeof dir !== "string") return Err("Invalid form data");
  if (!dir.match(/^[a-zA-Z0-9-_]+$/)) return Err("Invalid directory");
  return Ok({ name, dir });
};

async function importServer({
  dir,
  name,
}: {
  dir: string;
  name: string;
}): Promise<Result<string, string>> {
  "use server";
  await authenticate();
  await _import(dir, name);
  revalidateTag("servers");
  return Ok("Server imported");
}

importServer.validate = async (
  formData: FormData,
): Promise<Result<{ dir: string; name: string }, string>> => {
  "use server";
  if (!(formData instanceof FormData)) return Err("Invalid form data");
  const name = formData.get("name");
  if (typeof name !== "string") return Err("Invalid form data");
  const dir = formData.get("dir");
  if (typeof dir !== "string") return Err("Invalid form data");
  if (!dir.match(/^[a-zA-Z0-9-_]+$/)) return Err("Invalid directory");
  return Ok({ name, dir });
};
