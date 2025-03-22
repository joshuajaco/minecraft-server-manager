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
import { client, type Server } from "../db";
import { authenticate } from "../auth";
import { Form } from "../form";
import {
  _delete,
  create,
  getStatus,
  restart,
  start,
  stop,
} from "../minecraft-server";
import Logo from "./icon1.svg";

export default async function HomePage() {
  await authenticate();
  return (
    <div className="grid gap-6 p-4 container mx-auto">
      <div className="flex items-center gap-2">
        <Image alt="logo" src={Logo} height={48} />
        <h1 className="text-xl">Minecraft Server Manager</h1>
        <form className="ml-auto" action={logout}>
          <button className="px-2 cursor-pointer">Logout</button>
        </form>
      </div>
      <div className="px-2 grid gap-4">
        <h2 className="text-3xl">Servers</h2>
        <Form
          action={addServer}
          validate={validateServer}
          className="flex gap-4"
        >
          <input
            type="text"
            name="name"
            placeholder="name"
            className="border border-foreground px-2 rounded min-w-0 w-full max-w-64"
          />
          <button className="border border-foreground px-2 rounded cursor-pointer">
            Add
          </button>
        </Form>
        <Suspense fallback={null}>
          <ServerList />
        </Suspense>
      </div>
    </div>
  );
}

async function ServerList() {
  "use cache";
  cacheTag("servers");
  cacheLife("seconds");
  const result = await client.execute("SELECT * FROM 'minecraft-servers'");
  const servers = result.rows as unknown as Server[];
  return (
    <div className="border rounded-lg">
      {servers.map((server) => (
        <Server key={server.name} {...server} />
      ))}
    </div>
  );
}

async function Server({ name }: Server) {
  const status = await getStatus(name);
  return (
    <div className="not-last:border-b border-foreground p-4">
      <div className="flex items-center gap-3">
        <h3 className="text-2xl">{name}</h3>
        <form className="flex items-center gap-3">
          {status === "active" ? (
            <button formAction={restartServer.bind(null, name)}>Restart</button>
          ) : (
            <button formAction={startServer.bind(null, name)}>Start</button>
          )}
          <button
            disabled={status !== "active"}
            formAction={stopServer.bind(null, name)}
          >
            Stop
          </button>
          <button formAction={deleteServer.bind(null, name)}>Delete</button>
        </form>
      </div>
      Status: {status}
    </div>
  );
}

async function logout() {
  "use server";
  await authenticate();
  (await cookies()).delete("session");
  redirect("/login");
}

async function validateServer(
  formData: FormData,
): Promise<Result<Server, string>> {
  "use server";
  if (!(formData instanceof FormData)) return Err("Invalid form data");
  const name = formData.get("name");
  if (typeof name !== "string") return Err("Invalid form data");
  if (!name.match(/^[a-zA-Z0-9-_]*$/)) return Err("Invalid name");
  return Ok({ name });
}

async function addServer({ name }: Server): Promise<Result<string, string>> {
  "use server";
  await authenticate();
  await create(name);
  revalidateTag("servers");
  return Ok("Server added");
}

async function startServer(name: string): Promise<void> {
  "use server";
  await authenticate();
  await start(name);
  revalidateTag("servers");
}

async function restartServer(name: string): Promise<void> {
  "use server";
  await restart(name);
  revalidateTag("servers");
}

async function stopServer(name: string): Promise<void> {
  "use server";
  await authenticate();
  await stop(name);
  revalidateTag("servers");
}

async function deleteServer(name: string): Promise<void> {
  "use server";
  await authenticate();
  await _delete(name);
  revalidateTag("servers");
}
