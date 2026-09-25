import { NextResponse } from "next/server";

// 環境変数が設定されているかだけを返す(値そのものは返さない)
export async function GET() {
  const e = process.env;
  return NextResponse.json({
    stripe: !!(e.STRIPE_SECRET_KEY && e.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    stripeTest: (e.STRIPE_SECRET_KEY ?? "").startsWith("sk_test"),
    agora: !!(e.NEXT_PUBLIC_AGORA_APP_ID && e.AGORA_APP_CERTIFICATE),
    claude: !!e.ANTHROPIC_API_KEY,
    upstash: !!(e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN),
  });
}
