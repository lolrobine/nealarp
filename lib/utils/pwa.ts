/** Only clean up this app's workers/caches, never another app on the same origin. */
export function isNealarpWorker(scriptURL: string, origin: string, basePath = "") {
  try {
    const url = new URL(scriptURL, origin);
    return (
      url.origin === origin &&
      new Set(["/sw.js", "/nealarp/sw.js", `${basePath}/sw.js`]).has(url.pathname)
    );
  } catch {
    return false;
  }
}

export async function clearPreviewCaches(basePath = "") {
  const origin = window.location.origin;
  const controlled = isNealarpWorker(
    navigator.serviceWorker?.controller?.scriptURL ?? "",
    origin,
    basePath
  );
  const registrations = (await navigator.serviceWorker?.getRegistrations()) ?? [];
  await Promise.all(
    registrations
      .filter((registration) => {
        const worker = registration.active ?? registration.waiting ?? registration.installing;
        return worker && isNealarpWorker(worker.scriptURL, origin, basePath);
      })
      .map((registration) => registration.unregister())
  );
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith("nealarp-")).map((key) => caches.delete(key))
    );
  }
  return controlled;
}
