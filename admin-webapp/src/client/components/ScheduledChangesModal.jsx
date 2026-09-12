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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Scheduled Flag Releases & Changes</h2>
              <p className="text-xs text-slate-400">Time-based automated flag state and rule transitions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Active Schedule Queue
            </span>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Release</span>
            </button>
          </div>

          {/* Form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              {error && (
                <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Flag</label>
                  <select
                    value={flagKey}
                    onChange={(e) => setFlagKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white font-mono"
                  >
                    {flags.map((f) => (
                      <option key={f.key} value={f.key}>{f.key}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Target State</label>
                  <select
                    value={targetState}
                    onChange={(e) => setTargetState(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="ENABLED">🟢 ENABLED</option>
                    <option value="DISABLED">🔴 DISABLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Scheduled Release Time (Local)</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Author / Sign-off</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason for Scheduled Change</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Marketing Campaign Launch"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          )}

          {/* List */}
          {loading && (
            <div className="py-8 text-center text-slate-500 animate-pulse">Loading schedule queue...</div>
          )}

          {!loading && scheduledList.length === 0 && (
            <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No scheduled releases currently queued.
            </div>
          )}

          {scheduledList.map((item) => (
            <div key={item.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-white">{item.flag_key}</span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                    item.status === 'APPLIED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : item.status === 'CANCELLED'
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">{item.reason}</div>
                <div className="text-[10px] text-slate-500 flex items-center space-x-2 mt-1">
                  <span>Scheduled for: {new Date(item.scheduled_at).toLocaleString()}</span>
                  <span>&bull; Author: {item.author}</span>
                </div>
              </div>

              {item.status === 'PENDING' && (
                <button
                  onClick={() => handleCancel(item.id)}
                  className="p-1.5 rounded text-slate-400 hover:text-rose-400 bg-slate-800"
                  title="Cancel scheduled release"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
