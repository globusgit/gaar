import { describe, it, expect } from "vitest";
import { formatDate } from "@/lib/dateUtil";

describe("formatDate", () => {
  it("formats ISO date string correctly", () => {
    const result = formatDate("2024-01-15T10:30:00Z");
    expect(result).toBe("15 Jan 2024");
  });

  it("formats date only string correctly", () => {
    const result = formatDate("2024-12-25");
    expect(result).toBe("25 Dec 2024");
  });

  it("returns empty string for null/undefined", () => {
    expect(formatDate(null as any)).toBe("");
    expect(formatDate(undefined as any)).toBe("");
    expect(formatDate("")).toBe("");
  });

  it("handles null and undefined", () => {
    expect(formatDate(null as any)).toBe("");
    expect(formatDate(undefined as any)).toBe("");
  });
});
