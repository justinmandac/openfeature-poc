import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
  Download,
  Copy,
  Check,
  Archive,
  Award,
  Edit2,
  RefreshCw,
  X,
  FileText
} from 'lucide-react';
import axios from 'axios';

export default function HygieneReport({ apiUrl, onOpenEdit, onFlagMutated }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // Sprint Ticket Modal state
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketMarkdown, setTicketMarkdown] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);

  const fetchHygiene = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/api/v1/admin/hygiene`);
      setIssues(res.data.hygieneIssues || []);
    } catch (err) {
      console.error('Failed to load hygiene report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHygiene();
  }, [apiUrl]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Archive dead or dormant flag
  const handleArchive = async (flagKey) => {
    try {
      setActionLoading((prev) => ({ ...prev, [flagKey]: 'ARCHIVE' }));
      await axios.post(`${apiUrl}/api/v1/admin/flags/${encodeURIComponent(flagKey)}/archive`, {
        reason: 'Archived dead flag during hygiene cleanup sprint'
      });
      showToast(`Flag "${flagKey}" successfully archived.`);
      await fetchHygiene();
      onFlagMutated?.();
    } catch (err) {
      alert(`Failed to archive flag: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [flagKey]: null }));
    }
  };

  // Graduate flag to static variant
  const handleGraduate = async (flagKey, variant) => {
    const targetVariant = variant || 'on';
    try {
      setActionLoading((prev) => ({ ...prev, [flagKey]: 'GRADUATE' }));
      await axios.post(`${apiUrl}/api/v1/admin/flags/${encodeURIComponent(flagKey)}/graduate`, {
        variant: targetVariant,
        reason: `Graduated to variant "${targetVariant}" after 100% saturation`
      });
      showToast(`Flag "${flagKey}" successfully graduated to "${targetVariant}".`);
      await fetchHygiene();
      onFlagMutated?.();
    } catch (err) {
      alert(`Failed to graduate flag: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [flagKey]: null }));
    }
  };

  // Delete flag permanently
  const handleDelete = async (flagKey) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete flag "${flagKey}"?`)) {
      return;
    }
    try {
      setActionLoading((prev) => ({ ...prev, [flagKey]: 'DELETE' }));
      await axios.delete(`${apiUrl}/api/v1/admin/flags/${encodeURIComponent(flagKey)}?reason=Hygiene+cleanup+permanent+deletion`);
      showToast(`Flag "${flagKey}" deleted permanently.`);
      await fetchHygiene();
      onFlagMutated?.();
    } catch (err) {
      alert(`Failed to delete flag: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [flagKey]: null }));
    }
  };

  // Export Cleanup Sprint Ticket
  const handleOpenTicketModal = async () => {
    try {
      setTicketLoading(true);
      setTicketModalOpen(true);
      const res = await axios.get(`${apiUrl}/api/v1/admin/hygiene/export`);
      setTicketMarkdown(typeof res.data === 'string' ? res.data : JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed to export cleanup ticket:', err);
      setTicketMarkdown('# Error generating cleanup sprint ticket\n' + err.message);
    } finally {
      setTicketLoading(false);
    }
  };

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticketMarkdown);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const handleDownloadTicket = () => {
    const blob = new Blob([ticketMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flag-cleanup-sprint-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'DEAD_FLAGS') {
      return issue.type === 'DEAD_ZERO_EVALUATIONS' || issue.type === 'DEAD_INACTIVE_30D';
    }
    if (activeFilter === 'DEAD_APP_PATH') {
      return issue.type === 'DEAD_APP_PATH';
    }
    if (activeFilter === 'SATURATED') {
      return issue.type === 'SINGLE_VARIANT_SATURATION';
    }
    if (activeFilter === 'DORMANT') {
      return issue.type === 'DISABLED_DORMANT_14D' || issue.type === 'INACTIVE_RULES_30D';
    }
    return true;
  });

  const highSeverityCount = issues.filter((i) => i.severity === 'HIGH').length;
  const mediumSeverityCount = issues.filter((i) => i.severity === 'MEDIUM').length;

  return (
    <div className="space-y-6 text-xs text-zinc-200">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-200 shadow-xl flex items-center space-x-2 font-mono text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Deck */}
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center space-x-2">
              <span>Cleanup Command Center & Hygiene Audit</span>
              <span className="px-2 py-0.2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono">
                OFREP Telemetry Driven
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Identifies dead flags with 0 evaluations, dormant app paths, 100% saturated variants, and unmaintained configurations.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={fetchHygiene}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
            title="Refresh Hygiene Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenTicketModal}
            className="px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs inline-flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Cleanup Ticket (.md)</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <span className="text-zinc-400">Total Hygiene Opportunities</span>
          <span className="font-mono font-bold text-base text-white">{issues.length}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
          <span className="text-rose-300">High Risk (Dead / Inactive)</span>
          <span className="font-mono font-bold text-base text-rose-300">{highSeverityCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-between">
          <span className="text-amber-300">Graduation Candidates</span>
          <span className="font-mono font-bold text-base text-amber-300">{mediumSeverityCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: `All Issues (${issues.length})` },
          {
            id: 'DEAD_FLAGS',
            label: `Dead Flags (${issues.filter((i) => i.type === 'DEAD_ZERO_EVALUATIONS' || i.type === 'DEAD_INACTIVE_30D').length})`
          },
          {
            id: 'DEAD_APP_PATH',
            label: `Dead App Paths (${issues.filter((i) => i.type === 'DEAD_APP_PATH').length})`
          },
          {
            id: 'SATURATED',
            label: `100% Saturated (${issues.filter((i) => i.type === 'SINGLE_VARIANT_SATURATION').length})`
          },
          {
            id: 'DORMANT',
            label: `Dormant / Disabled (${issues.filter((i) => i.type === 'DISABLED_DORMANT_14D' || i.type === 'INACTIVE_RULES_30D').length})`
          }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-zinc-200 text-zinc-950 font-bold shadow-xs'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Issues List */}
      {loading && (
        <div className="py-12 text-center text-zinc-500 font-mono animate-pulse">
          Analyzing flag inventory and evaluation telemetry...
        </div>
      )}

      {!loading && filteredIssues.length === 0 && (
        <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="font-semibold text-white text-sm">No Matching Hygiene Issues</h4>
          <p className="text-xs text-zinc-400">
            Selected category has zero flagged items. Your flag catalog remains clean!
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filteredIssues.map((issue, idx) => {
          const isHigh = issue.severity === 'HIGH';
          const isMed = issue.severity === 'MEDIUM';
          const isCurrentAction = actionLoading[issue.flagKey];

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors ${
                isHigh
                  ? 'bg-rose-950/20 border-rose-900/50 text-rose-200 border-l-4 border-l-rose-500'
                  : isMed
                  ? 'bg-amber-950/20 border-amber-900/50 text-amber-200 border-l-4 border-l-amber-500'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 border-l-4 border-l-blue-500'
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-mono font-semibold text-white text-xs tracking-tight">
                    {issue.flagKey}
                  </span>
                  <span
                    className={`px-2 py-0.2 rounded text-[10px] font-mono font-semibold ${
                      isHigh
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {issue.type} &bull; {issue.severity}
                  </span>
                  {issue.businessUnit && (
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px] border border-zinc-700">
                      {issue.businessUnit}
                    </span>
                  )}
                </div>

                <p className="text-zinc-300 text-xs leading-relaxed">{issue.message}</p>

                <div className="flex items-center space-x-3 text-[10px] text-zinc-400 font-mono">
                  <span>Evaluations: <strong className="text-zinc-200">{issue.totalEvaluations ?? 0}</strong></span>
                  {issue.daysSinceLastEvaluation !== null && (
                    <span>Last seen: {issue.daysSinceLastEvaluation}d ago</span>
                  )}
                  {issue.saturatedVariant && (
                    <span>Saturated variant: <strong className="text-white">{issue.saturatedVariant}</strong></span>
                  )}
                </div>
              </div>

              {/* 1-Click Action Buttons Deck */}
              <div className="flex items-center space-x-2 shrink-0">
                {issue.recommendedAction === 'ARCHIVE' && (
                  <button
                    onClick={() => handleArchive(issue.flagKey)}
                    disabled={Boolean(isCurrentAction)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-amber-300 border border-zinc-700 font-mono text-[11px] font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Transition flag to ARCHIVED"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isCurrentAction === 'ARCHIVE' ? 'Archiving...' : 'Archive'}</span>
                  </button>
                )}

                {issue.recommendedAction === 'GRADUATE' && (
                  <button
                    onClick={() => handleGraduate(issue.flagKey, issue.saturatedVariant)}
                    disabled={Boolean(isCurrentAction)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-emerald-300 border border-zinc-700 font-mono text-[11px] font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Permanently freeze variant into hardcoded code"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isCurrentAction === 'GRADUATE' ? 'Graduating...' : 'Graduate'}</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenEdit?.({ key: issue.flagKey })}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                  title="Edit flag rules in Studio"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(issue.flagKey)}
                  disabled={Boolean(isCurrentAction)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-rose-400 hover:text-rose-300 border border-zinc-700 transition-colors cursor-pointer"
                  title="Delete flag completely"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ticket Export Modal */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h4 className="font-semibold text-white text-sm">Sprint Cleanup Ticket (Markdown)</h4>
              </div>
              <button
                onClick={() => setTicketModalOpen(false)}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs bg-zinc-950 text-zinc-200">
              {ticketLoading ? (
                <div className="py-12 text-center text-zinc-500 animate-pulse">Generating sprint ticket...</div>
              ) : (
                <pre className="whitespace-pre-wrap">{ticketMarkdown}</pre>
              )}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">
                Ready to paste into Jira, GitHub Issues, or Linear
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyTicket}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 font-mono text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTicket ? 'Copied!' : 'Copy Ticket'}</span>
                </button>

                <button
                  onClick={handleDownloadTicket}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold font-mono text-xs flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download (.md)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
