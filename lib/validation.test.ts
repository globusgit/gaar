import { describe, it, expect } from "vitest";
import { validateBody, validateQuery } from "@/lib/validation";
import { z } from "zod";

describe("validateBody", () => {
  it("returns success for valid data", async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const validator = validateBody(schema);
    const mockReq = {
      json: async () => ({ name: "John", age: 30 }),
    } as Request;

    const result = await validator(mockReq);
    expect(result.success).toBe(true);
    expect((result as unknown as { data: { name: string } }).data.name).toBe("John");
  });

  it("returns error for invalid data", async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const validator = validateBody(schema);
    const mockReq = {
      json: async () => ({ name: "John", age: "not a number" }),
    } as Request;

    const result = await validator(mockReq);
    expect(result.success).toBe(false);
    expect((result as unknown as { error: Response }).error).toBeInstanceOf(Response);
    expect((result as unknown as { error: { status: number } }).error.status).toBe(400);
  });
});

describe("validateQuery", () => {
  it("returns success for valid query params", () => {
    const schema = z.object({
      page: z.string().transform(Number),
      limit: z.string().transform(Number),
    });

    const validator = validateQuery(schema);
    const params = new URLSearchParams([
      ["page", "1"],
      ["limit", "10"],
    ]);

    const result = validator(params);
    expect(result.success).toBe(true);
    expect((result as unknown as { data: { page: number; limit: number } }).data.page).toBe(1);
    expect((result as unknown as { data: { page: number; limit: number } }).data.limit).toBe(10);
  });

  it("returns error for invalid query params", () => {
    const schema = z.object({
      page: z.coerce.number(),
    });

    const validator = validateQuery(schema);
    const params = new URLSearchParams([
      ["page", "not-a-number"],
    ]);

    const result = validator(params);
    // z.coerce.number() fails on "not-a-number" because NaN is not valid
    expect(result.success).toBe(false);
    expect((result as unknown as { error: Response }).error).toBeInstanceOf(Response);
    expect((result as unknown as { error: { status: number } }).error.status).toBe(400);
  });
});
