import type { Metadata, Viewport } from "next";
import { Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";

const mincho = Shippori_Mincho_B1({
  variable: "--font-shippori",
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const gothic = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "杉の泉 オンライン占いサービス",
  description: "杉の泉 オンライン占いサービス",
  appleWebApp: {
    title: "杉の泉",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#14102A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${mincho.variable} ${gothic.variable} h-full antialiased`}>
      <body className="min-h-full bg-night text-text">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
