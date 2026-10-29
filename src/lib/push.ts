import webpush from "web-push";
import { redis, redisConfigured } from "./redis";

// プッシュ通知(Web Push)。購読情報・通知設定・鍵はUpstashに保存する
export type OwnerType = "user" | "provider";
export type PushPrefs = Record<string, boolean>;

export const PUSH_CATEGORIES: Record<OwnerType, { key: string; label: string; desc: string }[]> = {
  provider: [
    { key: "bookings", label: "新しい予約", desc: "お客様が鑑定を予約したとき" },
    { key: "messages", label: "メッセージ", desc: "お客様からメッセージが届いたとき" },
    { key: "gifts", label: "感謝", desc: "お客様から感謝が届いたとき" },
    { key: "unlocks", label: "返信の開封", desc: "お客様があなたの返信を開封したとき" },
  ],
  user: [
    { key: "replies", label: "先生からの返信", desc: "先生から返信が届いたとき" },
    { key: "bookings", label: "予約のお知らせ", desc: "予約の確定・キャンセルなど" },
  ],
};

type Sub = { endpoint: string; keys: { p256dh: string; auth: string }; ownerType: OwnerType; ownerId: string; ua?: string; createdAt: number };
const SUBS = "push:subs";
const prefsKey = (t: OwnerType, id: string) => `push:prefs:${t}:${id}`;

// VAPID鍵:環境変数があればそれを、なければ初回に自動で作って保存する
export async function vapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const envPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const envPriv = process.env.VAPID_PRIVATE_KEY;
  if (envPub && envPriv) return { publicKey: envPub, privateKey: envPriv };
  if (!redisConfigured) throw new Error("通知の設定にはデータベース(Upstash)が必要です");
  const saved = await redis.get<{ publicKey: string; privateKey: string }>("push:vapid");
  if (saved?.publicKey && saved?.privateKey) return saved;
  const keys = webpush.generateVAPIDKeys();
  await redis.set("push:vapid", keys);
  return keys;
}

export async function getPrefs(t: OwnerType, id: string): Promise<PushPrefs> {
  const defaults = Object.fromEntries(PUSH_CATEGORIES[t].map((c) => [c.key, true]));
  if (!redisConfigured) return defaults;
  const saved = (await redis.get<PushPrefs>(prefsKey(t, id))) ?? {};
  return { ...defaults, ...saved };
}

export async function setPrefs(t: OwnerType, id: string, prefs: PushPrefs) {
  const allowed = new Set(PUSH_CATEGORIES[t].map((c) => c.key));
  const clean = Object.fromEntries(Object.entries(prefs).filter(([k]) => allowed.has(k)).map(([k, v]) => [k, !!v]));
  await redis.set(prefsKey(t, id), clean);
  return getPrefs(t, id);
}

async function loadSubs(): Promise<Sub[]> {
  return ((await redis.get<Sub[]>(SUBS)) ?? []) as Sub[];
}

export async function addSub(t: OwnerType, id: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }, ua?: string) {
  const subs = (await loadSubs()).filter((s) => s.endpoint !== sub.endpoint);
  subs.push({ endpoint: sub.endpoint, keys: sub.keys, ownerType: t, ownerId: id, ua: ua?.slice(0, 120), createdAt: Date.now() });
  await redis.set(SUBS, subs.slice(-2000));
}

export async function removeSub(endpoint: string) {
  const subs = await loadSubs();
  await redis.set(SUBS, subs.filter((s) => s.endpoint !== endpoint));
}

export async function countSubs(t: OwnerType, id: string) {
  return (await loadSubs()).filter((s) => s.ownerType === t && s.ownerId === id).length;
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

// 相手に通知を送る。category を指定すると、その種類をオフにしている人には送らない
export async function sendPush(t: OwnerType, id: string, payload: PushPayload, category?: string) {
  if (!redisConfigured || !id) return 0;
  try {
    if (category) {
      const prefs = await getPrefs(t, id);
      if (prefs[category] === false) return 0;
    }
    const subs = (await loadSubs()).filter((s) => s.ownerType === t && s.ownerId === id);
    if (!subs.length) return 0;
    const { publicKey, privateKey } = await vapidKeys();
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:info@suginoizumi.com", publicKey, privateKey);
    const dead: string[] = [];
    let sent = 0;
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify({ ...payload, icon: "/icon-192.png" }), { TTL: 60 * 60 * 24 });
          sent++;
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) dead.push(s.endpoint);
        }
      })
    );
    if (dead.length) {
      const all = await loadSubs();
      await redis.set(SUBS, all.filter((s) => !dead.includes(s.endpoint)));
    }
    return sent;
  } catch {
    return 0;
  }
}

