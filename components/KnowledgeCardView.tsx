"use client";

import Link from "next/link";
import { KnowledgeCard } from "@/types";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n";

interface KnowledgeCardViewProps {
  card: KnowledgeCard | null;
}

function KnowledgeCardContent({ card }: { card: KnowledgeCard }) {
  const { t, locale } = useI18n();

  const createdDate = new Date(card.createdAt).toLocaleDateString(
    locale === "de" ? "de-DE" : "en-US",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  return (
    <div className="min-h-screen bg-bmw-gray">
      {/* Header */}
      <header className="bg-bmw-blue text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
              <span className="text-bmw-blue font-bold text-xs">MR</span>
            </div>
            <span className="font-semibold text-sm">MaschineRAG</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/"
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
            >
              {t("cardPage.goToApp")} →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Title Card */}
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-bmw-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl">🗺️</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge bg-bmw-blue text-white text-xs">{t("cardPage.badge")}</span>
                <span className="text-xs text-gray-400">{createdDate}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mt-1 break-words">
                {card.documentName}
              </h1>
            </div>
          </div>
          <p className="mt-4 text-gray-600 text-sm leading-relaxed">{card.summary}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Main Topics */}
          {card.mainTopics.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-xl">📋</span>
                {t("cardPage.mainTopics")}
              </h2>
              <ul className="space-y-2">
                {card.mainTopics.map((topic, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-bmw-blue font-bold flex-shrink-0 mt-0.5">→</span>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Typical Problems */}
          {card.typicalProblems.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                {t("cardPage.problems")}
              </h2>
              <ul className="space-y-2">
                {card.typicalProblems.map((problem, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 font-bold flex-shrink-0 mt-0.5">!</span>
                    {problem}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Safety Notes */}
        {card.safetyNotes.length > 0 && (
          <div className="card p-5 border-l-4 border-l-red-400">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              {t("cardPage.safety")}
            </h2>
            <ul className="space-y-2">
              {card.safetyNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-500 font-bold flex-shrink-0 mt-0.5">⚡</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA — Growth Loop Conversion */}
        <div className="bg-bmw-blue rounded-xl p-6 text-white text-center">
          <h3 className="font-bold text-lg mb-2">
            {t("cardPage.ctaTitle")}
          </h3>
          <p className="text-blue-200 text-sm mb-4">
            {t("cardPage.ctaDesc")}
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-bmw-blue font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm"
          >
            {t("cardPage.ctaButton")}
          </Link>
        </div>
      </main>

      <footer className="mt-8 border-t border-bmw-gray-dark bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-gray-400">
          <span>{t("cardPage.footer")}</span>
          <Link href="/" className="hover:text-bmw-blue">{t("cardPage.goToApp")}</Link>
        </div>
      </footer>
    </div>
  );
}

function NotFoundContent() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-bmw-gray flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">{t("cardPage.notFound")}</h1>
        <p className="text-gray-500 text-sm mb-6">
          {t("cardPage.notFoundDesc")}
        </p>
        <Link href="/" className="btn-primary inline-block">
          {t("cardPage.goToApp")}
        </Link>
      </div>
    </div>
  );
}

export default function KnowledgeCardView({ card }: KnowledgeCardViewProps) {
  return (
    <I18nProvider>
      {card ? <KnowledgeCardContent card={card} /> : <NotFoundContent />}
    </I18nProvider>
  );
}
