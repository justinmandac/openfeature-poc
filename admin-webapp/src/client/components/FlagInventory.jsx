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
  X,
  Building2,
  Tv
} from 'lucide-react';

const BU_STYLES = {
  'bu-retail': { label: 'Retail', badge: 'bg-blue-950/70 border-blue-800 text-blue-300' },
  'bu-wealth': { label: 'Wealth', badge: 'bg-emerald-950/70 border-emerald-800 text-emerald-300' },
  'bu-cards': { label: 'Cards', badge: 'bg-purple-950/70 border-purple-800 text-purple-300' },
  'bu-platform': { label: 'Platform', badge: 'bg-zinc-800 border-zinc-700 text-zinc-300' }
};

export default function FlagInventory({
  flags = [],
  loading = false,
  selectedFlagKey,
  onSelectFlag,
  onToggleState,
  onDelete,
  onOpenEdit,
  onOpenHistory,
  togglingKey,
  businessUnits = [],
  selectedBu = '',
  onSelectBu
}) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedLifecycle, setSelectedLifecycle] = useState('ALL');
  const [selectedTraffic, setSelectedTraffic] = useState('ALL');

  // Filter flags
  const filteredFlags = flags.filter((f) => {
    const matchesSearch =
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

    const matchesTag = selectedTag === 'ALL' || (f.app_tags && f.app_tags.includes(selectedTag));
    const matchesType = selectedType === 'ALL' || f.type === selectedType;
    const matchesLifecycle = selectedLifecycle === 'ALL' || f.lifecycle_state === selectedLifecycle;

    const isDead = (f.total_evaluations === 0 || f.total_evaluations === null || !f.last_evaluated_at);
    const matchesTraffic =
      selectedTraffic === 'ALL' ||
      (selectedTraffic === 'DEAD' && isDead) ||
      (selectedTraffic === 'ACTIVE' && !isDead);

    return matchesSearch && matchesTag && matchesType && matchesLifecycle && matchesTraffic;
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedTag('ALL');
    setSelectedType('ALL');
    setSelectedLifecycle('ALL');
    setSelectedTraffic('ALL');
    onSelectBu?.('');
  };

  const isFiltered =
    search !== '' ||
    selectedTag !== 'ALL' ||
    selectedType !== 'ALL' ||
    selectedLifecycle !== 'ALL' ||
    selectedTraffic !== 'ALL' ||
    selectedBu !== '';

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-zinc-950 text-zinc-200">
      {/* Top Filter Controls Deck */}
      <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by flag key, namespace, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Filter Counts & Reset */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-400 font-mono text-[11px]">
              Showing <strong className="text-zinc-100">{filteredFlags.length}</strong> of{' '}
              <strong className="text-zinc-400">{flags.length}</strong> flags
            </span>

            {isFiltered && (
              <button
                onClick={clearFilters}
                className="text-zinc-400 hover:text-white text-[11px] underline flex items-center space-x-1"
              >
                <span>Reset filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Tenant / BU Filter Chips */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-md border border-zinc-800">
            <span className="text-zinc-500 px-1 text-[10px] uppercase font-semibold flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-zinc-400" />
              <span>Tenant:</span>
            </span>
            <button
              onClick={() => onSelectBu?.('')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                selectedBu === ''
                  ? 'bg-zinc-200 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ALL
            </button>
            {businessUnits.map((bu) => {
              const shortName = bu.name
                .replace(' Banking', '')
                .replace(' & Asset Management', '')
                .replace(' & Merchant Services', '')
                .replace(' Operations', '');
              return (
                <button
                  key={bu.id}
                  onClick={() => onSelectBu?.(bu.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    selectedBu === bu.id
                      ? 'bg-zinc-200 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {shortName}
                </button>
              );
            })}
          </div>

          {/* Lifecycle Status Chips */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-md border border-zinc-800">
            <span className="text-zinc-500 px-1 text-[10px] uppercase font-semibold">State:</span>
            {['ALL', 'ENABLED', 'DISABLED', 'DRAFT', 'GRADUATED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedLifecycle(st)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  selectedLifecycle === st
                    ? 'bg-zinc-200 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Scope Chips */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-md border border-zinc-800">
            <span className="text-zinc-500 px-1 text-[10px] uppercase font-semibold">Scope:</span>
            {['ALL', 'webapp', 'bff', 'api'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  selectedTag === t
                    ? 'bg-zinc-200 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Type Chips */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-md border border-zinc-800">
            <span className="text-zinc-500 px-1 text-[10px] uppercase font-semibold">Type:</span>
            {['ALL', 'BOOLEAN', 'OBJECT', 'STRING', 'NUMBER'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  selectedType === type
                    ? 'bg-zinc-200 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Traffic / Dead Flags Chip */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-md border border-zinc-800">
            <span className="text-zinc-500 px-1 text-[10px] uppercase font-semibold">Traffic:</span>
            {[
              { id: 'ALL', label: 'ALL' },
              { id: 'ACTIVE', label: 'ACTIVE' },
              { id: 'DEAD', label: 'DEAD / ZERO' }
            ].map((tr) => (
              <button
                key={tr.id}
                onClick={() => setSelectedTraffic(tr.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  selectedTraffic === tr.id
                    ? tr.id === 'DEAD'
                      ? 'bg-rose-900 text-rose-100 font-bold'
                      : 'bg-zinc-200 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dense Table Canvas */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <table className="w-full text-left border-collapse text-xs select-text">
          <thead className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-800">
            <tr className="text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Flag Key & Namespace</th>
              <th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4">Lifecycle State</th>
              <th className="py-2.5 px-4">Evaluations</th>
              <th className="py-2.5 px-4">Rollout Strategy</th>
              <th className="py-2.5 px-4">Channels & Scopes</th>
              <th className="py-2.5 px-4">Version</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-zinc-500">
                  <div className="flex flex-col items-center space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
                    <span className="font-mono text-xs">Loading flag inventory...</span>
                  </div>
                </td>
              </tr>
            ) : filteredFlags.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-zinc-500">
                  <div className="flex flex-col items-center space-y-2">
                    <Layers className="w-7 h-7 text-zinc-600" />
                    <span className="font-semibold text-zinc-300">No matching feature flags found</span>
                    <span className="text-xs text-zinc-500">Adjust your filter criteria or search query.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredFlags.map((flag, idx) => {
                const isSelected = selectedFlagKey === flag.key;
                const isEnabled = flag.state === 'ENABLED' || flag.lifecycle_state === 'ENABLED';
                const hasPrereqs = flag.prerequisites && flag.prerequisites.length > 0;
                const rolloutRule = (flag.rules || []).find((r) => r.rollout);

                const buInfo = BU_STYLES[flag.business_unit_id] || {
                  label: (flag.business_unit_id || 'Platform').replace('bu-', ''),
                  badge: 'bg-zinc-800 border-zinc-700 text-zinc-300'
                };

                // Split namespace for visual clarity
                const parts = flag.key.split('.');
                const namespace = parts.length > 1 ? parts[0] : null;
                const nameWithoutNamespace = parts.length > 1 ? parts.slice(1).join('.') : flag.key;

                return (
                  <tr
                    key={flag.key}
                    onClick={() => onSelectFlag(flag.key)}
                    className={`cursor-pointer transition-colors duration-100 ${
                      isSelected
                        ? 'bg-zinc-900 border-l-2 border-l-zinc-200 text-white'
                        : 'hover:bg-zinc-900/60 text-zinc-300 border-l-2 border-l-transparent'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-center font-mono text-[10px] text-zinc-500">
                      {idx + 1}
                    </td>

                    {/* Flag Key & Badges */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        {/* Tenant BU Chip */}
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold border ${buInfo.badge}`}
                          title={`Tenant: ${flag.business_unit_id}`}
                        >
                          {buInfo.label}
                        </span>

                        {flag.is_global && (
                          <span
                            className="px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800 text-[9px] font-mono font-semibold"
                            title="Global Enterprise Flag"
                          >
                            GLOBAL
                          </span>
                        )}

                        {namespace && (
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700">
                            {namespace}
                          </span>
                        )}
                        <span className="font-mono font-semibold text-zinc-100 text-xs tracking-tight">
                          {nameWithoutNamespace}
                        </span>

                        {hasPrereqs && (
                          <span
                            className="flex items-center space-x-1 px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-blue-300 font-mono text-[9px]"
                            title={`Prerequisites: ${flag.prerequisites.map((p) => `${p.flagKey}==${p.variant}`).join(', ')}`}
                          >
                            <Link2 className="w-2.5 h-2.5 text-blue-400" />
                            <span>{flag.prerequisites.length} Dep</span>
                          </span>
                        )}
                      </div>

                      <p className="text-zinc-400 text-[11px] mt-0.5 line-clamp-1 max-w-md">
                        {flag.description || 'No description provided.'}
                      </p>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          flag.type === 'BOOLEAN'
                            ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                            : 'bg-zinc-800 text-purple-300 border border-zinc-700'
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
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono transition-colors ${
                          flag.lifecycle_state === 'GRADUATED'
                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 opacity-70 cursor-not-allowed'
                            : flag.lifecycle_state === 'DRAFT'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/80'
                            : isEnabled
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-750'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            flag.lifecycle_state === 'GRADUATED'
                              ? 'bg-purple-400'
                              : isEnabled
                              ? 'bg-emerald-400'
                              : 'bg-zinc-500'
                          }`}
                        />
                        <span>{flag.lifecycle_state || flag.state}</span>
                      </button>
                    </td>

                    {/* Evaluations & Caller Activity */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold border ${
                              (flag.total_evaluations || 0) > 0
                                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                                : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                            }`}
                          >
                            {(flag.total_evaluations || 0).toLocaleString()} evals
                          </span>
                          {(flag.total_evaluations || 0) === 0 && (
                            <span className="px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[9px] font-mono font-semibold">
                              DEAD
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500">
                          {flag.last_evaluated_at
                            ? `Last: ${new Date(flag.last_evaluated_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                            : 'Never evaluated'}
                        </span>
                      </div>
                    </td>

                    {/* Gradual Rollout Bar */}
                    <td className="py-3 px-4">
                      {rolloutRule ? (
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                            <span>Canary</span>
                            <span>{rolloutRule.rollout.percentage}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${rolloutRule.rollout.percentage}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-500 font-mono text-[10px]">100% Direct</span>
                      )}
                    </td>

                    {/* Channels & Scopes */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {/* Delivery Channels */}
                        <div className="flex flex-wrap gap-1">
                          {(flag.shared_channels || ['web']).map((ch) => (
                            <span
                              key={ch}
                              className="px-1.5 py-0.2 rounded bg-sky-950/60 border border-sky-800/80 text-sky-300 font-mono text-[9px]"
                              title={`Delivery Channel: ${ch}`}
                            >
                              {ch}
                            </span>
                          ))}
                        </div>

                        {/* App Tags / Scopes */}
                        <div className="flex flex-wrap gap-1">
                          {(flag.app_tags || []).map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[9px]"
                              title={`Service Scope: ${t}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Version & Age */}
                    <td className="py-3 px-4 font-mono text-[10px] text-zinc-400">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-zinc-850 text-zinc-200 font-semibold border border-zinc-750">
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
                            isSelected ? 'bg-zinc-700 text-white' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                          }`}
                          title="Open Context Inspector"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenHistory(flag.key)}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="Revision History & Diff"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenEdit(flag)}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="Edit Flag"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDelete(flag)}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-colors"
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
      <div className="h-9 px-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-400 shrink-0 font-mono">
        <div>
          <span>Total Records: <strong className="text-zinc-200">{flags.length}</strong></span>
        </div>
        <div className="flex items-center space-x-3 text-zinc-500">
          <span>Select any row to view details in the Inspector</span>
        </div>
      </div>
    </div>
  );
}
