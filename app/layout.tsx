import type { Metadata } from "next";
import { News_Cycle, Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

const newsCycle = News_Cycle({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-news-cycle",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Washington Speedy Trial Calculator (CrR 3.3)",
  description: "CrR 3.3 trial deadline from date of commencement",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} ${newsCycle.variable}`}>
        {children}
      </body>
    </html>
  );
}
