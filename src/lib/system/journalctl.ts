import cp from "node:child_process";
import { Result, Ok, Err } from "../result";
import { assertInstanceOf, assertTypeOf, Untrusted } from "../assert";
import { Json } from "../json";

export type JournalCtlLine = { message: string; cursor: string };
type JournalCtlChunk = JournalCtlLine[];
type JournalCtlResult = Result<void, string[]>;

type JournalCtlOptions = {
  unit: string;
  follow?: boolean;
  limit?: number;
  pager?: boolean;
  cursor?: string | null;
};

export async function* journalctl({
  unit,
  follow,
  limit,
  pager,
  cursor,
}: JournalCtlOptions): AsyncGenerator<JournalCtlChunk, JournalCtlResult> {
  const opts = ["-u", unit];
  if (follow) opts.push("-f");
  if (limit) opts.push("-n", limit.toString());
  if (!pager) opts.push("--no-pager");
  if (cursor) opts.push("--after-cursor=" + cursor);
  opts.push("--output=json");

  const { stdout, stderr } = cp.spawn("journalctl", opts);

  const errors: string[] = [];
  stderr.on("data", (data) => errors.push(data.toString()));

  let buffer = "";

  for await (const chunk of stdout) {
    assertInstanceOf(chunk, Buffer);
    const lines = (buffer + chunk).split("\n");
    buffer = lines.pop() ?? "";
    yield lines.map(parseLine);
  }

  if (buffer) {
    console.log("left over buffer", buffer);
    try {
      yield [parseLine(buffer)];
    } catch (e) {
      errors.push("Unparsable left over buffer: '" + buffer + "'");
    }
  }

  if (errors.length > 0) return Err(errors);

  return Ok();
}

function parseLine(str: string): JournalCtlLine {
  const line = Json.parse<RawLine>(str);
  assertTypeOf(line.MESSAGE, "string");
  assertTypeOf(line.__CURSOR, "string");
  return { message: line.MESSAGE, cursor: line.__CURSOR };
}

type RawLine = {
  SYSLOG_IDENTIFIER: string;
  _PID: string;
  _MACHINE_ID: string;
  MESSAGE: string;
  _BOOT_ID: string;
  __CURSOR: string;
  _SYSTEMD_INVOCATION_ID: string;
  _HOSTNAME: string;
  _SYSTEMD_SLICE: string;
  _RUNTIME_SCOPE: string;
  _TRANSPORT: string;
  __REALTIME_TIMESTAMP: string;
  __SEQNUM: string;
  _COMM: string;
  SYSLOG_FACILITY: string;
  _GID: string;
  _CMDLINE: string;
  _STREAM_ID: string;
  PRIORITY: string;
  _EXE: string;
  __SEQNUM_ID: string;
  _SYSTEMD_UNIT: string;
  _SYSTEMD_CGROUP: string;
  __MONOTONIC_TIMESTAMP: string;
  _UID: string;
  _CAP_EFFECTIVE: string;
};
