import { Readable } from "node:stream";
import { LOG_LINES } from "../src/constants";

export function mockJournalCtlLogs(..._args: unknown[]) {
  const stdout = mockLogs();
  return Promise.resolve({ stdout, stderr: "" });
}

export function mockJournalCtlLogsStream(..._args: unknown[]) {
  const stdout: Readable = Readable.from(streamLogs());
  const stderr: Readable = Readable.from("");
  return { stdout, stderr };
}

async function* streamLogs() {
  yield Buffer.from(mockLogs());
  const unit = sep + template;
  const lines = unit.split("\n").slice(0, -1);
  let line = 0;
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    yield Buffer.from(lines[line] + "\n");
    line = (line + 1) % lines.length;
  }
}

function mockLogs(lines = LOG_LINES) {
  const templateLines = (template.match(/\n/g) || []).length;
  const sepLines = (template.match(/\n/g) || []).length;
  const unit = template + sep;
  const unitLength = templateLines + sepLines;
  const repeatCount = Math.floor((lines + sep.length) / unitLength);
  return (unit.repeat(repeatCount) + template)
    .split("\n")
    .slice(-lines - 1)
    .join("\n");
}

const template = `Mar 29 19:55:37 dust408 systemd[1]: Started minecraft-server-vanilla.service - Minecraft Server (Vanilla).
Mar 29 19:55:38 dust408 bash[312087]: Starting net.fabricmc.loader.impl.game.minecraft.BundlerClassPathCapture
Mar 29 19:55:39 dust408 bash[312087]: [19:55:39] [main/INFO]: Loading Minecraft 1.21.4 with Fabric Loader 0.16.10
Mar 29 19:55:39 dust408 bash[312087]: [19:55:39] [main/INFO]: Loading 11 mods:
Mar 29 19:55:39 dust408 bash[312087]:         - fabricloader 0.16.10
Mar 29 19:55:39 dust408 bash[312087]:            \\-- mixinextras 0.4.1
Mar 29 19:55:39 dust408 bash[312087]:         - java 21
Mar 29 19:55:39 dust408 bash[312087]:         - lithium 0.15.0+mc1.21.4
Mar 29 19:55:39 dust408 bash[312087]:         - minecraft 1.21.4
Mar 29 19:55:39 dust408 bash[312087]:         - voicechat 1.21.4-2.5.26
Mar 29 19:55:39 dust408 bash[312087]:            |-- fabric-api-base 0.4.52+8ca5486f82
Mar 29 19:55:39 dust408 bash[312087]:            |-- fabric-command-api-v2 2.2.39+e496eb1582
Mar 29 19:55:39 dust408 bash[312087]:            |-- fabric-key-binding-api-v1 1.0.55+7feeb73382
Mar 29 19:55:39 dust408 bash[312087]:            |-- fabric-lifecycle-events-v1 2.5.2+bf2a60eb82
Mar 29 19:55:39 dust408 bash[312087]:            |-- fabric-networking-api-v1 4.3.7+cc0fa2fe82
Mar 29 19:55:39 dust408 bash[312087]:            \\-- fabric-resource-loader-v0 3.0.9+203e6b2382
Mar 29 19:55:39 dust408 bash[312087]: [19:55:39] [main/INFO]: SpongePowered MIXIN Subsystem Version=0.8.7 Source=file:/minecraft/vanilla/libraries/net/fabricmc/sponge-mixin/0.15.4+mixin.0.8.7/sponge-mixin-0.15.4+mixin.0.8.7.jar Service=Knot/Fabric Env=SERVER
Mar 29 19:55:39 dust408 bash[312087]: [19:55:39] [main/INFO]: Compatibility level set to JAVA_21
Mar 29 19:55:39 dust408 bash[312087]: [19:55:39] [main/INFO]: Loaded configuration file for Lithium: 149 options available, 0 override(s) found
Mar 29 19:55:40 dust408 bash[312087]: [19:55:40] [main/INFO]: Initializing MixinExtras via com.llamalad7.mixinextras.service.MixinExtrasServiceImpl(version=0.4.1).
Mar 29 19:55:45 dust408 bash[312087]: [19:55:45] [main/INFO]: [voicechat] Compatibility version 18
Mar 29 19:55:45 dust408 bash[312087]: [19:55:45] [main/INFO]: [voicechat] Loading plugins
Mar 29 19:55:45 dust408 bash[312087]: [19:55:45] [main/INFO]: [voicechat] Loaded 0 plugin(s)
Mar 29 19:55:45 dust408 bash[312087]: [19:55:45] [main/INFO]: [voicechat] Initializing plugins
Mar 29 19:55:45 dust408 bash[312087]: [19:55:45] [main/INFO]: [voicechat] Initialized 0 plugin(s)
Mar 29 19:55:45 dust408 bash[312087]: [19:55:45] [main/WARN]: resource-pack-id missing, using default of aacaf07d-f909-3011-b414-9718ac0d2ac7
Mar 29 19:55:45 dust408 bash[312087]: [19:55:45] [main/INFO]: Environment: Environment[sessionHost=https://sessionserver.mojang.com, servicesHost=https://api.minecraftservices.com, name=PROD]
Mar 29 19:55:45 dust408 bash[312087]: [19:55:45] [main/WARN]: Non [a-z0-9_.-] character in namespace .DS_Store in pack ./world/datapacks/SmartLock-1.21.zip, ignoring
Mar 29 19:55:45 dust408 bash[312087]: [19:55:45] [main/WARN]: Non [a-z0-9_.-] character in namespace .DS_Store in pack ./world/datapacks/SmartLock-1.21.zip, ignoring
Mar 29 19:55:46 dust408 bash[312087]: [19:55:46] [Worker-Main-3/WARN]: Invalid path in datapack: minecraft:loot_table/.DS_Store, ignoring
Mar 29 19:55:47 dust408 bash[312087]: [19:55:47] [Worker-Main-4/WARN]: Invalid path in datapack: smart_lock:function/.DS_Store, ignoring
Mar 29 19:55:47 dust408 bash[312087]: [19:55:47] [main/INFO]: Loaded 1370 recipes
Mar 29 19:55:47 dust408 bash[312087]: [19:55:47] [main/INFO]: Loaded 1489 advancements
Mar 29 19:55:47 dust408 bash[312087]: [19:55:47] [Server thread/INFO]: Starting minecraft server version 1.21.4
Mar 29 19:55:47 dust408 bash[312087]: [19:55:47] [Server thread/INFO]: Loading properties
Mar 29 19:55:47 dust408 bash[312087]: [19:55:47] [Server thread/INFO]: Default game type: SURVIVAL
Mar 29 19:55:47 dust408 bash[312087]: [19:55:47] [Server thread/INFO]: Generating keypair
Mar 29 19:55:47 dust408 bash[312087]: [19:55:47] [Server thread/INFO]: Starting Minecraft server on *:25564
Mar 29 19:55:47 dust408 bash[312087]: [19:55:47] [Server thread/INFO]: Using epoll channel type
Mar 29 19:55:47 dust408 bash[312087]: [19:55:47] [Server thread/INFO]: Preparing level "world"
Mar 29 19:55:48 dust408 bash[312087]: [19:55:48] [Server thread/INFO]: Preparing start region for dimension minecraft:overworld
Mar 29 19:55:49 dust408 bash[312087]: [19:55:49] [Worker-Main-13/INFO]: Preparing spawn area: 0%
Mar 29 19:55:49 dust408 bash[312087]: [19:55:49] [Worker-Main-13/INFO]: Preparing spawn area: 0%
Mar 29 19:55:49 dust408 bash[312087]: [19:55:49] [Server thread/INFO]: Time elapsed: 946 ms
Mar 29 19:55:49 dust408 bash[312087]: [19:55:49] [Server thread/INFO]: Done (1.467s)! For help, type "help"
Mar 29 19:55:49 dust408 bash[312087]: [19:55:49] [VoiceChatServerThread/INFO]: [voicechat] Voice chat server started at port 24454
Mar 29 19:55:56 dust408 bash[312087]: [19:55:56] [Server thread/INFO]: [Not Secure] [Server] done
`;

const sep = `Mar 29 19:55:37 dust408 systemd[1]: Stopping minecraft-server-vanilla.service - Minecraft Server (Vanilla)...
Mar 29 19:55:37 dust408 systemd[1]: minecraft-server-vanilla.service: Deactivated successfully.
Mar 29 19:55:37 dust408 systemd[1]: Stopped minecraft-server-vanilla.service - Minecraft Server (Vanilla).
Mar 29 19:55:37 dust408 systemd[1]: minecraft-server-vanilla.service: Consumed 5min 47.744s CPU time.
`;
