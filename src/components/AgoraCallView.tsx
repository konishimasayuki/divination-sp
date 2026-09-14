"use client";

import { useEffect, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

type Props = {
  channel: string;
  uid: number;
  localLabel: string;
  remoteLabel: string;
  onClose?: () => void;
};

export default function AgoraCallView({ channel, uid, localLabel, remoteLabel, onClose }: Props) {
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<{
    audio: IMicrophoneAudioTrack | null;
    video: ICameraVideoTrack | null;
  }>({ audio: null, video: null });

  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState("");
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function join() {
      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video" && remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current);
            setRemoteJoined(true);
          }
          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
        });

        client.on("user-unpublished", () => {
          setRemoteJoined(false);
        });

        const tokenRes = await fetch(
          `/api/agora-token?channel=${encodeURIComponent(channel)}&uid=${uid}`
        );
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokenData.error || "トークン取得に失敗しました");

        await client.join(tokenData.appId, tokenData.channelName, tokenData.token, uid);

        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTracksRef.current = { audio: audioTrack, video: videoTrack };
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }
        await client.publish([audioTrack, videoTrack]);

        if (!cancelled) setStatus("connected");
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            e instanceof Error ? e.message : "通話への接続に失敗しました。"
          );
        }
      }
    }

    join();

    return () => {
      cancelled = true;
      localTracksRef.current.audio?.close();
      localTracksRef.current.video?.close();
      const client = clientRef.current;
      if (client) {
        client.remoteUsers.forEach((u) => {
          u.audioTrack?.stop();
          u.videoTrack?.stop();
        });
        client.removeAllListeners();
        client.leave();
      }
    };
  }, [channel, uid]);

  function toggleMic() {
    const audio = localTracksRef.current.audio;
    if (!audio) return;
    audio.setEnabled(!micOn);
    setMicOn((v) => !v);
  }

  function toggleCam() {
    const video = localTracksRef.current.video;
    if (!video) return;
    video.setEnabled(!camOn);
    setCamOn((v) => !v);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-64 overflow-hidden rounded-lg bg-neutral-900">
        <div ref={remoteVideoRef} className="h-full w-full" />
        {!remoteJoined && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">
            {status === "connecting" && "接続中..."}
            {status === "connected" && `${remoteLabel}の参加を待っています`}
            {status === "error" && errorMessage}
          </div>
        )}
        <div className="absolute right-2 top-2 h-20 w-16 overflow-hidden rounded bg-neutral-700">
          <div ref={localVideoRef} className="h-full w-full" />
        </div>
        <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-[10px] text-white">
          {localLabel}(自分)
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={toggleMic}
          className={`flex-1 rounded border py-1.5 text-xs ${
            micOn ? "border-neutral-200" : "border-red-300 bg-red-50 text-red-600"
          }`}
        >
          マイク{micOn ? "ON" : "OFF"}
        </button>
        <button
          onClick={toggleCam}
          className={`flex-1 rounded border py-1.5 text-xs ${
            camOn ? "border-neutral-200" : "border-red-300 bg-red-50 text-red-600"
          }`}
        >
          カメラ{camOn ? "ON" : "OFF"}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 rounded bg-neutral-900 py-1.5 text-xs text-white"
          >
            退室する
          </button>
        )}
      </div>
    </div>
  );
}
