export type Provider = {
  id: string;
  name: string;
  tag: string;
  rating: number;
  status: "available" | "busy" | "off";
  chatRate: number; // 1文字あたりのポイント
  callRate: number; // 1分あたりのポイント
  mailRate: number; // 1回あたりのポイント
  reviewCount: number;
  styleTags: string[];
  bio: string;
  photo: string;
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
    mailRate: 3000,
    reviewCount: 8420,
    styleTags: ["ゆったり", "初心者歓迎", "寄り添い"],
    bio: "タロット鑑定歴8年。恋愛・復縁・片想いを中心に、あなたの気持ちに寄り添いながら丁寧にお伝えします。焦らずゆっくりお話ししましょう。",
    photo: "/provider1.jpg",
  },
  {
    id: "p2",
    name: "蓮先生(デモ)",
    tag: "四柱推命",
    rating: 4.8,
    status: "busy",
    chatRate: 60,
    callRate: 150,
    mailRate: 4000,
    reviewCount: 5310,
    styleTags: ["具体的", "テンポが良い", "的確"],
    bio: "四柱推命歴12年。仕事運・金運の的中率に定評あり。結論から端的にお伝えするスタイルです。",
    photo: "/provider2.jpg",
  },
  {
    id: "p3",
    name: "美月先生(デモ)",
    tag: "霊感・霊視",
    rating: 4.7,
    status: "off",
    chatRate: 80,
    callRate: 200,
    mailRate: 5000,
    reviewCount: 2190,
    styleTags: ["スピリチュアル", "本格派", "リピーター多数"],
    bio: "霊視歴15年。目に見えないご縁や因縁、相手の本音を視ていきます。深い悩みほどお力になれます。",
    photo: "/provider3.jpg",
  },
  {
    id: "p4",
    name: "アイ先生(AI・デモ)",
    tag: "AIタロット占星術",
    rating: 4.6,
    status: "available",
    chatRate: 30,
    callRate: 80,
    mailRate: 2000,
    reviewCount: 640,
    styleTags: ["24時間対応", "即レス", "低価格"],
    bio: "AIによるタロット・西洋占星術鑑定。膨大なデータから統計的傾向を踏まえて、いつでもすぐにお答えします。まずは気軽に試したい方に。",
    photo: "/provider-ai1.jpg",
  },
  {
    id: "p5",
    name: "レイ先生(AI・デモ)",
    tag: "AI四柱推命・数秘術",
    rating: 4.5,
    status: "available",
    chatRate: 30,
    callRate: 80,
    mailRate: 2000,
    reviewCount: 410,
    styleTags: ["24時間対応", "即レス", "低価格"],
    bio: "AIによる四柱推命・数秘術鑑定。生年月日から導かれる運勢を、いつでもすぐに診断します。じっくり考える前にまず聞いてみたい方に。",
    photo: "/provider-ai2.jpg",
  },
];
