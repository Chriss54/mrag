"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import UploadZone from "@/components/UploadZone";
import DocumentList from "@/components/DocumentList";
import QueryInterface from "@/components/QueryInterface";
import KnowledgeCardNotification from "@/components/KnowledgeCardNotification";
import { RagieDocument, KnowledgeCard } from "@/types";
import { useI18n } from "@/lib/i18n";

interface DocumentWithCard extends RagieDocument {
  knowledgeCardId: string | null;
}

export default function HomePage() {
  const { t } = useI18n();
  const [documents, setDocuments] = useState<DocumentWithCard[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [pendingCard, setPendingCard] = useState<KnowledgeCard | null>(null);

  const documentsRef = useRef(documents);
  documentsRef.current = documents;

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch {
      // Silent — UI shows empty state
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(() => {
      if (documentsRef.current.some((d) => d.status !== "ready" && d.status !== "failed")) {
        fetchDocuments();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  const handleUploadComplete = (document: RagieDocument, knowledgeCard: KnowledgeCard) => {
    setDocuments((prev) => {
      const withCard: DocumentWithCard = { ...document, knowledgeCardId: knowledgeCard.id };
      return [withCard, ...prev.filter((d) => d.id !== document.id)];
    });
    setPendingCard(knowledgeCard);
    // Re-fetch to sync status
    setTimeout(fetchDocuments, 2000);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId);

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="bg-bmw-blue rounded-xl p-6 text-white">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold tracking-tight">
            {t("hero.title")}
          </h2>
          <p className="text-blue-200 text-sm mt-1.5">
            {t("hero.subtitle")}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
              📄 {t("hero.pdf")}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
              🎥 {t("hero.mp4")}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
              🎵 {t("hero.mp3")}
            </span>
          </div>
        </div>
      </div>

      {/* Knowledge Card Notification (Growth Loop) */}
      {pendingCard && (
        <KnowledgeCardNotification
          card={pendingCard}
          onDismiss={() => setPendingCard(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Upload + Document List */}
        <div className="lg:col-span-1 space-y-4">
          <UploadZone onUploadComplete={handleUploadComplete} />
          {loadingDocs ? (
            <div className="card p-6 flex items-center justify-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-bmw-blue rounded-full animate-spin" />
              <span className="text-sm">{t("loading.documents")}</span>
            </div>
          ) : (
            <DocumentList
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelect={setSelectedDocumentId}
              onDelete={handleDelete}
              onRefresh={fetchDocuments}
            />
          )}
        </div>

        {/* Right Column: Query Interface */}
        <div className="lg:col-span-2">
          <QueryInterface
            selectedDocumentId={selectedDocumentId}
            selectedDocumentName={selectedDoc?.name}
          />
        </div>
      </div>
    </div>
  );
}
