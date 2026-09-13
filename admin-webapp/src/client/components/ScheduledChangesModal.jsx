import React, { useState, useEffect } from 'react';
import { Clock, Plus, X, Calendar, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function ScheduledChangesModal({ apiUrl, flags, onClose }) {
  const [scheduledList, setScheduledList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [flagKey, setFlagKey] = useState(flags[0]?.key || '');
  const [targetState, setTargetState] = useState('ENABLED');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    return d.toISOString().slice(0, 16);
  });
  const [reason, setReason] = useState('Scheduled automated release');
  const [author, setAuthor] = useState('release-manager');
  const [error, setError] = useState(null);

  const fetchScheduled = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/api/v1/admin/scheduled-changes`);
      setScheduledList(res.data.scheduledChanges || []);
    } catch (err) {
      console.error('Failed to load scheduled changes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, [apiUrl]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post(`${apiUrl}/api/v1/admin/scheduled-changes`, {
        flag_key: flagKey,
        scheduled_at: new Date(scheduledAt).toISOString(),
        changes: {
          state: targetState,
          lifecycle_state: targetState
        },
        author,
        reason
      });
      setIsCreating(false);
      fetchScheduled();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleCancel = async (id) => {
    try {
      await axios.delete(`${apiUrl}/api/v1/admin/scheduled-changes/${id}`);
      fetchScheduled();
    } catch (err) {
      alert(`Cancel failed: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 text-zinc-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Scheduled Flag Releases & Queue</h2>
              <p className="text-xs text-zinc-400">Time-based automated flag state and rule transitions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">
              Active Schedule Queue
            </span>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-950" />
              <span>Schedule Release</span>
            </button>
          </div>

          {/* Form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              {error && (
                <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 text-[10px] uppercase font-medium">Target Flag</label>
                  <select
                    value={flagKey}
                    onChange={(e) => setFlagKey(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-zinc-500"
                  >
                    {flags.map((f) => (
                      <option key={f.key} value={f.key}>{f.key}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 text-[10px] uppercase font-medium">Target State</label>
                  <select
                    value={targetState}
                    onChange={(e) => setTargetState(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  >
                    <option value="ENABLED">ENABLED</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 text-[10px] uppercase font-medium">Release Time (Local)</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 text-[10px] uppercase font-medium">Author / Sign-off</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 text-[10px] uppercase font-medium">Reason for Scheduled Change</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Scheduled release window"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-750 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          )}

          {/* List */}
          {loading && (
            <div className="py-8 text-center text-zinc-500 font-mono animate-pulse">Loading schedule queue...</div>
          )}

          {!loading && scheduledList.length === 0 && (
            <div className="py-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              No scheduled releases currently queued.
            </div>
          )}

          {scheduledList.map((item) => (
            <div key={item.id} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-semibold text-white">{item.flag_key}</span>
                  <span
                    className={`px-2 py-0.2 rounded text-[10px] font-mono font-semibold ${
                      item.status === 'APPLIED'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80'
                        : item.status === 'CANCELLED'
                        ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        : 'bg-amber-950/60 text-amber-300 border border-amber-800/80'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="text-zinc-400 text-[11px] mt-0.5">{item.reason}</div>
                <div className="text-[10px] text-zinc-500 flex items-center space-x-2 mt-1 font-mono">
                  <span>Scheduled: {new Date(item.scheduled_at).toLocaleString()}</span>
                  <span>&bull; Author: {item.author}</span>
                </div>
              </div>

              {item.status === 'PENDING' && (
                <button
                  onClick={() => handleCancel(item.id)}
                  className="p-1.5 rounded text-zinc-400 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
                  title="Cancel scheduled release"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
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
