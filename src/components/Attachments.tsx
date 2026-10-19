"use client";

import { useRef } from "react";
import type { Attachment } from "@/lib/types";
import { fmtSize, kindOf } from "@/lib/attach";
import { IClip, IClose, IFile } from "./icons";

// メッセージに付いた写真・動画・ファイルの表示
export function AttachmentList({ items, mine }: { items: Attachment[]; mine?: boolean }) {
  return (
    <div className={`flex max-w-[80%] flex-col gap-1.5 ${mine ? "items-end" : "items-start"}`}>
      {items.map((a, i) =>
        a.kind === "image" ? (
          <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-line">
            <img src={a.url} alt={a.name} className="block max-h-64 w-auto max-w-full object-cover" />
          </a>
        ) : a.kind === "video" ? (
          <video key={i} src={a.url} controls playsInline preload="metadata" className="block max-h-72 max-w-full rounded-2xl border border-line bg-black" />
        ) : (
          <a key={i} href={a.url} target="_blank" rel="noreferrer" download={a.name} className="flex w-60 max-w-full items-center gap-2.5 rounded-2xl border border-line bg-card px-3 py-2.5 text-text">
            <IFile className="shrink-0 text-gold" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{a.name}</span>
              <span className="block text-[11px] text-mute">{fmtSize(a.size)} ・ タップで開く</span>
            </span>
          </a>
        )
      )}
    </div>
  );
}

// 添付ボタン(写真・動画・ファイルを選ぶ)
export function AttachButton({ onPick, disabled }: { onPick: (files: File[]) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} disabled={disabled} aria-label="写真・動画・ファイルを添付" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-edge text-lav disabled:opacity-40">
        <IClip />
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onPick(files);
          e.target.value = "";
        }}
      />
    </>
  );
}

// 送信前に選んだファイルの一覧(×で外せる)
export function PendingFiles({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (!files.length) return null;
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
      {files.map((f, i) => (
        <span key={i} className="flex h-9 max-w-[200px] shrink-0 items-center gap-1.5 rounded-full border border-edge bg-card pl-3 pr-1 text-xs">
          <span className="text-gold">{kindOf(f.type) === "image" ? "写真" : kindOf(f.type) === "video" ? "動画" : "ファイル"}</span>
          <span className="truncate text-soft">{f.name}</span>
          <button type="button" onClick={() => onRemove(i)} aria-label={`${f.name}を外す`} className="flex h-7 w-7 shrink-0 items-center justify-center text-mute">
            <IClose size={14} />
          </button>
        </span>
      ))}
    </div>
  );
}
