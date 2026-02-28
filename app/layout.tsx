import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "./components/SidebarContext";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "فاتورة+ | لوحة البيانات",
  description: "لوحة بيانات فواتير حديثة بنمط مبسط.",
};

const themeScript = `
(() => {
  const storageKey = "ui-theme";
  const stored = localStorage.getItem(storageKey);
  const theme =
    stored === "light" || stored === "dark"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} ${geistMono.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SidebarProvider>{children}</SidebarProvider>
      </body>
    </html>
  );
}
