import { describe, expect, it } from "vitest";
import { canAssignRole, canManageRole, hasModuleAccess } from "@/lib/apiGuard";

describe("module access", () => {
  it("allows an explicitly assigned module for every user role", () => {
    for (const role of ["ORG_USER", "ADMIN", "MANAGER", "ACCOUNTANT", "USER"]) {
      expect(hasModuleAccess({ role, modules: ["fund-request"] }, "fund-request")).toBe(true);
    }
  });

  it("denies an unassigned module", () => {
    expect(hasModuleAccess({ role: "ADMIN", modules: ["dashboard"] }, "payments")).toBe(false);
  });

  it("allows SYS_ADMIN without an explicit assignment", () => {
    expect(hasModuleAccess({ role: "SYS_ADMIN", modules: [] }, "audit-logs")).toBe(true);
  });
});

describe("role authority", () => {
  it("prevents lower roles from creating administrators", () => {
    expect(canAssignRole({ role: "USER" }, "ADMIN")).toBe(false);
    expect(canAssignRole({ role: "MANAGER" }, "ADMIN")).toBe(false);
    expect(canAssignRole({ role: "ADMIN" }, "ADMIN")).toBe(true);
  });

  it("reserves SYS_ADMIN assignment and management for SYS_ADMIN", () => {
    expect(canAssignRole({ role: "ADMIN" }, "SYS_ADMIN")).toBe(false);
    expect(canManageRole({ role: "ADMIN" }, "SYS_ADMIN")).toBe(false);
    expect(canAssignRole({ role: "SYS_ADMIN" }, "SYS_ADMIN")).toBe(true);
  });

  it("allows module administrators to manage users at or below their authority", () => {
    expect(canManageRole({ role: "MANAGER" }, "USER")).toBe(true);
    expect(canManageRole({ role: "USER" }, "MANAGER")).toBe(false);
  });
});
