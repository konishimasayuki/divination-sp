export type Product = {
  id: string;
  name: string;
  category: string;
  points: number;
  desc: string;
  image: string;
  supervisor?: string; // 監修の先生ID
};

export const PRODUCT_CATEGORIES = ["すべて", "水晶", "お守り", "開運グッズ", "数珠", "色紙", "タロット"];

export const products: Product[] = [
  { id: "pr1", name: "アメジスト浄化ブレスレット(デモ)", category: "水晶", points: 3200, desc: "浄化・魔除けの意味を持つ紫水晶のブレスレット。気持ちを落ち着けたい夜や、大切な決断の前に。", image: "/product-amethyst.jpg", supervisor: "p1" },
  { id: "pr2", name: "ローズクォーツブレスレット(デモ)", category: "水晶", points: 2800, desc: "恋愛運アップの定番、淡いピンクの天然石。", image: "/product-rosequartz.jpg", supervisor: "p1" },
  { id: "pr3", name: "水晶さざれ石(デモ)", category: "水晶", points: 1500, desc: "浄化用のさざれ石。ほかの石の浄化にも使えます。", image: "/product-rosequartz.jpg" },
  { id: "pr8", name: "サンストーンブレスレット(デモ)", category: "水晶", points: 3400, desc: "太陽の石と呼ばれる、活力・仕事運アップのお守り石。", image: "/product-amethyst.jpg", supervisor: "p2" },
  { id: "pr9", name: "タイガーアイブレスレット(デモ)", category: "水晶", points: 2600, desc: "金運・仕事運に効果があるとされる縞模様の天然石。", image: "/product-rosequartz.jpg", supervisor: "p2" },
  { id: "pr12", name: "縁結びお守り(デモ)", category: "お守り", points: 1200, desc: "良縁・恋愛成就を願う、紗希先生監修の特製お守り。", image: "/product-omamori.jpg", supervisor: "p1" },
  { id: "pr13", name: "金運上昇お守り(デモ)", category: "お守り", points: 1200, desc: "金運・仕事運アップを願う、蓮先生監修の特製お守り。", image: "/product-omamori.jpg", supervisor: "p2" },
  { id: "pr14", name: "開運だるま(小)(デモ)", category: "開運グッズ", points: 2500, desc: "願掛け・目標達成のお守りとして人気の縁起物。", image: "/product-daruma.jpg" },
  { id: "pr15", name: "招福開運セット(デモ)", category: "開運グッズ", points: 3000, desc: "だるま・お守り・浄化アイテムをまとめた開運セット。", image: "/product-daruma.jpg" },
  { id: "pr4", name: "本連数珠(女性用)(デモ)", category: "数珠", points: 4500, desc: "法事・お参り用の正式な本連数珠。", image: "/product-juzu.jpg" },
  { id: "pr10", name: "本連数珠(男性用)(デモ)", category: "数珠", points: 4800, desc: "男性向けの落ち着いたデザインの本連数珠。", image: "/product-juzu.jpg" },
  { id: "pr5", name: "略式数珠(男女兼用)(デモ)", category: "数珠", points: 2200, desc: "普段使いしやすいシンプルな略式数珠。", image: "/product-juzu.jpg" },
  { id: "pr11", name: "略式数珠(お子様用)(デモ)", category: "数珠", points: 1800, desc: "お子様の手にも合わせやすい、小ぶりな略式数珠。", image: "/product-juzu.jpg" },
  { id: "pr16", name: "先生直筆 色紙(デモ)", category: "色紙", points: 8000, desc: "紗希先生が直接メッセージを書き入れる、世界に一つの色紙。", image: "/product-shikishi.jpg", supervisor: "p1" },
  { id: "pr6", name: "先生監修タロットカード(デモ)", category: "タロット", points: 3800, desc: "紗希先生が実際に使用している78枚デッキと同モデル。", image: "/product-tarot.jpg", supervisor: "p1" },
  { id: "pr7", name: "オラクルカード(デモ)", category: "タロット", points: 3500, desc: "直感を高めるメッセージ性の強いオラクルカードデッキ。", image: "/product-tarot.jpg" },
];

export const productMap: Record<string, Product> = Object.fromEntries(products.map((p) => [p.id, p]));
