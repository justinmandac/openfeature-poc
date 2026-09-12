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
      <aside className="w-96 xl:w-[420px] bg-[#0c1322] border-l border-[#16223b] flex flex-col items-center justify-center p-6 text-center shrink-0 select-none">
        <div className="w-12 h-12 rounded-xl bg-[#111a2e] border border-[#1b2a47] flex items-center justify-center text-slate-500 mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-white text-sm">Context Inspector</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Select any feature flag or dynamic config row to inspect live targeting rules, test evaluations, or review schemas.
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
    <aside className="w-96 xl:w-[420px] bg-[#0c1322] border-l border-[#16223b] flex flex-col justify-between shrink-0 h-full select-none z-20">
      {/* Top Inspector Header */}
      <div className="p-4 border-b border-[#16223b] bg-[#090f1c] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                flag.type === 'BOOLEAN'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'bg-purple-950 text-purple-300 border border-purple-800'
              }`}
            >
              {flag.type}
            </span>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                flag.lifecycle_state === 'GRADUATED'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : flag.lifecycle_state === 'DRAFT'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : isEnabled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {flag.lifecycle_state || flag.state}
            </span>

            <span className="font-mono text-[10px] text-slate-400 bg-[#16223b] px-1.5 py-0.5 rounded">
              v{flag.version || 1}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onOpenEdit(flag)}
              className="p-1.5 rounded bg-[#111a2e] hover:bg-[#16233d] text-slate-300 hover:text-white border border-[#1b2a47]"
              title="Edit in Modal"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#16233d] text-slate-400 hover:text-white"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Flag Key Title */}
        <div className="flex items-center justify-between">
          <div className="font-mono font-bold text-white text-xs tracking-tight truncate pr-2" title={flag.key}>
            {flag.key}
          </div>
          <button
            onClick={handleCopyKey}
            className="p-1 rounded text-slate-400 hover:text-teal-300"
            title="Copy Flag Key"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Inspector Navigation Tabs */}
        <div className="grid grid-cols-5 gap-1 bg-[#070b14] p-1 rounded-lg border border-[#16223b] text-[10px] font-semibold">
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
              className={`py-1 rounded text-center transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
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
            <div className="p-3 rounded-lg bg-[#111a2e] border border-[#1b2a47] space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Description</span>
              <p className="text-slate-200 text-xs leading-relaxed">
                {flag.description || 'No description provided.'}
              </p>
            </div>

            {/* Blast Radius & Risk Estimation Card */}
            <div className="p-3 rounded-lg bg-[#111a2e] border border-[#1b2a47] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Estimated Blast Radius</span>
                </span>
                <span className="font-mono font-bold text-teal-300">{blastRadiusPercent}%</span>
              </div>

              <div className="w-full bg-[#070b14] h-2 rounded-full overflow-hidden border border-[#16223b]">
                <div
                  className={`h-full transition-all duration-500 ${
                    blastRadiusPercent > 50
                      ? 'bg-amber-500'
                      : blastRadiusPercent > 0
                      ? 'bg-teal-500'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${blastRadiusPercent}%` }}
                />
              </div>

              <div className="text-[10px] text-slate-400">
                {hasRollout
                  ? `Gradual Canary Rollout active via MurmurHash3 (${rolloutRule.rollout.percentage}% sticky bucketing).`
                  : isEnabled
                  ? 'Flag is ENABLED across targeted audiences.'
                  : 'Flag is DISABLED (returning fallback default values safely).'}
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-[#111a2e] border border-[#1b2a47]">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Default Variant</span>
                <span className="font-mono font-bold text-white text-xs">{flag.default_variant}</span>
              </div>

              <div className="p-2.5 rounded bg-[#111a2e] border border-[#1b2a47]">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Age</span>
                <span className="font-mono font-bold text-slate-300 text-xs">{flag.age || 'Recent'}</span>
              </div>
            </div>

            {/* Application Scopes & Tags */}
            <div className="space-y-1.5">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Application Scopes</span>
              <div className="flex flex-wrap gap-1.5">
                {(flag.app_tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-[#16223b] border border-[#1b2a47] text-teal-300 font-mono text-[10px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Prerequisites */}
            {prerequisites.length > 0 && (
              <div className="p-3 rounded-lg bg-[#090f1c] border border-blue-900/60 space-y-2">
                <div className="flex items-center space-x-1.5 text-blue-300 text-xs font-semibold">
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Prerequisite Flags ({prerequisites.length})</span>
                </div>
                <div className="space-y-1.5">
                  {prerequisites.map((p, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded bg-[#111a2e] border border-[#1b2a47] font-mono text-[10px] flex items-center justify-between text-slate-300"
                    >
                      <span className="truncate">{p.flagKey}</span>
                      <span className="text-teal-400 font-bold ml-2">== {p.variant}</span>
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
            <div className="text-[11px] text-slate-400 font-medium">
              Targeting Rule Hierarchy ({rules.length} custom rules)
            </div>

            {rules.length === 0 ? (
              <div className="p-6 rounded-lg bg-[#111a2e] border border-[#1b2a47] text-center text-slate-400 text-xs">
                No custom targeting rules defined. All evaluations resolve to default variant "{flag.default_variant}".
              </div>
            ) : (
              rules.map((rule, idx) => (
                <div
                  key={rule.id || idx}
                  className="p-3 rounded-lg bg-[#111a2e] border border-[#1b2a47] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-teal-400">
                      Rule #{idx + 1} (Priority {rule.priority || idx + 1})
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono text-[9px] font-bold uppercase">
                      Approved
                    </span>
                  </div>

                  {/* Conditions */}
                  <div className="p-2 rounded bg-[#090f1c] border border-[#16223b] font-mono text-[11px] text-slate-300">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(rule.condition, null, 2)}</pre>
                  </div>

                  {/* Serve Variant & Rollout */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#16223b] text-[11px]">
                    <span className="text-slate-400">Serves Variant:</span>
                    <span className="font-mono font-bold text-white">{rule.variant}</span>
                  </div>

                  {rule.rollout && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-amber-300 font-mono">
                        <span>% Gradual Rollout</span>
                        <span>{rule.rollout.percentage}%</span>
                      </div>
                      <div className="w-full bg-[#070b14] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${rule.rollout.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Default Fallback Rule */}
            <div className="p-2.5 rounded-lg bg-[#090f1c] border border-[#16223b] text-[11px] flex items-center justify-between text-slate-400">
              <span>Default Fallback (All other users)</span>
              <span className="font-mono font-bold text-slate-200">{flag.default_variant}</span>
            </div>
          </div>
        )}

        {/* Tab 4: SCHEMA */}
        {activeTab === 'SCHEMA' && (
          <div className="space-y-3 text-xs">
            {flag.type === 'OBJECT' && flag.schema ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>JSON Schema Specification</span>
                  <span className="font-mono text-[10px] text-teal-400">Draft 2020-12 / Draft 7</span>
                </div>
                <div className="p-3 rounded-lg bg-[#090f1c] border border-[#16223b] font-mono text-[11px] text-slate-200 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(flag.schema, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-[#111a2e] border border-[#1b2a47] text-center text-slate-400 text-xs">
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
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Recent Revisions (Audit Trail)</span>
              <button
                onClick={() => onOpenHistory(flag.key)}
                className="text-teal-400 hover:text-teal-300 flex items-center space-x-1"
              >
                <span>Full Audit</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center text-slate-500 animate-pulse text-xs">
                Fetching revision diffs...
              </div>
            ) : recentHistory.length === 0 ? (
              <div className="p-6 rounded-lg bg-[#111a2e] border border-[#1b2a47] text-center text-slate-400 text-xs">
                No previous revisions recorded.
              </div>
            ) : (
              recentHistory.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-lg bg-[#111a2e] border border-[#1b2a47] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-teal-300 text-xs">
                      v{rev.version}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300">
                    Author: <strong className="text-white">{rev.author}</strong>
                  </div>

                  {rev.change_reason && (
                    <div className="text-[10px] text-slate-400 italic">
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
      <div className="p-3 border-t border-[#16223b] bg-[#090f1c] flex items-center justify-between gap-2">
        <button
          onClick={() => onToggleState(flag)}
          disabled={isToggling || flag.lifecycle_state === 'GRADUATED'}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs font-mono flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            flag.lifecycle_state === 'GRADUATED'
              ? 'bg-blue-950 text-blue-300 border border-blue-800 opacity-60 cursor-not-allowed'
              : isEnabled
              ? 'bg-rose-900/50 hover:bg-rose-800 text-rose-200 border border-rose-700'
              : 'bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700'
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
          className="py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-teal-950 cursor-pointer"
        >
          Edit Rules
        </button>
      </div>
    </aside>
  );
}
