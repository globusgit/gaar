const store = new Map<string, { count: number; resetAt: number }>();

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfter: number };

export function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  record.count += 1;

  if (record.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  return { allowed: true, remaining: limit - record.count, retryAfter: 0 };
}

export function rateLimitKey(identifier: string, scope = "global"): string {
  return `${scope}:${identifier}`;
}
