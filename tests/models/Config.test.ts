import { describe, it, expect, beforeEach } from "vitest";
import Config from "@/models/Config";

describe("Config Model", () => {
  beforeEach(async () => {
    await Config.deleteMany({});
  });

  it("should create a config entry", async () => {
    const config = await Config.create({
      name: "FR Count",
      value: "1",
      orgId: "TESTORG",
    });

    expect(config._id).toBeDefined();
    expect(config.name).toBe("FR Count");
    expect(config.value).toBe("1");
  });

  it("should enforce required fields", async () => {
    await expect(
      Config.create({
        // missing required fields
       
    } as any)
    ).rejects.toThrow();
  });

  it("should enforce unique name + orgId via index", async () => {
    await Config.create({
      name: "Test Config",
      value: "10",
      orgId: "TESTORG",
    });

    await expect(
      Config.create({
        name: "Test Config",
        value: "20",
        orgId: "TESTORG",
      })
    ).rejects.toThrow();
  });
});
