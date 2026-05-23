"use client";

import "./globals.css";
import { I18nProvider, LanguageSwitcher, useI18n } from "@/lib/i18n";

function Header() {
  const { t } = useI18n();
  return (
    <header className="bg-bmw-blue text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-bmw-blue font-bold text-xs">MR</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">MaschineRAG</h1>
            <p className="text-xs text-blue-200 leading-none mt-0.5">{t("header.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-blue-200">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
            {t("header.demoMode")}
          </span>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-12 border-t border-bmw-gray-dark bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between text-xs text-gray-400">
        <span>{t("footer.poweredBy")}</span>
        <span>{t("footer.hackathon")}</span>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <title>MaschineRAG — Technisches Wissenssystem</title>
        <meta name="description" content="Multimodales RAG-System für Maschinenbauer — PDFs, Videos und Audionotizen sofort durchsuchbar" />
      </head>
      <body className="min-h-screen bg-bmw-gray">
        <I18nProvider>
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
