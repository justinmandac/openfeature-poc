import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  History,
  Edit2,
  Trash2,
  Radio,
  Layers,
  Sparkles,
  ShieldAlert,
  Clock,
  Calendar,
  Tag,
  CheckCircle2,
  RefreshCw,
  Link2,
  Sliders,
  Users,
  BarChart3,
  Archive,
  GraduationCap
} from 'lucide-react';
import axios from 'axios';
import SegmentsManager from './SegmentsManager';
import ScheduledChangesModal from './ScheduledChangesModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import HygieneReport from './HygieneReport';

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
  const [activeTab, setActiveTab] = useState('FLAGS'); // FLAGS, SEGMENTS, SCHEDULED, HYGIENE, ANALYTICS
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedLifecycle, setSelectedLifecycle] = useState('ALL');
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [togglingKey, setTogglingKey] = useState(null);

  // Filter flags
  const filteredFlags = flags.filter((f) => {
    const matchesSearch =
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

    const matchesTag = selectedTag === 'ALL' || (f.app_tags && f.app_tags.includes(selectedTag));
    const matchesType = selectedType === 'ALL' || f.type === selectedType;
    const matchesLifecycle = selectedLifecycle === 'ALL' || f.lifecycle_state === selectedLifecycle;

    return matchesSearch && matchesTag && matchesType && matchesLifecycle;
  });

  const handleToggleState = async (flag) => {
    if (flag.lifecycle_state === 'GRADUATED') {
      alert(`Flag "${flag.key}" is GRADUATED (frozen permanent feature).`);
      return;
    }

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

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('FLAGS')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'FLAGS' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Flags & Configs ({flags.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SEGMENTS')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'SEGMENTS' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Audience Segments</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULED')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'SCHEDULED' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Scheduled Releases</span>
          </button>

          <button
            onClick={() => setActiveTab('HYGIENE')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'HYGIENE' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Stale Flags & Hygiene</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'ANALYTICS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Evaluation Analytics</span>
          </button>
        </div>

        {/* Real-time Indicator & Schedule Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300 font-medium text-[11px]">
              {sseConnected ? 'SSE Live Sync' : 'Connecting...'}
            </span>
          </div>

          <button
            onClick={() => setShowScheduledModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-medium border border-slate-700"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Schedule Release</span>
          </button>

          <button
            onClick={onOpenCreate}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-lg shadow-teal-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Flag</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Flag Inventory */}
      {activeTab === 'FLAGS' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search flags or descriptions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Lifecycle Filter */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <span className="text-slate-500 px-1.5 text-[11px]">Lifecycle:</span>
                {['ALL', 'ENABLED', 'DISABLED', 'DRAFT', 'GRADUATED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedLifecycle(st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      selectedLifecycle === st ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Tag Filter */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <span className="text-slate-500 px-1.5 text-[11px]">Scope:</span>
                {['ALL', 'webapp', 'bff', 'api'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      selectedTag === t ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              title="Refresh list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-4">Flag Key & Dependencies</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Lifecycle State</th>
                    <th className="py-3 px-4">Scope</th>
                    <th className="py-3 px-4">Created & Age</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredFlags.map((flag) => {
                    const isEnabled = flag.state === 'ENABLED' || flag.lifecycle_state === 'ENABLED';
                    const hasPrereqs = flag.prerequisites && flag.prerequisites.length > 0;
                    const hasRollout = flag.rules && flag.rules.some(r => r.rollout);

                    return (
                      <tr key={flag.key} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-white text-xs">{flag.key}</span>
                            {hasPrereqs && (
                              <span
                                className="p-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300"
                                title={`Has prerequisite flags: ${flag.prerequisites.map(p => `${p.flagKey}==${p.variant}`).join(', ')}`}
                              >
                                <Link2 className="w-3 h-3" />
                              </span>
                            )}
                            {hasRollout && (
                              <span
                                className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-800 text-amber-300 text-[9px] font-mono"
                                title="Contains percentage-based gradual rollout rule"
                              >
                                % ROLLOUT
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1 max-w-sm">
                            {flag.description}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            flag.type === 'BOOLEAN'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}>
                            {flag.type}
                          </span>
                        </td>

                        {/* Lifecycle state switch */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleState(flag)}
                            disabled={togglingKey === flag.key || flag.lifecycle_state === 'GRADUATED'}
                            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono transition-all ${
                              flag.lifecycle_state === 'GRADUATED'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800 cursor-not-allowed'
                                : flag.lifecycle_state === 'DRAFT'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : isEnabled
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                                : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              flag.lifecycle_state === 'GRADUATED' ? 'bg-blue-400' : isEnabled ? 'bg-emerald-400' : 'bg-rose-400'
                            }`} />
                            <span>{flag.lifecycle_state}</span>
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(flag.app_tags || []).map((t) => (
                              <span key={t} className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-300 font-medium flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{flag.age}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-teal-300">
                            v{flag.version || 1}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onOpenHistory(flag.key)}
                              className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-teal-300"
                              title="Audit History & Diff"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenEdit(flag)}
                              className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                              title="Edit Flag"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(flag)}
                              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-rose-400"
                              title="Delete Flag"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Reusable Audience Segments */}
      {activeTab === 'SEGMENTS' && <SegmentsManager apiUrl={apiUrl} />}

      {/* Tab 3: Scheduled Releases View */}
      {activeTab === 'SCHEDULED' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <Clock className="w-8 h-8 text-teal-400 mx-auto" />
          <h4 className="font-bold text-white text-sm">Scheduled Release Management</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Schedule automatic future feature flag state changes, rule rollouts, or variant swaps for planned marketing launches.
          </p>
          <button
            onClick={() => setShowScheduledModal(true)}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs inline-flex items-center space-x-1.5 shadow-lg shadow-teal-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Open Scheduled Releases Queue</span>
          </button>
        </div>
      )}

      {/* Tab 4: Stale Flags & Hygiene */}
      {activeTab === 'HYGIENE' && <HygieneReport apiUrl={apiUrl} onOpenEdit={onOpenEdit} />}

      {/* Tab 5: Evaluation Analytics */}
      {activeTab === 'ANALYTICS' && <AnalyticsDashboard apiUrl={apiUrl} />}

      {/* Scheduled Changes Modal */}
      {showScheduledModal && (
        <ScheduledChangesModal
          apiUrl={apiUrl}
          flags={flags}
          onClose={() => setShowScheduledModal(false)}
        />
      )}
    </div>
  );
}
