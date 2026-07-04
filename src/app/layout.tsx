import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createClient } from "@supabase/supabase-js";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "JobPortal | Find Your Dream Career in Tech",
  description: "Modern, scalable job portal for high-growth tech opportunities.",
};

async function getAdsensePublisherId(): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "adsense_publisher_id")
      .single();
    return data?.value || "";
  } catch {
    return "";
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publisherId = await getAdsensePublisherId();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full font-sans antialiased text-gray-900 bg-background-gray">
        {children}
        {publisherId ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
