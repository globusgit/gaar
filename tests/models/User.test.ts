import { describe, it, expect, beforeEach } from "vitest";
import User from "@/models/User";

describe("User Model", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("should create a user with all required fields", async () => {
    const user = await User.create({
      username: "testuser",
      password: "hashed123",
      employeeName: "Test User",
      status: "Active",
      role: "ADMIN",
      orgId: "TESTORG",
    });

    expect(user._id).toBeDefined();
    expect(user.username).toBe("testuser");
    expect(user.employeeName).toBe("Test User");
    expect(user.status).toBe("Active");
    expect(user.role).toBe("ADMIN");
  });

  it("should enforce required fields", async () => {
    await expect(
      User.create({
        // missing required fields
        username: "test",
         
      } as any)
    ).rejects.toThrow();
  });

  it("should enforce unique username per org via index", async () => {
    await User.create({
      username: "uniqueuser",
      password: "hashed123",
      employeeName: "User One",
      status: "Active",
      role: "USER",
      orgId: "TESTORG",
    });

    await expect(
      User.create({
        username: "uniqueuser",
        password: "hashed123",
        employeeName: "User Two",
        status: "Active",
        role: "USER",
        orgId: "TESTORG",
      })
    ).rejects.toThrow();
  });

  it("should default status to Active", async () => {
    const user = await User.create({
      username: "defaultstatus",
      password: "hashed123",
      employeeName: "Default Status",
      role: "USER",
      orgId: "TESTORG",
    });

    expect(user.status).toBe("Active");
  });

  it("should default isFirstLogin to true", async () => {
    const user = await User.create({
      username: "firstlogin",
      password: "hashed123",
      employeeName: "First Login",
      role: "USER",
      orgId: "TESTORG",
    });

    expect(user.isFirstLogin).toBe(true);
  });

  it("should accept valid roles", async () => {
    const validRoles = ["SYS_ADMIN", "ADMIN", "ACCOUNTS", "ORG_USER", "USER", "MANAGER", "ACCOUNTANT"];

    for (const role of validRoles) {
      const user = await User.create({
        username: `user_${role}`,
        password: "hashed123",
        employeeName: `User ${role}`,
         
        role: role as any,
        orgId: "TESTORG",
      });
      expect(user.role).toBe(role);
    }
  });

  it("should persist supported assigned modules including AI", async () => {
    const user = await User.create({
      username: "moduleuser",
      password: "hashed123",
      employeeName: "Module User",
      role: "USER",
      orgId: "TESTORG",
      modules: ["dashboard", "payments", "ai"],
    });

    expect(user.modules).toEqual(["dashboard", "payments", "ai"]);
  });

  it("should reject unsupported assigned modules", async () => {
    await expect(User.create({
      username: "badmoduleuser",
      password: "hashed123",
      employeeName: "Bad Module User",
      role: "USER",
      orgId: "TESTORG",
      modules: ["dashboard", "unknown-module"],
    })).rejects.toThrow();
  });
});
