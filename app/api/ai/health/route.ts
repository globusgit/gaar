import { NextRequest, NextResponse } from "next/server";
import { getProviderName, getModelName } from "@/lib/llm";
import { hasModuleAccess, requireAuth } from "@/lib/apiGuard";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  if (!hasModuleAccess(auth, "ai")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const provider = getProviderName();
  const model = getModelName();
  const configured = provider === "groq"
    ? !!process.env.GROQ_API_KEY
    : provider === "ollama"
    ? true
    : !!process.env.OPENAI_API_KEY;

  return NextResponse.json({
    status: configured ? "ready" : "not_configured",
    provider,
    model,
    configured,
    timestamp: new Date().toISOString(),
  });
}
