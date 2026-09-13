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
  const [conditionJson, setConditionJson] = useState('{\n  "country": ["SG", "HK", "AE", "IN"],\n  "userTier": "PREMIUM"\n}');
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
    setConditionJson('{\n  "country": ["SG", "HK", "AE", "IN"],\n  "userTier": "PREMIUM"\n}');
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
    <div className="space-y-6 text-zinc-200">
      {/* Header */}
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Reusable Audience Segments</h3>
            <p className="text-xs text-zinc-400">
              Define named user cohorts once and reference them across targeting rules in any flag.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-zinc-950" />
          <span>New Segment</span>
        </button>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && (
          <div className="col-span-2 py-12 text-center text-zinc-500 text-xs font-mono animate-pulse">
            Loading segments...
          </div>
        )}

        {!loading && segments.length === 0 && (
          <div className="col-span-2 py-12 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
            No audience segments created yet.
          </div>
        )}

        {segments.map((seg) => (
          <div key={seg.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-3 shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-zinc-200 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                  {seg.id}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleOpenEdit(seg)}
                    className="p-1.5 rounded text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-750 transition-colors"
                    title="Edit Segment"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(seg.id)}
                    className="p-1.5 rounded text-zinc-400 hover:text-rose-400 bg-zinc-800 hover:bg-zinc-750 transition-colors"
                    title="Delete Segment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h4 className="font-semibold text-white text-sm mt-2">{seg.name}</h4>
              <p className="text-xs text-zinc-400 mt-0.5">{seg.description}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px]">
              <div className="text-[10px] text-zinc-500 font-sans mb-1 uppercase tracking-wider font-semibold">Matching Criteria:</div>
              <pre className="text-zinc-200 overflow-x-auto leading-relaxed">
                {JSON.stringify(seg.condition, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {(isCreating || editingSegment) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden text-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">
                {editingSegment ? `Edit Segment: ${id}` : 'Create Audience Segment'}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingSegment(null);
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
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
                <label className="block text-zinc-300 font-medium mb-1 uppercase tracking-wider text-[10px]">
                  Segment ID *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingSegment}
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="e.g. segment-apac-premier"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-zinc-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 uppercase tracking-wider text-[10px]">
                  Segment Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. APAC Premier Wealth Clients"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 uppercase tracking-wider text-[10px]">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Target audience purpose..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 uppercase tracking-wider text-[10px]">
                  Matching Condition (JSON) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={conditionJson}
                  onChange={(e) => setConditionJson(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingSegment(null);
                  }}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-750 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-zinc-950" />
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
