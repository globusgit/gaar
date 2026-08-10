import { describe, expect, it } from "vitest";
import { normalizeUserModules, USER_MODULES } from "@/lib/userModules";

describe("user module permissions", () => {
  it("accepts every supported module, including AI", () => {
    expect(normalizeUserModules(USER_MODULES)).toEqual(USER_MODULES);
  });

  it("deduplicates assigned modules", () => {
    expect(normalizeUserModules(["dashboard", "payments", "payments"])).toEqual([
      "dashboard",
      "payments",
    ]);
  });

  it("rejects unknown modules and non-array input", () => {
    expect(normalizeUserModules(["dashboard", "unknown-module"])).toBeNull();
    expect(normalizeUserModules("dashboard")).toBeNull();
  });
});
