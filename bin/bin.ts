#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import cp from "child_process";
import util from "util";
import * as process from "node:process";

const spawn = util.promisify(cp.spawn);
const _exec = util.promisify(cp.exec);
const program = new Command();
const minecraftPath = "/minecraft";
const systemDPath = "/etc/systemd/system/";

program
  .name("minecraft-server-manager")
  .description("CLI for managing minecraft servers")
  .version("0.0.1")
  .allowExcessArguments()
  .allowUnknownOption();

program
  .command("create")
  .description("Create a server")
  .argument("<name>", "name for the server")
  .action(async (name) => {
    await create(parseName(name));
  });

program
  .command("delete")
  .description("Delete a server")
  .argument("<name>", "name of the server")
  .action(async (name) => {
    await _delete(parseName(name));
  });

program
  .command("start")
  .description("Start a server")
  .argument("<name>", "name of the server")
  .action(async (name) => {
    await start(parseName(name));
  });

program
  .command("stop")
  .description("Stop a server")
  .argument("<name>", "name of the server")
  .action(async (name) => {
    await stop(parseName(name));
  });

program
  .command("restart")
  .description("Restart a server")
  .argument("<name>", "name of the server")
  .action(async (name) => {
    await restart(parseName(name));
  });

program
  .command("status")
  .description("Status for a server")
  .argument("<name>", "name of the server")
  .action(async (name) => {
    await status(parseName(name));
  });

program
  .command("log")
  .description("Print logs for a server")
  .argument("<name>", "name of the server")
  .action(async (name) => {
    await log(parseName(name));
  });

program
  .command("run")
  .description("Run a command on a server")
  .argument("<name>", "string to split")
  .action(async (name) => {
    await run(parseName(name), process.argv.slice(4).join(" "));
  });

await program.parseAsync();

async function create(name: string) {
  const dir = path.join(minecraftPath, name);
  await fs.mkdir(dir);
  const UID = 1001;
  const GID = 1001;
  await fs.chown(dir, UID, GID);

  const serviceName = `minecraft-${name}`;
  const service = `[Unit]
Description=Minecraft Server (${name})

[Service]   
Type=simple
WorkingDirectory=${dir} 
ExecStart=bash ${dir}/run.sh
User=minecraft
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

  await fs.writeFile(`${systemDPath}${serviceName}.service`, service);
  await fs.writeFile(`${systemDPath}${serviceName}.socket`, socket);

  console.log("done");
}

async function _delete(name: string) {
  const serviceName = `minecraft-${name}`;
  await stop(name);
  await fs.rm(`${systemDPath}${serviceName}.service`);
  await fs.rm(`${systemDPath}${serviceName}.socket`);
  console.log("Deleted");
}

async function start(name: string) {
  const serviceName = `minecraft-${name}`;
  await exec(`systemctl start ${serviceName}`);
}

async function restart(name: string) {
  const serviceName = `minecraft-${name}`;
  await exec(`systemctl restart ${serviceName}`);
}

async function stop(name: string) {
  const serviceName = `minecraft-${name}`;
  await exec(`systemctl stop ${serviceName}`);
}

async function status(name: string) {
  const serviceName = `minecraft-${name}`;
  await spawn("systemctl", ["status", serviceName], { stdio: "inherit" });
}

async function log(name: string) {
  const serviceName = `minecraft-${name}`;
  await spawn("journalctl", ["-u", serviceName, "-f"], { stdio: "inherit" });
}

async function run(name: string, command: string) {
  const serviceName = `minecraft-${name}`;
  await exec(`echo "${command}" > /run/${serviceName}.stdin`);
}

async function exec(command: string) {
  const { stdout, stderr } = await _exec(command);
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
}

function parseName(name: string): string {
  const match = name.match(/^[a-z,A-Z-_]*$/);
  if (!match) throw new Error("Invalid name");
  return match[0].toLowerCase();
}
