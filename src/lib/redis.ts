import { Redis } from "@upstash/redis";

// Vercelの環境変数 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN を使用
export const redisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://not-configured.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "not-configured",
  retry: { retries: 2, backoff: (n) => 150 * (n + 1) },
});

export function assertRedis() {
  if (!redisConfigured) throw new Error("Upstashの環境変数が設定されていません");
}
