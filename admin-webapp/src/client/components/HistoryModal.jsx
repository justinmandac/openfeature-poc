import React, { useEffect, useState } from 'react';
import { History, X, User, Clock, ArrowRight, CheckCircle2, FileJson } from 'lucide-react';
import axios from 'axios';

export default function HistoryModal({ flagKey, apiUrl, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await axios.get(`${apiUrl}/api/v1/admin/flags/${encodeURIComponent(flagKey)}/history?limit=5`);
        setHistory(res.data.history || []);
        if (res.data.history && res.data.history.length > 0) {
          setSelectedVersion(res.data.history[0]);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [flagKey, apiUrl]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 text-zinc-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Revision History & Audit Log</h2>
              <p className="text-xs text-zinc-400 font-mono">{flagKey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Timeline List */}
          <div className="w-full md:w-80 border-r border-zinc-800 p-4 overflow-y-auto space-y-3 bg-zinc-950/60">
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2">
              Recent Revisions
            </div>

            {loading && (
              <div className="text-xs text-zinc-500 p-4 text-center font-mono animate-pulse">
                Loading revisions...
              </div>
            )}

            {error && (
              <div className="text-xs text-rose-400 p-3 rounded bg-rose-950/40 border border-rose-800/60">
                {error}
              </div>
            )}

            {!loading && history.length === 0 && (
              <div className="text-xs text-zinc-500 p-4 text-center">
                No history entries found.
              </div>
            )}

            {history.map((rev) => (
              <div
                key={rev.id}
                onClick={() => setSelectedVersion(rev)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedVersion?.id === rev.id
                    ? 'bg-zinc-800 border-zinc-600 text-white shadow-xs'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-200 border border-zinc-800">
                    v{rev.version}
                  </span>
                  <span className="text-[11px] text-zinc-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 inline mr-1 text-zinc-500" />
                    {rev.age}
                  </span>
                </div>
                <div className="text-xs font-medium text-zinc-200 truncate">
                  {rev.change_reason || 'Configuration updated'}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1 flex items-center space-x-1">
                  <User className="w-3 h-3 text-zinc-500" />
                  <span>{rev.author}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Snapshot & Diff Inspector */}
          <div className="flex-1 p-5 overflow-y-auto bg-zinc-900">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-xs font-semibold text-white flex items-center space-x-2">
                      <span>Snapshot & Changes in Version {selectedVersion.version}</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Recorded on {new Date(selectedVersion.created_at).toLocaleString()} by <strong className="text-zinc-200">{selectedVersion.author}</strong>
                    </p>
                  </div>
                  <div className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200">
                    {selectedVersion.diff?.action || 'UPDATED'}
                  </div>
                </div>

                {/* Diff Viewer */}
                <div>
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Detailed Change Diff</span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-xs overflow-x-auto">
                    <pre className="text-zinc-200 leading-relaxed">
                      {JSON.stringify(selectedVersion.diff, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Full Snapshot */}
                <div>
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <FileJson className="w-3.5 h-3.5 text-blue-400" />
                    <span>Complete Flag State at v{selectedVersion.version}</span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-xs overflow-x-auto max-h-60">
                    <pre className="text-zinc-300 leading-relaxed">
                      {JSON.stringify(selectedVersion.snapshot, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
                Select a revision to view details and diff.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-750 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
