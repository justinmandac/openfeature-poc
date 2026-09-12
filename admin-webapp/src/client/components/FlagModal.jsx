import React, { useState } from 'react';
import { X, Check, AlertCircle, Plus, Trash2, Code2, ShieldCheck, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function FlagModal({ flag, isEditing, apiUrl, onClose, onSaved }) {
  const [key, setKey] = useState(flag?.key || '');
  const [type, setType] = useState(flag?.type || 'BOOLEAN');
  const [state, setState] = useState(flag?.state || 'ENABLED');
  const [defaultVariant, setDefaultVariant] = useState(flag?.default_variant || (flag?.type === 'BOOLEAN' ? 'on' : 'standard'));
  const [description, setDescription] = useState(flag?.description || '');
  const [appTags, setAppTags] = useState(flag?.app_tags || ['webapp', 'bff']);
  const [changeReason, setChangeReason] = useState('');
  const [author, setAuthor] = useState('admin-user');

  // Variants state (JSON string for editor)
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

  // Handle Type Change
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
      if (!schemaJson) {
        setSchemaJson(JSON.stringify({
          type: 'object',
          required: ['maxTokens', 'temperature'],
          properties: {
            maxTokens: { type: 'integer', minimum: 50 },
            temperature: { type: 'number', minimum: 0, maximum: 1 }
          }
        }, null, 2));
      }
    }
  };

  // Add a targeting rule
  const handleAddRule = () => {
    const newRule = {
      id: `rule-${Date.now().toString().slice(-4)}`,
      priority: rules.length + 1,
      description: 'Target specific context condition',
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
        // keep string temporary or handle gracefully
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

  // Test JSON Schema
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

  // Save flag
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
      state,
      default_variant: defaultVariant,
      variants: parsedVariants,
      rules,
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isEditing ? `Edit Flag: ${key}` : 'Create New Feature Flag / Config'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Make live changes with schema validation & audit trail' : 'Define typed OpenFeature flag or dynamic config'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Row 1: Key & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Flag Key *
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. feature.chatbot-v2 or config.limits"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-teal-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Type *
              </label>
              <select
                disabled={isEditing}
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-500 disabled:opacity-60"
              >
                <option value="BOOLEAN">BOOLEAN (Feature Toggle)</option>
                <option value="STRING">STRING (Variant Switch)</option>
                <option value="NUMBER">NUMBER (Metric / Rate)</option>
                <option value="OBJECT">OBJECT (Dynamic JSON Config)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Description & State */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Clear summary of what this flag controls..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="ENABLED">🟢 ENABLED</option>
                <option value="DISABLED">🔴 DISABLED</option>
              </select>
            </div>
          </div>

          {/* Row 3: App Tags & Default Variant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Variant Key *
              </label>
              <input
                type="text"
                required
                value={defaultVariant}
                onChange={(e) => setDefaultVariant(e.target.value)}
                placeholder="e.g. on, standard, v1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                App Scope Tags
              </label>
              <div className="flex space-x-3 pt-2">
                {['webapp', 'bff', 'api'].map((tag) => (
                  <label key={tag} className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appTags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) setAppTags([...appTags, tag]);
                        else setAppTags(appTags.filter(t => t !== tag));
                      }}
                      className="rounded border-slate-700 text-teal-500 focus:ring-0 bg-slate-950"
                    />
                    <span className="font-mono">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Variants JSON Editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Variants Dictionary (JSON) *</span>
              <span className="text-[11px] text-slate-500 font-normal">Maps variant name to value</span>
            </label>
            <textarea
              rows={4}
              required
              value={variantsJson}
              onChange={(e) => setVariantsJson(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-teal-300 font-mono text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* JSON Schema Definition (If OBJECT) */}
          {type === 'OBJECT' && (
            <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>JSON Schema Validator (Draft 7 / 2020-12)</span>
                </label>
                <button
                  type="button"
                  onClick={handleTestSchema}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-medium transition-colors"
                >
                  Test Schema
                </button>
              </div>
              <textarea
                rows={4}
                value={schemaJson}
                onChange={(e) => setSchemaJson(e.target.value)}
                placeholder="Optional JSON Schema object for variant validation..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              {schemaTestResult && (
                <div className={`p-2 rounded text-xs ${schemaTestResult.success ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300' : 'bg-rose-950/60 border border-rose-800/80 text-rose-300'}`}>
                  {schemaTestResult.message}
                </div>
              )}
            </div>
          )}

          {/* Targeting Rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Targeting Rules (Evaluated in Order of Priority)
              </label>
              <button
                type="button"
                onClick={handleAddRule}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-teal-950 border border-teal-800 text-teal-300 hover:bg-teal-900 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </button>
            </div>

            {rules.length === 0 ? (
              <div className="text-xs text-slate-500 p-3 rounded-lg border border-dashed border-slate-800 text-center">
                No custom targeting rules. All consumers will receive the default variant.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, idx) => (
                  <div key={rule.id || idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-3">
                    <span className="text-xs font-bold font-mono px-2 py-1 rounded bg-slate-800 text-teal-400 mt-1">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Rule Description"
                        value={rule.description || ''}
                        onChange={(e) => handleUpdateRule(idx, 'description', e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder='Condition JSON e.g. {"country":"SG"}'
                        value={typeof rule.condition === 'object' ? JSON.stringify(rule.condition) : rule.condition}
                        onChange={(e) => handleUpdateRule(idx, 'condition', e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-teal-300"
                      />
                      <input
                        type="text"
                        placeholder="Target Variant"
                        value={rule.variant}
                        onChange={(e) => handleUpdateRule(idx, 'variant', e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Governance & Audit Meta */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Author / Change Sign-off
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Change Reason (For Audit Log)
              </label>
              <input
                type="text"
                placeholder="e.g. Approved by risk committee for SG rollout"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white flex items-center space-x-1.5 shadow-lg shadow-teal-900/30 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : isEditing ? 'Save Changes & Record Revision' : 'Create Flag'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
