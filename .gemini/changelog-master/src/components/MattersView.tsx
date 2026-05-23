import { useState, useEffect, useCallback } from 'react';
import type { GeminiAnalysis } from '../types';
import { AlertTriangle, AlertCircle, Sparkles, Wrench, Terminal, Code, Slash, Volume2, Loader2, Square, History, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AnalysisHistoryItem {
  version: string;
  created_at: string;
}

interface MattersViewProps {
  analysis: GeminiAnalysis | null;
  isAnalyzing: boolean;
  onGenerateAudio: (text: string, label: string) => void;
  generatingAudioFor: string | null;
  playingAudioFor: string | null;
  onStopAudio: () => void;
}

export function MattersView({
  analysis,
  isAnalyzing,
  onGenerateAudio,
  generatingAudioFor,
  playingAudioFor,
  onStopAudio,
}: MattersViewProps) {
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [historicalAnalysis, setHistoricalAnalysis] = useState<GeminiAnalysis | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/analysis');
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data);
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  };

  const loadHistoricalAnalysis = useCallback(async (version: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/analysis/${encodeURIComponent(version)}`);
      if (res.ok) {
        const data = await res.json();
        setHistoricalAnalysis(data.analysis);
        setSelectedVersion(version);
      }
    } catch (error) {
      console.error('Failed to load historical analysis:', error);
    } finally {
      setIsLoadingHistory(false);
      setShowHistoryDropdown(false);
    }
  }, []);

  const showCurrentAnalysis = () => {
    setSelectedVersion(null);
    setHistoricalAnalysis(null);
    setShowHistoryDropdown(false);
  };

  // Determine which analysis to display
  const displayAnalysis = selectedVersion ? historicalAnalysis : analysis;
  const isViewingHistory = selectedVersion !== null;

  if (isAnalyzing && !isViewingHistory) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-base-700 bg-base-800 rounded-xl" />
          <div className="h-40 bg-base-700 bg-base-800 rounded-xl" />
          <div className="h-32 bg-base-700 bg-base-800 rounded-xl" />
        </div>
        <p className="text-center text-base-300 mt-6">
          Analyzing changelog with AI...
        </p>
      </div>
    );
  }

  if (!displayAnalysis) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-base-300">
          Analysis not available. Please check your Gemini API key configuration.
        </p>
      </div>
    );
  }

  const getFullAnalysisText = () => {
    let text = `Here's what matters in the latest Claude Code release. ${displayAnalysis.tldr}. `;

    if (displayAnalysis.categories.critical_breaking_changes.length > 0) {
      text += `Critical breaking changes: ${displayAnalysis.categories.critical_breaking_changes.join('. ')}. `;
    }

    if (displayAnalysis.categories.major_features.length > 0) {
      text += `Major new features: ${displayAnalysis.categories.major_features.join('. ')}. `;
    }

    if (displayAnalysis.categories.important_fixes.length > 0) {
      text += `Important fixes: ${displayAnalysis.categories.important_fixes.join('. ')}. `;
    }

    if (displayAnalysis.action_items.length > 0) {
      text += `Action items for you: ${displayAnalysis.action_items.join('. ')}`;
    }

    return text;
  };

  const handleAudioClick = (text: string, label: string) => {
    if (playingAudioFor === label) {
      onStopAudio();
    } else {
      onGenerateAudio(text, label);
    }
  };

  const AudioButton = ({ text, label }: { text: string; label: string }) => {
    const isGenerating = generatingAudioFor === label;
    const isPlaying = playingAudioFor === label;

    return (
      <button
        onClick={() => handleAudioClick(text, label)}
        disabled={isGenerating}
        className={`p-2 rounded-xl transition-colors ${
          isPlaying
            ? 'bg-accent-400/20 bg-accent-600/20 text-accent-500 text-accent-400'
            : 'text-base-400 hover:bg-base-700 hover:bg-base-800 hover:text-accent-500'
        } disabled:opacity-50`}
        title={isPlaying ? 'Stop' : 'Listen'}
      >
        {isGenerating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isPlaying ? (
          <Square className="w-5 h-5 fill-current" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* History Selector */}
      {historyItems.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-base-700 rounded-xl border border-base-600 border-base-700 text-base-200 hover:bg-base-700 hover:bg-base-800 transition-colors"
            >
              <History className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isViewingHistory ? selectedVersion : 'Current Analysis'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showHistoryDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showHistoryDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowHistoryDropdown(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-80 bg-base-700 rounded-xl shadow-xl border border-base-600 border-base-700 z-50 overflow-hidden max-h-64 overflow-y-auto">
                  <button
                    onClick={showCurrentAnalysis}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between transition-colors ${
                      !isViewingHistory
                        ? 'bg-accent-400/20 bg-accent-600/20 text-accent-600 text-accent-400'
                        : 'hover:bg-base-600 text-base-200'
                    }`}
                  >
                    <span className="font-medium">Current Analysis</span>
                    <span className="text-xs text-base-300">Latest</span>
                  </button>
                  <div className="border-t border-base-700 border-base-700" />
                  {historyItems.map((item) => (
                    <button
                      key={item.version}
                      onClick={() => loadHistoricalAnalysis(item.version)}
                      disabled={isLoadingHistory}
                      className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between transition-colors ${
                        selectedVersion === item.version
                          ? 'bg-accent-400/20 bg-accent-600/20 text-accent-600 text-accent-400'
                          : 'hover:bg-base-600 text-base-200'
                      } disabled:opacity-50`}
                    >
                      <span className="font-medium truncate">{item.version}</span>
                      <span className="text-xs text-base-300 ml-2 flex-shrink-0">
                        {formatDate(item.created_at)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {isViewingHistory && (
            <button
              onClick={showCurrentAnalysis}
              className="text-sm text-accent-500 text-accent-400 hover:underline"
            >
              Back to current
            </button>
          )}
        </div>
      )}

      {isLoadingHistory && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-coral-500" />
        </div>
      )}

      {!isLoadingHistory && (
        <>
          {/* Viewing History Banner */}
          {isViewingHistory && (
            <div className="p-3 bg-accent-500/100/10 bg-accent-600/10 rounded-xl border border-teal-400/30 border-accent-600/30 flex items-center gap-2">
              <History className="w-4 h-4 text-accent-500 text-accent-400" />
              <span className="text-sm text-accent-600 text-accent-400">
                Viewing archived analysis: <strong>{selectedVersion}</strong>
              </span>
            </div>
          )}

          {/* TLDR Section */}
          <div className="p-6 bg-gradient-to-r from-coral-400/10 to-coral-500/10 from-coral-600/10 to-coral-700/10 rounded-xl border border-accent-400/30 border-accent-600/30">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-accent-600 text-accent-400">TL;DR</h2>
              <AudioButton text={displayAnalysis.tldr} label="tldr" />
            </div>
            <div className="prose prose-sm prose-invert max-w-none prose-p:text-base-200 prose-p:text-base-200 prose-p:leading-relaxed prose-strong:text-accent-500 prose-strong:text-accent-400 prose-ul:my-2 prose-li:my-0.5">
              <ReactMarkdown>{displayAnalysis.tldr}</ReactMarkdown>
            </div>
          </div>

          {/* Full Summary Audio Button */}
          <div className="flex justify-center">
            <button
              onClick={() => handleAudioClick(getFullAnalysisText(), 'full-analysis')}
              disabled={generatingAudioFor === 'full-analysis'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                playingAudioFor === 'full-analysis'
                  ? 'bg-coral-500 text-white'
                  : 'bg-accent-400/20 bg-accent-600/20 text-accent-600 text-accent-400 hover:bg-accent-400/30 hover:bg-accent-600/30'
              } disabled:opacity-50`}
            >
              {generatingAudioFor === 'full-analysis' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : playingAudioFor === 'full-analysis' ? (
                <Square className="w-5 h-5 fill-current" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
              {playingAudioFor === 'full-analysis' ? 'Stop' : 'Listen to Full Summary'}
            </button>
          </div>

          {/* Critical Breaking Changes */}
          {displayAnalysis.categories.critical_breaking_changes.length > 0 && (
            <Section
              title="Critical Breaking Changes"
              icon={<AlertTriangle className="w-5 h-5" />}
              items={displayAnalysis.categories.critical_breaking_changes}
              color="red"
              onAudio={(text) => handleAudioClick(text, 'breaking')}
              isGenerating={generatingAudioFor === 'breaking'}
              isPlaying={playingAudioFor === 'breaking'}
            />
          )}

          {/* Removals */}
          {displayAnalysis.categories.removals.length > 0 && (
            <div className="p-4 border-l-4 border-coral-500 bg-accent-400/10 bg-accent-600/10 rounded-r-xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-accent-500 text-accent-400" />
                <h3 className="font-semibold text-accent-600 text-accent-400">Removals</h3>
              </div>
              <ul className="space-y-2">
                {displayAnalysis.categories.removals.map((removal, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-lg ${
                        removal.severity === 'critical'
                          ? 'bg-accent-600/20 text-accent-600 text-accent-400'
                          : removal.severity === 'high'
                          ? 'bg-coral-500/20 text-accent-500 text-accent-400'
                          : 'bg-accent-400/20 text-coral-500 text-accent-400'
                      }`}
                    >
                      {removal.severity}
                    </span>
                    <div>
                      <span className="font-medium text-base-50">{removal.feature}</span>
                      <span className="text-base-200"> — {removal.why}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Major Features */}
          {displayAnalysis.categories.major_features.length > 0 && (
            <Section
              title="Major Features"
              icon={<Sparkles className="w-5 h-5" />}
              items={displayAnalysis.categories.major_features}
              color="teal"
              onAudio={(text) => handleAudioClick(text, 'features')}
              isGenerating={generatingAudioFor === 'features'}
              isPlaying={playingAudioFor === 'features'}
            />
          )}

          {/* Important Fixes */}
          {displayAnalysis.categories.important_fixes.length > 0 && (
            <Section
              title="Important Fixes"
              icon={<Wrench className="w-5 h-5" />}
              items={displayAnalysis.categories.important_fixes}
              color="gray"
              onAudio={(text) => handleAudioClick(text, 'fixes')}
              isGenerating={generatingAudioFor === 'fixes'}
              isPlaying={playingAudioFor === 'fixes'}
            />
          )}

          {/* New Slash Commands */}
          {displayAnalysis.categories.new_slash_commands.length > 0 && (
            <Section
              title="New Slash Commands"
              icon={<Slash className="w-5 h-5" />}
              items={displayAnalysis.categories.new_slash_commands}
              color="purple"
              onAudio={(text) => handleAudioClick(text, 'commands')}
              isGenerating={generatingAudioFor === 'commands'}
              isPlaying={playingAudioFor === 'commands'}
            />
          )}

          {/* Terminal Improvements */}
          {displayAnalysis.categories.terminal_improvements.length > 0 && (
            <Section
              title="Terminal Improvements"
              icon={<Terminal className="w-5 h-5" />}
              items={displayAnalysis.categories.terminal_improvements}
              color="blue"
              onAudio={(text) => handleAudioClick(text, 'terminal')}
              isGenerating={generatingAudioFor === 'terminal'}
              isPlaying={playingAudioFor === 'terminal'}
            />
          )}

          {/* API Changes */}
          {displayAnalysis.categories.api_changes.length > 0 && (
            <Section
              title="API Changes"
              icon={<Code className="w-5 h-5" />}
              items={displayAnalysis.categories.api_changes}
              color="indigo"
              onAudio={(text) => handleAudioClick(text, 'api')}
              isGenerating={generatingAudioFor === 'api'}
              isPlaying={playingAudioFor === 'api'}
            />
          )}

          {/* Action Items */}
          {displayAnalysis.action_items.length > 0 && (
            <div className="p-4 bg-base-700 rounded-xl border border-base-600 border-base-700">
              <h3 className="font-semibold text-base-50 mb-3">Action Items</h3>
              <ul className="space-y-2">
                {displayAnalysis.action_items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-base-200">
                    <span className="text-coral-500 mt-0.5">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  color: 'red' | 'orange' | 'teal' | 'gray' | 'purple' | 'blue' | 'indigo';
  onAudio?: (text: string) => void;
  isGenerating?: boolean;
  isPlaying?: boolean;
}

function Section({ title, icon, items, color, onAudio, isGenerating, isPlaying }: SectionProps) {
  const colorClasses = {
    red: 'border-accent-600 bg-coral-500/10 bg-accent-600/10 text-accent-500 text-accent-400',
    orange: 'border-coral-500 bg-accent-400/10 bg-coral-500/10 text-coral-500 text-accent-400',
    teal: 'border-teal-500 bg-accent-500/100/10 bg-accent-600/10 text-accent-500 text-accent-400',
    gray: 'border-base-700 bg-base-700 text-base-400 text-base-200',
    purple: 'border-purple-500 bg-purple-50 bg-purple-900/20 text-purple-600 text-purple-400',
    blue: 'border-blue-500 bg-blue-50 bg-blue-900/20 text-blue-600 text-blue-400',
    indigo: 'border-indigo-500 bg-indigo-50 bg-indigo-900/20 text-indigo-600 text-indigo-400',
  };

  const classes = colorClasses[color];
  const [borderColor, bgColor, textColor] = classes.split(' ');

  const sectionText = `${title}: ${items.join('. ')}`;

  return (
    <div className={`p-4 border-l-4 ${borderColor} ${bgColor} rounded-r-xl`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={textColor}>{icon}</span>
          <h3 className="font-semibold text-base-50">{title}</h3>
        </div>
        {onAudio && (
          <button
            onClick={() => onAudio(sectionText)}
            disabled={isGenerating}
            className={`p-1.5 rounded-xl transition-colors ${
              isPlaying
                ? 'bg-accent-400/20 bg-accent-600/20 text-accent-500'
                : 'text-base-400 hover:bg-white/50 hover:bg-base-800 hover:text-accent-500'
            } disabled:opacity-50`}
            title={isPlaying ? 'Stop' : 'Listen'}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-base-200 flex items-start gap-2">
            <span className="text-base-300">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
