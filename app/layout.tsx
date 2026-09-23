import type { Metadata } from "next";
import "@fontsource/assistant/400.css";
import "@fontsource/assistant/600.css";
import "@fontsource/assistant/700.css";
import "@fontsource/assistant/800.css";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kiri Math",
    template: "%s · Kiri Math",
  },
  description: "Interactive mathematics courses: lecture notes, explorations and practice.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}
