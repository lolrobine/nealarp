import { describe, it, expect } from "vitest";
import { verifyPassword, fnv1aHex } from "./sitePassword";

describe("sitePassword", () => {
  it("fnv1aHex deterministic", () => {
    expect(fnv1aHex("nealarp")).toBe("c1f78782");
    expect(fnv1aHex("")).toBe("811c9dc5");
  });

  it("verifyPassword trims and checks", async () => {
    expect(await verifyPassword("nealarp")).toBe(true);
    expect(await verifyPassword(" nealarp ")).toBe(true);
    expect(await verifyPassword("wrong")).toBe(false);
    expect(await verifyPassword("")).toBe(false);
  });
});
