import { toWords } from "number-to-words";

export function convertToWords(amount) {
  if (amount === null || amount === undefined || amount === "") return "";
  const num = Number(amount);
  if (isNaN(num)) return "";
  if (num === 0) return "Zero Rupees Only";
  return (
    toWords(num).replace(/\b\w/g, (c) => c.toUpperCase()) + " Rupees Only"
  );
}
