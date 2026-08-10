import { describe, it, expect } from "vitest";
import { convertToWords } from "@/lib/convertToWords";

describe("convertToWords", () => {
  it("converts zero to Zero Rupees Only", () => {
    expect(convertToWords(0)).toBe("Zero Rupees Only");
  });

  it("converts single digit numbers", () => {
    expect(convertToWords(1)).toBe("One Rupees Only");
    expect(convertToWords(5)).toBe("Five Rupees Only");
    expect(convertToWords(9)).toBe("Nine Rupees Only");
  });

  it("converts teen numbers", () => {
    expect(convertToWords(10)).toBe("Ten Rupees Only");
    expect(convertToWords(13)).toBe("Thirteen Rupees Only");
    expect(convertToWords(19)).toBe("Nineteen Rupees Only");
  });

  it("converts tens numbers", () => {
    expect(convertToWords(20)).toBe("Twenty Rupees Only");
    expect(convertToWords(35)).toBe("Thirty-Five Rupees Only");
    expect(convertToWords(90)).toBe("Ninety Rupees Only");
  });

  it("converts hundreds", () => {
    expect(convertToWords(100)).toBe("One Hundred Rupees Only");
    expect(convertToWords(250)).toBe("Two Hundred Fifty Rupees Only");
    expect(convertToWords(999)).toBe("Nine Hundred Ninety-Nine Rupees Only");
  });

  it("converts thousands", () => {
    expect(convertToWords(1000)).toBe("One Thousand Rupees Only");
    expect(convertToWords(1500)).toBe("One Thousand, Five Hundred Rupees Only");
    expect(convertToWords(10000)).toBe("Ten Thousand Rupees Only");
  });

  it("converts larger numbers", () => {
    expect(convertToWords(100000)).toBe("One Hundred Thousand Rupees Only");
    expect(convertToWords(1000000)).toBe("One Million Rupees Only");
  });

  it("returns empty string for null/undefined", () => {
    expect(convertToWords(null as unknown as number)).toBe("");
    expect(convertToWords(undefined as unknown as number)).toBe("");
    expect(convertToWords("")).toBe("");
  });
});
