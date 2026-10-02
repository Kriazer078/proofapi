import { describe, expect, it } from "vitest";
import { MemoryDemoRequestStore, isAdminLogin, parseDemoRequest, submitDemoRequest } from "@/lib/demo-requests";
import { RateLimitError, ValidationError } from "@/lib/errors";

describe("demo requests", () => {
  it("cleans the form and keeps optional fields optional", () => {
    expect(parseDemoRequest({ name: "  Aru  ", email: " ARU@Example.com ", company: "", locale: "kk" })).toEqual({
      name: "Aru",
      email: "aru@example.com",
      company: undefined,
      message: undefined,
      locale: "kk",
    });
    expect(parseDemoRequest({ name: "A", email: "a@b.co", locale: "xx" }).locale).toBe("en");
  });

  it("rejects a missing name or a bad email", () => {
    expect(() => parseDemoRequest({ name: "", email: "a@b.co" })).toThrow(ValidationError);
    expect(() => parseDemoRequest({ name: "A", email: "not-an-email" })).toThrow(ValidationError);
  });

  it("caps long fields", () => {
    const r = parseDemoRequest({ name: "A", email: "a@b.co", message: "x".repeat(5000) });
    expect(r.message).toHaveLength(2000);
  });

  it("stores requests and limits each address to three an hour", async () => {
    const store = new MemoryDemoRequestStore();
    const input = parseDemoRequest({ name: "A", email: "a@b.co" });
    const now = new Date("2026-10-02T10:00:00Z");
    for (let i = 0; i < 3; i++) await submitDemoRequest(store, input, "ip1", now);
    await expect(submitDemoRequest(store, input, "ip1", now)).rejects.toThrow(RateLimitError);
    await submitDemoRequest(store, input, "ip2", now);
    await submitDemoRequest(store, input, "ip1", new Date("2026-10-02T11:30:00Z"));
    expect((await store.list(10)).length).toBe(5);
  });

  it("recognises admins only from the configured list", () => {
    expect(isAdminLogin("Kriazer078", "kriazer078, other")).toBe(true);
    expect(isAdminLogin("someone", "kriazer078")).toBe(false);
    expect(isAdminLogin("kriazer078", undefined)).toBe(false);
    expect(isAdminLogin(null, "kriazer078")).toBe(false);
  });
});
