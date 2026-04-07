import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plain Language Translator",
  description: "Turn complex writing into plain language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
