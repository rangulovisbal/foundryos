import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "@/app/globals.css";
import { getHtmlLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: `${siteConfig.name} | AI-first operating system for small teams`,
  description: siteConfig.description,
  icons: {
    icon: "/icon"
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getCookieLanguage();

  return (
    <html lang={getHtmlLanguage(language)}>
      <body>
        <div className="site-chrome">
          <SiteHeader language={language} />
        </div>
        <main>{children}</main>
        <div className="site-chrome">
          <SiteFooter language={language} />
        </div>
      </body>
    </html>
  );
}
