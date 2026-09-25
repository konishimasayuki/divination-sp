import { NextRequest, NextResponse } from "next/server";
import { assertRedis, redis } from "@/lib/redis";
import { initialProviders, normalizeProvider, type Provider } from "@/lib/providers-data";

const KEY = "providers";

async function getProviders(): Promise<Provider[]> {
  assertRedis();
  const data = await redis.get<Provider[]>(KEY);
  if (!data) {
    await redis.set(KEY, initialProviders);
    return initialProviders;
  }
  return data.map((p) => normalizeProvider(p));
}

export async function GET() {
  try {
    return NextResponse.json({ providers: await getProviders() });
  } catch {
    // Upstash未接続時はデモ用の初期データを返す
    return NextResponse.json({ providers: initialProviders, fallback: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const providers = await getProviders();
    const newProvider = normalizeProvider({
      id: `p${Date.now()}`,
      name: body.name,
      tag: body.tag || "",
      status: "off",
      chatRate: Number(body.chatRate) || 50,
      callRate: Number(body.callRate) || 120,
      voiceRate: Number(body.voiceRate) || 90,
      reviewCount: 0,
      rating: 0,
      styleTags: [],
      bio: "",
      photo: body.photo || "/provider1.jpg",
      loginId: body.loginId || `provider${Date.now()}`,
      loginPassword: body.loginPassword || "changeme",
      visible: body.visible ?? true,
      isAI: !!body.isAI,
    });
    const updated = [...providers, newProvider];
    await redis.set(KEY, updated);
    return NextResponse.json({ providers: updated });
  } catch {
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
    const updated = providers.map((p) => (p.id === body.id ? normalizeProvider({ ...p, ...body.updates }) : p));
    await redis.set(KEY, updated);
    return NextResponse.json({ providers: updated });
  } catch {
    return NextResponse.json(
      { error: "Upstashへの保存に失敗しました。環境変数の設定を確認してください。" },
      { status: 500 }
    );
  }
}
