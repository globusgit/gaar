import { describe, expect, it } from "vitest";
import {
  BASIC_USER_MODULES,
  getEffectiveUserModules,
  normalizeUserModules,
  USER_MODULES,
} from "@/lib/userModules";

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

  it("limits USER accounts to their required operational modules", () => {
    expect(getEffectiveUserModules("USER", ["employees", "clients"])).toEqual(
      BASIC_USER_MODULES,
    );
  });

  it("keeps assigned modules unchanged for other roles", () => {
    expect(getEffectiveUserModules("MANAGER", ["dashboard", "employees"])).toEqual([
      "dashboard",
      "employees",
    ]);
  });
});
