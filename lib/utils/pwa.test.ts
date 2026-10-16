import { afterEach, describe, it, expect, vi } from "vitest";
import { clearPreviewCaches, isNealarpWorker } from "./pwa";

afterEach(() => {
  vi.unstubAllGlobals();
});
describe("stale preview cleanup", () => {
  it("recognizes only this app's root and legacy subpath workers", () => {
    const origin = "https://preview.example";
    expect(isNealarpWorker(`${origin}/sw.js`, origin)).toBe(true);
    expect(isNealarpWorker(`${origin}/nealarp/sw.js`, origin)).toBe(true);
    expect(isNealarpWorker(`${origin}/other/sw.js`, origin)).toBe(false);
    expect(isNealarpWorker("https://elsewhere.test/sw.js", origin)).toBe(false);
    expect(isNealarpWorker("", origin)).toBe(false);
  });
  it("unregisters legacy workers, clears only owned caches and reports a controlled tab", async () => {
    const origin = window.location.origin,
      owned = vi.fn().mockResolvedValue(true),
      foreign = vi.fn();
    vi.stubGlobal("navigator", {
      serviceWorker: {
        controller: { scriptURL: `${origin}/nealarp/sw.js` },
        getRegistrations: async () => [
          { active: { scriptURL: `${origin}/sw.js` }, unregister: owned },
          { active: { scriptURL: `${origin}/other/sw.js` }, unregister: foreign },
        ],
      },
    });
    const remove = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("caches", { keys: async () => ["nealarp-v2-2", "other-app"], delete: remove });
    expect(await clearPreviewCaches()).toBe(true);
    expect(owned).toHaveBeenCalledOnce();
    expect(foreign).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledExactlyOnceWith("nealarp-v2-2");
  });
});
