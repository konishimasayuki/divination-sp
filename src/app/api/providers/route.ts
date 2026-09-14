import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { initialProviders, type Provider } from "@/lib/providers-data";

const KEY = "providers";

async function getProviders(): Promise<Provider[]> {
  const data = await redis.get<Provider[]>(KEY);
  if (!data) {
    await redis.set(KEY, initialProviders);
    return initialProviders;
  }
  return data;
}

export async function GET() {
  try {
    const providers = await getProviders();
    return NextResponse.json({ providers });
  } catch {
    // Upstash未接続時などのフォールバック(デモ用の初期データを返す)
    return NextResponse.json({ providers: initialProviders, fallback: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const providers = await getProviders();
    const newProvider: Provider = {
      id: `p${Date.now()}`,
      name: `${body.name}(デモ)`,
      tag: body.tag,
      rating: 4.5,
      status: "off",
      chatRate: Number(body.chatRate) || 50,
      callRate: Number(body.callRate) || 120,
      mailRate: Number(body.mailRate) || 3000,
      reviewCount: 0,
      styleTags: [],
      bio: body.bio || "",
      photo: body.photo || "/provider1.jpg",
    };
    const updated = [...providers, newProvider];
    await redis.set(KEY, updated);
    return NextResponse.json({ providers: updated });
  } catch (e) {
    return NextResponse.json(
      { error: "Upstashへの保存に失敗しました。環境変数の設定を確認してください。" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const providers = await getProviders();
    const updated = providers.map((p) =>
      p.id === body.id ? { ...p, ...body.updates } : p
    );
    await redis.set(KEY, updated);
    return NextResponse.json({ providers: updated });
  } catch (e) {
    return NextResponse.json(
      { error: "Upstashへの保存に失敗しました。環境変数の設定を確認してください。" },
      { status: 500 }
    );
  }
}