// 汎用APIでデータが追加・更新されたときに、関係する相手へ通知する
type Row = Record<string, unknown>;
const short = (s: unknown, n = 40) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
};

async function nameOfUser(id: string) {
  const users = ((await redis.get<Row[]>("col:users")) ?? []) as Row[];
  return String(users.find((u) => u.id === id)?.name ?? "お客様");
}
async function nameOfProvider(id: string) {
  const ps = ((await redis.get<Row[]>("providers")) ?? []) as Row[];
  return String(ps.find((p) => p.id === id)?.name ?? "先生").replace(/\((AI・)?デモ\)/, "");
}

export async function notifyOnCreate(name: string, item: Row) {
  if (name === "messages") {
    if (item.from === "user") {
      const who = await nameOfUser(String(item.userId));
      const hasFile = Array.isArray(item.attachments) && item.attachments.length > 0;
      await sendPush("provider", String(item.providerId), {
        title: `${who}さんからメッセージ`,
        body: short(item.text) || (hasFile ? "ファイルが届きました" : "新しいメッセージが届きました"),
        url: `/provider/messages/${item.userId}`,
        tag: `msg-${item.threadId}`,
      }, "messages");
    } else if (item.from === "provider") {
      const who = await nameOfProvider(String(item.providerId));
      // 開封前の本文は通知にも出さない
      const locked = Number(item.price) > 0 && !item.unlocked;
      await sendPush("user", String(item.userId), {
        title: `${who}から返信が届きました`,
        body: locked ? "タップして返信を確認できます" : short(item.text) || "新しいメッセージ",
        url: `/messages/${item.providerId}`,
        tag: `msg-${item.threadId}`,
      }, "replies");
    }
  } else if (name === "bookings") {
    await sendPush("provider", String(item.providerId), {
      title: "新しい予約が入りました",
      body: `${item.date ?? ""} ${item.time ?? ""} ・ ${item.userName ?? "お客様"}さん(${item.method === "voice" ? "音声" : "ビデオ"}${item.minutes ?? ""}分)`,
      url: "/provider",
      tag: `booking-${item.id}`,
    }, "bookings");
  } else if (name === "history" && item.kind === "gift" && item.providerId) {
    const who = await nameOfUser(String(item.userId));
    await sendPush("provider", String(item.providerId), {
      title: "感謝が届きました",
      body: `${who}さんから「${item.detail ?? "感謝"}」(${Math.abs(Number(item.points) || 0).toLocaleString()}pt)`,
      url: "/provider/earnings",
      tag: `gift-${item.id}`,
    }, "gifts");
  }
}

export async function notifyOnUpdate(name: string, before: Row | undefined, after: Row | undefined) {
  if (!before || !after) return;
  if (name === "messages" && after.from === "provider" && !before.unlocked && after.unlocked) {
    const who = await nameOfUser(String(after.userId));
    await sendPush("provider", String(after.providerId), {
      title: "返信が開封されました",
      body: `${who}さんがあなたの返信を開封しました`,
      url: `/provider/messages/${after.userId}`,
      tag: `unlock-${after.id}`,
    }, "unlocks");
  }
  if (name === "bookings" && before.status !== "canceled" && after.status === "canceled") {
    const pname = await nameOfProvider(String(after.providerId));
    await sendPush("user", String(after.userId), {
      title: "予約がキャンセルされました",
      body: `${after.date ?? ""} ${after.time ?? ""} ${pname}の予約`,
      url: "/history",
      tag: `booking-${after.id}`,
    }, "bookings");
    await sendPush("provider", String(after.providerId), {
      title: "予約がキャンセルされました",
      body: `${after.date ?? ""} ${after.time ?? ""} ・ ${after.userName ?? "お客様"}さん`,
      url: "/provider",
      tag: `booking-${after.id}`,
    }, "bookings");
  }
}
