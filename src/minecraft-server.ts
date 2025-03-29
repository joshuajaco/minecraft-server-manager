import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import { env } from "./env";
import dbus from "dbus-next";
import _ from "@dbus-types/systemd";
import { client } from "./db";
import { Err } from "./result";

const bus = dbus.systemBus();

async function getDirectories(p: string) {
  const entries = await fs.readdir(p, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}
export async function create(name: string, _dir: string, createDir = true) {
  await client.execute({
    sql: "INSERT INTO 'minecraft-servers'(name, dir) VALUES (?, ?)",
    args: [name, _dir],
  });

  const dir = path.join(env.MINECRAFT_PATH, _dir);

  if (createDir) {
    await fs.mkdir(dir);
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
}

export async function _import(_dir: string, name: string) {
  await create(name, _dir, false);
}

export async function _delete(
  dir: string,
  options: { removeFiles?: boolean } = {},
) {
  await client.execute({
    sql: "DELETE FROM 'minecraft-servers' WHERE dir=(?)",
    args: [dir],
  });
  //await stop(dir);
  const serviceName = getServiceName(dir);
  await fs.rm(`${env.SYSTEMD_PATH}${serviceName}.service`);
  await fs.rm(`${env.SYSTEMD_PATH}${serviceName}.socket`);

  if (options.removeFiles) {
    const _path = path.join(env.MINECRAFT_PATH, dir);
    await fs.rm(_path, { recursive: true, force: true });
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

export type Status = "active" | "inactive" | "deactivating";

export async function getStatus(dir: string): Promise<Status> {
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

async function run(dir: string, command: string) {
  const serviceName = getServiceName(dir);
  // await exec(`echo "${command}" > /run/${serviceName}.stdin`);
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
