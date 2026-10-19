"use client";

import { upload } from "@vercel/blob/client";
import type { Attachment } from "./types";
import { uploadImage } from "./upload";

export const MAX_ATTACH_MB = 50;

export function kindOf(type: string): Attachment["kind"] {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  return "file";
}

export function fmtSize(n: number) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

// 1ファイルをアップロードして添付情報を返す
// Blob未設定の環境では、写真だけは縮小して従来の画像保存に回す
export async function uploadAttachment(file: File, threadId: string): Promise<Attachment> {
  if (file.size > MAX_ATTACH_MB * 1024 * 1024) throw new Error(`${file.name} は${MAX_ATTACH_MB}MBを超えています`);
  const type = file.type || "application/octet-stream";
  const kind = kindOf(type);
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-60) || "file";
  try {
    const blob = await upload(`messages/${threadId}/${safe}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      contentType: type,
      multipart: file.size > 8 * 1024 * 1024,
    });
    return { url: blob.url, name: file.name, type, size: file.size, kind };
  } catch (e) {
    if (kind === "image") {
      const url = await uploadImage(file, { max: 1600 });
      return { url, name: file.name, type: "image/jpeg", size: file.size, kind };
    }
    const msg = e instanceof Error ? e.message : "";
    throw new Error(msg.includes("未設定") || msg.includes("503") ? "動画・ファイルの送信は準備中です(写真は送れます)" : `${file.name} を送れませんでした`);
  }
}
