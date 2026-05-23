"use client";

import { useState, useRef, useCallback } from "react";
import { RagieDocument, KnowledgeCard } from "@/types";
import { useI18n } from "@/lib/i18n";

interface UploadZoneProps {
  onUploadComplete: (document: RagieDocument, knowledgeCard: KnowledgeCard) => void;
}

const ACCEPTED = ".pdf,.mp4,.mp3,.wav,.m4a";
const MAX_MB_PDF = 50;
const MAX_MB_MEDIA = 200;

type UploadState = "idle" | "uploading" | "processing" | "done" | "error";

interface UploadStatus {
  state: UploadState;
  fileName?: string;
  progress?: string;
  error?: string;
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<UploadStatus>({ state: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const isMedia = /\.(mp4|mp3|wav|m4a|ogg)$/i.test(file.name) ||
      file.type.startsWith("video/") || file.type.startsWith("audio/");
    const maxMB = isMedia ? MAX_MB_MEDIA : MAX_MB_PDF;
    if (file.size > maxMB * 1024 * 1024) {
      const key = isMedia ? "upload.tooLargeMedia" as const : "upload.tooLargePdf" as const;
      setStatus({ state: "error", error: t(key, { max: maxMB }) });
      return;
    }

    setStatus({ state: "uploading", fileName: file.name, progress: t("upload.uploading") });

    const formData = new FormData();
    formData.append("file", file);

    try {
      setStatus({ state: "processing", fileName: file.name, progress: t("upload.processing") });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setStatus({ state: "done", fileName: file.name, progress: t("upload.success") });

      onUploadComplete(data.document, data.knowledgeCard);

      setTimeout(() => setStatus({ state: "idle" }), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("upload.failed");
      setStatus({ state: "error", fileName: file.name, error: message });
    }
  }, [onUploadComplete, t]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const isActive = status.state === "uploading" || status.state === "processing";

  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <UploadIcon />
        {t("upload.title")}
      </h2>

      <div
        role="button"
        tabIndex={0}
        aria-label={t("upload.ariaLabel")}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => !isActive && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !isActive && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-150 cursor-pointer
          ${isDragOver && !isActive ? "border-bmw-blue bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-bmw-blue-light hover:bg-blue-50/30"}
          ${isActive ? "cursor-wait pointer-events-none" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleChange}
          className="sr-only"
          disabled={isActive}
        />

        {status.state === "idle" && (
          <>
            <div className="text-4xl mb-3">📂</div>
            <p className="text-sm font-medium text-gray-700">{t("upload.dropHint")}</p>
            <p className="text-xs text-gray-400 mt-1">PDF (max. {MAX_MB_PDF} MB) · MP4, MP3, WAV, M4A (max. {MAX_MB_MEDIA} MB)</p>
          </>
        )}

        {(status.state === "uploading" || status.state === "processing") && (
          <div className="flex flex-col items-center gap-3">
            <Spinner />
            <div>
              <p className="text-sm font-semibold text-bmw-blue">{status.progress}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{status.fileName}</p>
            </div>
            <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-bmw-blue rounded-full animate-pulse"
                style={{ width: status.state === "processing" ? "75%" : "35%" }}
              />
            </div>
          </div>
        )}

        {status.state === "done" && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">✅</span>
            <p className="text-sm font-semibold text-green-700">{status.progress}</p>
            <p className="text-xs text-gray-500 truncate max-w-xs">{status.fileName}</p>
          </div>
        )}

        {status.state === "error" && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">❌</span>
            <p className="text-sm font-semibold text-red-600">{t("upload.failed")}</p>
            <p className="text-xs text-red-500">{status.error}</p>
            <p className="text-xs text-gray-400 mt-1">{t("upload.retry")}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {t("upload.hint")}
      </p>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg className="w-5 h-5 text-bmw-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-2 border-gray-200 border-t-bmw-blue rounded-full animate-spin" />
  );
}
