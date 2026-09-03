import "./globals.css";

import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "EasyFlow",
  description: "Workflow-centric supply chain SaaS",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
