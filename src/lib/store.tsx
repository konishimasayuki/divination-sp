"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initialProviders, normalizeProvider, type Provider } from "./providers-data";
import { defaultSettings, type HistoryItem, type Settings, type User } from "./types";
import { add, list, update } from "./db";

type Session = { role: "user" | "provider" | "admin"; userId?: string; providerId?: string };
type CartLine = { productId: string; qty: number };

type Ctx = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  providers: Provider[];
  settings: Settings;
  cart: CartLine[];
  login: (id: string, pw: string) => Promise<string | null>;
  register: (data: Omit<User, "id" | "points" | "favorites" | "status" | "createdAt">) => Promise<string | null>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  saveUser: (updates: Partial<User>) => Promise<void>;
  spend: (amount: number, entry: Omit<HistoryItem, "id" | "userId" | "points" | "createdAt">) => Promise<boolean>;
  gain: (amount: number, entry: Omit<HistoryItem, "id" | "userId" | "points" | "createdAt">) => Promise<void>;
  refreshProviders: () => Promise<void>;
  saveProvider: (id: string, updates: Partial<Provider>) => Promise<string | null>;
  addProvider: (data: Record<string, unknown>) => Promise<string | null>;
  refreshSettings: () => Promise<void>;
  saveSettings: (updates: Partial<Settings>) => Promise<void>;
  addToCart: (productId: string, qty?: number) => void;
  setCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  toggleFavorite: (providerId: string) => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);
