import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X, Check } from 'lucide-react';
import axios from 'axios';

export default function SegmentsManager({ apiUrl }) {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSegment, setEditingSegment] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conditionJson, setConditionJson] = useState('{\n  "country": ["SG", "PH"],\n  "userTier": "PREMIUM"\n}');
  const [error, setError] = useState(null);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/api/v1/admin/segments`);
      setSegments(res.data.segments || []);
    } catch (err) {
      console.error('Failed to load segments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, [apiUrl]);

  const handleOpenCreate = () => {
    setId(`segment-${Date.now().toString().slice(-4)}`);
    setName('');
    setDescription('');
    setConditionJson('{\n  "country": ["SG", "PH"],\n  "userTier": "PREMIUM"\n}');
    setError(null);
    setIsCreating(true);
    setEditingSegment(null);
  };

  const handleOpenEdit = (seg) => {
    setId(seg.id);
    setName(seg.name);
    setDescription(seg.description);
    setConditionJson(JSON.stringify(seg.condition, null, 2));
    setError(null);
    setEditingSegment(seg);
    setIsCreating(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    let condition;
    try {
      condition = JSON.parse(conditionJson);
    } catch (e) {
      setError('Invalid JSON in Condition editor');
      return;
    }

    try {
      if (editingSegment) {
        await axios.put(`${apiUrl}/api/v1/admin/segments/${encodeURIComponent(id)}`, {
          name,
          description,
          condition
        });
      } else {
        await axios.post(`${apiUrl}/api/v1/admin/segments`, {
          id,
          name,
          description,
          condition
        });
      }
      setIsCreating(false);
      setEditingSegment(null);
      fetchSegments();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (segmentId) => {
    if (!confirm(`Delete segment "${segmentId}"? Any rules referencing this segment will no longer match.`)) return;
    try {
      await axios.delete(`${apiUrl}/api/v1/admin/segments/${encodeURIComponent(segmentId)}`);
      fetchSegments();
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Reusable Audience Segments</h3>
            <p className="text-xs text-slate-400">
              Define named user cohorts once and reference them across targeting rules in any flag.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-lg shadow-teal-900/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Segment</span>
        </button>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && (
          <div className="col-span-2 py-12 text-center text-slate-500 text-xs animate-pulse">
            Loading segments...
          </div>
        )}

        {!loading && segments.length === 0 && (
          <div className="col-span-2 py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No audience segments created yet.
          </div>
        )}

        {segments.map((seg) => (
          <div key={seg.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-teal-300 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                  {seg.id}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleOpenEdit(seg)}
                    className="p-1.5 rounded text-slate-400 hover:text-white bg-slate-800/60"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(seg.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-400 bg-slate-800/60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h4 className="font-semibold text-white text-sm mt-2">{seg.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{seg.description}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px]">
              <div className="text-[10px] text-slate-500 font-sans mb-1 uppercase tracking-wider">Matching Criteria:</div>
              <pre className="text-teal-300 overflow-x-auto">
                {JSON.stringify(seg.condition, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {(isCreating || editingSegment) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-base">
                {editingSegment ? `Edit Segment: ${id}` : 'Create Reusable Audience Segment'}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingSegment(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  Segment ID *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingSegment}
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="e.g. segment-apac-premier"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  Segment Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. APAC Premier Wealth Clients"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Target audience purpose..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  Matching Condition (JSON) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={conditionJson}
                  onChange={(e) => setConditionJson(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-teal-300 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingSegment(null);
                  }}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Segment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
