import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  History,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Radio,
  Layers,
  Sparkles,
  ShieldAlert,
  Clock,
  Calendar,
  Tag,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

export default function FlagInventory({
  flags,
  loading,
  apiUrl,
  sseConnected,
  onRefresh,
  onOpenCreate,
  onOpenEdit,
  onOpenHistory
}) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [togglingKey, setTogglingKey] = useState(null);

  // Filter flags
  const filteredFlags = flags.filter((f) => {
    const matchesSearch =
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

    const matchesTag = selectedTag === 'ALL' || (f.app_tags && f.app_tags.includes(selectedTag));
    const matchesType = selectedType === 'ALL' || f.type === selectedType;

    return matchesSearch && matchesTag && matchesType;
  });

  // Handle Quick State Toggle
  const handleToggleState = async (flag) => {
    const newState = flag.state === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    try {
      setTogglingKey(flag.key);
      await axios.patch(`${apiUrl}/api/v1/admin/flags/${encodeURIComponent(flag.key)}/state`, {
        state: newState
      }, {
        headers: { 'x-author': 'admin-dashboard' }
      });
      onRefresh();
    } catch (err) {
      alert(`Failed to toggle flag state: ${err.response?.data?.error || err.message}`);
    } finally {
      setTogglingKey(null);
    }
  };

  // Handle Delete Flag
  const handleDelete = async (flag) => {
    if (!confirm(`Are you sure you want to delete flag "${flag.key}"? This will be recorded in the audit log.`)) {
      return;
    }
    try {
      await axios.delete(`${apiUrl}/api/v1/admin/flags/${encodeURIComponent(flag.key)}?author=admin-dashboard&reason=Deleted from admin UI`);
      onRefresh();
    } catch (err) {
      alert(`Failed to delete flag: ${err.response?.data?.error || err.message}`);
    }
  };

  // Summary Metrics
  const totalCount = flags.length;
  const activeCount = flags.filter(f => f.state === 'ENABLED').length;
  const booleanCount = flags.filter(f => f.type === 'BOOLEAN').length;
  const objectCount = flags.filter(f => f.type === 'OBJECT').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{totalCount}</div>
            <div className="text-xs text-slate-400 font-medium">Total Flags & Configs</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{activeCount}</div>
            <div className="text-xs text-slate-400 font-medium">Active (Enabled)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{booleanCount}</div>
            <div className="text-xs text-slate-400 font-medium">Feature Toggles</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{objectCount}</div>
            <div className="text-xs text-slate-400 font-medium">Dynamic JSON Configs</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Realtime Status, Create Button */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Search & Filter Tabs */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by flag key or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* App Tag Filter */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-500 px-2 flex items-center space-x-1">
              <Tag className="w-3 h-3" />
              <span>Scope:</span>
            </span>
            {['ALL', 'webapp', 'bff'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors ${
                  selectedTag === tag
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-500 px-2 flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span>Type:</span>
            </span>
            {['ALL', 'BOOLEAN', 'OBJECT'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  selectedType === t
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Right: SSE Status, Refresh & Create Flag Button */}
        <div className="flex items-center space-x-3">
          {/* SSE Live Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300 font-medium text-[11px]">
              {sseConnected ? 'SSE Live Stream' : 'Connecting SSE...'}
            </span>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCreate}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-lg shadow-teal-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Flag / Config</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3.5 px-4">Key & Description</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">State</th>
                <th className="py-3.5 px-4">App Scope</th>
                <th className="py-3.5 px-4">Created & Age</th>
                <th className="py-3.5 px-4">Version</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && flags.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="animate-pulse">Loading OpenFeature flags and dynamic configs...</div>
                  </td>
                </tr>
              ) : filteredFlags.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No feature flags match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredFlags.map((flag) => {
                  const isEnabled = flag.state === 'ENABLED';
                  return (
                    <tr key={flag.key} className="hover:bg-slate-800/40 transition-colors group">
                      {/* Key & Description */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white text-xs flex items-center space-x-2">
                          <span>{flag.key}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1 max-w-sm">
                          {flag.description}
                        </p>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
                          flag.type === 'BOOLEAN'
                            ? 'bg-blue-950 border border-blue-800 text-blue-300'
                            : flag.type === 'OBJECT'
                            ? 'bg-purple-950 border border-purple-800 text-purple-300'
                            : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                        }`}>
                          {flag.type}
                        </span>
                      </td>

                      {/* State Toggle Switch */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleState(flag)}
                          disabled={togglingKey === flag.key}
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            isEnabled
                              ? 'bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 hover:bg-emerald-900'
                              : 'bg-rose-950/80 border border-rose-800/80 text-rose-300 hover:bg-rose-900'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          <span>{togglingKey === flag.key ? 'Updating...' : flag.state}</span>
                        </button>
                      </td>

                      {/* App Tags */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(flag.app_tags || []).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Created & Age */}
                      <td className="py-3 px-4">
                        <div className="text-slate-300 font-medium flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{flag.age}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(flag.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Version */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-teal-300">
                          v{flag.version || 1}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* History / Audit Button */}
                          <button
                            onClick={() => onOpenHistory(flag.key)}
                            className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-teal-300 transition-colors"
                            title="View Revision History & Diff (Last 5)"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => onOpenEdit(flag)}
                            className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit Flag / Rules"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(flag)}
                            className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors"
                            title="Delete Flag"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
