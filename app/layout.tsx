import type { Metadata } from "next";
import { News_Cycle, Open_Sans } from "next/font/google";
import Script from "next/script";
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
  title: "Washington Speedy Trial Calculator | CrR 3.3 & CrRLJ 3.3",
  description:
    "Free Washington speedy trial calculator for CrR 3.3 and CrRLJ 3.3. Calculate trial deadlines instantly, including excluded periods.",
  keywords: [
    "Washington speedy trial",
    "CrR 3.3 calculator",
    "CrRLJ 3.3",
    "trial deadline calculator",
    "Washington criminal defense",
  ],
  metadataBase: new URL("https://www.trialdeadline.com"),
  openGraph: {
    title: "Washington Speedy Trial Calculator",
    description:
      "Calculate CrR 3.3 and CrRLJ 3.3 deadlines instantly.",
    url: "https://www.trialdeadline.com",
    siteName: "Trial Deadline",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Washington Speedy Trial Calculator",
    description:
      "Calculate Washington speedy trial deadlines instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} ${newsCycle.variable}`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-K240QXDVK8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-K240QXDVK8');
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}