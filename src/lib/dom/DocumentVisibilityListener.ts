export function DocumentVisibilityListener(
  callbacks: Record<DocumentVisibilityState, () => void>,
) {
  function onVisibilityChange() {
    switch (document.visibilityState) {
      case "visible":
        callbacks.visible();
        break;
      case "hidden":
        callbacks.hidden();
        break;
      default:
        throw new Error(
          `Unsupported document visibilityState ${document.visibilityState satisfies never}`,
        );
    }
  }

  document.addEventListener("visibilitychange", onVisibilityChange);

  function remove() {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  return { remove };
}