const SESSION_KEY = "suginoizumi_session_v2";
const CART_KEY = "suginoizumi_cart";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [cart, setCart] = useState<CartLine[]>([]);

  const refreshProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/providers", { cache: "no-store" });
      const data = await res.json();
      if (data.providers) setProviders(data.providers.map((p: Provider) => normalizeProvider(p)));
    } catch {
      // 初期データのまま
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    const items = await list<Settings>("settings", { id: "main" });
    if (items[0]) setSettings({ ...defaultSettings, ...items[0] });
  }, []);

  const loadUser = useCallback(async (userId: string) => {
    const items = await list<User>("users", { id: userId });
    setUser(items[0] ?? null);
    return items[0] ?? null;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        const s: Session | null = raw ? JSON.parse(raw) : null;
        const c = localStorage.getItem(CART_KEY);
        if (c) setCart(JSON.parse(c));
        // 占い師・設定は裏で読み込む(画面表示を待たせない)
        refreshProviders();
        refreshSettings();
        if (s?.role === "user" && s.userId) {
          const u = await loadUser(s.userId);
          if (u) setSession(s);
          else localStorage.removeItem(SESSION_KEY);
        } else if (s) {
          setSession(s);
        }
      } catch {
        // 読み込めなくてもログイン画面から続行できるようにする
      } finally {
        setReady(true);
      }
    })();
  }, [refreshProviders, refreshSettings, loadUser]);

  function persistSession(s: Session | null) {
    setSession(s);
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // no-op
    }
  }

  const login = async (id: string, pw: string) => {
    if (!id.trim() || !pw.trim()) return "メールアドレスとパスワードを入力してください";
    if (id === "z" && pw === "z") {
      persistSession({ role: "admin" });
      return null;
    }
    const prov = providers.find((p) => p.loginId === id && p.loginPassword === pw);
    if (prov || (id === "b" && pw === "b")) {
      persistSession({ role: "provider", providerId: prov?.id ?? "p1" });
      return null;
    }
    if (id === "a" && pw === "a") {
      // デモ用お客様アカウント(なければ作成)
      const found = await list<User>("users", { email: "a" });
      let u = found[0];
      if (!u) {
        u = await add<User>("users", {
          email: "a",
          password: "a",
          name: "占い 花子",
          birthday: "1992-05-14",
          gender: "女性",
          bloodType: "A",
          points: 4240,
          favorites: ["p1", "p2"],
          status: "active",
        });
        await add("history", { userId: u.id, kind: "bonus", label: "会員登録特典", detail: "デモアカウント", points: 4240 });
      }
      setUser(u);
      persistSession({ role: "user", userId: u.id });
      return null;
    }
    const found = await list<User>("users", { email: id });
    const u = found.find((x) => x.password === pw);
    if (!u) return "メールアドレスまたはパスワードが違います";
    if (u.status === "stop") return "このアカウントは利用停止中です。運営にお問い合わせください";
    setUser(u);
    persistSession({ role: "user", userId: u.id });
    return null;
  };

  const register: Ctx["register"] = async (data) => {
    const dup = await list<User>("users", { email: data.email });
    if (dup.length) return "このメールアドレスはすでに登録されています";
    const u = await add<User>("users", {
      ...data,
      points: settings.signupBonus,
      favorites: [],
      status: "active",
    });
    await add("history", { userId: u.id, kind: "bonus", label: "会員登録特典", detail: "ようこそ杉の泉へ", points: settings.signupBonus });
    setUser(u);
    persistSession({ role: "user", userId: u.id });
    return null;
  };

  const logout = () => {
    setUser(null);
    persistSession(null);
  };

  const refreshUser = async () => {
    if (session?.userId) await loadUser(session.userId);
  };

  const saveUser = async (updates: Partial<User>) => {
    if (!user) return;
    const u = await update<User>("users", user.id, updates);
    setUser({ ...user, ...u });
  };

  const spend: Ctx["spend"] = async (amount, entry) => {
    if (!user) return false;
    const latest = (await list<User>("users", { id: user.id }))[0] ?? user;
    if (latest.points < amount) {
      setUser(latest);
      return false;
    }
    const u = await update<User>("users", user.id, { points: latest.points - amount });
    setUser({ ...latest, ...u });
    await add("history", { ...entry, userId: user.id, points: -amount });
    return true;
  };

  const gain: Ctx["gain"] = async (amount, entry) => {
    if (!user) return;
    const latest = (await list<User>("users", { id: user.id }))[0] ?? user;
    const u = await update<User>("users", user.id, { points: latest.points + amount });
    setUser({ ...latest, ...u });
    await add("history", { ...entry, userId: user.id, points: amount });
  };

  const saveProvider = async (id: string, updates: Partial<Provider>) => {
    try {
      const res = await fetch("/api/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "保存に失敗しました";
      setProviders(data.providers.map((p: Provider) => normalizeProvider(p)));
      return null;
    } catch {
      return "保存に失敗しました";
    }
  };

  const addProvider = async (body: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "追加に失敗しました";
      setProviders(data.providers.map((p: Provider) => normalizeProvider(p)));
      return null;
    } catch {
      return "追加に失敗しました";
    }
  };

  const saveSettings = async (updates: Partial<Settings>) => {
    const next = { ...settings, ...updates };
    await update("settings", "main", next);
    setSettings(next);
  };

  const writeCart = (next: CartLine[]) => {
    setCart(next);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch {
      // no-op
    }
  };
  const addToCart = (productId: string, qty = 1) => {
    const ex = cart.find((c) => c.productId === productId);
    writeCart(ex ? cart.map((c) => (c.productId === productId ? { ...c, qty: c.qty + qty } : c)) : [...cart, { productId, qty }]);
  };
  const setCartQty = (productId: string, qty: number) =>
    writeCart(qty <= 0 ? cart.filter((c) => c.productId !== productId) : cart.map((c) => (c.productId === productId ? { ...c, qty } : c)));
  const clearCart = () => writeCart([]);

  const toggleFavorite = async (providerId: string) => {
    if (!user) return;
    const favs = user.favorites ?? [];
    await saveUser({ favorites: favs.includes(providerId) ? favs.filter((f) => f !== providerId) : [...favs, providerId] });
  };

  return (
    <AppCtx.Provider
      value={{
        ready, session, user, providers, settings, cart,
        login, register, logout, refreshUser, saveUser, spend, gain,
        refreshProviders, saveProvider, addProvider, refreshSettings, saveSettings,
        addToCart, setCartQty, clearCart, toggleFavorite,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("AppProvider is missing");
  return ctx;
}

// ログイン状態に応じてリダイレクト
export function useGuard(role: "user" | "provider" | "admin") {
  const app = useApp();
  const router = useRouter();
  useEffect(() => {
    if (!app.ready) return;
    if (!app.session || app.session.role !== role) router.replace("/login");
  }, [app.ready, app.session, role, router]);
  return app.ready && app.session?.role === role;
}
