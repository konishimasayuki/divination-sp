import type { Message } from "./types";
import { update } from "./db";

// 送信取り消しができる時間(送信から)
export const RETRACT_HOURS = 24;

// 取り消せるか: 自分のメッセージで、送信から24時間以内。有料で開封済みのものはお客様が支払っているので不可
export function canRetract(m: Message, now = Date.now()) {
  if (m.retracted || m.from === "system") return false;
  if ((m.price ?? 0) > 0 && m.unlocked) return false;
  return now - m.createdAt < RETRACT_HOURS * 3600 * 1000;
}

// 送信を取り消す(本文と添付を消して「取り消しました」表示にする)
export async function retractMessage(id: string) {
  const updates = { retracted: true, retractedAt: Date.now(), text: "", attachments: [] };
  let res: Response;
  try {
    res = await fetch("/api/col/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updates }),
    });
  } catch {
    await update("messages", id, updates); // サーバーが使えない環境(ローカル保存)
    return;
  }
  if (res.status === 409) throw new Error((await res.json().catch(() => ({}))).error || "このメッセージは取り消せません");
  if (!res.ok) await update("messages", id, updates);
}

export function retractedLabel(mine: boolean, name: string) {
  return mine ? "メッセージの送信を取り消しました" : `${name}がメッセージの送信を取り消しました`;
}
