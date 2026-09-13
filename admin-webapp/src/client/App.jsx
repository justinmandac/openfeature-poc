import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SidebarRail from './components/SidebarRail';
import InstitutionalHeader from './components/InstitutionalHeader';
import FlagInventory from './components/FlagInventory';
import InspectorPanel from './components/InspectorPanel';
import FlagStudio from './components/FlagStudio';
import HistoryModal from './components/HistoryModal';
import ScheduledChangesModal from './components/ScheduledChangesModal';
import SegmentsManager from './components/SegmentsManager';
import HygieneReport from './components/HygieneReport';
import AnalyticsDashboard from './components/AnalyticsDashboard';

export default function App() {
  const rootEl = document.getElementById('admin-root');
  const apiUrl = rootEl?.dataset?.apiUrl || 'http://localhost:4000';

  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('FLAGS'); // FLAGS, SEGMENTS, SCHEDULED, HYGIENE, ANALYTICS
  const [environment, setEnvironment] = useState('PROD-SG-HUB');
  const [selectedFlagKey, setSelectedFlagKey] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [togglingKey, setTogglingKey] = useState(null);

  // Modals state
  const [editingFlag, setEditingFlag] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [historyFlagKey, setHistoryFlagKey] = useState(null);
  const [showScheduledModal, setShowScheduledModal] = useState(false);

  // Close inspector on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isInspectorOpen) {
        setIsInspectorOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspectorOpen]);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/api/v1/admin/flags`);
      const list = res.data.flags || [];
      setFlags(list);

      // Auto-select first flag if none selected yet
      setSelectedFlagKey((prev) => {
        if (prev && list.some((f) => f.key === prev)) {
          return prev;
        }
        return list.length > 0 ? list[0].key : null;
      });
    } catch (err) {
      console.error('Failed to fetch flags:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Initial fetch and SSE stream setup
  useEffect(() => {
    fetchFlags();

    let eventSource;
    try {
      eventSource = new EventSource(`${apiUrl}/api/v1/events/flags`);

      eventSource.addEventListener('connected', () => {
        setSseConnected(true);
      });

      eventSource.addEventListener('PROVIDER_CONFIGURATION_CHANGED', () => {
        // Reactive auto-refresh when any flag mutation occurs
        fetchFlags();
      });

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch (e) {
      console.warn('SSE connection error:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [apiUrl, fetchFlags]);

  // Safe State Toggle with Enterprise Bank Guardrails
  const handleToggleState = async (flag) => {
    if (flag.lifecycle_state === 'GRADUATED') {
      alert(`Flag "${flag.key}" is GRADUATED (frozen permanent feature).`);
      return;
    }

    const isProd = environment.startsWith('PROD');
    const newState = flag.state === 'ENABLED' ? 'DISABLED' : 'ENABLED';

    if (isProd) {
      const confirmAction = window.confirm(
        `[SECURITY GUARDRAIL] You are about to toggle "${flag.key}" to ${newState} in ${environment}.\n\nThis will trigger immediate OFREP cache invalidation across all connected banking nodes.\n\nProceed with change?`
      );
      if (!confirmAction) return;
    }

    try {
      setTogglingKey(flag.key);
      await axios.patch(
        `${apiUrl}/api/v1/admin/flags/${encodeURIComponent(flag.key)}/state`,
        { state: newState },
        { headers: { 'x-author': 'admin-control-center' } }
      );
      await fetchFlags();
    } catch (err) {
      alert(`Failed to toggle flag state: ${err.response?.data?.error || err.message}`);
    } finally {
      setTogglingKey(null);
    }
  };

  // Flag Deletion
  const handleDeleteFlag = async (flag) => {
    const isProd = environment.startsWith('PROD');
    const warning = isProd
      ? `[CRITICAL COMPLIANCE WARNING] Deleting flag "${flag.key}" from ${environment} requires dual-authorization sign-off. Are you sure?`
      : `Are you sure you want to delete flag "${flag.key}"? This will be recorded in the audit log.`;

    if (!window.confirm(warning)) return;

    try {
      await axios.delete(
        `${apiUrl}/api/v1/admin/flags/${encodeURIComponent(flag.key)}?author=admin-control-center&reason=Deleted from FlagOps Console`
      );
      if (selectedFlagKey === flag.key) {
        setSelectedFlagKey(null);
      }
      fetchFlags();
    } catch (err) {
      alert(`Failed to delete flag: ${err.response?.data?.error || err.message}`);
    }
  };

  // Active selected flag object
  const selectedFlag = flags.find((f) => f.key === selectedFlagKey) || null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-zinc-950 text-zinc-100 antialiased font-sans">
      {/* Top Institutional Header */}
      <InstitutionalHeader
        flagsCount={flags.length}
        sseConnected={sseConnected}
        environment={environment}
        onRefresh={fetchFlags}
        onOpenCreate={() => setIsCreating(true)}
        onOpenScheduledModal={() => setShowScheduledModal(true)}
      />

      {/* Main Operations Body */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Column: Navigation Rail */}
        <SidebarRail
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'FLAGS') {
              setIsInspectorOpen(false);
            }
          }}
          flagsCount={flags.length}
          environment={environment}
          onEnvironmentChange={setEnvironment}
          sseConnected={sseConnected}
        />

        {/* Center Column: Operations Workbench (Fixed width, zero layout shift) */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-zinc-950">
          {activeTab === 'FLAGS' && (
            <FlagInventory
              flags={flags}
              loading={loading}
              selectedFlagKey={isInspectorOpen ? selectedFlagKey : null}
              onSelectFlag={(key) => {
                setSelectedFlagKey(key);
                setIsInspectorOpen(true);
              }}
              onToggleState={handleToggleState}
              onDelete={handleDeleteFlag}
              onOpenEdit={(flag) => setEditingFlag(flag)}
              onOpenHistory={(key) => setHistoryFlagKey(key)}
              togglingKey={togglingKey}
            />
          )}

          {activeTab === 'SEGMENTS' && (
            <div className="p-6 flex-1 overflow-y-auto">
              <SegmentsManager apiUrl={apiUrl} />
            </div>
          )}

          {activeTab === 'SCHEDULED' && (
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-4 max-w-2xl mx-auto">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mx-auto">
                  <span className="text-base">⏱️</span>
                </div>
                <h3 className="text-base font-bold text-zinc-100">Scheduled Release Management Queue</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Stage future flag state transitions, canary rollout increments, and configuration updates for regulatory go-live dates or scheduled maintenance windows.
                </p>
                <button
                  onClick={() => setShowScheduledModal(true)}
                  className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs inline-flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <span>Open Active Scheduled Releases</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'HYGIENE' && (
            <div className="p-6 flex-1 overflow-y-auto">
              <HygieneReport
                apiUrl={apiUrl}
                onOpenEdit={(flag) => {
                  setActiveTab('FLAGS');
                  setEditingFlag(flag);
                }}
              />
            </div>
          )}

          {activeTab === 'ANALYTICS' && (
            <div className="p-6 flex-1 overflow-y-auto">
              <AnalyticsDashboard apiUrl={apiUrl} />
            </div>
          )}
        </main>

        {/* Slide-over Context Inspector Panel (Active on FLAGS tab) */}
        {activeTab === 'FLAGS' && (
          <>
            {/* Backdrop to dismiss slide-over when clicking outside */}
            <div
              className={`absolute inset-0 bg-black/30 backdrop-blur-[0.5px] z-20 transition-opacity duration-300 ${
                isInspectorOpen && selectedFlag ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={() => setIsInspectorOpen(false)}
            />

            {/* Slide-over Drawer Panel */}
            <div
              className={`absolute top-0 right-0 bottom-0 z-30 w-[480px] xl:w-[540px] max-w-full shadow-2xl transition-transform duration-300 ease-out flex ${
                isInspectorOpen && selectedFlag ? 'translate-x-0' : 'translate-x-full pointer-events-none'
              }`}
            >
              {selectedFlag && (
                <InspectorPanel
                  flag={selectedFlag}
                  apiUrl={apiUrl}
                  allFlags={flags}
                  onClose={() => setIsInspectorOpen(false)}
                  onOpenEdit={(flag) => setEditingFlag(flag)}
                  onOpenHistory={(key) => setHistoryFlagKey(key)}
                  onToggleState={handleToggleState}
                  isToggling={togglingKey === selectedFlag?.key}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Studio */}
      {(isCreating || editingFlag) && (
        <FlagStudio
          flag={editingFlag}
          isEditing={!!editingFlag}
          apiUrl={apiUrl}
          allFlags={flags}
          environment={environment}
          onClose={() => {
            setIsCreating(false);
            setEditingFlag(null);
          }}
          onSaved={() => {
            setIsCreating(false);
            setEditingFlag(null);
            fetchFlags();
          }}
        />
      )}

      {/* History Audit Modal */}
      {historyFlagKey && (
        <HistoryModal
          flagKey={historyFlagKey}
          apiUrl={apiUrl}
          onClose={() => setHistoryFlagKey(null)}
        />
      )}

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
