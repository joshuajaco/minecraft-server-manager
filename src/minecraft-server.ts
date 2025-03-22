import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import { env } from "./env";
import dbus from "dbus-next";
import { client } from "./db";

export async function create(name: string) {
  await client.execute({
    sql: "INSERT INTO 'minecraft-servers'(name) VALUES (?)",
    args: [name],
  });

  const dir = path.join(env.MINECRAFT_PATH, name);
  await fs.mkdir(dir);
  const UID = +env.MINECRAFT_USER_ID;
  const GID = +env.MINECRAFT_GROUP_ID;
  await fs.chown(dir, UID, GID);

  const serviceName = getServiceName(name);
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

export async function _delete(
  name: string,
  options: { removeFiles?: boolean } = {},
) {
  await client.execute({
    sql: "DELETE FROM 'minecraft-servers' WHERE name=(?)",
    args: [name],
  });
  await stop(name);
  const serviceName = getServiceName(name);
  await fs.rm(`${env.SYSTEMD_PATH}${serviceName}.service`);
  await fs.rm(`${env.SYSTEMD_PATH}${serviceName}.socket`);

  if (options.removeFiles) {
    const dir = path.join(env.MINECRAFT_PATH, name);
    await fs.rm(dir, { recursive: true, force: true });
  }
}

export async function start(name: string) {
  const serviceName = getServiceName(name);
  const manager = await getManager();
  await manager.StartUnit(`${serviceName}.service`, "replace");
}

export async function restart(name: string) {
  const serviceName = getServiceName(name);
  const manager = await getManager();
  await manager.RestartUnit(`${serviceName}.service`, "replace");
}

export async function stop(name: string) {
  const serviceName = getServiceName(name);
  const manager = await getManager();
  await manager.StopUnit(`${serviceName}.service`, "replace");
}

export async function getStatus(name: string): Promise<"active" | "inactive"> {
  const serviceName = getServiceName(name);
  const bus = dbus.systemBus();
  const manager = await getManager(bus);
  const path = await manager.LoadUnit(`${serviceName}.service`);
  const unit = await bus.getProxyObject("org.freedesktop.systemd1", path);
  const properties = unit.getInterface("org.freedesktop.DBus.Properties");
  const status = await properties.Get(
    "org.freedesktop.systemd1.Unit",
    "ActiveState",
  );
  return status.value;
}

async function run(name: string, command: string) {
  const serviceName = getServiceName(name);
  // await exec(`echo "${command}" > /run/${serviceName}.stdin`);
}

async function getManager(_bus?: dbus.MessageBus) {
  const bus = _bus ?? dbus.systemBus();
  const systemd = await bus.getProxyObject(
    "org.freedesktop.systemd1",
    "/org/freedesktop/systemd1",
  );
  return systemd.getInterface("org.freedesktop.systemd1.Manager");
}

function getServiceName(name: string) {
  return `minecraft-server-${name}`;
}
