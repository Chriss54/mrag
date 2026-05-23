import { useState, useCallback, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Header, TabNav, ChangelogView, MattersView, AudioPlayer, Toast, LoadingSkeleton, ChatPanel, KnowledgeBaseView } from './components';
import { useChangelog, useAudio } from './hooks';
import { sendChangelogEmail } from './services';

function App() {
  const {
    rawChangelog,
    parsedChangelog,
    analysis,
    latestVersion,
    isLoading,
    isAnalyzing,
    error,
    lastFetched,
    sources,
    selectedSourceId,
    selectedSourceName,
    refresh,
    selectSource,
  } = useChangelog();

  const {
    audioUrl,
    generatingFor,
    playingFor,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    selectedVoice,
    setSelectedVoice,
    setPlaybackSpeed,
    generateAndPlay,
    play,
    pause,
    stop,
    seek,
    download,
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'changelog' | 'matters' | 'knowledge'>('changelog');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pendingKBUpdates, setPendingKBUpdates] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = localStorage.getItem('refreshInterval');
    return saved ? parseInt(saved) : 0;
  });

  // Fetch pending KB update count
  useEffect(() => {
    const fetchKBStats = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/kb/stats');
        if (res.ok) {
          const data = await res.json();
          setPendingKBUpdates(data.pending || 0);
        }
      } catch { /* server might not be running */ }
    };
    fetchKBStats();
    const interval = setInterval(fetchKBStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (refreshInterval === 0) return;

    const intervalId = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, refresh]);

  const handleRefreshIntervalChange = useCallback((interval: number) => {
    setRefreshInterval(interval);
    localStorage.setItem('refreshInterval', interval.toString());
  }, []);

  const handleSendEmail = useCallback(async () => {
    if (!analysis) {
      setToast({ message: 'Analysis not available yet', type: 'error' });
      return;
    }

    setIsEmailSending(true);
    try {
      const success = await sendChangelogEmail({
        version: latestVersion,
        tldr: analysis.tldr,
        analysis,
      });

      if (success) {
        setToast({ message: 'Changelog sent to your email!', type: 'success' });
      } else {
        setToast({ message: 'Failed to send email. Please try again.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to send email. Please try again.', type: 'error' });
    } finally {
      setIsEmailSending(false);
    }
  }, [analysis, latestVersion]);

  const handleGenerateAudio = useCallback(
    async (text: string, label: string) => {
      await generateAndPlay(text, label);
    },
    [generateAndPlay]
  );

  const handleDownload = useCallback(() => {
    download(`claude-code-${latestVersion}-${playingFor || 'audio'}.wav`);
  }, [download, latestVersion, playingFor]);

  return (
    <div className="min-h-screen bg-base-950 transition-colors duration-500">
      <Header
        version={latestVersion}
        lastFetched={lastFetched}
        isLoading={isLoading}
        onRefresh={refresh}
        onSendEmail={handleSendEmail}
        isEmailSending={isEmailSending}
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={handleRefreshIntervalChange}
        sources={sources}
        selectedSourceId={selectedSourceId}
        selectedSourceName={selectedSourceName}
        onSelectSource={selectSource}
      />

      <TabNav activeTab={activeTab} onTabChange={setActiveTab} isAnalyzing={isAnalyzing} pendingKBUpdates={pendingKBUpdates} />

      <main className="pb-24">
        {error ? (
          <div className="max-w-4xl mx-auto p-8">
            <div className="bg-coral-400/10 dark:bg-coral-600/10 border border-coral-400 dark:border-coral-600 rounded-xl p-5 text-coral-700 dark:text-coral-400">
              <p className="font-semibold">Error loading changelog</p>
              <p className="text-sm mt-1 opacity-80">{error}</p>
              <button
                onClick={refresh}
                className="mt-4 px-5 py-2.5 bg-coral-600 text-white rounded-xl hover:bg-coral-700 transition-all text-sm font-medium shadow-sm hover:shadow-md"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : activeTab === 'changelog' ? (
          <ChangelogView
            versions={parsedChangelog}
            rawMarkdown={rawChangelog}
            onGenerateAudio={handleGenerateAudio}
            generatingAudioFor={generatingFor}
            playingAudioFor={playingFor}
            onStopAudio={stop}
          />
        ) : activeTab === 'matters' ? (
          <MattersView
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            onGenerateAudio={handleGenerateAudio}
            generatingAudioFor={generatingFor}
            playingAudioFor={playingFor}
            onStopAudio={stop}
          />
        ) : (
          <KnowledgeBaseView />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0">
        <AudioPlayer
          audioUrl={audioUrl}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackSpeed={playbackSpeed}
          selectedVoice={selectedVoice}
          playingLabel={playingFor}
          onVoiceChange={setSelectedVoice}
          onSpeedChange={setPlaybackSpeed}
          onPlay={play}
          onPause={pause}
          onSeek={seek}
          onDownload={handleDownload}
        />
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-accent-600 hover:bg-accent-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl z-30"
        aria-label="Open changelog chat"
        title="Ask about changelogs"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      <ChatPanel
        versions={parsedChangelog}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}

export default App;
