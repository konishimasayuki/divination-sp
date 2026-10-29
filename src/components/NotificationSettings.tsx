"use client";

import { useCallback, useEffect, useState } from "react";

type Cat = { key: string; label: string; desc: string };
type State = "loading" | "unsupported" | "needInstall" | "denied" | "off" | "on";

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const isIOS = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export async function swRegistration() {
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  await navigator.serviceWorker.ready;
  return reg;
}

// プッシュ通知の設定(この端末で受け取る/種類ごとのオン・オフ/テスト)
export function NotificationSettings({ ownerType, ownerId }: { ownerType: "user" | "provider"; ownerId: string }) {
  const [state, setState] = useState<State>("loading");
  const [prefs, setPrefsState] = useState<Record<string, boolean>>({});
  const [cats, setCats] = useState<Cat[]>([]);
  const [publicKey, setPublicKey] = useState("");
  const [devices, setDevices] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/push?type=${ownerType}&id=${encodeURIComponent(ownerId)}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setPublicKey(d.publicKey);
      setPrefsState(d.prefs ?? {});
      setCats(d.categories ?? []);
      setDevices(d.devices ?? 0);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "通知の設定を読み込めませんでした");
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState(isIOS() && !isStandalone() ? "needInstall" : "unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    const reg = await swRegistration();
    const sub = await reg.pushManager.getSubscription();
    setState(sub && Notification.permission === "granted" ? "on" : "off");
  }, [ownerType, ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  async function turnOn() {
    setBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await swRegistration();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) }));
      const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "subscribe", type: ownerType, id: ownerId, subscription: sub.toJSON() }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setDevices(d.devices ?? devices + 1);
      setState("on");
      setMsg("この端末で通知を受け取れるようになりました");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "通知をオンにできませんでした");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMsg("");
    try {
      const reg = await swRegistration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unsubscribe", endpoint: sub.endpoint }) });
        await sub.unsubscribe();
        setDevices(Math.max(0, devices - 1));
      }
      setState("off");
      setMsg("この端末の通知をオフにしました");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(key: string) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefsState(next);
    const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "prefs", type: ownerType, id: ownerId, prefs: next }) });
    if (res.ok) setPrefsState((await res.json()).prefs);
  }

  async function test() {
    setMsg("");
    const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test", type: ownerType, id: ownerId }) });
    const d = await res.json();
    setMsg(d.sent > 0 ? "テスト通知を送りました。数秒で届きます" : "送れる端末がありません。先に「この端末で通知を受け取る」を押してください");
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-line bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[15px] font-bold">この端末の通知</div>
            <div className="mt-0.5 text-xs text-mute">
              {state === "on" ? "オン ・ この端末に届きます" : state === "loading" ? "確認しています…" : "オフ"}
              {devices > 0 && ` (登録端末 ${devices}台)`}
            </div>
          </div>
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${state === "on" ? "bg-mint" : "bg-edge"}`} aria-hidden />
        </div>

        {state === "needInstall" && (
          <div className="mt-3 rounded-xl bg-night px-3.5 py-3 text-xs leading-relaxed text-soft">
            iPhoneで通知を受け取るには、先にホーム画面に追加してください。
            <ol className="mt-1.5 list-decimal pl-4">
              <li>Safariの共有ボタンをタップ</li>
              <li>「ホーム画面に追加」をタップ</li>
              <li>ホーム画面の「杉の泉」から開いて、この画面に戻る</li>
            </ol>
          </div>
        )}
        {state === "unsupported" && <p className="mt-3 text-xs leading-relaxed text-mute">このブラウザは通知に対応していません。iPhoneはSafari、AndroidはChromeでお試しください。</p>}
        {state === "denied" && (
          <p className="mt-3 text-xs leading-relaxed text-rose">
            通知がブロックされています。端末の設定 → 通知 →「杉の泉」(またはブラウザのサイト設定)で、通知を許可してから戻ってください。
          </p>
        )}
        {state === "off" && (
          <button onClick={turnOn} disabled={busy || !publicKey} className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-gold text-sm font-bold text-ink disabled:opacity-50">
            {busy ? "設定しています…" : "この端末で通知を受け取る"}
          </button>
        )}
        {state === "on" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={test} className="flex h-11 items-center justify-center rounded-xl border border-gold text-sm font-bold text-gold">テスト通知</button>
            <button onClick={turnOff} disabled={busy} className="flex h-11 items-center justify-center rounded-xl border border-edge text-sm text-soft">この端末はオフ</button>
          </div>
        )}
        {msg && <p className="mt-2.5 text-xs text-lav">{msg}</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="px-4 pb-1 pt-3.5 text-[13px] font-medium text-lav">通知する内容</div>
        {cats.map((c, i) => {
          const on = prefs[c.key] !== false;
          return (
            <button key={c.key} onClick={() => toggle(c.key)} className={`flex w-full items-center gap-3 px-4 py-3 text-left ${i < cats.length - 1 ? "border-b border-deep" : ""}`} aria-pressed={on}>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-text">{c.label}</span>
                <span className="mt-0.5 block text-[11px] text-mute">{c.desc}</span>
              </span>
              <span className={`relative h-[30px] w-[52px] shrink-0 rounded-full ${on ? "bg-gold" : "bg-edge"}`}>
                <span className="absolute top-[3px] h-6 w-6 rounded-full bg-text" style={{ left: on ? 25 : 3 }} />
              </span>
            </button>
          );
        })}
      </section>
      <p className="px-1 text-[11px] leading-relaxed text-dim">通知はこの端末ごとに設定します。スマホとパソコンの両方で受け取りたい場合は、それぞれで「この端末で通知を受け取る」を押してください。</p>
    </div>
  );
}
