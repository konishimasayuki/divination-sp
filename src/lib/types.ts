export type User = {
  id: string;
  email: string;
  password: string;
  name: string;
  birthday: string; // YYYY-MM-DD
  birthTime?: string;
  gender: string;
  bloodType: string;
  points: number;
  favorites: string[];
  address?: string;
  status: "active" | "stop";
  createdAt: number;
};

export type Booking = {
  id: string;
  userId: string;
  userName: string;
  providerId: string;
  providerName: string;
  method: "video" | "voice";
  minutes: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  points: number;
  channel: string;
  status: "reserved" | "done" | "canceled";
  note?: string;
  memo?: string;
  createdAt: number;
};

export type Message = {
  id: string;
  threadId: string; // `${userId}__${providerId}`
  userId: string;
  providerId: string;
  from: "user" | "provider" | "system";
  text: string;
  bookingId?: string;
  cost?: number;
  createdAt: number;
};

export type HistoryItem = {
  id: string;
  userId: string;
  providerId?: string;
  kind: "talk" | "msg" | "palm" | "goods" | "buy" | "gift" | "bonus";
  label: string;
  detail: string;
  points: number; // +購入 / -消費
  createdAt: number;
};

export type Review = {
  id: string;
  providerId: string;
  userId: string;
  userName: string;
  rating: number;
  tags: string[];
  text: string;
  createdAt: number;
};

export type Payout = {
  id: string;
  providerId: string;
  providerName: string;
  amount: number;
  status: "pending" | "approved";
  createdAt: number;
};

export type PalmReading = {
  id: string;
  userId: string;
  result: string;
  createdAt: number;
};

export type Order = {
  id: string;
  userId: string;
  items: { productId: string; qty: number }[];
  total: number;
  createdAt: number;
};

export type Settings = {
  id: string;
  palmCost: number;
  signupBonus: number;
  prepMinutes: number;
  shareRate: number; // 占い師への分配率(%)
  packs: { points: number; price: number }[];
};

export const defaultSettings: Settings = {
  id: "main",
  palmCost: 200,
  signupBonus: 800,
  prepMinutes: 2,
  shareRate: 50,
  packs: [
    { points: 1000, price: 1000 },
    { points: 3000, price: 2800 },
    { points: 5000, price: 4500 },
  ],
};
