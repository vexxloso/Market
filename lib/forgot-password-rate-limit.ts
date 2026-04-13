const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const buckets = new Map<string, { count: number; windowStart: number }>();

export function allowForgotPassword(emailNorm: string): boolean {
  const key = emailNorm.toLowerCase();
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (b.count >= MAX_PER_WINDOW) return false;
  b.count += 1;
  return true;
}

