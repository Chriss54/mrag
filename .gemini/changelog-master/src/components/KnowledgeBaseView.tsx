import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Link2, Youtube, Check, X, Eye, Clock, AlertTriangle, Loader2, FileText, ArrowUpCircle, RefreshCw, Trash2, Undo2, CheckCheck } from 'lucide-react';

const API_BASE = 'http://localhost:3001';

interface KBUpdateSummary {
  id: string;
  file_path: string;
  file_name: string;
  source_type: 'changelog' | 'url' | 'youtube';
  source_url: string;
  source_title: string;
  change_summary: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  created_at: string;
}

interface KBUpdateFull extends KBUpdateSummary {
  original_content: string;
  updated_content: string;
}

interface KBStats {
  pending: number;
  approved: number;
  applied: number;
  rejected: number;
  snapshots: number;
}

interface KBFreshness {
  lastApplied: string | null;
  daysSinceUpdate: number;
  totalApplied: number;
  healthStatus: 'fresh' | 'aging' | 'stale';
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  filePath?: string;
}

interface IngestionEntry {
  id: string;
  url: string;
  source_type: string;
  title: string | null;
  status: string;
  error: string | null;
  updates_generated: number;
  created_at: string;
}

export function KnowledgeBaseView() {
  const [activeSection, setActiveSection] = useState<'updates' | 'ingest' | 'history'>('updates');
  const [updates, setUpdates] = useState<KBUpdateSummary[]>([]);
  const [stats, setStats] = useState<KBStats | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<KBUpdateFull | null>(null);
  const [ingestions, setIngestions] = useState<IngestionEntry[]>([]);
  const [freshness, setFreshness] = useState<KBFreshness | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  // Ingest form state
  const [ingestUrl, setIngestUrl] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info', filePath?: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, filePath }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const fetchUpdates = useCallback(async () => {
    try {
      const [updatesRes, statsRes, freshnessRes] = await Promise.all([
        fetch(`${API_BASE}/api/kb/updates`),
        fetch(`${API_BASE}/api/kb/stats`),
        fetch(`${API_BASE}/api/kb/freshness`),
      ]);
      setUpdates(await updatesRes.json());
      setStats(await statsRes.json());
      if (freshnessRes.ok) setFreshness(await freshnessRes.json());
    } catch (err) {
      console.error('Failed to fetch KB updates:', err);
    }
  }, []);

  const fetchIngestions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/kb/ingestions`);
      setIngestions(await res.json());
    } catch (err) {
      console.error('Failed to fetch ingestion log:', err);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
    fetchIngestions();
  }, [fetchUpdates, fetchIngestions]);

  const handleIngest = async () => {
    if (!ingestUrl.trim()) return;
    setIsIngesting(true);
    setIngestResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/kb/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ingestUrl.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        const msg = data.message || (data.updates > 0
          ? `✅ ${data.updates} KB update(s) generated!${data.skipped > 0 ? ` (${data.skipped} skipped — already have pending updates)` : ''}`
          : 'Content analyzed — no new updates needed for the knowledge base.');
        setIngestResult({ success: true, message: msg });
        setIngestUrl('');
        fetchUpdates();
        fetchIngestions();
      } else if (res.status === 409) {
        setIngestResult({ success: false, message: `⚠️ ${data.error}` });
      } else {
        setIngestResult({ success: false, message: `❌ ${data.error}` });
      }
    } catch (err) {
      setIngestResult({ success: false, message: `❌ Network error: ${err}` });
    } finally {
      setIsIngesting(false);
    }
  };

  const viewUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/kb/updates/${id}`);
      setSelectedUpdate(await res.json());
    } catch (err) {
      console.error('Failed to load update:', err);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await fetch(`${API_BASE}/api/kb/updates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchUpdates();
      if (selectedUpdate?.id === id) {
        setSelectedUpdate(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const applyUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/kb/apply/${id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ Applied → ${data.path || data.file}`, 'success', data.path);
        fetchUpdates();
        if (selectedUpdate?.id === id) {
          setSelectedUpdate(prev => prev ? { ...prev, status: 'applied' } : null);
        }
      } else {
        showToast(`❌ Failed: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast(`❌ Network error: ${err}`, 'error');
    }
  };

  // A3: Batch approve all pending updates
  const applyAllPending = async () => {
    const pendingUpdates = updates.filter(u => u.status === 'pending');
    if (pendingUpdates.length === 0) return;
    setIsApplyingAll(true);
    let successCount = 0;
    let failCount = 0;
    for (const u of pendingUpdates) {
      try {
        const res = await fetch(`${API_BASE}/api/kb/apply/${u.id}`, { method: 'POST' });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    showToast(
      `✅ ${successCount} update(s) applied${failCount > 0 ? `, ${failCount} failed` : ''}`,
      failCount > 0 ? 'info' : 'success'
    );
    fetchUpdates();
    setIsApplyingAll(false);
  };

  // B2: Undo an applied update (restore original content)
  const undoUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/kb/undo/${id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(`↩️ Undone → ${data.path || data.file}`, 'info', data.path);
        fetchUpdates();
        if (selectedUpdate?.id === id) {
          setSelectedUpdate(prev => prev ? { ...prev, status: 'pending' } : null);
        }
      } else {
        showToast(`❌ Undo failed: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast(`❌ Network error: ${err}`, 'error');
    }
  };

  const deleteUpdate = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/kb/updates/${id}`, { method: 'DELETE' });
      fetchUpdates();
      if (selectedUpdate?.id === id) setSelectedUpdate(null);
    } catch (err) {
      console.error('Failed to delete update:', err);
    }
  };

  // B3: Push logic
  const pushSnapshot = async () => {
    setIsPushing(true);
    showToast('🔂 Pushing snapshot to Git repository...', 'info');
    try {
      const res = await fetch(`${API_BASE}/api/kb/push`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || '✅ Git Push successful!', 'success');
      } else {
        showToast(`❌ Push failed: ${data.details || data.error}`, 'error');
      }
    } catch (err) {
      showToast(`❌ Network error during push: ${err}`, 'error');
    } finally {
      setIsPushing(false);
    }
  };

  const sourceIcon = (type: string) => {
    if (type === 'youtube') return <Youtube className="w-4 h-4 text-red-500" />;
    if (type === 'changelog') return <FileText className="w-4 h-4 text-accent-400" />;
    return <Link2 className="w-4 h-4 text-blue-500" />;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
      applied: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-slide-in ${
                toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              <p>{toast.message}</p>
              {toast.filePath && (
                <p className="text-xs opacity-70 mt-1 font-mono truncate">{toast.filePath}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* B1: Freshness Dashboard */}
      {freshness && (
        <div className={`mb-4 px-4 py-3 rounded-xl border flex items-center justify-between text-sm ${
          freshness.healthStatus === 'fresh' ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : freshness.healthStatus === 'aging' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{freshness.healthStatus === 'fresh' ? '🟢' : freshness.healthStatus === 'aging' ? '🟡' : '🔴'}</span>
            <span className="font-medium">
              {freshness.healthStatus === 'fresh' ? 'KB is up to date' : freshness.healthStatus === 'aging' ? 'KB may need updates' : 'KB is outdated'}
            </span>
          </div>
          <span className="text-xs opacity-80">
            {freshness.lastApplied
              ? `Last update: ${freshness.daysSinceUpdate === 0 ? 'Today' : freshness.daysSinceUpdate === 1 ? 'Yesterday' : `${freshness.daysSinceUpdate} days ago`} · ${freshness.totalApplied} total applied`
              : 'No updates applied yet'
            }
          </span>
        </div>
      )}

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
            <div className="text-xs text-amber-500/80">Pending</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
            <div className="text-xs text-green-500/80">Approved</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.applied}</div>
            <div className="text-xs text-blue-500/80">Applied</div>
          </div>
          <div className="bg-base-700 border border-base-600 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-base-200">{stats.snapshots}</div>
            <div className="text-xs text-base-300">KB Files Tracked</div>
          </div>
        </div>
      )}

      {/* Section Nav & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {([['updates', 'Updates', ArrowUpCircle], ['ingest', 'Ingest URL', Link2], ['history', 'History', Clock]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as 'updates' | 'ingest' | 'history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeSection === key
                  ? 'bg-accent-600 text-white shadow-md'
                  : 'bg-base-700 text-base-300 hover:text-base-50 hover:bg-base-600 border border-base-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {key === 'updates' && stats && stats.pending > 0 && (
                <span className="ml-1 w-5 h-5 flex items-center justify-center bg-amber-500 text-white text-xs rounded-full">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={pushSnapshot}
          disabled={isPushing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white shadow-md transition-all disabled:opacity-50"
          title="Commit and Push .gemini folder to remote"
        >
          {isPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4" />}
          Git Push Snapshot
        </button>
      </div>

      {/* ====== UPDATES SECTION ====== */}
      {activeSection === 'updates' && (
        <div className="space-y-4">
          {selectedUpdate ? (
            // Detail View
            <div className="bg-base-800 rounded-2xl border border-base-600 overflow-hidden">
              <div className="p-4 border-b border-base-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUpdate(null)}
                    className="text-sm text-base-300 hover:text-base-50 hover:text-base-200"
                  >
                    ← Back
                  </button>
                  <div className="flex items-center gap-2">
                    {sourceIcon(selectedUpdate.source_type)}
                    <span className="font-semibold text-base-50">{selectedUpdate.file_name}</span>
                    {statusBadge(selectedUpdate.status)}
                  </div>
                </div>
                {selectedUpdate.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => applyUpdate(selectedUpdate.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4" /> Approve & Apply
                    </button>
                    <button
                      onClick={() => updateStatus(selectedUpdate.id, 'rejected')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm text-base-300 mb-1">
                    Source: <a href={selectedUpdate.source_url} target="_blank" rel="noreferrer" className="text-accent-500 hover:underline">{selectedUpdate.source_title}</a>
                  </p>
                  <p className="text-sm text-base-200 text-base-500">{selectedUpdate.change_summary}</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-base-400 uppercase mb-2">Original</h4>
                    <pre className="bg-base-900 rounded-xl p-4 text-xs overflow-auto max-h-[500px] text-base-200 text-base-500 border border-base-700">
                      {selectedUpdate.original_content}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-green-600 text-green-400 uppercase mb-2">Updated</h4>
                    <pre className="bg-green-50 bg-green-900/10 rounded-xl p-4 text-xs overflow-auto max-h-[500px] text-base-200 text-base-500 border border-green-200 border-green-800">
                      {selectedUpdate.updated_content}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // List View
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-base-50">Knowledge Base Updates</h3>
                <div className="flex items-center gap-3">
                  {/* A3: Approve All Button */}
                  {stats && stats.pending > 1 && (
                    <button
                      onClick={applyAllPending}
                      disabled={isApplyingAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isApplyingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                      Approve & Apply All ({stats.pending})
                    </button>
                  )}
                  <button onClick={fetchUpdates} className="flex items-center gap-1.5 text-sm text-base-300 hover:text-accent-500 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </button>
                </div>
              </div>
              {updates.length === 0 ? (
                <div className="bg-base-800 rounded-2xl border border-base-600 p-12 text-center">
                  <BookOpen className="w-12 h-12 text-base-400 mx-auto mb-4" />
                  <p className="text-base-300 font-medium">No KB updates yet</p>
                  <p className="text-sm text-base-400 mt-1">
                    Submit a URL in the "Ingest URL" tab or wait for the auto-changelog check to generate updates.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {updates.map((u) => (
                    <div
                      key={u.id}
                      className="bg-base-800 rounded-xl border border-base-700 p-4 flex items-center gap-4 hover:border-accent-400 hover:border-accent-700 transition-colors group"
                    >
                      <div className="flex-shrink-0">{sourceIcon(u.source_type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-base-100 truncate">{u.file_name}</span>
                          {statusBadge(u.status)}
                        </div>
                        <p className="text-xs text-base-300 truncate">{u.change_summary}</p>
                        <p className="text-xs text-base-400 mt-0.5">
                          {new Date(u.created_at).toLocaleDateString()} · {u.source_title}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 items-center">
                        <button onClick={() => viewUpdate(u.id)} className="p-2 hover:bg-base-700 rounded-lg" title="View diff">
                          <Eye className="w-4 h-4 text-base-400" />
                        </button>
                        {u.status === 'pending' && (
                          <>
                            <button
                              onClick={() => applyUpdate(u.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve & Apply
                            </button>
                            <button
                              onClick={() => updateStatus(u.id, 'rejected')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {/* B2: Undo button for applied updates */}
                        {u.status === 'applied' && (
                          <button
                            onClick={() => undoUpdate(u.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
                            title="Undo — restore original content"
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Undo
                          </button>
                        )}
                        <button onClick={() => deleteUpdate(u.id)} className="p-2 hover:bg-red-100 hover:bg-red-900/30 rounded-lg" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ====== INGEST SECTION ====== */}
      {activeSection === 'ingest' && (
        <div className="bg-base-800 rounded-2xl border border-base-600 p-6">
          <h3 className="text-lg font-semibold text-base-50 mb-2">Ingest New Knowledge</h3>
          <p className="text-sm text-base-300 mb-6">
            Paste a URL to a documentation page, blog post, or YouTube video. The AI will analyze it and suggest updates to the knowledge base.
          </p>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="url"
                value={ingestUrl}
                onChange={(e) => setIngestUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isIngesting && handleIngest()}
                placeholder="https://docs.anthropic.com/... or https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-base-900 border border-base-600 rounded-xl text-sm text-base-100 placeholder-charcoal-400 placeholder-charcoal-500 focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all"
                disabled={isIngesting}
              />
              {ingestUrl && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {ingestUrl.includes('youtube.com') || ingestUrl.includes('youtu.be')
                    ? <Youtube className="w-5 h-5 text-red-500" />
                    : <Link2 className="w-5 h-5 text-blue-500" />
                  }
                </span>
              )}
            </div>
            <button
              onClick={handleIngest}
              disabled={isIngesting || !ingestUrl.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-xl text-sm font-medium hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  Ingest
                </>
              )}
            </button>
          </div>

          {isIngesting && (
            <div className="mt-4 p-4 bg-accent-500/10 bg-accent-900/20 border border-accent-500/20 border-accent-800 rounded-xl">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-accent-500 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-accent-600 text-accent-400">Processing content...</p>
                  <p className="text-xs text-accent-500 text-accent-400 mt-0.5">Fetching → Analyzing → Mapping to KB files → Generating updates</p>
                </div>
              </div>
            </div>
          )}

          {ingestResult && (
            <div className={`mt-4 p-4 rounded-xl border ${
              ingestResult.success
                ? 'bg-green-50 bg-green-900/20 border-green-200 border-green-800 text-green-700 text-green-400'
                : 'bg-red-50 bg-red-900/20 border-red-200 border-red-800 text-red-700 text-red-400'
            }`}>
              <p className="text-sm">{ingestResult.message}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-base-700">
            <h4 className="text-sm font-semibold text-base-300 text-base-500 mb-3">Supported Sources</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 bg-base-700 rounded-xl">
                <FileText className="w-5 h-5 text-accent-400" />
                <div>
                  <p className="text-sm font-medium text-base-200">Documentation</p>
                  <p className="text-xs text-base-400">Anthropic docs, changelogs</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-base-700 rounded-xl">
                <Youtube className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-base-200">YouTube</p>
                  <p className="text-xs text-base-400">Video transcripts</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-base-700 rounded-xl">
                <Link2 className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-base-200">Web Pages</p>
                  <p className="text-xs text-base-400">Blog posts, articles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== HISTORY SECTION ====== */}
      {activeSection === 'history' && (
        <div className="bg-base-800 rounded-2xl border border-base-600 overflow-hidden">
          <div className="p-4 border-b border-base-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-base-50">Ingestion History</h3>
            <button onClick={fetchIngestions} className="flex items-center gap-1.5 text-sm text-base-300 hover:text-accent-500 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
          {ingestions.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-base-400 mx-auto mb-4" />
              <p className="text-base-300">No ingestion history yet</p>
            </div>
          ) : (
            <div className="divide-y divide-base-700">
              {ingestions.map((entry) => (
                <div key={entry.id} className="p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {entry.status === 'processing' ? (
                      <Loader2 className="w-5 h-5 text-accent-400 animate-spin" />
                    ) : entry.status === 'error' ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-100 truncate">
                      {entry.title || entry.url}
                    </p>
                    <p className="text-xs text-base-400 mt-0.5">
                      {new Date(entry.created_at).toLocaleString()} · {entry.source_type}
                      {entry.updates_generated > 0 && ` · ${entry.updates_generated} update(s)`}
                    </p>
                    {entry.error && (
                      <p className="text-xs text-red-500 mt-1">{entry.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
