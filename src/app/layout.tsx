import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { GlobalNavbar } from "@/components/layout/global-navbar";
import { RoutePrefetch } from "@/components/layout/route-prefetch";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Nam Tước",
  description: "Bảng điều khiển cá nhân lấy cảm hứng từ iCloud Web",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/finance.png",
    apple: "/images/finance.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nam Tước"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0f"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className={`${sora.variable} ${manrope.variable} bg-background text-text`}>
        <Providers>
          <RoutePrefetch />
          <GlobalNavbar />
          <div className="pt-[44px]">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
