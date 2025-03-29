"use client";

import { useEffect } from "react";
import { refresh } from "./refresh";

export function Refresh({ tags }: { tags: string[] }) {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      interval = setInterval(() => refresh(...tags), 5000);
    }

    function stopPolling() {
      if (interval) clearInterval(interval);
      interval = null;
    }

    function onVisibilityChange() {
      switch (document.visibilityState) {
        case "visible":
          startPolling();
          void refresh(...tags);
          break;
        case "hidden":
          stopPolling();
          break;
        default:
          throw new Error(
            `Unsupported document visibilityState ${document.visibilityState satisfies never}`,
          );
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    if (document.visibilityState === "visible") startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [...tags]);

  return null;
}
