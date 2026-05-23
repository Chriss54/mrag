interface TabNavProps {
  activeTab: 'changelog' | 'matters' | 'knowledge';
  onTabChange: (tab: 'changelog' | 'matters' | 'knowledge') => void;
  isAnalyzing: boolean;
  pendingKBUpdates?: number;
}

export function TabNav({ activeTab, onTabChange, isAnalyzing, pendingKBUpdates }: TabNavProps) {
  return (
    <nav className="border-b border-base-600 border-base-700 bg-base-800 transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-1">
          <button
            onClick={() => onTabChange('changelog')}
            className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-all duration-300 ${
              activeTab === 'changelog'
                ? 'border-accent-500 text-accent-500 text-accent-400'
                : 'border-transparent text-base-300 hover:text-base-50 hover:bg-base-700'
            }`}
            aria-selected={activeTab === 'changelog'}
            role="tab"
          >
            Changelog
          </button>
          <button
            onClick={() => onTabChange('matters')}
            className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'matters'
                ? 'border-accent-500 text-accent-500 text-accent-400'
                : 'border-transparent text-base-300 hover:text-base-50 hover:bg-base-700'
            }`}
            aria-selected={activeTab === 'matters'}
            role="tab"
          >
            What Matters
            {isAnalyzing && (
              <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
            )}
          </button>
          <button
            onClick={() => onTabChange('knowledge')}
            className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'knowledge'
                ? 'border-accent-500 text-accent-500 text-accent-400'
                : 'border-transparent text-base-300 hover:text-base-50 hover:bg-base-700'
            }`}
            aria-selected={activeTab === 'knowledge'}
            role="tab"
          >
            Knowledge Base
            {pendingKBUpdates !== undefined && pendingKBUpdates > 0 && (
              <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-white text-xs rounded-full font-bold">
                {pendingKBUpdates}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
