"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export type Locale = "de" | "en";

const translations = {
  // ─── Layout / Header / Footer ───
  "header.subtitle": { de: "Technisches Wissenssystem", en: "Technical Knowledge System" },
  "header.demoMode": { de: "Demo-Modus", en: "Demo Mode" },
  "footer.poweredBy": { de: "MaschineRAG — Powered by Ragie.ai + GPT-4o", en: "MaschineRAG — Powered by Ragie.ai + GPT-4o" },
  "footer.hackathon": { de: "Hackathon Demo 2026", en: "Hackathon Demo 2026" },

  // ─── Hero Banner ───
  "hero.title": { de: "Technisches Wissen sofort verfügbar", en: "Technical Knowledge Instantly Available" },
  "hero.subtitle": {
    de: "Lade Handbücher, Montagevideos und Audionotizen hoch — stelle Fragen in natürlicher Sprache, erhalte präzise Antworten mit Quellenangabe.",
    en: "Upload manuals, training videos and audio notes — ask questions in natural language, get precise answers with source references.",
  },
  "hero.pdf": { de: "PDF Handbücher", en: "PDF Manuals" },
  "hero.mp4": { de: "MP4 Schulungsvideos", en: "MP4 Training Videos" },
  "hero.mp3": { de: "MP3 Audionotizen", en: "MP3 Audio Notes" },
  "loading.documents": { de: "Dokumente werden geladen…", en: "Loading documents…" },

  // ─── Upload Zone ───
  "upload.title": { de: "Dokument hochladen", en: "Upload Document" },
  "upload.dropHint": { de: "Datei hierher ziehen oder klicken", en: "Drag file here or click" },
  "upload.ariaLabel": { de: "Datei hochladen — klicken oder ablegen", en: "Upload file — click or drop" },
  "upload.uploading": { de: "Wird hochgeladen…", en: "Uploading…" },
  "upload.processing": { de: "Ragie.ai indexiert & analysiert…", en: "Ragie.ai indexing & analyzing…" },
  "upload.success": { de: "Erfolgreich hochgeladen", en: "Successfully uploaded" },
  "upload.failed": { de: "Upload fehlgeschlagen", en: "Upload failed" },
  "upload.retry": { de: "Klicken zum erneuten Versuch", en: "Click to retry" },
  "upload.tooLargePdf": { de: "Datei zu groß (max. {max} MB für PDF)", en: "File too large (max {max} MB for PDF)" },
  "upload.tooLargeMedia": { de: "Datei zu groß (max. {max} MB für Medien)", en: "File too large (max {max} MB for media)" },
  "upload.hint": {
    de: "Nach dem Upload wird automatisch eine Wissensskarte erstellt und ein öffentlicher Link generiert.",
    en: "After upload, a knowledge card is automatically created and a public link is generated.",
  },

  // ─── Document List ───
  "docs.title": { de: "Wissensbasis", en: "Knowledge Base" },
  "docs.refresh": { de: "Aktualisieren", en: "Refresh" },
  "docs.empty": { de: "Noch keine Dokumente hochgeladen", en: "No documents uploaded yet" },
  "docs.emptyHint": { de: "Lade PDFs, Videos oder Audionotizen hoch", en: "Upload PDFs, videos or audio notes" },
  "docs.queryAll": { de: "Alle Dokumente befragen", en: "Query all documents" },
  "docs.knowledgeCard": { de: "Wissensskarte", en: "Knowledge Card" },
  "docs.delete": { de: "Löschen", en: "Delete" },
  "docs.deleteTitle": { de: "Dokument löschen", en: "Delete document" },
  "docs.deleteError": { de: "Löschen fehlgeschlagen", en: "Delete failed" },
  "docs.deleteFetchError": { de: "Fehler beim Löschen", en: "Error deleting" },

  // ─── Document Status ───
  "status.pending": { de: "Ausstehend", en: "Pending" },
  "status.partitioned": { de: "Wird verarbeitet", en: "Processing" },
  "status.refined": { de: "Wird verfeinert", en: "Refining" },
  "status.chunked": { de: "Wird indexiert", en: "Indexing" },
  "status.indexed": { de: "Wird indexiert", en: "Indexing" },
  "status.ready": { de: "Bereit", en: "Ready" },
  "status.failed": { de: "Fehler", en: "Error" },

  // ─── Query Interface ───
  "query.title": { de: "Wissensbasis befragen", en: "Query Knowledge Base" },
  "query.scopeAll": { de: "Gesamte Wissensbasis", en: "Entire Knowledge Base" },
  "query.scopeDoc": { de: "Dokument", en: "Document" },
  "query.placeholder": {
    de: 'z.B. "Warum überhitzt die Pumpe bei Schritt 3?" — Enter zum Senden, Shift+Enter für Zeilenumbruch',
    en: 'e.g. "Why does the pump overheat at step 3?" — Enter to send, Shift+Enter for line break',
  },
  "query.submit": { de: "Frage stellen", en: "Ask Question" },
  "query.generating": { de: "Antwort wird generiert…", en: "Generating answer…" },
  "query.error": { de: "Abfrage fehlgeschlagen", en: "Query failed" },
  "query.answers": { de: "Antworten", en: "Answers" },
  "query.source": { de: "Quelle", en: "Source" },
  "query.sources": { de: "Quellen", en: "Sources" },

  // ─── Knowledge Card Notification ───
  "card.created": { de: "Wissensskarte erstellt", en: "Knowledge Card Created" },
  "card.view": { de: "Ansehen", en: "View" },
  "card.copyLink": { de: "Link kopieren", en: "Copy Link" },
  "card.copied": { de: "✓ Kopiert!", en: "✓ Copied!" },
  "card.dismissLabel": { de: "Benachrichtigung schließen", en: "Dismiss notification" },

  // ─── Knowledge Card Page ───
  "cardPage.notFound": { de: "Wissensskarte nicht gefunden", en: "Knowledge Card Not Found" },
  "cardPage.notFoundDesc": {
    de: "Diese Wissensskarte existiert nicht oder wurde gelöscht.",
    en: "This knowledge card does not exist or has been deleted.",
  },
  "cardPage.goToApp": { de: "Zur App", en: "Go to App" },
  "cardPage.badge": { de: "Wissensskarte", en: "Knowledge Card" },
  "cardPage.mainTopics": { de: "Hauptthemen", en: "Main Topics" },
  "cardPage.problems": { de: "Typische Probleme", en: "Typical Problems" },
  "cardPage.safety": { de: "Sicherheitshinweise", en: "Safety Notes" },
  "cardPage.ctaTitle": { de: "Weitere Fragen zu diesem Dokument?", en: "More questions about this document?" },
  "cardPage.ctaDesc": {
    de: "Mit MaschineRAG kannst du das vollständige Dokument in natürlicher Sprache befragen — inkl. Zeitstempel für Videos.",
    en: "With MaschineRAG you can query the full document in natural language — including timestamps for videos.",
  },
  "cardPage.ctaButton": { de: "Jetzt kostenlos ausprobieren →", en: "Try it free now →" },
  "cardPage.footer": { de: "Erstellt mit MaschineRAG — Powered by Ragie.ai + GPT-4o", en: "Created with MaschineRAG — Powered by Ragie.ai + GPT-4o" },
} as const;

export type TranslationKey = keyof typeof translations;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");

  useEffect(() => {
    const saved = localStorage.getItem("mr-locale") as Locale | null;
    if (saved === "de" || saved === "en") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("mr-locale", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const entry = translations[key];
      if (!entry) return key;
      let text = entry[locale] ?? entry.de;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "de" ? "en" : "de")}
      className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
      aria-label={locale === "de" ? "Switch to English" : "Zu Deutsch wechseln"}
      title={locale === "de" ? "Switch to English" : "Zu Deutsch wechseln"}
    >
      <span className="text-base leading-none">{locale === "de" ? "🇩🇪" : "🇬🇧"}</span>
      <span className="font-medium">{locale === "de" ? "DE" : "EN"}</span>
    </button>
  );
}
