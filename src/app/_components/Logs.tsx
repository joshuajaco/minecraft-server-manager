"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { LOG_LINES } from "../../constants";
import { DocumentVisibilityListener } from "../../lib/dom/DocumentVisibilityListener";

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
    let controller = new AbortController();

    async function startPolling() {
      controller = new AbortController();
      const { signal } = controller;
      while (true) {
        if (signal.aborted) break;
        await fetchLogs({ dir, signal, setLogs }).catch(ignoreAbortError);
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

  return (
    <pre className="overflow-auto grow px-4 py-2 border-b flex flex-col-reverse">
      {lines >= LOG_LINES ? "-- More logs --\n" : ""}
      {logs}
    </pre>
  );
}

async function fetchLogs({
  dir,
  signal: _signal,
  setLogs,
}: {
  dir: string;
  signal: AbortSignal;
  setLogs: Dispatch<SetStateAction<string>>;
}) {
  const signal = AbortSignal.any([_signal, AbortSignal.timeout(30_000)]);
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
