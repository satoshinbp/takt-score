import { Geist_Mono, Noto_Sans, Roboto } from "next/font/google";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

import "./globals.css";

const notoSansHeading = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        roboto.variable,
        notoSansHeading.variable,
      )}
    >
      <body>
        <ThemeProvider>
          <div className="h-screen overflow-hidden flex flex-col bg-muted dark:bg-background text-foreground">
            <Header />
            <div className="flex-1 overflow-hidden">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
};
export default RootLayout;
