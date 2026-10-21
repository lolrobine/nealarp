import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, it, expect, vi } from "vitest";

/** The project rule is to bump CACHE_NAME whenever assets change, so this test reads the
 *  current name out of sw.js instead of hard-coding it — otherwise every correct bump
 *  breaks the suite. Only the stale name below is a fixture. */
const CURRENT_CACHE = /const CACHE_NAME = "([^"]+)"/.exec(
  readFileSync("public/sw.js", "utf8")
)![1]!;
const STALE_CACHE = "nealarp-v2-stale";

type WorkerEvent = {
  request?: { url: string; method: string; mode: string; headers: Headers };
  respondWith?: (response: Promise<Response>) => void;
  waitUntil: (promise: Promise<unknown>) => void;
};
function worker() {
  const handlers: Record<string, (event: WorkerEvent) => void> = {};
  const cache = {
    match: vi.fn().mockResolvedValue(new Response("old cached page")),
    put: vi.fn().mockResolvedValue(undefined),
    addAll: vi.fn().mockResolvedValue(undefined),
  };
  const storage = {
    open: vi.fn().mockResolvedValue(cache),
    keys: vi.fn().mockResolvedValue([STALE_CACHE, CURRENT_CACHE, "other-app"]),
    delete: vi.fn().mockResolvedValue(true),
  };
  const fetcher = vi.fn().mockResolvedValue(new Response("fresh page"));
  const self = {
    location: new URL("https://preview.example/nealarp/sw.js"),
    clients: { claim: vi.fn() },
    skipWaiting: vi.fn(),
    addEventListener: (name: string, fn: (e: WorkerEvent) => void) => {
      handlers[name] = fn;
    },
  };
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    self,
    caches: storage,
    fetch: fetcher,
    URL,
    Response,
  });
  async function request(path: string, mode = "navigate", headers = new Headers()) {
    let response: Promise<Response> | undefined;
    const waits: Promise<unknown>[] = [];
    handlers.fetch!({
      request: { url: `https://preview.example${path}`, method: "GET", mode, headers },
      respondWith: (value: Promise<Response>) => {
        response = value;
      },
      waitUntil: (value: Promise<unknown>) => waits.push(value),
    });
    const result = await response;
    await Promise.all(waits);
    return result;
  }
  return { handlers, cache, storage, fetcher, request };
}
describe("fresh catalogue service worker", () => {
  it("serves new navigation HTML instead of a cached catalogue", async () => {
    const w = worker();
    expect(await (await w.request("/nealarp/"))!.text()).toBe("fresh page");
    expect(w.fetcher).toHaveBeenCalledWith(expect.anything(), { cache: "no-cache" });
    expect(w.cache.put).toHaveBeenCalled();
  });
  it("falls back to cached pages when offline", async () => {
    const w = worker();
    w.fetcher.mockRejectedValue(new Error("offline"));
    expect(await (await w.request("/nealarp/"))!.text()).toBe("old cached page");
  });
  it("revalidates artwork but reuses hashed Next assets", async () => {
    const w = worker();
    await w.request("/nealarp/experiences/spend-money/realistic.webp", "cors");
    expect(w.fetcher).toHaveBeenCalledOnce();
    w.fetcher.mockClear();
    await w.request("/nealarp/_next/static/chunks/abc123.js", "cors");
    expect(w.fetcher).not.toHaveBeenCalled();
  });
  it("does not cache RSC responses and leaves other apps' caches alone", async () => {
    const w = worker();
    expect(await w.request("/nealarp/?_rsc=abc", "cors")).toBeUndefined();
    expect(await w.request("/nealarp/", "cors", new Headers({ RSC: "1" }))).toBeUndefined();
    expect(w.fetcher).not.toHaveBeenCalled();
    let done: Promise<unknown> | undefined;
    w.handlers.activate!({
      waitUntil: (p: Promise<unknown>) => {
        done = p;
      },
    });
    await done;
    // The live cache survives, another app's cache is untouched, stale nealarp caches go.
    expect(w.storage.delete).toHaveBeenCalledExactlyOnceWith(STALE_CACHE);
    expect(CURRENT_CACHE).toMatch(/^nealarp-/);
  });
});
