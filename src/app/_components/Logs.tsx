"use client";

import { useEffect, useState } from "react";
import { LOG_LINES } from "../../constants";

const decoder = new TextDecoder("utf-8");

export function Logs({
  initialLogs,
  dir,
}: {
  initialLogs: string;
  dir: string;
}) {
  const [logs, setLogs] = useState(initialLogs);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchLogs() {
      const { signal } = controller;
      const response = await fetch(`/api/logs?dir=${dir}`, { signal });

      if (!response.body) return;

      const reader = response.body.getReader();

      let first = true;

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          const v = decoder.decode(value);
          if (first) {
            first = false;
            setLogs(v);
          } else {
            setLogs((text) => text + v);
          }
        }

        if (done) break;
      }
    }

    void fetchLogs().catch(ignoreAbortError);

    return () => controller.abort();
  }, [dir]);

  const lines = (logs.match(/\n/g) || []).length;

  return (
    <pre className="overflow-auto grow px-4 py-2 border-b flex flex-col-reverse">
      {lines >= LOG_LINES ? "-- More logs --\n" : ""}
      {logs}
    </pre>
  );
}

function ignoreAbortError(error: unknown) {
  if (
    error instanceof Error &&
    "name" in error &&
    error.name === "AbortError"
  ) {
    return;
  }

  throw error;
}
