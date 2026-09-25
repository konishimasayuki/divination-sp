"use client";

import { useState } from "react";
import { useAgoraCall } from "@/lib/useAgoraCall";
import { AdminShell, panel } from "@/components/AdminShell";

function TestRoom({ channel, audioOnly }: { channel: string; audioOnly: boolean }) {
  const call = useAgoraCall({ channel, uid: 9, audioOnly });
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-[#16112B]">
        <div ref={call.remoteRef} className="absolute inset-0" />
        {!call.remoteHasVideo && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-mute">
            {call.status === "error" ? call.error : call.status !== "connected" ? "接続しています…" : call.remoteJoined ? "相手はカメラOFFです" : "相手の入室を待っています(別の端末で同じチャンネル名に入ってください)"}
          </div>
        )}
        {!audioOnly && (
          <div className="absolute right-3 top-3 h-28 w-20 overflow-hidden rounded-lg border-2 border-night bg-deep">
            <div ref={call.localRef} className="h-full w-full" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className={`rounded-full px-3 py-1 text-xs ${call.status === "connected" ? "bg-[#1F3A33] text-mint-hi" : call.status === "error" ? "bg-[#3A1C24] text-rose" : "bg-deep text-mute"}`}>
          {call.status === "connected" ? "Agora接続済み" : call.status === "error" ? "エラー" : "接続中"}
        </span>
        <button onClick={call.toggleMic} className="rounded-lg border border-edge px-3 py-1 text-xs">マイク{call.micOn ? "ON" : "OFF"}</button>
        {!audioOnly && <button onClick={call.toggleCam} className="rounded-lg border border-edge px-3 py-1 text-xs">カメラ{call.camOn ? "ON" : "OFF"}</button>}
        {!audioOnly && <button onClick={() => call.switchCamera()} className="rounded-lg border border-edge px-3 py-1 text-xs">カメラ切替</button>}
        <button onClick={call.togglePip} className="rounded-lg border border-edge px-3 py-1 text-xs">ワイプ</button>
      </div>
    </div>
  );
}

export default function VideoTest() {
  const [channel, setChannel] = useState("admin-test");
  const [audioOnly, setAudioOnly] = useState(false);
  const [joined, setJoined] = useState(false);

  return (
    <AdminShell title="ビデオテスト" sub="同じチャンネル名に2台の端末で入ると、実際の通話を確認できます">
      <div className={`${panel} flex max-w-3xl flex-col gap-4`}>
        {!joined ? (
          <>
            <label className="flex flex-col gap-1.5 text-xs text-lav">
              チャンネル名
              <input value={channel} onChange={(e) => setChannel(e.target.value)} className="h-10 rounded-[10px] border border-edge bg-night px-3 text-sm outline-none focus:border-gold" />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setAudioOnly(false)} className={`h-10 flex-1 rounded-[10px] border text-sm ${!audioOnly ? "border-gold bg-deep" : "border-edge text-mute"}`}>ビデオ通話</button>
              <button onClick={() => setAudioOnly(true)} className={`h-10 flex-1 rounded-[10px] border text-sm ${audioOnly ? "border-gold bg-deep" : "border-edge text-mute"}`}>音声のみ</button>
            </div>
            <button onClick={() => channel.trim() && setJoined(true)} className="h-11 rounded-[10px] bg-gold text-sm font-bold text-ink">テスト通話に入る</button>
          </>
        ) : (
          <>
            <TestRoom channel={channel.trim()} audioOnly={audioOnly} />
            <button onClick={() => setJoined(false)} className="h-10 rounded-[10px] bg-danger text-sm font-bold text-white">退出する</button>
          </>
        )}
      </div>
    </AdminShell>
  );
}
