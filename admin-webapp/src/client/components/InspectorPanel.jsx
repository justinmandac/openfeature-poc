import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Sparkles,
  Play,
  FileCode2,
  History,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Tag,
  Copy,
  Check,
  Edit2,
  Link2,
  Sliders,
  ExternalLink,
  ChevronRight,
  Lock,
  GitBranch,
  ShieldAlert
} from 'lucide-react';
import axios from 'axios';
import EvaluationPlayground from './EvaluationPlayground';

function formatConditionSummary(condition) {
  if (!condition || typeof condition !== 'object') return 'All contexts';
  const parts = [];
  for (const [key, val] of Object.entries(condition)) {
    if (key === 'segmentId' || key === 'segment') {
      parts.push(`Segment is "${val}"`);
    } else if (Array.isArray(val)) {
      parts.push(`${key} in [${val.join(', ')}]`);
    } else if (typeof val === 'object' && val !== null) {
      if (val.in) parts.push(`${key} in [${val.in.join(', ')}]`);
      else if (val.notIn) parts.push(`${key} not in [${val.notIn.join(', ')}]`);
      else parts.push(`${key} matches ${JSON.stringify(val)}`);
    } else {
      parts.push(`${key} == "${val}"`);
    }
  }
  return parts.length > 0 ? parts.join(' AND ') : 'All contexts';
}

