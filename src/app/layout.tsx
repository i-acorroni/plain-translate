import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plain Language Translator",
  description: "Turn complex writing into plain language.",
};

const themeBootScript = `
  (() => {
    try {
      const storageKey = "plain-language-translator:theme";
      const stored = window.localStorage.getItem(storageKey);
      const theme =
        stored === "dark" || stored === "light"
          ? stored
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      document.documentElement.dataset.theme = theme;
    } catch {
      document.documentElement.dataset.theme = "light";
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
