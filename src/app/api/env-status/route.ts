import { NextResponse } from "next/server";

// 環境変数が設定されているかだけを返す(値そのものは返さない)
export async function GET() {
  const e = process.env;
  return NextResponse.json({
    paypay: !!(e.PAYPAY_API_KEY && e.PAYPAY_API_SECRET && e.PAYPAY_MERCHANT_ID),
    paypayTest: e.PAYPAY_ENV !== "production",
    agora: !!(e.NEXT_PUBLIC_AGORA_APP_ID && e.AGORA_APP_CERTIFICATE),
    claude: !!e.ANTHROPIC_API_KEY,
    blob: !!e.BLOB_READ_WRITE_TOKEN,
    upstash: !!(e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN),
  });
}
