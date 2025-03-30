export function DocumentVisibilityListener(
  callbacks: Record<DocumentVisibilityState, () => void>,
) {
  function onVisibilityChange() {
    callbacks[document.visibilityState]();
  }

  document.addEventListener("visibilitychange", onVisibilityChange);

  function remove() {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  return { remove };
}
