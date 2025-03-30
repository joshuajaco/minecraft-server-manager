"use client";

import { useEffect, useRef, useState } from "react";
import { LOG_LINES } from "../../constants";
import { DocumentVisibilityListener } from "../../lib/dom/DocumentVisibilityListener";
import { assertTypeOf } from "../../lib/assert";
import { Json } from "../../lib/json";
import type { LogsChunk } from "../../minecraft-server";

const decoder = new TextDecoder("utf-8");

export function Logs({
  initialLogs,
  initialCursor,
  dir,
}: {
  initialLogs: string;
  initialCursor: string | undefined;
  dir: string;
}) {
  const [logs, setLogs] = useState(initialLogs);
  const cursor = useRef(initialCursor);

  useEffect(() => {
    let controller = new AbortController();

    async function fetchLogs() {
      const searchParams = new URLSearchParams({ dir });

      if (cursor.current) searchParams.set("cursor", cursor.current);

      const signal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(30_000),
      ]);

      const response = await fetch(`/api/logs?${searchParams}`, { signal });

      if (!response.body) return;

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;
        if (signal.aborted) {
          console.log("reader aborted");
          break;
        }

        if (value) {
          const chunks = decoder
            .decode(value)
            .split("\n")
            .filter(Boolean)
            .map(parseChunk);

          setLogs((prevLogs) =>
            chunks.reduce((acc, chunk) => acc + chunk.logs, prevLogs),
          );

          cursor.current = chunks.at(-1)?.cursor;
        }
      }
    }

    async function startPolling() {
      controller = new AbortController();
      while (true) {
        if (controller.signal.aborted) break;
        await fetchLogs().catch(ignoreAbortError);
      }
    }

    function stopPolling() {
      controller.abort();
    }

    if (document.visibilityState === "visible") void startPolling();

    const listener = DocumentVisibilityListener({
      visible: startPolling,
      hidden: stopPolling,
    });

    return () => {
      stopPolling();
      listener.remove();
    };
  }, [dir]);

  const lines = (logs.match(/\n/g) || []).length;
  const prefix = lines >= LOG_LINES ? "-- More logs --\n" : "";
  const output = prefix + logs;

  return (
    <pre className="overflow-auto grow px-4 py-2 border-b flex flex-col-reverse">
      {output}
    </pre>
  );
}

function parseChunk(line: string): LogsChunk {
  const { logs, cursor } = Json.parse<LogsChunk>(line);
  assertTypeOf(logs, "string");
  assertTypeOf(cursor, "string", "undefined");
  return { logs, cursor };
}

function ignoreAbortError(error: unknown) {
  if (
    error instanceof Error &&
    "name" in error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return;
  }

  console.error("___ERROR___", error);
  throw error;
}
