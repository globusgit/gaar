import OpenAI from "openai";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const AI_PROVIDER = process.env.AI_PROVIDER || "groq";

export type AIProvider = "groq" | "openai" | "ollama";

export interface LLMConfig {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_CONFIG: LLMConfig = {
  provider: AI_PROVIDER as AIProvider,
  model: process.env.AI_MODEL || "llama3.1-sonar-small-32k",
  temperature: 0.3,
  maxTokens: 4096,
};

function getClient(): OpenAI {
  const apiKey =
    DEFAULT_CONFIG.provider === "groq"
      ? GROQ_API_KEY
      : OPENAI_API_KEY;

  const baseURL =
    DEFAULT_CONFIG.provider === "ollama"
      ? `${OLLAMA_BASE_URL}/v1`
      : undefined;

  return new OpenAI({
    apiKey,
    baseURL,
    ...(DEFAULT_CONFIG.provider === "ollama" ? { dangerouslyAllowBrowser: true } : {}),
  });
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  config?: Partial<LLMConfig>
): Promise<string> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: mergedConfig.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: mergedConfig.temperature,
    max_tokens: mergedConfig.maxTokens,
    response_format: { type: "text" },
  });

  return completion.choices[0]?.message?.content || "";
}

export async function generateStructuredResponse<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: Record<string, unknown>,
  config?: Partial<LLMConfig>
): Promise<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: mergedConfig.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: mergedConfig.temperature,
    max_tokens: mergedConfig.maxTokens,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as T;
}

export function getProviderName(): string {
  return DEFAULT_CONFIG.provider;
}

export function getModelName(): string {
  return DEFAULT_CONFIG.model;
}