export default function InspectorPanel({
  flag,
  apiUrl,
  allFlags = [],
  onClose,
  onOpenEdit,
  onOpenHistory,
  onToggleState,
  isToggling = false
}) {
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, PLAYGROUND, RULES, SCHEMA, AUDIT
  const [copiedKey, setCopiedKey] = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dependentsData, setDependentsData] = useState(null);

  // Fetch downstream dependents
  useEffect(() => {
    if (flag) {
      axios
        .get(`${apiUrl}/api/v1/admin/flags/${encodeURIComponent(flag.key)}/dependents`)
        .then((res) => setDependentsData(res.data))
        .catch((err) => console.warn('Could not fetch dependents:', err));
    }
  }, [flag, apiUrl]);

  // Copy flag key
  const handleCopyKey = () => {
    if (!flag) return;
    navigator.clipboard.writeText(flag.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Fetch quick history when AUDIT tab is clicked
  useEffect(() => {
    if (activeTab === 'AUDIT' && flag) {
      const fetchHistory = async () => {
        try {
          setHistoryLoading(true);
          const res = await axios.get(`${apiUrl}/api/v1/admin/flags/${encodeURIComponent(flag.key)}/history?limit=3`);
          setRecentHistory(res.data.history || []);
        } catch (err) {
          console.error('Failed to load quick history:', err);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab, flag, apiUrl]);

  if (!flag) {
    return (
      <aside className="w-full bg-zinc-900 border-l border-zinc-800 flex flex-col items-center justify-center p-6 text-center shrink-0 select-none text-zinc-400">
        <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 mb-3">
          <Layers className="w-5 h-5" />
        </div>
        <h4 className="font-semibold text-zinc-100 text-sm">Context Inspector</h4>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          Select any feature flag to inspect rules, test runtime evaluations, or examine dependency blast radius.
        </p>
      </aside>
    );
  }

  const isEnabled = flag.state === 'ENABLED' || flag.lifecycle_state === 'ENABLED';
  const rules = flag.rules || [];
  const prerequisites = flag.prerequisites || [];
  const hasRollout = rules.some((r) => r.rollout);

  // Calculate approximate blast radius based on rollout or rules
  const rolloutRule = rules.find((r) => r.rollout);
  const blastRadiusPercent = rolloutRule ? rolloutRule.rollout.percentage : isEnabled ? 100 : 0;

  return (
    <aside className="w-full bg-zinc-900 border-l border-zinc-800 flex flex-col justify-between shrink-0 h-full select-none z-20 text-zinc-200">
      {/* Top Inspector Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-200 border border-zinc-700">
              {flag.type}
            </span>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                flag.lifecycle_state === 'GRADUATED'
                  ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  : flag.lifecycle_state === 'DRAFT'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/80'
                  : isEnabled
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {flag.lifecycle_state || flag.state}
            </span>

            <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
              v{flag.version || 1}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onOpenEdit(flag)}
              className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
              title="Edit in Studio"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Flag Key Title */}
        <div className="flex items-center justify-between">
          <div className="font-mono font-semibold text-zinc-100 text-xs tracking-tight truncate pr-2" title={flag.key}>
            {flag.key}
          </div>
          <button
            onClick={handleCopyKey}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
            title="Copy Flag Key"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Inspector Navigation Tabs */}
        <div className="grid grid-cols-5 gap-1 bg-zinc-950 p-1 rounded-md border border-zinc-800 text-[10px] font-medium">
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'PLAYGROUND', label: 'Simulator' },
            { id: 'RULES', label: 'Rules' },
            { id: 'SCHEMA', label: 'Schema' },
            { id: 'AUDIT', label: 'Audit' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1 rounded text-center transition-colors ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tab 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-4 text-xs">
            {/* Description */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-zinc-400 text-[10px] uppercase font-semibold block">Description</span>
              <p className="text-zinc-200 text-xs leading-relaxed">
                {flag.description || 'No description provided.'}
              </p>
            </div>

            {/* Blast Radius & Risk Estimation Card */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Estimated Blast Radius</span>
                </span>
                <span className="font-mono font-semibold text-zinc-100">{blastRadiusPercent}%</span>
              </div>

              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    blastRadiusPercent > 50
                      ? 'bg-amber-500'
                      : blastRadiusPercent > 0
                      ? 'bg-blue-500'
                      : 'bg-zinc-700'
                  }`}
                  style={{ width: `${blastRadiusPercent}%` }}
                />
              </div>

              <div className="text-[10px] text-zinc-400">
                {hasRollout
                  ? `Canary Rollout active via MurmurHash3 (${rolloutRule.rollout.percentage}% sticky bucketing).`
                  : isEnabled
                  ? 'Flag is fully enabled across targeted audiences.'
                  : 'Flag is disabled (serving safe default values).'}
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Default Variant</span>
                <span className="font-mono font-semibold text-zinc-100 text-xs">{flag.default_variant}</span>
              </div>

              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Age</span>
                <span className="font-mono font-medium text-zinc-300 text-xs">{flag.age || 'Recent'}</span>
              </div>
            </div>

            {/* Application Scopes & Tags */}
            <div className="space-y-1.5">
              <span className="text-zinc-400 text-[10px] uppercase font-semibold block">Application Scopes</span>
              <div className="flex flex-wrap gap-1.5">
                {(flag.app_tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[10px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Prerequisites */}
            {prerequisites.length > 0 && (
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center space-x-1.5 text-zinc-300 text-xs font-semibold">
                  <Link2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Upstream Prerequisites ({prerequisites.length})</span>
                </div>
                <div className="space-y-1.5">
                  {prerequisites.map((p, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] flex items-center justify-between text-zinc-300"
                    >
                      <span className="truncate">{p.flagKey}</span>
                      <span className="text-blue-400 font-bold ml-2">== {p.variant}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Downstream Dependents (Agentic Impact) */}
            {dependentsData?.downstream && dependentsData.downstream.length > 0 && (
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center space-x-1.5 text-zinc-300 text-xs font-semibold">
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                  <span>Downstream Dependents ({dependentsData.downstream.length})</span>
                </div>
                <div className="space-y-1.5">
                  {dependentsData.downstream.map((d, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] flex items-center justify-between text-zinc-300"
                    >
                      <span className="truncate">{d.flagKey}</span>
                      <span className="text-amber-400 font-medium ml-2">requires == {d.requiredVariant}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: PLAYGROUND (Evaluation Simulator) */}
        {activeTab === 'PLAYGROUND' && (
          <EvaluationPlayground flag={flag} apiUrl={apiUrl} />
        )}

        {/* Tab 3: RULES (Rule Hierarchy Tree) */}
        {activeTab === 'RULES' && (
          <div className="space-y-3 text-xs">
            <div className="text-[11px] text-zinc-400 font-medium">
              Targeting Rule Hierarchy ({rules.length} custom rules)
            </div>

            {rules.length === 0 ? (
              <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center text-zinc-400 text-xs">
                No custom targeting rules defined. Evaluations resolve to default variant "{flag.default_variant}".
              </div>
            ) : (
              rules.map((rule, idx) => (
                <div
                  key={rule.id || idx}
                  className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold text-zinc-300">
                      Rule #{idx + 1} (Priority {rule.priority || idx + 1})
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[9px] font-semibold uppercase">
                      Active
                    </span>
                  </div>

                  {/* Conditions */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-zinc-300 font-medium bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono uppercase text-blue-400 bg-blue-950/60 px-1 py-0.2 rounded border border-blue-800/80">IF</span>
                      <span className="truncate">{formatConditionSummary(rule.condition)}</span>
                    </div>
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-400">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(rule.condition, null, 2)}</pre>
                    </div>
                  </div>

                  {/* Serve Variant & Rollout */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-850 text-[11px]">
                    <span className="text-zinc-400">Serves Variant:</span>
                    <span className="font-mono font-semibold text-zinc-100">{rule.variant}</span>
                  </div>

                  {rule.rollout && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-300 font-mono">
                        <span>% Gradual Rollout</span>
                        <span>{rule.rollout.percentage}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${rule.rollout.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Default Fallback Rule */}
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] flex items-center justify-between text-zinc-400">
              <span>Default Fallback (All other users)</span>
              <span className="font-mono font-semibold text-zinc-200">{flag.default_variant}</span>
            </div>
          </div>
        )}

        {/* Tab 4: SCHEMA */}
        {activeTab === 'SCHEMA' && (
          <div className="space-y-3 text-xs">
            {flag.type === 'OBJECT' && flag.schema ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>JSON Schema Specification</span>
                  <span className="font-mono text-[10px] text-zinc-300">Draft 2020-12 / Draft 7</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-200 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(flag.schema, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center text-zinc-400 text-xs">
                {flag.type === 'OBJECT'
                  ? 'No JSON Schema attached to this OBJECT flag.'
                  : `Flags of type "${flag.type}" do not require JSON Schema validation.`}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: AUDIT */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span>Recent Revisions (Audit Trail)</span>
              <button
                onClick={() => onOpenHistory(flag.key)}
                className="text-zinc-300 hover:text-white flex items-center space-x-1"
              >
                <span>Full Audit</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Fetching revision diffs...
              </div>
            ) : recentHistory.length === 0 ? (
              <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center text-zinc-400 text-xs">
                No previous revisions recorded.
              </div>
            ) : (
              recentHistory.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-zinc-200 text-xs">
                      v{rev.version}
                    </span>
                    <span className="text-[10px] text-zinc-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-300">
                    Author: <strong className="text-white">{rev.author}</strong>
                  </div>

                  {rev.change_reason && (
                    <div className="text-[10px] text-zinc-400 italic">
                      "{rev.change_reason}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between gap-2">
        <button
          onClick={() => onToggleState(flag)}
          disabled={isToggling || flag.lifecycle_state === 'GRADUATED'}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs font-mono flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
            flag.lifecycle_state === 'GRADUATED'
              ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 opacity-60 cursor-not-allowed'
              : isEnabled
              ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700'
              : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80'
          }`}
        >
          <span>
            {flag.lifecycle_state === 'GRADUATED'
              ? 'Frozen (Graduated)'
              : isEnabled
              ? 'Disable Flag'
              : 'Enable Flag'}
          </span>
        </button>

        <button
          onClick={() => onOpenEdit(flag)}
          className="py-2 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
        >
          Edit Rules
        </button>
      </div>
    </aside>
  );
}
