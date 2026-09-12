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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Revision History & Audit Log</h2>
              <p className="text-xs text-slate-400 font-mono">{flagKey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Timeline List */}
          <div className="w-full md:w-80 border-r border-slate-800 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
              Last 5 Revisions
            </div>

            {loading && (
              <div className="text-xs text-slate-500 p-4 text-center animate-pulse">
                Loading revisions...
              </div>
            )}

            {error && (
              <div className="text-xs text-rose-400 p-3 rounded bg-rose-950/40 border border-rose-800/40">
                {error}
              </div>
            )}

            {!loading && history.length === 0 && (
              <div className="text-xs text-slate-500 p-4 text-center">
                No history entries found.
              </div>
            )}

            {history.map((rev) => (
              <div
                key={rev.id}
                onClick={() => setSelectedVersion(rev)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedVersion?.id === rev.id
                    ? 'bg-teal-950/50 border-teal-500/50 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300">
                    v{rev.version}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {rev.age}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-200 truncate">
                  {rev.change_reason || 'Configuration updated'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                  <User className="w-3 h-3 text-slate-500" />
                  <span>{rev.author}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Snapshot & Diff Inspector */}
          <div className="flex-1 p-5 overflow-y-auto bg-slate-900">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                      <span>Snapshot & Changes in Version {selectedVersion.version}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Recorded on {new Date(selectedVersion.created_at).toLocaleString()} by <strong className="text-slate-300">{selectedVersion.author}</strong>
                    </p>
                  </div>
                  <div className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {selectedVersion.diff?.action || 'UPDATED'}
                  </div>
                </div>

                {/* Diff Viewer */}
                <div>
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                    <span>Detailed Change Diff</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto">
                    <pre className="text-teal-300">
                      {JSON.stringify(selectedVersion.diff, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Full Snapshot */}
                <div>
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <FileJson className="w-3.5 h-3.5 text-blue-400" />
                    <span>Complete Flag State at v{selectedVersion.version}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto max-h-60">
                    <pre className="text-slate-300">
                      {JSON.stringify(selectedVersion.snapshot, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Select a revision to view details and diff.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
