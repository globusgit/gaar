import { NextResponse } from "next/server";
import { z } from "zod";

export function validateBody<T extends z.ZodType>(schema: T) {
  return async (req: Request) => {
    try {
      const body = await req.json();
      const parsed = schema.parse(body);
      return { success: true as const, data: parsed };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false as const,
          error: NextResponse.json(
            { message: "Validation failed", errors: error.issues },
            { status: 400 },
          ),
        };
      }
      return {
        success: false as const,
        error: NextResponse.json(
          { message: "Invalid request body" },
          { status: 400 },
        ),
      };
    }
  };
}

export function validateQuery<T extends z.ZodType>(schema: T) {
  return (searchParams: URLSearchParams) => {
    const raw: Record<string, string | string[]> = {};
    for (const [key, value] of searchParams.entries()) {
      if (raw[key]) {
        raw[key] = Array.isArray(raw[key])
          ? [...(raw[key] as string[]), value]
          : [raw[key] as string, value];
      } else {
        raw[key] = value;
      }
    }
    const result = schema.safeParse(raw);
    if (!result.success) {
      return {
        success: false as const,
        error: NextResponse.json(
          { message: "Validation failed", errors: result.error.issues },
          { status: 400 },
        ),
      };
    }
    return { success: true as const, data: result.data };
  };
}