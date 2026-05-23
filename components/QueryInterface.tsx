"use client";

import { useState, useRef, useEffect } from "react";
import { QueryResult } from "@/types";
import { useI18n } from "@/lib/i18n";

interface QueryInterfaceProps {
  selectedDocumentId: string | null;
  selectedDocumentName?: string;
}

interface HistoryEntry {
  question: string;
  result: QueryResult;
  documentId: string | null;
  timestamp: Date;
}

export default function QueryInterface({
  selectedDocumentId,
  selectedDocumentName,
}: QueryInterfaceProps) {
  const { t } = useI18n();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history.length > 0 && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [history]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          documentId: selectedDocumentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      setHistory((prev) => [
        {
          question: trimmed,
          result: data,
          documentId: selectedDocumentId,
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("query.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const scope = selectedDocumentId
    ? `${t("query.scopeDoc")}: ${selectedDocumentName ?? selectedDocumentId}`
    : t("query.scopeAll");

  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <SearchIcon />
        {t("query.title")}
      </h2>

      <div className="mb-4 flex items-center gap-2 p-2.5 bg-bmw-blue/5 border border-bmw-blue/20 rounded-lg">
        <span className="text-bmw-blue">
          {selectedDocumentId ? "📄" : "🔍"}
        </span>
        <span className="text-xs text-bmw-blue font-medium">Scope: {scope}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("query.placeholder")}
            rows={3}
            maxLength={1000}
            disabled={loading}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-bmw-blue focus:border-bmw-blue
                       disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
          />
          <span className="absolute bottom-2 right-2 text-xs text-gray-300">
            {question.length}/1000
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t("query.generating")}
            </>
          ) : (
            <>
              <SearchIcon size="sm" />
              {t("query.submit")}
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {history.length > 0 && (
        <div ref={answerRef} className="mt-6 space-y-6">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{t("query.answers")}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          {history.map((entry, i) => (
            <AnswerCard key={i} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerCard({ entry }: { entry: HistoryEntry }) {
  const { t } = useI18n();
  const [showSources, setShowSources] = useState(false);
  const timeStr = entry.result.durationMs > 0
    ? `${(entry.result.durationMs / 1000).toFixed(1)}s`
    : null;

  const sourceCount = entry.result.sources.length;
  const sourceLabel = sourceCount === 1 ? t("query.source") : t("query.sources");

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-800 flex items-start gap-2">
          <span className="text-bmw-blue mt-0.5 flex-shrink-0">Q</span>
          {entry.question}
        </p>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-2 mb-3">
          <span className="text-bmw-blue font-bold text-sm flex-shrink-0 mt-0.5">A</span>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {entry.result.answer}
          </p>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setShowSources(!showSources)}
            className="text-xs text-bmw-blue-light hover:text-bmw-blue flex items-center gap-1 transition-colors"
          >
            <span>{sourceCount} {sourceLabel}</span>
            <span>{showSources ? "▲" : "▼"}</span>
          </button>
          {timeStr && (
            <span className="text-xs text-gray-400">{timeStr}</span>
          )}
        </div>

        {showSources && entry.result.sources.length > 0 && (
          <div className="mt-3 space-y-2">
            {entry.result.sources.slice(0, 4).map((src, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                <span className="text-xs text-gray-400 font-mono w-4 flex-shrink-0">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-bmw-blue truncate">{src.documentName}</span>
                    {src.timestamp && (
                      <span className="badge bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                        ⏱ {src.timestamp}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      Score: {(src.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{src.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchIcon({ size = "md" }: { size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <svg className={`${sz} text-current`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
    </svg>
  );
}
