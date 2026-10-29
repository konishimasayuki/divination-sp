import type { MetadataRoute } from "next";

// ホーム画面に追加したときの設定(iPhoneでプッシュ通知を受け取るのに必要)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "杉の泉 オンライン占い",
    short_name: "杉の泉",
    description: "杉の泉 オンライン占いサービス",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#14102A",
    theme_color: "#14102A",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
