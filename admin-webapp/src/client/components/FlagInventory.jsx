import React, { useState } from 'react';
import {
  Search,
  Filter,
  History,
  Edit2,
  Trash2,
  Layers,
  Clock,
  Tag,
  Link2,
  Sliders,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Lock,
  RefreshCw,
  X
} from 'lucide-react';

export default function FlagInventory({
  flags = [],
  loading = false,
  selectedFlagKey,
  onSelectFlag,
  onToggleState,
  onDelete,
  onOpenEdit,
  onOpenHistory,
  togglingKey
}) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedLifecycle, setSelectedLifecycle] = useState('ALL');

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

  const clearFilters = () => {
    setSearch('');
    setSelectedTag('ALL');
    setSelectedType('ALL');
    setSelectedLifecycle('ALL');
  };

  const isFiltered = search !== '' || selectedTag !== 'ALL' || selectedType !== 'ALL' || selectedLifecycle !== 'ALL';

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#070b14]">
      {/* Top Filter Controls Deck */}
      <div className="p-3.5 border-b border-[#16223b] bg-[#090f1c] shrink-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by flag key, namespace, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0c1322] border border-[#1b2a47] rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Filter Counts & Reset */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              Showing <strong className="text-teal-400">{filteredFlags.length}</strong> of{' '}
              <strong className="text-slate-300">{flags.length}</strong> flags
            </span>

            {isFiltered && (
              <button
                onClick={clearFilters}
                className="text-slate-400 hover:text-white text-[11px] underline flex items-center space-x-1"
              >
                <span>Reset filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Lifecycle Status Chips */}
          <div className="flex items-center space-x-1 bg-[#0c1322] p-1 rounded-lg border border-[#1b2a47]">
            <span className="text-slate-500 px-1 text-[10px] uppercase font-semibold">State:</span>
            {['ALL', 'ENABLED', 'DISABLED', 'DRAFT', 'GRADUATED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedLifecycle(st)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                  selectedLifecycle === st
                    ? 'bg-teal-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Scope Chips */}
          <div className="flex items-center space-x-1 bg-[#0c1322] p-1 rounded-lg border border-[#1b2a47]">
            <span className="text-slate-500 px-1 text-[10px] uppercase font-semibold">Scope:</span>
            {['ALL', 'webapp', 'bff', 'api'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                  selectedTag === t
                    ? 'bg-teal-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Type Chips */}
          <div className="flex items-center space-x-1 bg-[#0c1322] p-1 rounded-lg border border-[#1b2a47]">
            <span className="text-slate-500 px-1 text-[10px] uppercase font-semibold">Type:</span>
            {['ALL', 'BOOLEAN', 'OBJECT', 'STRING', 'NUMBER'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                  selectedType === type
                    ? 'bg-teal-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dense Table Canvas */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <table className="w-full text-left border-collapse text-xs select-text">
          <thead className="sticky top-0 bg-[#090f1c] z-10 border-b border-[#16223b] shadow-sm">
            <tr className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Flag Key & Hierarchy</th>
              <th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4">Lifecycle State</th>
              <th className="py-2.5 px-4">Gradual Rollout</th>
              <th className="py-2.5 px-4">Scopes</th>
              <th className="py-2.5 px-4">Version & Age</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#16223b]/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
                    <span className="font-mono text-xs">Loading flag inventory...</span>
                  </div>
                </td>
              </tr>
            ) : filteredFlags.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center space-y-2">
                    <Layers className="w-8 h-8 text-slate-600" />
                    <span className="font-semibold text-slate-300">No matching feature flags found</span>
                    <span className="text-xs text-slate-500">Try adjusting your filters or search terms.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredFlags.map((flag, idx) => {
                const isSelected = selectedFlagKey === flag.key;
                const isEnabled = flag.state === 'ENABLED' || flag.lifecycle_state === 'ENABLED';
                const hasPrereqs = flag.prerequisites && flag.prerequisites.length > 0;
                const rolloutRule = (flag.rules || []).find((r) => r.rollout);

                // Split namespace for visual clarity
                const parts = flag.key.split('.');
                const namespace = parts.length > 1 ? parts[0] : null;
                const nameWithoutNamespace = parts.length > 1 ? parts.slice(1).join('.') : flag.key;

                return (
                  <tr
                    key={flag.key}
                    onClick={() => onSelectFlag(flag.key)}
                    className={`cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#111a2e] border-l-4 border-l-teal-400 text-white shadow-inner'
                        : 'hover:bg-[#0c1322] text-slate-300 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-500">
                      {idx + 1}
                    </td>

                    {/* Flag Key & Badges */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {namespace && (
                          <span className="px-1.5 py-0.2 rounded bg-[#16223b] text-slate-400 font-mono text-[10px] border border-[#1b2a47]">
                            {namespace}
                          </span>
                        )}
                        <span className="font-mono font-bold text-white text-xs tracking-tight">
                          {nameWithoutNamespace}
                        </span>

                        {hasPrereqs && (
                          <span
                            className="flex items-center space-x-1 px-1.5 py-0.2 rounded bg-blue-950 border border-blue-800 text-blue-300 font-mono text-[9px]"
                            title={`Prerequisites: ${flag.prerequisites.map((p) => `${p.flagKey}==${p.variant}`).join(', ')}`}
                          >
                            <Link2 className="w-2.5 h-2.5" />
                            <span>{flag.prerequisites.length} Dep</span>
                          </span>
                        )}
                      </div>

                      <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1 max-w-md">
                        {flag.description || 'No description provided.'}
                      </p>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          flag.type === 'BOOLEAN'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}
                      >
                        {flag.type}
                      </span>
                    </td>

                    {/* Lifecycle Toggle */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleState(flag)}
                        disabled={togglingKey === flag.key || flag.lifecycle_state === 'GRADUATED'}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono transition-all ${
                          flag.lifecycle_state === 'GRADUATED'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800 opacity-70 cursor-not-allowed'
                            : flag.lifecycle_state === 'DRAFT'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : isEnabled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                            : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            flag.lifecycle_state === 'GRADUATED'
                              ? 'bg-blue-400'
                              : isEnabled
                              ? 'bg-emerald-400'
                              : 'bg-rose-400'
                          }`}
                        />
                        <span>{flag.lifecycle_state || flag.state}</span>
                      </button>
                    </td>

                    {/* Gradual Rollout Bar */}
                    <td className="py-3 px-4">
                      {rolloutRule ? (
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-[10px] font-mono text-amber-300">
                            <span>Canary</span>
                            <span>{rolloutRule.rollout.percentage}%</span>
                          </div>
                          <div className="w-full bg-[#070b14] h-1.5 rounded-full overflow-hidden border border-[#16223b]">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-teal-400"
                              style={{ width: `${rolloutRule.rollout.percentage}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[10px]">100% Direct</span>
                      )}
                    </td>

                    {/* Scopes */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(flag.app_tags || []).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.2 rounded bg-[#0c1322] border border-[#1b2a47] text-slate-300 font-mono text-[10px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Version & Age */}
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-[#16223b] text-teal-300 font-bold">
                          v{flag.version || 1}
                        </span>
                        <span>{flag.age || 'Recent'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onSelectFlag(flag.key)}
                          className={`p-1.5 rounded transition-colors ${
                            isSelected ? 'bg-teal-600 text-white' : 'bg-[#0c1322] hover:bg-[#16233d] text-slate-300'
                          }`}
                          title="Open Context Inspector"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenHistory(flag.key)}
                          className="p-1.5 rounded bg-[#0c1322] hover:bg-[#16233d] text-slate-300 hover:text-teal-300"
                          title="Revision History & Diff"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenEdit(flag)}
                          className="p-1.5 rounded bg-[#0c1322] hover:bg-[#16233d] text-slate-300 hover:text-white"
                          title="Edit Flag"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDelete(flag)}
                          className="p-1.5 rounded bg-[#0c1322] hover:bg-[#16233d] text-slate-400 hover:text-rose-400"
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

      {/* Sticky Table Footer */}
      <div className="h-9 px-4 border-t border-[#16223b] bg-[#090f1c] flex items-center justify-between text-[11px] text-slate-400 shrink-0 font-mono">
        <div>
          <span>Total Records: <strong className="text-white">{flags.length}</strong></span>
        </div>
        <div className="flex items-center space-x-3">
          <span>Click any row to populate the Right Context Inspector</span>
        </div>
      </div>
    </div>
  );
}
