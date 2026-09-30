import type { Metadata } from "next";
import { CourseEntry } from "./_site/CourseEntry";
import { TextSizeControl } from "./_site/TextSizeControl";
import { textSizeBootScript } from "./_site/textSize";
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
    // The boot script may set the root font size before hydration, hence suppressHydrationWarning.
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: textSizeBootScript }} />
      </head>
      <body>
        <CourseEntry>{children}</CourseEntry>
        <TextSizeControl />
      </body>
    </html>
  );
}
