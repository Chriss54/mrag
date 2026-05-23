import { RefreshCw, Mail, ChevronDown } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';
import { SourcesPanel } from './SourcesPanel';
import type { ChangelogSource } from '../types';

interface HeaderProps {
  version: string;
  lastFetched: number | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSendEmail: () => void;
  isEmailSending: boolean;
  refreshInterval: number;
  onRefreshIntervalChange: (interval: number) => void;
  sources?: ChangelogSource[];
  selectedSourceId: string | null;
  selectedSourceName: string;
  onSelectSource?: (sourceId: string | null) => void;
}

export function Header({
  version,
  lastFetched,
  isLoading,
  onRefresh,
  onSendEmail,
  isEmailSending,
  refreshInterval,
  onRefreshIntervalChange,
  sources = [],
  selectedSourceId,
  selectedSourceName,
  onSelectSource,
}: HeaderProps) {
  const formatLastFetched = (timestamp: number | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const activeSources = sources.filter(s => s.is_active);

  return (
    <header className="border-b border-base-600 border-base-700 bg-base-800 sticky top-0 z-10 transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-base-50 tracking-tight transition-colors duration-300">
                {selectedSourceName} Changelog
              </h1>
              {activeSources.length > 1 && onSelectSource && (
                <div className="relative group">
                  <button
                    className="p-1.5 text-base-300 hover:text-base-50 rounded-lg hover:bg-base-700 hover:bg-base-800 transition-colors"
                    aria-label="Switch changelog source"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="absolute left-0 top-full mt-2 w-72 bg-base-700 rounded-xl shadow-xl border border-base-600 border-base-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                    <div className="py-2">
                      {activeSources.map((source) => (
                        <button
                          key={source.id}
                          onClick={() => onSelectSource(source.id)}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                            source.id === selectedSourceId
                              ? 'text-accent-500 text-accent-400 bg-base-800 bg-base-800'
                              : 'text-base-50 text-base-200 hover:bg-base-600'
                          }`}
                        >
                          <span className="truncate font-medium">{source.name}</span>
                          {source.last_version && (
                            <span className="text-xs text-base-300 ml-2 font-mono bg-base-700 bg-base-800 px-2 py-0.5 rounded">
                              v{source.last_version}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <span className="px-3 py-1.5 text-sm font-medium bg-accent-500/100 text-white rounded-full shadow-sm">
              v{version}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {lastFetched && (
              <span className="text-sm text-base-400 text-base-200 hidden sm:block mr-2 transition-colors">
                Updated: {formatLastFetched(lastFetched)}
              </span>
            )}

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 text-base-300 text-base-200 hover:text-base-50 hover:bg-base-700 hover:bg-base-800 rounded-xl transition-colors disabled:opacity-50"
              aria-label="Refresh changelog"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>



            <button
              onClick={onSendEmail}
              disabled={isEmailSending}
              className="p-2.5 text-base-300 text-base-200 hover:text-base-50 hover:bg-base-700 hover:bg-base-800 rounded-xl transition-colors disabled:opacity-50"
              aria-label="Send changelog to email"
              title="Send to email"
            >
              <Mail className={`w-5 h-5 ${isEmailSending ? 'animate-pulse' : ''}`} />
            </button>

            <SourcesPanel />

            <SettingsPanel
              refreshInterval={refreshInterval}
              onRefreshIntervalChange={onRefreshIntervalChange}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
