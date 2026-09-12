import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import FlagInventory from './components/FlagInventory';
import FlagModal from './components/FlagModal';
import HistoryModal from './components/HistoryModal';

export default function App() {
  const rootEl = document.getElementById('admin-root');
  const apiUrl = rootEl?.dataset?.apiUrl || 'http://localhost:4000';

  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);

  // Modals state
  const [editingFlag, setEditingFlag] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [historyFlagKey, setHistoryFlagKey] = useState(null);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/api/v1/admin/flags`);
      setFlags(res.data.flags || []);
    } catch (err) {
      console.error('Failed to fetch flags:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Initial fetch and SSE setup
  useEffect(() => {
    fetchFlags();

    let eventSource;
    try {
      eventSource = new EventSource(`${apiUrl}/api/v1/events/flags`);

      eventSource.addEventListener('connected', () => {
        setSseConnected(true);
      });

      eventSource.addEventListener('PROVIDER_CONFIGURATION_CHANGED', () => {
        // Live auto-refresh when any flag is created/updated/deleted
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Title & Subtitle */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Runtime Feature Flags & Configuration Inventory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Centrally author, target, and monitor enterprise OpenFeature flags with JSON Schema validation and revision auditing.
          </p>
        </div>
      </div>

      {/* Main Inventory Component */}
      <FlagInventory
        flags={flags}
        loading={loading}
        apiUrl={apiUrl}
        sseConnected={sseConnected}
        onRefresh={fetchFlags}
        onOpenCreate={() => setIsCreating(true)}
        onOpenEdit={(flag) => setEditingFlag(flag)}
        onOpenHistory={(key) => setHistoryFlagKey(key)}
      />

      {/* Create / Edit Modal */}
      {(isCreating || editingFlag) && (
        <FlagModal
          flag={editingFlag}
          isEditing={!!editingFlag}
          apiUrl={apiUrl}
          allFlags={flags}
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
    </div>
  );
}
