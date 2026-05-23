"use client";

import { KnowledgeCard } from "@/types";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

interface KnowledgeCardNotificationProps {
  card: KnowledgeCard;
  onDismiss: () => void;
}

export default function KnowledgeCardNotification({
  card,
  onDismiss,
}: KnowledgeCardNotificationProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  const link = `${appUrl}/knowledge/${card.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("input");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card border-l-4 border-l-green-500 p-4 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">🗺️</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800">
              {t("card.created")}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{card.documentName}</p>

            {card.mainTopics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {card.mainTopics.slice(0, 4).map((topic, i) => (
                  <span key={i} className="badge bg-blue-50 border border-blue-100 text-blue-600 text-xs">
                    {topic}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <a
                href={`/knowledge/${card.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs py-1 px-3"
              >
                {t("card.view")}
              </a>
              <button
                onClick={handleCopy}
                className={`btn-primary text-xs py-1 px-3 ${copied ? "bg-green-600" : ""}`}
              >
                {copied ? t("card.copied") : t("card.copyLink")}
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none"
          aria-label={t("card.dismissLabel")}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
