import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { proxy } from "./proxy";

const PASSWORD_ENV = "NEXT_PUBLIC_SITE_PASSWORD";
const original = process.env[PASSWORD_ENV];

afterEach(() => {
  if (original === undefined) delete process.env[PASSWORD_ENV];
  else process.env[PASSWORD_ENV] = original;
});

const request = (path: string) => new NextRequest(new URL(path, "https://example.test"));

describe("proxy (the Vercel gate hint, renamed from middleware for Next 16)", () => {
  it("passes requests through untouched when no site password is configured", async () => {
    delete process.env[PASSWORD_ENV];
    const response = await proxy(request("/stack-ledger"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-nealarp-gate")).toBeNull();
  });

  it("tags a locked request but still lets it through — it must never block", async () => {
    process.env[PASSWORD_ENV] = "a-password";
    const response = await proxy(request("/stack-ledger"));
    // The client-side PasswordGate owns the actual gate; this only annotates.
    expect(response.status).toBe(200);
    expect(response.headers.get("x-nealarp-gate")).toBe("locked");
    expect(response.headers.get("location")).toBeNull();
  });

  it("leaves Next internals and static assets alone", async () => {
    process.env[PASSWORD_ENV] = "a-password";
    for (const path of ["/_next/static/chunk.js", "/favicon.ico", "/photo.webp"]) {
      const response = await proxy(request(path));
      expect(response.headers.get("x-nealarp-gate"), path).toBeNull();
    }
  });

  it("ignores a cookie that does not match the expected token", async () => {
    process.env[PASSWORD_ENV] = "a-password";
    const req = request("/");
    req.cookies.set("nealarp.site-unlock.v1", "not-the-token");
    const response = await proxy(req);
    expect(response.headers.get("x-nealarp-gate")).toBe("locked");
  });
});
