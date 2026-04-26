import type { Metadata } from "next";
import { JetBrains_Mono,Space_Grotesk } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "TaktScore",
  description: "耳コピしたドラムパターンを入力・保存・再生",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
