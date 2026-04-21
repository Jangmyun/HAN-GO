import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HAN:GO — 한동대 주문·결제·예매",
  description: "한동대학교 동아리·부스 주문 및 공연 예매 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
