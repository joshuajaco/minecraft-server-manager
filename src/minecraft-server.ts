import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import { LibsqlError } from "@libsql/client";
import dbus from "dbus-next";
import _ from "@dbus-types/systemd";
import { LOG_LINES } from "./constants";
import { env } from "./env";
import { client } from "./db";
import { Result, Ok, Err } from "./lib/result";
import { AsyncIterable } from "./lib/async-iterable";
import { journalctl } from "./lib/system/journalctl";

const bus = dbus.systemBus();

export async function create(
  name: string,
  _dir: string,
  createDir = true,
): Promise<Result<void, string>> {
  try {
    await client.execute({
      sql: "INSERT INTO 'minecraft-servers'(name, dir) VALUES (?, ?)",
      args: [name, _dir],
    });
  } catch (error) {
    if (
      error instanceof LibsqlError &&
      error.code === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      const match = error.message.match(
        /UNIQUE constraint failed: minecraft-servers\.(.+)/,
      );

      if (match && match[1]) {
        let key;
        switch (match[1]) {
          case "name":
            key = "Name";
            break;
          case "dir":
            key = "Directory";
            break;
          default:
            key = match[1];
        }

        return Err(`${key} already exists`);
      }
    }

    throw error;
  }

  const dir = path.join(env.MINECRAFT_PATH, _dir);

  if (createDir) {
    try {
      await fs.mkdir(dir);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "EEXIST"
      ) {
        await client.execute({
          sql: "DELETE FROM 'minecraft-servers' WHERE dir=(?)",
          args: [_dir],
        });
        return Err("Directory already exists");
      }

      throw error;
    }
    const UID = +env.MINECRAFT_USER_ID;
    const GID = +env.MINECRAFT_GROUP_ID;
    await fs.chown(dir, UID, GID);
  }

  const serviceName = getServiceName(_dir);
  const service = `[Unit]
Description=Minecraft Server (${name})

[Service]   
Type=simple
WorkingDirectory=${dir} 
ExecStart=bash ${dir}/run.sh
User=${env.MINECRAFT_USER_NAME}
Restart=on-failure
Sockets=${serviceName}.socket
StandardInput=socket
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`;

  const socket = `[Unit]
PartOf=${serviceName}.service

[Socket]
ListenFIFO=%t/${serviceName}.stdin
`;

  await fs.writeFile(
    path.join(env.SYSTEMD_PATH, `${serviceName}.service`),
    service,
  );
  await fs.writeFile(
    path.join(env.SYSTEMD_PATH, `${serviceName}.socket`),
    socket,
  );

  return Ok();
}

export async function _import(_dir: string, name: string) {
  return create(name, _dir, false);
}

export async function _delete(
  dir: string,
  options: { removeFiles?: boolean } = {},
) {
  await client.execute({
    sql: "DELETE FROM 'minecraft-servers' WHERE dir=(?)",
    args: [dir],
  });
  await stop(dir);
  const serviceName = getServiceName(dir);
  await tryRm(`${env.SYSTEMD_PATH}${serviceName}.service`);
  await tryRm(`${env.SYSTEMD_PATH}${serviceName}.socket`);

  if (options.removeFiles) {
    const _path = path.join(env.MINECRAFT_PATH, dir);
    await tryRm(_path, { recursive: true, force: true });
  }
}

async function tryRm(...args: Parameters<typeof fs.rm>) {
  try {
    await fs.rm(...args);
  } catch (error) {
    if (
      !(error instanceof Error && "code" in error && error.code === "ENOENT")
    ) {
      throw error;
    }
  }
}

export async function start(dir: string) {
  const serviceName = getServiceName(dir);
  const manager = await getManager();
  await manager.StartUnit(`${serviceName}.service`, "replace");
}

export async function restart(dir: string) {
  const serviceName = getServiceName(dir);
  const manager = await getManager();
  await manager.RestartUnit(`${serviceName}.service`, "replace");
}

export async function stop(dir: string) {
  const serviceName = getServiceName(dir);
  const manager = await getManager();
  await manager.StopUnit(`${serviceName}.service`, "replace");
}

export type ActiveState = "active" | "inactive" | "deactivating";

export async function getStatus(dir: string): Promise<ActiveState> {
  const serviceName = getServiceName(dir);
  const manager = await getManager();
  const path = await manager.LoadUnit(`${serviceName}.service`);
  const unit = await bus.getProxyObject("org.freedesktop.systemd1", path);
  const properties = unit.getInterface("org.freedesktop.DBus.Properties");
  const status = await properties.Get(
    "org.freedesktop.systemd1.Unit",
    "ActiveState",
  );
  return status.value;
}

export async function run(dir: string, command: string) {
  const fileHandle = await fs.open(`/run/${getServiceName(dir)}.stdin`, "w");
  await fileHandle.write(command + "\n");
  await fileHandle.close();
}

export async function getLogs(dir: string) {
  const unit = getServiceName(dir);
  const generator = journalctl({ unit: "test-counter", limit: LOG_LINES });
  const { entries, result } = await AsyncIterable.collect(generator);
  if (!result.ok) return result;
  const lines = entries.flat();
  const logs = lines.map((line) => line.message).join("\n") + "\n";
  const cursor = lines.at(-1)?.cursor;
  return Ok({ logs, cursor });
}

export type LogsChunk = {
  logs: string;
  cursor?: string;
};

export function streamLogs(dir: string, cursor: string | undefined) {
  const unit = getServiceName(dir);
  const generator = journalctl({
    unit: "test-counter",
    follow: true,
    limit: LOG_LINES,
    pager: true,
    cursor,
  });

  return AsyncIterable.map(
    generator,
    (value): LogsChunk => ({
      logs: value.map((line) => line.message).join("\n") + "\n",
      cursor: value.at(-1)?.cursor,
    }),
  );
}

async function getManager() {
  const systemd = await bus.getProxyObject(
    "org.freedesktop.systemd1",
    "/org/freedesktop/systemd1",
  );
  return systemd.getInterface("org.freedesktop.systemd1.Manager");
}

function getServiceName(dir: string) {
  return `minecraft-server-${dir}`;
}
