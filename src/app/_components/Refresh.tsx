"use client";

import { useEffect } from "react";
import { DocumentVisibilityListener } from "../../lib/dom/DocumentVisibilityListener";
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

    if (document.visibilityState === "visible") startPolling();

    const listener = DocumentVisibilityListener({
      visible: startPolling,
      hidden: stopPolling,
    });

    return () => {
      stopPolling();
      listener.remove();
    };
  }, [...tags]);

  return null;
}
