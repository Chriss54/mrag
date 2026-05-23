import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, Copy, Check, Volume2, Loader2, Square } from 'lucide-react';
import type { ChangelogVersion } from '../types';

interface ChangelogViewProps {
  versions: ChangelogVersion[];
  rawMarkdown: string | null;
  onGenerateAudio: (text: string, label: string) => void;
  generatingAudioFor: string | null;
  playingAudioFor: string | null;
  onStopAudio: () => void;
}

export function ChangelogView({
  versions,
  rawMarkdown,
  onGenerateAudio,
  generatingAudioFor,
  playingAudioFor,
  onStopAudio,
}: ChangelogViewProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set(versions.slice(0, 1).map((v) => v.version))
  );
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return '✨';
      case 'fix':
        return '🔧';
      case 'removal':
        return '⚠️';
      case 'breaking':
        return '🚨';
      default:
        return '•';
    }
  };

  const getVersionText = (version: ChangelogVersion) => {
    const header = `Version ${version.version}${version.date ? `, released ${version.date}` : ''}.`;
    const items = version.items.map((item) => {
      const typeLabel = item.type === 'feature' ? 'New feature' :
        item.type === 'fix' ? 'Bug fix' :
        item.type === 'removal' ? 'Removal' :
        item.type === 'breaking' ? 'Breaking change' : 'Update';
      return `${typeLabel}: ${item.content}`;
    }).join('. ');
    return `${header} Changes include: ${items}`;
  };

  const handleAudioClick = (e: React.MouseEvent, version: ChangelogVersion) => {
    e.stopPropagation();
    const label = `v${version.version}`;

    if (playingAudioFor === label) {
      onStopAudio();
    } else {
      const text = getVersionText(version);
      onGenerateAudio(text, label);
    }
  };

  if (!rawMarkdown && versions.length === 0) {
    return (
      <div className="p-8 text-center text-base-400">
        No changelog data available
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {versions.map((version) => {
        const label = `v${version.version}`;
        const isGenerating = generatingAudioFor === label;
        const isPlaying = playingAudioFor === label;

        return (
          <div
            key={version.version}
            className="border border-base-600 border-base-700 rounded-xl overflow-hidden bg-base-800 transition-colors duration-500"
          >
            <div className="flex items-center bg-base-700">
              <button
                onClick={() => toggleVersion(version.version)}
                className="flex-1 px-4 py-3 flex items-center justify-between hover:bg-base-700 hover:bg-base-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedVersions.has(version.version) ? (
                    <ChevronDown className="w-5 h-5 text-base-300" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-base-300" />
                  )}
                  <span className="font-semibold text-base-50">
                    v{version.version}
                  </span>
                  {version.date && (
                    <span className="text-sm text-base-300">
                      {version.date}
                    </span>
                  )}
                </div>
                <span className="text-sm text-base-300">
                  {version.items.length} changes
                </span>
              </button>

              <button
                onClick={(e) => handleAudioClick(e, version)}
                disabled={isGenerating}
                className={`p-3 mr-2 rounded-xl transition-colors ${
                  isPlaying
                    ? 'bg-accent-400/20 bg-accent-600/20 text-accent-500 text-accent-400'
                    : 'text-base-400 hover:bg-base-700 hover:bg-base-800 hover:text-accent-500'
                } disabled:opacity-50`}
                aria-label={isPlaying ? 'Stop audio' : 'Generate audio for this version'}
                title={isPlaying ? 'Stop' : 'Listen to this release'}
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Square className="w-5 h-5 fill-current" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>

            {expandedVersions.has(version.version) && (
              <div className="p-4 space-y-2">
                {version.items.map((item, idx) => {
                  const itemId = `${version.version}-${idx}`;
                  return (
                    <div
                      key={itemId}
                      className="group flex items-start gap-2 p-2 rounded-lg hover:bg-base-700 transition-colors"
                    >
                      <span className="flex-shrink-0 text-lg">{getItemIcon(item.type)}</span>
                      <div className="flex-1 min-w-0 prose prose-sm prose-invert max-w-none text-base-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {item.content}
                        </ReactMarkdown>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.content, itemId)}
                        className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 text-base-400 hover:text-base-300 hover:text-base-200 transition-opacity"
                        aria-label="Copy to clipboard"
                      >
                        {copiedItem === itemId ? (
                          <Check className="w-4 h-4 text-accent-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
