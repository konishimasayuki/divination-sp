"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { fmtPt, list } from "@/lib/db";
import type { HistoryItem } from "@/lib/types";
import { AdminShell, panel } from "@/components/AdminShell";

type Form = { name: string; tag: string; chatRate: string; callRate: string; voiceRate: string; loginId: string; loginPassword: string; visible: boolean; isAI: boolean };
const empty: Form = { name: "", tag: "", chatRate: "50", callRate: "120", voiceRate: "90", loginId: "", loginPassword: "", visible: true, isAI: false };
const fi = "h-10 w-full rounded-[10px] border border-edge bg-night px-3 text-sm outline-none focus:border-gold";

export default function AdminTellers() {
  const { providers, saveProvider, addProvider } = useApp();
  const [sel, setSel] = useState<string | "new">(providers[0]?.id ?? "new");
  const [form, setForm] = useState<Form>(empty);
  const [hist, setHist] = useState<HistoryItem[]>([]);
  const [msg, setMsg] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    list<HistoryItem>("history").then(setHist);
  }, []);

  useEffect(() => {
    setMsg("");
    if (sel === "new") {
      setForm(empty);
      return;
    }
    const p = providers.find((x) => x.id === sel);
    if (p) setForm({ name: p.name, tag: p.tag, chatRate: String(p.chatRate), callRate: String(p.callRate), voiceRate: String(p.voiceRate), loginId: p.loginId, loginPassword: p.loginPassword, visible: p.visible !== false, isAI: !!p.isAI });
  }, [sel, providers]);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const sales = (id: string) => hist.filter((h) => h.providerId === id && h.createdAt >= monthStart).reduce((s, h) => s + Math.abs(h.points), 0);
  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim() || !form.loginId.trim() || !form.loginPassword.trim()) {
      setMsg("表示名・ログインID・パスワードは必須です");
      return;
    }
    const dup = providers.find((p) => p.loginId === form.loginId.trim() && p.id !== sel);
    if (dup) {
      setMsg("このログインIDは他の占い師が使用しています");
      return;
    }
    const body = {
      name: form.name.trim(),
      tag: form.tag.trim(),
      chatRate: Number(form.chatRate) || 50,
      callRate: Number(form.callRate) || 120,
      voiceRate: Number(form.voiceRate) || 90,
      loginId: form.loginId.trim(),
      loginPassword: form.loginPassword,
      visible: form.visible,
      isAI: form.isAI,
    };
    const err = sel === "new" ? await addProvider(body) : await saveProvider(sel, body);
    setMsg(err ?? (sel === "new" ? "追加しました" : "保存しました"));
    if (!err && sel === "new") setForm(empty);
  }

  return (
    <AdminShell
      title="占い師管理"
      actions={<button onClick={() => setSel("new")} className="h-10 shrink-0 rounded-[10px] bg-gold px-4 text-sm font-bold text-ink">+ 占い師を追加</button>}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div>
          <div className={`${panel} overflow-x-auto p-0 lg:p-0`}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-dim">
                <tr className="border-b border-deep">
                  <th className="px-4 py-3 font-normal">名前</th><th className="py-3 font-normal">占術</th><th className="py-3 font-normal">メッセージ</th><th className="py-3 font-normal">ビデオ</th><th className="py-3 font-normal">状態</th><th className="px-4 py-3 text-right font-normal">今月の売上</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id} onClick={() => setSel(p.id)} className={`cursor-pointer border-b border-[#211B3E] ${sel === p.id ? "bg-deep" : "hover:bg-card"}`}>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2.5 font-bold">
                        <img src={p.photo} alt="" className="h-[34px] w-[34px] rounded-full object-cover" />
                        {p.name}
                        {p.visible === false && <span className="rounded bg-night px-1.5 text-[10px] font-normal text-dim">非公開</span>}
                      </span>
                    </td>
                    <td className="text-lav">{p.tag}</td>
                    <td>{p.chatRate}pt/字</td>
                    <td>{p.callRate}pt/分</td>
                    <td className={`text-xs ${p.status === "available" ? "text-mint" : p.status === "busy" ? "text-gold" : "text-dim"}`}>
                      ● {p.status === "available" ? "待機中" : p.status === "busy" ? "鑑定中" : "休止中"}
                    </td>
                    <td className="px-4 text-right font-bold">{fmtPt(sales(p.id))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-xs text-dim">行をクリックすると編集できます。状態(待機中など)とプロフィール文・写真は占い師本人が設定します。</p>
        </div>

        <div className={`${panel} flex flex-col gap-3.5 self-start`}>
          <div className="font-mincho text-lg font-bold">{sel === "new" ? "新しい占い師を追加" : `${form.name} を編集`}</div>
          <label className="flex flex-col gap-1.5 text-xs text-lav">表示名<input className={fi} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="例: 心先生" /></label>
          <label className="flex flex-col gap-1.5 text-xs text-lav">占術・得意分野<input className={fi} value={form.tag} onChange={(e) => set("tag", e.target.value)} placeholder="例: 西洋占星術・恋愛" /></label>
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1.5 text-xs text-lav">メッセージ/字<input inputMode="numeric" className={fi} value={form.chatRate} onChange={(e) => set("chatRate", e.target.value)} /></label>
            <label className="flex flex-col gap-1.5 text-xs text-lav">ビデオ/分<input inputMode="numeric" className={fi} value={form.callRate} onChange={(e) => set("callRate", e.target.value)} /></label>
            <label className="flex flex-col gap-1.5 text-xs text-lav">音声/分<input inputMode="numeric" className={fi} value={form.voiceRate} onChange={(e) => set("voiceRate", e.target.value)} /></label>
          </div>
          <div className="my-1 h-px bg-deep" />
          <div className="text-[13px] font-bold">ログイン情報</div>
          <label className="flex flex-col gap-1.5 text-xs text-lav">ログインID<input className={fi} value={form.loginId} onChange={(e) => set("loginId", e.target.value)} autoComplete="off" /></label>
          <label className="flex flex-col gap-1.5 text-xs text-lav">
            パスワード
            <div className="flex gap-2">
              <input className={fi} type={showPw ? "text" : "password"} value={form.loginPassword} onChange={(e) => set("loginPassword", e.target.value)} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="h-10 shrink-0 rounded-[10px] border border-edge px-3 text-xs text-soft">{showPw ? "隠す" : "表示"}</button>
            </div>
          </label>
          <button onClick={() => set("visible", !form.visible)} className="flex items-center justify-between rounded-[10px] bg-card px-3 py-2.5 text-[13px]">
            お客様に公開する
            <span className={`relative h-[26px] w-11 rounded-full ${form.visible ? "bg-gold" : "bg-edge"}`}>
              <span className="absolute top-[3px] h-5 w-5 rounded-full bg-text" style={{ left: form.visible ? 21 : 3 }} />
            </span>
          </button>
          <button onClick={() => set("isAI", !form.isAI)} className="flex items-center justify-between rounded-[10px] bg-card px-3 py-2.5 text-[13px]">
            AI占い師(メッセージにAIが自動返信)
            <span className={`relative h-[26px] w-11 rounded-full ${form.isAI ? "bg-gold" : "bg-edge"}`}>
              <span className="absolute top-[3px] h-5 w-5 rounded-full bg-text" style={{ left: form.isAI ? 21 : 3 }} />
            </span>
          </button>
          {msg && <p className={`text-xs ${msg.endsWith("ました") ? "text-mint-hi" : "text-rose"}`}>{msg}</p>}
          <button onClick={save} className="h-[46px] rounded-xl bg-gold text-[15px] font-bold text-ink">{sel === "new" ? "追加する" : "保存する"}</button>
        </div>
      </div>
    </AdminShell>
  );
}
