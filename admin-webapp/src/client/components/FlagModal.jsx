import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Plus, Trash2, ShieldCheck, Sparkles, Sliders, Layers, Link2 } from 'lucide-react';
import axios from 'axios';

export default function FlagModal({ flag, isEditing, apiUrl, onClose, onSaved, allFlags = [] }) {
  const [key, setKey] = useState(flag?.key || '');
  const [type, setType] = useState(flag?.type || 'BOOLEAN');
  const [state, setState] = useState(flag?.state || 'ENABLED');
  const [lifecycleState, setLifecycleState] = useState(flag?.lifecycle_state || 'ENABLED');
  const [graduatedVariant, setGraduatedVariant] = useState(flag?.graduated_variant || '');
  const [defaultVariant, setDefaultVariant] = useState(flag?.default_variant || (flag?.type === 'BOOLEAN' ? 'on' : 'standard'));
  const [description, setDescription] = useState(flag?.description || '');
  const [appTags, setAppTags] = useState(flag?.app_tags || ['webapp', 'bff']);
  const [changeReason, setChangeReason] = useState('');
  const [author, setAuthor] = useState('admin-user');

  // Prerequisites state
  const [prerequisites, setPrerequisites] = useState(flag?.prerequisites || []);

  // Segments available
  const [segments, setSegments] = useState([]);

  // Variants state
  const [variantsJson, setVariantsJson] = useState(
    flag?.variants 
      ? JSON.stringify(flag.variants, null, 2)
      : (type === 'BOOLEAN' ? JSON.stringify({ on: true, off: false }, null, 2) : '{\n  "standard": {\n    "maxTokens": 500\n  }\n}')
  );

  // Schema state
  const [schemaJson, setSchemaJson] = useState(
    flag?.schema ? JSON.stringify(flag.schema, null, 2) : ''
  );

  // Rules state
  const [rules, setRules] = useState(flag?.rules || []);

  const [validationError, setValidationError] = useState(null);
  const [schemaTestResult, setSchemaTestResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSegments() {
      try {
        const res = await axios.get(`${apiUrl}/api/v1/admin/segments`);
        setSegments(res.data.segments || []);
      } catch (e) {
        console.warn('Could not load segments:', e);
      }
    }
    loadSegments();
  }, [apiUrl]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'BOOLEAN') {
      setVariantsJson(JSON.stringify({ on: true, off: false }, null, 2));
      setDefaultVariant('on');
    } else if (newType === 'STRING') {
      setVariantsJson(JSON.stringify({ v1: 'Alpha', v2: 'Beta' }, null, 2));
      setDefaultVariant('v1');
    } else if (newType === 'NUMBER') {
      setVariantsJson(JSON.stringify({ low: 10, high: 100 }, null, 2));
      setDefaultVariant('low');
    } else if (newType === 'OBJECT') {
      setVariantsJson(JSON.stringify({
        standard: { maxTokens: 500, temperature: 0.2 },
        premium: { maxTokens: 2000, temperature: 0.7 }
      }, null, 2));
      setDefaultVariant('standard');
    }
  };

  // Add Prerequisite
  const handleAddPrerequisite = () => {
    const otherFlags = allFlags.filter(f => f.key !== key);
    const firstOther = otherFlags[0]?.key || 'feature.chatbot-gemini-ui';
    setPrerequisites([...prerequisites, { flagKey: firstOther, variant: 'on' }]);
  };

  const handleUpdatePrerequisite = (index, field, value) => {
    const updated = [...prerequisites];
    updated[index][field] = value;
    setPrerequisites(updated);
  };

  const handleRemovePrerequisite = (index) => {
    setPrerequisites(prerequisites.filter((_, i) => i !== index));
  };

  // Add Rule
  const handleAddRule = () => {
    const newRule = {
      id: `rule-${Date.now().toString().slice(-4)}`,
      priority: rules.length + 1,
      description: 'Target specific condition or percentage',
      condition: { country: 'SG' },
      variant: defaultVariant
    };
    setRules([...rules, newRule]);
  };

  const handleUpdateRule = (index, field, value) => {
    const updated = [...rules];
    if (field === 'condition') {
      try {
        updated[index].condition = JSON.parse(value);
      } catch (e) {
        // preserve temporary input
      }
    } else if (field === 'percentage') {
      const pct = Number(value);
      if (pct > 0 && pct < 100) {
        updated[index].rollout = {
          attribute: 'targetingKey',
          percentage: pct,
          variant: updated[index].variant || defaultVariant,
          fallbackVariant: defaultVariant
        };
      } else {
        delete updated[index].rollout;
      }
    } else {
      updated[index][field] = value;
    }
    setRules(updated);
  };

  const handleRemoveRule = (index) => {
    const updated = rules.filter((_, i) => i !== index).map((r, i) => ({ ...r, priority: i + 1 }));
    setRules(updated);
  };

  const handleTestSchema = async () => {
    try {
      setSchemaTestResult(null);
      const parsedVariants = JSON.parse(variantsJson);
      const parsedSchema = JSON.parse(schemaJson);

      const res = await axios.post(`${apiUrl}/api/v1/admin/flags/validate-schema`, {
        schema: parsedSchema,
        payload: parsedVariants[defaultVariant]
      });

      if (res.data.valid) {
        setSchemaTestResult({ success: true, message: `Schema valid! Matches default variant "${defaultVariant}".` });
      } else {
        setSchemaTestResult({ success: false, message: res.data.errors?.join(', ') || 'Validation failed' });
      }
    } catch (e) {
      setSchemaTestResult({ success: false, message: e.response?.data?.error || e.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    let parsedVariants, parsedSchema = null;
    try {
      parsedVariants = JSON.parse(variantsJson);
    } catch (err) {
      setValidationError('Invalid JSON in Variants editor');
      return;
    }

    if (schemaJson.trim()) {
      try {
        parsedSchema = JSON.parse(schemaJson);
      } catch (err) {
        setValidationError('Invalid JSON in Schema editor');
        return;
      }
    }

    if (parsedVariants[defaultVariant] === undefined) {
      setValidationError(`Default variant "${defaultVariant}" is not defined in variants!`);
      return;
    }

    const payload = {
      key,
      type,
      state: (lifecycleState === 'ENABLED' || lifecycleState === 'GRADUATED') ? 'ENABLED' : 'DISABLED',
      lifecycle_state: lifecycleState,
      graduated_variant: lifecycleState === 'GRADUATED' ? (graduatedVariant || defaultVariant) : null,
      default_variant: defaultVariant,
      variants: parsedVariants,
      rules,
      prerequisites,
      schema: parsedSchema,
      app_tags: appTags,
      description,
      change_reason: changeReason || (isEditing ? 'Updated flag configuration' : 'Created new flag')
    };

    try {
      setSubmitting(true);
      if (isEditing) {
        await axios.put(`${apiUrl}/api/v1/admin/flags/${encodeURIComponent(key)}`, payload, {
          headers: { 'x-author': author }
        });
      } else {
        await axios.post(`${apiUrl}/api/v1/admin/flags`, payload, {
          headers: { 'x-author': author }
        });
      }
      onSaved();
    } catch (err) {
      setValidationError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                {isEditing ? `Edit Flag: ${key}` : 'Create New Feature Flag / Config'}
              </h2>
              <p className="text-xs text-zinc-400">
                Configure prerequisites, segments, percentage rollouts, and lifecycle state
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Key & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Flag Key *
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. feature.chatbot-v2 or config.limits"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-mono disabled:opacity-60 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Type *
              </label>
              <select
                disabled={isEditing}
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 disabled:opacity-60 focus:outline-none focus:border-zinc-500"
              >
                <option value="BOOLEAN">BOOLEAN (Feature Toggle)</option>
                <option value="STRING">STRING (Variant Switch)</option>
                <option value="NUMBER">NUMBER (Metric / Rate)</option>
                <option value="OBJECT">OBJECT (Dynamic JSON Config)</option>
              </select>
            </div>
          </div>

          {/* Lifecycle State & Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Description *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summary of what this flag controls..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Lifecycle State
              </label>
              <select
                value={lifecycleState}
                onChange={(e) => setLifecycleState(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-medium focus:outline-none focus:border-zinc-500"
              >
                <option value="DRAFT">🟡 DRAFT (Non-evaluable)</option>
                <option value="ENABLED">🟢 ENABLED (Active)</option>
                <option value="DISABLED">🔴 DISABLED (Inactive)</option>
                <option value="GRADUATED">🔵 GRADUATED (Permanent Frozen)</option>
                <option value="ARCHIVED">⚫ ARCHIVED (Soft deleted)</option>
              </select>
            </div>
          </div>

          {/* Prerequisites (Flag Dependencies) */}
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Link2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Flag Prerequisites (Dependencies)</span>
              </label>
              <button
                type="button"
                onClick={handleAddPrerequisite}
                className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 text-[11px]"
              >
                + Add Dependency
              </button>
            </div>

            {prerequisites.length === 0 ? (
              <div className="text-[11px] text-zinc-500">No prerequisites. Flag evaluates independently.</div>
            ) : (
              <div className="space-y-2">
                {prerequisites.map((prereq, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-zinc-900 p-2 rounded border border-zinc-800">
                    <span className="text-zinc-400 font-mono">Requires</span>
                    <input
                      type="text"
                      placeholder="Prerequisite Flag Key"
                      value={prereq.flagKey}
                      onChange={(e) => handleUpdatePrerequisite(idx, 'flagKey', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200 text-xs flex-1 focus:outline-none focus:border-zinc-500"
                    />
                    <span className="text-zinc-400 font-mono">==</span>
                    <input
                      type="text"
                      placeholder="Required Variant"
                      value={prereq.variant}
                      onChange={(e) => handleUpdatePrerequisite(idx, 'variant', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200 font-semibold text-xs w-24 focus:outline-none focus:border-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePrerequisite(idx)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variants JSON Editor */}
          <div>
            <label className="block font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Variants Dictionary (JSON) *</span>
              <span className="text-[10px] text-zinc-500 font-normal">Default: <strong className="text-zinc-200 font-mono">{defaultVariant}</strong></span>
            </label>
            <textarea
              rows={3}
              required
              value={variantsJson}
              onChange={(e) => setVariantsJson(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 font-mono focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* JSON Schema (If OBJECT) */}
          {type === 'OBJECT' && (
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>JSON Schema Validator</span>
                </label>
                <button
                  type="button"
                  onClick={handleTestSchema}
                  className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px]"
                >
                  Test Schema
                </button>
              </div>
              <textarea
                rows={3}
                value={schemaJson}
                onChange={(e) => setSchemaJson(e.target.value)}
                placeholder="JSON Schema for variant validation..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 font-mono focus:outline-none focus:border-zinc-500"
              />
              {schemaTestResult && (
                <div className={`p-2 rounded text-[11px] ${schemaTestResult.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                  {schemaTestResult.message}
                </div>
              )}
            </div>
          )}

          {/* Targeting Rules (Priority, Segments & Percentage Rollout) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-300 uppercase tracking-wider">
                Targeting Rules & Percentage Rollouts
              </label>
              <button
                type="button"
                onClick={handleAddRule}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-[11px] shadow-sm transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Rule</span>
              </button>
            </div>

            {rules.length === 0 ? (
              <div className="text-[11px] text-zinc-500 p-2.5 rounded border border-dashed border-zinc-800 text-center">
                No targeting rules configured. Evaluates to default variant.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, idx) => (
                  <div key={rule.id || idx} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          placeholder="Rule Description"
                          value={rule.description || ''}
                          onChange={(e) => handleUpdateRule(idx, 'description', e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs w-60 focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-zinc-500 block mb-0.5">Condition / Segment JSON</span>
                        <input
                          type="text"
                          placeholder='{"segmentId":"segment-apac-premier"}'
                          value={typeof rule.condition === 'object' ? JSON.stringify(rule.condition) : rule.condition}
                          onChange={(e) => handleUpdateRule(idx, 'condition', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-500 block mb-0.5">Target Variant</span>
                        <input
                          type="text"
                          placeholder="Variant"
                          value={rule.variant}
                          onChange={(e) => handleUpdateRule(idx, 'variant', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-500 block mb-0.5">Percentage Rollout (0-100%)</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g. 50"
                          value={rule.rollout?.percentage || ''}
                          onChange={(e) => handleUpdateRule(idx, 'percentage', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-amber-400 font-mono focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold flex items-center space-x-1 shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : 'Save Flag'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
