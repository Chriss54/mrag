"use client";

import { useState } from "react";
import { RagieDocument } from "@/types";
import { useI18n } from "@/lib/i18n";

interface DocumentWithCard extends RagieDocument {
  knowledgeCardId: string | null;
}

interface DocumentListProps {
  documents: DocumentWithCard[];
  selectedDocumentId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

function fileIcon(name: string) {
  if (name.endsWith(".pdf")) return "📄";
  if (name.endsWith(".mp4")) return "🎥";
  if (name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".m4a")) return "🎵";
  return "📁";
}

export default function DocumentList({
  documents,
  selectedDocumentId,
  onSelect,
  onDelete,
  onRefresh,
}: DocumentListProps) {
  const { t } = useI18n();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    pending: { label: t("status.pending"), color: "text-yellow-600 bg-yellow-50 border-yellow-200", dot: "bg-yellow-400 animate-pulse" },
    partitioned: { label: t("status.partitioned"), color: "text-blue-600 bg-blue-50 border-blue-200", dot: "bg-blue-400 animate-pulse" },
    refined: { label: t("status.refined"), color: "text-blue-600 bg-blue-50 border-blue-200", dot: "bg-blue-400 animate-pulse" },
    chunked: { label: t("status.chunked"), color: "text-blue-600 bg-blue-50 border-blue-200", dot: "bg-blue-400 animate-pulse" },
    indexed: { label: t("status.indexed"), color: "text-blue-600 bg-blue-50 border-blue-200", dot: "bg-blue-400 animate-pulse" },
    ready: { label: t("status.ready"), color: "text-green-700 bg-green-50 border-green-200", dot: "bg-green-500" },
    failed: { label: t("status.failed"), color: "text-red-600 bg-red-50 border-red-200", dot: "bg-red-500" },
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("docs.deleteFetchError"));
      }
      onDelete(id);
      if (selectedDocumentId === id) onSelect(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : t("docs.deleteError"));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <FolderIcon />
            {t("docs.title")}
          </h2>
          <button onClick={onRefresh} className="btn-secondary text-xs px-2 py-1">
            {t("docs.refresh")}
          </button>
        </div>
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-sm">{t("docs.empty")}</p>
          <p className="text-xs mt-1">{t("docs.emptyHint")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <FolderIcon />
          {t("docs.title")}
          <span className="badge bg-bmw-blue text-white">{documents.length}</span>
        </h2>
        <button onClick={onRefresh} className="btn-secondary text-xs px-2 py-1">
          {t("docs.refresh")}
        </button>
      </div>

      <div className="mb-3">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
            selectedDocumentId === null
              ? "bg-bmw-blue text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span>🔍</span>
          <span className="font-medium">{t("docs.queryAll")}</span>
        </button>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => {
          const statusCfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending;
          const isSelected = selectedDocumentId === doc.id;
          const isDeleting = deletingId === doc.id;
          const isConfirming = confirmDeleteId === doc.id;

          return (
            <div
              key={doc.id}
              className={`border rounded-lg transition-all ${
                isSelected
                  ? "border-bmw-blue bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => onSelect(isSelected ? null : doc.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg flex-shrink-0">{fileIcon(doc.name)}</span>
                      <span
                        className={`text-sm font-medium truncate ${isSelected ? "text-bmw-blue" : "text-gray-800"}`}
                        title={doc.name}
                      >
                        {doc.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 ml-7">
                      <span className={`badge border text-xs ${statusCfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 inline-block ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                      {doc.knowledgeCardId && (
                        <a
                          href={`/knowledge/${doc.knowledgeCardId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="badge border border-blue-200 text-blue-600 bg-blue-50 text-xs hover:bg-blue-100"
                        >
                          {t("docs.knowledgeCard")}
                        </a>
                      )}
                    </div>
                  </button>

                  <div className="flex-shrink-0 ml-1">
                    {isConfirming ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={isDeleting}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeleting ? "…" : t("docs.delete")}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-gray-500 hover:text-gray-700 px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(doc.id)}
                        className="btn-danger text-xs p-1.5"
                        title={t("docs.deleteTitle")}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FolderIcon() {
  return (
    <svg className="w-5 h-5 text-bmw-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
