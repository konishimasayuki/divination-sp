import { Redis } from "@upstash/redis";

// Vercelの環境変数 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN を使用します。
// ローカル(このサンドボックス)には環境変数がないため、ここでは接続テストはできません。
// Vercel上にデプロイされた際に、Vercel Marketplace経由でUpstashと連携していれば
// 自動でこれらの環境変数が設定されます。
export const redis = Redis.fromEnv();
