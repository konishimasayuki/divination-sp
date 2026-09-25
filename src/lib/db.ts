// クライアント側のデータアクセス。Upstash(サーバー)が使えない時はlocalStorageで代替する。
type Item = { id: string; [k: string]: unknown };

function localLoad(name: string): Item[] {
  try {
    return JSON.parse(localStorage.getItem(`fallback:col:${name}`) || "[]");
  } catch {
    return [];
  }
}
function localSave(name: string, items: Item[]) {
  try {
    localStorage.setItem(`fallback:col:${name}`, JSON.stringify(items));
  } catch {
    // no-op
  }
}

export async function list<T>(name: string, filter: Record<string, string> = {}): Promise<T[]> {
  const qs = new URLSearchParams(filter).toString();
  try {
    const res = await fetch(`/api/col/${name}${qs ? `?${qs}` : ""}`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.items as T[];
  } catch {
    return localLoad(name).filter((it) =>
      Object.entries(filter).every(([k, v]) => String(it[k]) === v)
    ) as unknown as T[];
  }
}

export async function add<T>(name: string, item: Record<string, unknown>): Promise<T> {
  try {
    const res = await fetch(`/api/col/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error();
    return (await res.json()).item as T;
  } catch {
    const items = localLoad(name);
    const created = {
      ...item,
      id: (item.id as string) || `${name.slice(0, 2)}${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: (item.createdAt as number) || Date.now(),
    } as Item;
    items.push(created);
    localSave(name, items);
    return created as unknown as T;
  }
}

export async function update<T>(name: string, id: string, updates: Record<string, unknown>): Promise<T> {
  try {
    const res = await fetch(`/api/col/${name}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updates }),
    });
    if (!res.ok) throw new Error();
    return (await res.json()).item as T;
  } catch {
    const items = localLoad(name);
    let updated: Item | null = null;
    const next = items.map((it) => {
      if (it.id !== id) return it;
      updated = { ...it, ...updates };
      return updated;
    });
    if (!updated) {
      updated = { id, ...updates } as Item;
      next.push(updated);
    }
    localSave(name, next);
    return updated as unknown as T;
  }
}

export const threadIdOf = (userId: string, providerId: string) => `${userId}__${providerId}`;

export function fmtPt(n: number) {
  return `${n.toLocaleString("ja-JP")}pt`;
}

export function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const DOW = ["日", "月", "火", "水", "木", "金", "土"];
export function fmtDay(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getMonth() + 1}月${d.getDate()}日(${DOW[d.getDay()]})`;
}
export function dowOf(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).getDay();
}
export function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const ZODIAC: [number, number, string][] = [
  [1, 20, "みずがめ座"], [2, 19, "うお座"], [3, 21, "おひつじ座"], [4, 20, "おうし座"], [5, 21, "ふたご座"],
  [6, 22, "かに座"], [7, 23, "しし座"], [8, 23, "おとめ座"], [9, 23, "てんびん座"], [10, 24, "さそり座"],
  [11, 23, "いて座"], [12, 22, "やぎ座"],
];
export function zodiacOf(birthday: string) {
  if (!birthday) return "";
  const d = new Date(`${birthday}T00:00:00`);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const [, start, name] = ZODIAC[m - 1];
  if (day >= start) return name;
  return m === 1 ? "やぎ座" : ZODIAC[m - 2][2];
}
export function fmtBirth(birthday: string) {
  return birthday ? birthday.replaceAll("-", ".") : "未登録";
}
