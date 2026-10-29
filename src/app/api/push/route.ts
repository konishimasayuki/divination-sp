import { NextRequest, NextResponse } from "next/server";
import { addSub, countSubs, getPrefs, PUSH_CATEGORIES, removeSub, sendPush, setPrefs, vapidKeys, type OwnerType } from "@/lib/push";

const isType = (t: unknown): t is OwnerType => t === "user" || t === "provider";

// GET /api/push?type=provider&id=p1 → 公開鍵・通知設定・この人の登録端末数
export async function GET(req: NextRequest) {
  try {
    const t = req.nextUrl.searchParams.get("type");
    const id = req.nextUrl.searchParams.get("id") ?? "";
    const { publicKey } = await vapidKeys();
    if (!isType(t) || !id) return NextResponse.json({ publicKey });
    return NextResponse.json({ publicKey, prefs: await getPrefs(t, id), categories: PUSH_CATEGORIES[t], devices: await countSubs(t, id) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "通知の設定を読み込めませんでした" }, { status: 503 });
  }
}

// POST /api/push  { action: "subscribe" | "unsubscribe" | "prefs" | "test", ... }
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (b.action === "unsubscribe") {
      if (b.endpoint) await removeSub(String(b.endpoint));
      return NextResponse.json({ ok: true });
    }
    if (!isType(b.type) || !b.id) return NextResponse.json({ error: "宛先が正しくありません" }, { status: 400 });
    if (b.action === "subscribe") {
      const s = b.subscription;
      if (!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth) return NextResponse.json({ error: "端末の情報が正しくありません" }, { status: 400 });
      await addSub(b.type, String(b.id), s, req.headers.get("user-agent") ?? undefined);
      return NextResponse.json({ ok: true, devices: await countSubs(b.type, String(b.id)) });
    }
    if (b.action === "prefs") {
      return NextResponse.json({ prefs: await setPrefs(b.type, String(b.id), b.prefs ?? {}) });
    }
    if (b.action === "test") {
      const sent = await sendPush(b.type, String(b.id), { title: "杉の泉", body: "テスト通知です。通知は正しく届いています。", url: b.type === "provider" ? "/provider" : "/home", tag: "test" });
      return NextResponse.json({ sent });
    }
    return NextResponse.json({ error: "不明な操作です" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "通知の処理に失敗しました" }, { status: 500 });
  }
}
