"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

// Agoraのビデオ/音声通話をまとめたフック(画面側は好きなUIで描画する)
export function useAgoraCall({ channel, uid, audioOnly = false, enabled = true }: { channel: string; uid: number; audioOnly?: boolean; enabled?: boolean }) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const remoteRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoRef = useRef<ICameraVideoTrack | null>(null);
  const camerasRef = useRef<MediaDeviceInfo[]>([]);
  const camIdx = useRef(0);

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState("");
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(!audioOnly);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !channel) return;
    let cancelled = false;
    setStatus("connecting");

    (async () => {
      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        AgoraRTC.setLogLevel(3);
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-joined", () => setRemoteJoined(true));
        client.on("user-left", () => {
          setRemoteJoined(false);
          setRemoteHasVideo(false);
        });
        client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType) => {
          await client.subscribe(user, mediaType);
          setRemoteJoined(true);
          if (mediaType === "video" && remoteRef.current) {
            user.videoTrack?.play(remoteRef.current, { fit: "cover" });
            setRemoteHasVideo(true);
          }
          if (mediaType === "audio") user.audioTrack?.play();
        });
        client.on("user-unpublished", (_u, mediaType) => {
          if (mediaType === "video") setRemoteHasVideo(false);
        });

        const res = await fetch(`/api/agora-token?channel=${encodeURIComponent(channel)}&uid=${uid}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "トークンの取得に失敗しました");
        await client.join(data.appId, data.channelName, data.token, uid);
        if (cancelled) return;

        const mic = await AgoraRTC.createMicrophoneAudioTrack();
        audioRef.current = mic;
        const tracks: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [mic];
        if (!audioOnly) {
          camerasRef.current = await AgoraRTC.getCameras().catch(() => []);
          const cam = await AgoraRTC.createCameraVideoTrack();
          videoRef.current = cam;
          if (localRef.current) cam.play(localRef.current, { fit: "cover" });
          tracks.push(cam);
        }
        await client.publish(tracks);
        if (!cancelled) {
          setStatus("connected");
          setConnectedAt(Date.now());
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "通話に接続できませんでした");
        }
      }
    })();

    return () => {
      cancelled = true;
      audioRef.current?.close();
      videoRef.current?.close();
      audioRef.current = null;
      videoRef.current = null;
      const client = clientRef.current;
      if (client) {
        client.remoteUsers.forEach((u) => {
          u.audioTrack?.stop();
          u.videoTrack?.stop();
        });
        client.removeAllListeners();
        client.leave().catch(() => {});
      }
      clientRef.current = null;
    };
  }, [channel, uid, audioOnly, enabled]);

  const toggleMic = useCallback(() => {
    const t = audioRef.current;
    if (!t) return;
    const next = !micOn;
    t.setEnabled(next);
    setMicOn(next);
  }, [micOn]);

  const toggleCam = useCallback(() => {
    const t = videoRef.current;
    if (!t) return;
    const next = !camOn;
    t.setEnabled(next);
    setCamOn(next);
  }, [camOn]);

  // 前面/背面(顔/手元)カメラの切り替え
  const switchCamera = useCallback(async () => {
    const t = videoRef.current;
    const cams = camerasRef.current;
    if (!t || cams.length < 2) return false;
    camIdx.current = (camIdx.current + 1) % cams.length;
    await t.setDevice(cams[camIdx.current].deviceId);
    return true;
  }, []);

  // 相手の映像をワイプ(ピクチャー・イン・ピクチャー)表示
  const togglePip = useCallback(async () => {
    const el = remoteRef.current?.querySelector("video") as
      | (HTMLVideoElement & { webkitSetPresentationMode?: (m: string) => void; webkitSupportsPresentationMode?: (m: string) => boolean })
      | null;
    if (!el) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (el.webkitSupportsPresentationMode?.("picture-in-picture") && el.webkitSetPresentationMode) {
        el.webkitSetPresentationMode("picture-in-picture");
      } else if (el.requestPictureInPicture) {
        await el.requestPictureInPicture();
      }
    } catch {
      // 非対応端末
    }
  }, []);

  return {
    localRef, remoteRef, status, error, remoteJoined, remoteHasVideo,
    micOn, camOn, connectedAt, toggleMic, toggleCam, switchCamera, togglePip,
    canSwitch: () => camerasRef.current.length > 1,
  };
}

export function useCountdown(startAt: number | null, totalSec: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = startAt ? Math.floor((now - startAt) / 1000) : 0;
  const left = Math.max(0, totalSec - elapsed);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return { elapsed, left, elapsedText: fmt(elapsed), leftText: fmt(left) };
}
