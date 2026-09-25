export type Provider = {
  id: string;
  name: string;
  tag: string;
  rating: number;
  status: "available" | "busy" | "off";
  chatRate: number; // メッセージ 1文字あたりのポイント
  callRate: number; // ビデオ通話 1分あたりのポイント
  voiceRate: number; // 音声通話 1分あたりのポイント
  mailRate: number; // 旧仕様(未使用)
  reviewCount: number;
  styleTags: string[];
  bio: string;
  photo: string;
  loginId: string;
  loginPassword: string;
  isAI?: boolean;
  visible?: boolean;
  careerYears?: number;
  acceptNow?: boolean;
  bankInfo?: string;
  // 曜日(0=日〜6=土) → 受付枠インデックス(0=18:00 〜 15=25:30)
  schedule?: Record<string, number[]>;
};

const defaultSchedule: Record<string, number[]> = {
  "0": [],
  "1": [4, 5, 6, 7, 8, 9, 10],
  "2": [4, 5, 6, 7, 8, 9, 10],
  "3": [4, 5, 6, 7, 8, 9, 10],
  "4": [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  "5": [0, 1, 2, 3, 4, 5, 6, 7],
  "6": [],
};
const allSlots = Array.from({ length: 16 }, (_, i) => i);
const fullSchedule: Record<string, number[]> = {
  "0": allSlots, "1": allSlots, "2": allSlots, "3": allSlots, "4": allSlots, "5": allSlots, "6": allSlots,
};

export const initialProviders: Provider[] = [
  {
    id: "p1",
    name: "紗希先生(デモ)",
    tag: "タロット・恋愛",
    rating: 4.9,
    status: "available",
    chatRate: 50,
    callRate: 120,
    voiceRate: 90,
    mailRate: 3000,
    reviewCount: 8420,
    styleTags: ["ゆったり", "寄り添い", "初心者歓迎"],
    bio: "タロット鑑定歴8年。恋愛・復縁・片想いを中心に、あなたの気持ちに寄り添いながら丁寧にお伝えします。焦らずゆっくりお話ししましょう。",
    photo: "/provider1.jpg",
    loginId: "sasaki",
    loginPassword: "sasaki123",
    visible: true,
    careerYears: 8,
    acceptNow: true,
    schedule: defaultSchedule,
  },
  {
    id: "p2",
    name: "蓮先生(デモ)",
    tag: "四柱推命",
    rating: 4.8,
    status: "busy",
    chatRate: 60,
    callRate: 150,
    voiceRate: 110,
    mailRate: 4000,
    reviewCount: 5310,
    styleTags: ["具体的", "テンポが良い"],
    bio: "四柱推命歴12年。仕事運・金運の的中率に定評あり。結論から端的にお伝えするスタイルです。",
    photo: "/provider2.jpg",
    loginId: "ren",
    loginPassword: "ren123",
    visible: true,
    careerYears: 12,
    acceptNow: true,
    schedule: defaultSchedule,
  },
  {
    id: "p3",
    name: "美月先生(デモ)",
    tag: "霊感・霊視",
    rating: 4.7,
    status: "off",
    chatRate: 80,
    callRate: 200,
    voiceRate: 150,
    mailRate: 5000,
    reviewCount: 2190,
    styleTags: ["本格派", "リピーター多数"],
    bio: "霊視歴15年。目に見えないご縁や因縁、相手の本音を視ていきます。深い悩みほどお力になれます。",
    photo: "/provider3.jpg",
    loginId: "mizuki",
    loginPassword: "mizuki123",
    visible: true,
    careerYears: 15,
    acceptNow: false,
    schedule: defaultSchedule,
  },
  {
    id: "p4",
    name: "アイ先生(AI・デモ)",
    tag: "AIタロット・占星術",
    rating: 4.6,
    status: "available",
    chatRate: 30,
    callRate: 80,
    voiceRate: 60,
    mailRate: 2000,
    reviewCount: 640,
    styleTags: ["24時間対応", "即レス", "低価格"],
    bio: "AIによるタロット・西洋占星術鑑定。膨大なデータから統計的傾向を踏まえて、いつでもすぐにお答えします。まずは気軽に試したい方に。",
    photo: "/provider-ai1.jpg",
    loginId: "ai1",
    loginPassword: "ai1123",
    isAI: true,
    visible: true,
    careerYears: 0,
    acceptNow: true,
    schedule: fullSchedule,
  },
  {
    id: "p5",
    name: "レイ先生(AI・デモ)",
    tag: "AI四柱推命・数秘術",
    rating: 4.5,
    status: "available",
    chatRate: 30,
    callRate: 80,
    voiceRate: 60,
    mailRate: 2000,
    reviewCount: 410,
    styleTags: ["24時間対応", "即レス", "低価格"],
    bio: "AIによる四柱推命・数秘術鑑定。生年月日から導かれる運勢を、いつでもすぐに診断します。じっくり考える前にまず聞いてみたい方に。",
    photo: "/provider-ai2.jpg",
    loginId: "ai2",
    loginPassword: "ai2123",
    isAI: true,
    visible: true,
    careerYears: 0,
    acceptNow: true,
    schedule: fullSchedule,
  },
];

// 受付枠インデックス → 表示用時刻
export const SLOT_TIMES = Array.from({ length: 16 }, (_, i) => {
  const h = 18 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h % 24).padStart(2, "0")}:${m}`;
});

// 古いデータ(voiceRateなし等)を補完
export function normalizeProvider(p: Partial<Provider> & { id: string }): Provider {
  const base = initialProviders.find((x) => x.id === p.id);
  return {
    name: "",
    tag: "",
    rating: 4.5,
    status: "off",
    chatRate: 50,
    callRate: 120,
    voiceRate: Math.round((p.callRate ?? 120) * 0.75),
    mailRate: 3000,
    reviewCount: 0,
    styleTags: [],
    bio: "",
    photo: "/provider1.jpg",
    loginId: "",
    loginPassword: "",
    visible: true,
    careerYears: 0,
    acceptNow: true,
    schedule: defaultSchedule,
    ...(base ?? {}),
    ...p,
  } as Provider;
}
