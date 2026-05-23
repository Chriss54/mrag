import { useState, useEffect, useCallback } from 'react';
import { Link, X, Plus, Trash2, Check, ExternalLink, Loader2, AlertCircle, CheckCircle, Edit3, Power, TestTube } from 'lucide-react';

interface ChangelogSource {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  last_version: string | null;
  last_checked_at: string | null;
}

interface TestResult {
  valid: boolean;
  latestVersion?: string;
  preview?: string;
  message?: string;
}

export function SourcesPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [sources, setSources] = useState<ChangelogSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Test URL state
  const [testingUrl, setTestingUrl] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const loadSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sources');
      if (!res.ok) throw new Error('Failed to load sources');
      const data = await res.json();
      setSources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      loadSources();
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, loadSources]);

  const testUrl = async (url: string) => {
    setTestingUrl(url);
    setTestResult(null);
    try {
      const res = await fetch('/api/sources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ valid: false, message: 'Failed to test URL' });
    } finally {
      setTestingUrl(null);
    }
  };

  const handleAddSource = async () => {
    if (!newName.trim() || !newUrl.trim()) {
      setAddError('Name and URL are required');
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), url: newUrl.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add source');
      }

      setNewName('');
      setNewUrl('');
      setShowAddForm(false);
      setTestResult(null);
      await loadSources();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add source');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateSource = async (id: string) => {
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), url: editUrl.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update source');
      }

      setEditingId(null);
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update source');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      await loadSources();
    } catch {
      setError('Failed to toggle source');
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this source? All version history for this source will be removed.')) {
      return;
    }

    try {
      const res = await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete source');
      await loadSources();
    } catch {
      setError('Failed to delete source');
    }
  };

  const startEditing = (source: ChangelogSource) => {
    setEditingId(source.id);
    setEditName(source.name);
    setEditUrl(source.url);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2.5 text-base-300 text-base-200 hover:text-base-50 hover:bg-base-700 hover:bg-base-800 rounded-xl transition-colors"
        aria-label="Changelog Sources"
        title="Changelog Sources"
      >
        <Link className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-base-800 rounded-xl shadow-2xl z-50 p-6 max-h-[90vh] overflow-y-auto transition-colors duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-base-50">Changelog Sources</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-base-400 hover:bg-base-700 hover:bg-base-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-coral-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-accent-400/10 bg-accent-600/10 border border-accent-400/30 border-accent-600/30 rounded-xl flex items-center gap-2 text-accent-500 text-accent-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {/* Sources list */}
                <div className="space-y-3">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className={`p-4 border rounded-xl transition-colors ${
                        source.is_active
                          ? 'border-teal-400/30 border-accent-600/30 bg-accent-500/100/10 bg-accent-600/10'
                          : 'border-base-600 border-base-700 bg-base-700/50 opacity-60'
                      }`}
                    >
                      {editingId === source.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Source name"
                            className="w-full bg-base-700 border border-base-600 border-base-700 rounded-xl px-3 py-2 text-sm text-base-200"
                          />
                          <input
                            type="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="Changelog URL"
                            className="w-full bg-base-700 border border-base-600 border-base-700 rounded-xl px-3 py-2 text-sm text-base-200 font-mono"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateSource(source.id)}
                              className="px-3 py-1.5 bg-coral-500 text-white text-sm rounded-xl hover:bg-accent-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 bg-base-700 bg-base-800 text-base-200 text-sm rounded-xl hover:bg-base-600 hover:bg-base-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-base-50 truncate">
                                  {source.name}
                                </h3>
                                {source.is_active && (
                                  <span className="flex-shrink-0 px-2 py-0.5 text-xs bg-accent-500/100/20 text-accent-600 text-accent-400 rounded-full">
                                    Active
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-accent-500 text-accent-400 hover:underline truncate font-mono"
                                >
                                  {source.url}
                                </a>
                                <ExternalLink className="w-3 h-3 flex-shrink-0 text-accent-500 text-accent-400" />
                              </div>
                              {source.last_version && (
                                <p className="text-xs text-base-300 mt-1">
                                  Last version: <span className="font-mono">{source.last_version}</span>
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleActive(source.id, source.is_active)}
                                className={`p-1.5 rounded-xl transition-colors ${
                                  source.is_active
                                    ? 'text-accent-500 hover:bg-accent-500/100/20 hover:bg-accent-600/20'
                                    : 'text-base-400 hover:bg-base-700 hover:bg-base-800'
                                }`}
                                title={source.is_active ? 'Disable source' : 'Enable source'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => startEditing(source)}
                                className="p-1.5 text-base-400 hover:bg-base-700 hover:bg-base-800 rounded-xl transition-colors"
                                title="Edit source"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSource(source.id)}
                                className="p-1.5 text-coral-500 hover:bg-accent-400/20 hover:bg-accent-600/20 rounded-xl transition-colors"
                                title="Delete source"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {sources.length === 0 && (
                    <div className="text-center py-8 text-base-300">
                      No changelog sources configured
                    </div>
                  )}
                </div>

                {/* Add source form */}
                {showAddForm ? (
                  <div className="p-4 border-2 border-dashed border-accent-400/30 border-accent-600/30 rounded-xl bg-accent-400/10 bg-accent-600/10 space-y-4">
                    <h3 className="font-medium text-base-50">Add New Source</h3>

                    {addError && (
                      <div className="p-2 bg-accent-400/20 bg-accent-600/20 border border-accent-400/30 border-accent-600/30 rounded-lg text-accent-500 text-accent-400 text-sm">
                        {addError}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-base-300 text-base-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g., Antigravity IDE"
                        className="w-full bg-base-700 border border-base-600 border-base-700 rounded-xl px-3 py-2 text-base-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-base-300 text-base-400 mb-1">Changelog URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newUrl}
                          onChange={(e) => {
                            setNewUrl(e.target.value);
                            setTestResult(null);
                          }}
                          placeholder="https://raw.githubusercontent.com/..."
                          className="flex-1 bg-base-700 border border-base-600 border-base-700 rounded-xl px-3 py-2 text-base-200 font-mono text-sm"
                        />
                        <button
                          onClick={() => testUrl(newUrl)}
                          disabled={!newUrl || testingUrl !== null}
                          className="px-3 py-2 bg-base-700 bg-base-800 text-base-200 rounded-xl hover:bg-base-600 hover:bg-base-800 disabled:opacity-50 flex items-center gap-1"
                        >
                          {testingUrl === newUrl ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <TestTube className="w-4 h-4" />
                          )}
                          Test
                        </button>
                      </div>
                    </div>

                    {/* Test result */}
                    {testResult && (
                      <div
                        className={`p-3 rounded-xl text-sm ${
                          testResult.valid
                            ? 'bg-accent-500/100/10 bg-accent-600/10 border border-teal-400/30 border-accent-600/30'
                            : 'bg-accent-400/10 bg-accent-600/10 border border-accent-400/30 border-accent-600/30'
                        }`}
                      >
                        {testResult.valid ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-accent-600 text-accent-400">
                              <CheckCircle className="w-4 h-4" />
                              <span>Valid changelog detected!</span>
                            </div>
                            <p className="text-base-300 text-base-400">
                              Latest version: <span className="font-mono font-medium">{testResult.latestVersion}</span>
                            </p>
                            {testResult.preview && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-base-400 hover:text-base-200 hover:text-base-200">
                                  Preview content
                                </summary>
                                <pre className="mt-2 p-2 bg-base-800 rounded-lg overflow-auto max-h-32 font-mono">
                                  {testResult.preview}
                                </pre>
                              </details>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-accent-600 text-accent-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>{testResult.message}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleAddSource}
                        disabled={isAdding || !newName || !newUrl}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-coral-500 text-white rounded-xl hover:bg-accent-600 disabled:opacity-50"
                      >
                        {isAdding ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Add Source
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddForm(false);
                          setNewName('');
                          setNewUrl('');
                          setAddError(null);
                          setTestResult(null);
                        }}
                        className="px-4 py-2 bg-base-700 bg-base-800 text-base-200 rounded-xl hover:bg-base-600 hover:bg-base-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-base-500 border-base-700 rounded-xl text-base-300 text-base-400 hover:border-accent-400 hover:text-accent-500 hover:text-accent-400 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add Changelog Source
                  </button>
                )}

                {/* Info */}
                <div className="p-4 bg-accent-500/100/10 bg-accent-600/10 rounded-xl border border-teal-400/30 border-accent-600/30">
                  <p className="text-xs text-accent-600 text-accent-400">
                    Add multiple changelog sources to monitor. Each source should be a raw markdown file URL
                    (e.g., from GitHub raw content). Active sources will be checked for new versions based on
                    your notification settings.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
