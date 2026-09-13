import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  Sparkles,
  Sliders,
  Layers,
  Link2,
  Code2,
  Play,
  FileCheck2,
  Lock,
  ChevronRight,
  Info,
  Tag,
  Copy,
  CheckCircle2,
  RefreshCw,
  GitBranch,
  FileJson,
  Activity,
  X
} from 'lucide-react';
import axios from 'axios';

export default function FlagStudio({
  flag,
  isEditing,
  apiUrl,
  onClose,
  onSaved,
  allFlags = [],
  environment = 'PROD-US-EAST'
}) {
  // Studio Navigation Tabs
  const [activeSection, setActiveSection] = useState('IDENTITY'); // IDENTITY, VARIANTS, DEPENDENCIES, RULES, GOVERNANCE

  // Form State
  const [key, setKey] = useState(flag?.key || '');
  const [type, setType] = useState(flag?.type || 'BOOLEAN');
  const [lifecycleState, setLifecycleState] = useState(flag?.lifecycle_state || 'ENABLED');
  const [graduatedVariant, setGraduatedVariant] = useState(flag?.graduated_variant || '');
  const [defaultVariant, setDefaultVariant] = useState(
    flag?.default_variant || (flag?.type === 'BOOLEAN' ? 'on' : 'standard')
  );
  const [description, setDescription] = useState(flag?.description || '');
  const [appTags, setAppTags] = useState(flag?.app_tags || ['webapp', 'bff']);
  const [newTag, setNewTag] = useState('');
  const [changeTicket, setChangeTicket] = useState(flag ? 'CHG-9281' : 'CHG-9402');
  const [changeReason, setChangeReason] = useState(flag?.change_reason || '');
  const [author, setAuthor] = useState('admin-architect');

  // Prerequisites state
  const [prerequisites, setPrerequisites] = useState(flag?.prerequisites || []);

  // Segments available
  const [segments, setSegments] = useState([]);

  // Variants state
  const [variantsJson, setVariantsJson] = useState(
    flag?.variants
      ? JSON.stringify(flag.variants, null, 2)
      : type === 'BOOLEAN'
      ? JSON.stringify({ on: true, off: false }, null, 2)
      : '{\n  "standard": {\n    "maxTokens": 500\n  }\n}'
  );

  // Schema state
  const [schemaJson, setSchemaJson] = useState(
    flag?.schema ? JSON.stringify(flag.schema, null, 2) : ''
  );

  // Rules state
  const [rules, setRules] = useState(flag?.rules || []);

  // Pre-Flight Simulation & Validation State
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [schemaTestResult, setSchemaTestResult] = useState(null);

  const [testContextJson, setTestContextJson] = useState(
    JSON.stringify(
      {
        targetingKey: 'sg-wealth-client-88',
        country: 'SG',
        businessUnit: 'Wealth Management',
        userTier: 'VIP',
        appId: 'webapp'
      },
      null,
      2
    )
  );
  const [dryRunResult, setDryRunResult] = useState(null);
  const [batchImpactResult, setBatchImpactResult] = useState(null);
  const [simulatingBatch, setSimulatingBatch] = useState(false);

  // Load Segments
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

  // Handle Type Change
  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'BOOLEAN') {
      setVariantsJson(JSON.stringify({ on: true, off: false }, null, 2));
      setDefaultVariant('on');
      setSchemaJson('');
    } else if (newType === 'STRING') {
      setVariantsJson(JSON.stringify({ v1: 'Alpha', v2: 'Beta' }, null, 2));
      setDefaultVariant('v1');
      setSchemaJson('');
    } else if (newType === 'NUMBER') {
      setVariantsJson(JSON.stringify({ low: 10, high: 100 }, null, 2));
      setDefaultVariant('low');
      setSchemaJson('');
    } else if (newType === 'OBJECT') {
      setVariantsJson(
        JSON.stringify(
          {
            standard: { maxTokens: 500, temperature: 0.2 },
            premium: { maxTokens: 2000, temperature: 0.7 }
          },
          null,
          2
        )
      );
      setDefaultVariant('standard');
      setSchemaJson(
        JSON.stringify(
          {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
            required: ['maxTokens', 'temperature'],
            properties: {
              maxTokens: { type: 'integer', minimum: 100 },
              temperature: { type: 'number', minimum: 0, maximum: 1 }
            }
          },
          null,
          2
        )
      );
    }
  };

  // Add Prerequisite
  const handleAddPrerequisite = () => {
    const otherFlags = allFlags.filter((f) => f.key !== key);
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
      description: 'Target specific condition or canary rollout',
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

  // Test JSON Schema with Core API
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
        setSchemaTestResult({
          success: true,
          message: `Schema conforms! Validates against default variant "${defaultVariant}".`
        });
      } else {
        setSchemaTestResult({
          success: false,
          message: res.data.errors?.join(', ') || 'Validation failed'
        });
      }
    } catch (e) {
      setSchemaTestResult({
        success: false,
        message: e.response?.data?.error || e.message
      });
    }
  };

  // Run Client-Side Dry-Run Simulation
  const handleSimulateDryRun = () => {
    try {
      let parsedVariants = {};
      try {
        parsedVariants = JSON.parse(variantsJson);
      } catch (e) {
        throw new Error('Variants JSON is invalid');
      }

      let parsedContext = {};
      try {
        parsedContext = JSON.parse(testContextJson);
      } catch (e) {
        throw new Error('Simulation Context JSON is invalid');
      }

      if (lifecycleState === 'DISABLED') {
        setDryRunResult({
          resolvedVariant: defaultVariant,
          resolvedValue: parsedVariants[defaultVariant],
          reason: 'DISABLED',
          matchedRule: 'Flag Disabled (Safely returns default variant)'
        });
        return;
      }

      // Check Rules
      let matched = null;
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        let ruleMatches = true;

        if (rule.condition) {
          for (const [prop, targetVal] of Object.entries(rule.condition)) {
            const ctxVal = parsedContext[prop];
            if (Array.isArray(targetVal)) {
              if (!targetVal.includes(ctxVal)) {
                ruleMatches = false;
                break;
              }
            } else if (targetVal !== ctxVal) {
              ruleMatches = false;
              break;
            }
          }
        }

        if (ruleMatches) {
          matched = { rule, index: i + 1 };
          break;
        }
      }

      if (matched) {
        let variantToServe = matched.rule.variant;
        let reason = 'TARGETING_MATCH';
        let detail = `Matched Rule #${matched.index}`;

        if (matched.rule.rollout) {
          detail += ` (Canary ${matched.rule.rollout.percentage}% Rollout)`;
        }

        setDryRunResult({
          resolvedVariant: variantToServe,
          resolvedValue: parsedVariants[variantToServe],
          reason,
          matchedRule: detail
        });
      } else {
        setDryRunResult({
          resolvedVariant: defaultVariant,
          resolvedValue: parsedVariants[defaultVariant],
          reason: 'DEFAULT',
          matchedRule: 'Fallback Default (No rules matched)'
        });
      }
    } catch (err) {
      setDryRunResult({
        error: err.message
      });
    }
  };

  // Run Server-Side Batch What-If Impact Simulation
  const handleRunBatchImpactSimulation = async () => {
    try {
      setSimulatingBatch(true);
      let parsedVariants = {};
      try {
        parsedVariants = JSON.parse(variantsJson);
      } catch (e) {
        alert('Invalid JSON in Variants editor: ' + e.message);
        return;
      }

      let parsedSchema = null;
      if (schemaJson.trim()) {
        try {
          parsedSchema = JSON.parse(schemaJson);
        } catch (e) {
          // ignore
        }
      }

      const proposedFlag = {
        key: key || 'draft.simulated-flag',
        type,
        state: lifecycleState === 'ENABLED' || lifecycleState === 'GRADUATED' ? 'ENABLED' : 'DISABLED',
        lifecycle_state: lifecycleState,
        default_variant: defaultVariant,
        variants: parsedVariants,
        rules,
        prerequisites,
        schema: parsedSchema,
        app_tags: appTags,
        description
      };

      const res = await axios.post(`${apiUrl}/api/v1/admin/simulate-impact`, {
        proposedFlag
      });

      setBatchImpactResult(res.data);
    } catch (err) {
      alert(`Blast Radius Simulation Failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setSimulatingBatch(false);
    }
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setValidationError(null);

    if (!key.trim()) {
      setValidationError('Flag key is required.');
      setActiveSection('IDENTITY');
      return;
    }

    let parsedVariants,
      parsedSchema = null;
    try {
      parsedVariants = JSON.parse(variantsJson);
    } catch (err) {
      setValidationError('Invalid JSON syntax in Variants definition.');
      setActiveSection('VARIANTS');
      return;
    }

    if (schemaJson.trim()) {
      try {
        parsedSchema = JSON.parse(schemaJson);
      } catch (err) {
        setValidationError('Invalid JSON syntax in Schema definition.');
        setActiveSection('VARIANTS');
        return;
      }
    }

    if (parsedVariants[defaultVariant] === undefined) {
      setValidationError(`Default variant "${defaultVariant}" is not defined in variants!`);
      setActiveSection('VARIANTS');
      return;
    }

    const payload = {
      key,
      type,
      state: lifecycleState === 'ENABLED' || lifecycleState === 'GRADUATED' ? 'ENABLED' : 'DISABLED',
      lifecycle_state: lifecycleState,
      graduated_variant: lifecycleState === 'GRADUATED' ? graduatedVariant || defaultVariant : null,
      default_variant: defaultVariant,
      variants: parsedVariants,
      rules,
      prerequisites,
      schema: parsedSchema,
      app_tags: appTags,
      description,
      change_reason: changeReason || `${changeTicket}: ${isEditing ? 'Updated flag configuration' : 'Created new flag'}`
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

  // Section Steps
  const sections = [
    { id: 'IDENTITY', label: '1. Identity & Scopes' },
    { id: 'VARIANTS', label: '2. Variants & Schema' },
    { id: 'DEPENDENCIES', label: `3. Dependencies (${prerequisites.length})` },
    { id: 'RULES', label: `4. Targeting & Rollout (${rules.length})` },
    { id: 'GOVERNANCE', label: '5. Governance & Audit' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#070b14] text-slate-100 flex flex-col h-screen w-screen overflow-hidden select-none font-sans">
      {/* Top Studio Command Bar */}
      <header className="h-16 bg-[#0c1322] border-b border-[#16223b] px-6 flex items-center justify-between shrink-0 z-30 shadow-md">
        {/* Left: Exit & Flag Metadata */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#111a2e] hover:bg-[#16233d] text-slate-300 hover:text-white border border-[#1b2a47] text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Studio</span>
          </button>

          <div className="h-6 w-px bg-[#16223b]" />

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-sm text-white tracking-tight">
                {key || 'untitled.flag'}
              </span>

              <span
                className={`px-2 py-0.2 rounded text-[10px] font-bold font-mono ${
                  type === 'BOOLEAN'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : 'bg-purple-950 text-purple-300 border border-purple-800'
                }`}
              >
                {type}
              </span>

              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {lifecycleState}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {isEditing ? 'Editing Enterprise Flag Configuration' : 'Authoring New OpenFeature Flag'}
            </div>
          </div>
        </div>

        {/* Center: Environment Guardrails Indicator */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#111a2e] border border-[#1b2a47] text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono text-slate-300 font-medium">Target: {environment}</span>
          {environment.startsWith('PROD') && (
            <span className="text-amber-400 font-semibold text-[10px] uppercase ml-1 flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Guardrails Active</span>
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
          >
            Discard
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-950 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing to OFREP Engine...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'Save & Deploy Changes' : 'Publish & Deploy Flag'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Body: 2-Column Wide Split Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Column: Spacious Authoring Workbench (65% width) */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#16223b] overflow-hidden bg-[#070b14]">
          {/* Studio Steps Navigation Bar */}
          <div className="h-12 bg-[#090f1c] border-b border-[#16223b] px-6 flex items-center space-x-2 overflow-x-auto shrink-0">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeSection === sec.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111a2e]'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="m-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
              <button onClick={() => setValidationError(null)} className="text-rose-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Scrollable Form Content Canvas */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1: IDENTITY & SCOPE */}
            {activeSection === 'IDENTITY' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Flag Identity & Classification</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define the unique key, evaluation type, operational lifecycle, and consuming applications.
                  </p>
                </div>

                {/* Key & Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Flag Key (Identifier)</span>
                      <span className="text-[10px] text-slate-500 font-mono">Immutable after creation</span>
                    </label>
                    <input
                      type="text"
                      disabled={isEditing}
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="e.g. feature.cross-border-fx"
                      className="w-full bg-[#0c1322] border border-[#1b2a47] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                      <span>Suggestions:</span>
                      {['feature.', 'config.', 'experiment.'].map((prefix) => (
                        <button
                          key={prefix}
                          type="button"
                          disabled={isEditing}
                          onClick={() => setKey(prefix + key.replace(/^(feature\.|config\.|experiment\.)/, ''))}
                          className="px-1.5 py-0.5 rounded bg-[#111a2e] text-teal-300 hover:text-white font-mono"
                        >
                          {prefix}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">OpenFeature Evaluation Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['BOOLEAN', 'OBJECT', 'STRING', 'NUMBER'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          disabled={isEditing}
                          onClick={() => handleTypeChange(t)}
                          className={`py-2 px-2 rounded-lg text-xs font-mono font-bold transition-all text-center ${
                            type === t
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'bg-[#0c1322] text-slate-400 hover:text-white border border-[#1b2a47]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Descriptive Purpose & Context</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the business purpose, release target, or operational behavior of this flag..."
                    className="w-full bg-[#0c1322] border border-[#1b2a47] rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Lifecycle State & Scopes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Flag Lifecycle State</label>
                    <select
                      value={lifecycleState}
                      onChange={(e) => setLifecycleState(e.target.value)}
                      className="w-full bg-[#0c1322] border border-[#1b2a47] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="ENABLED">ENABLED — Active & evaluating rules</option>
                      <option value="DISABLED">DISABLED — Safely returns default fallback</option>
                      <option value="DRAFT">DRAFT — Not evaluable in production</option>
                      <option value="GRADUATED">GRADUATED — Feature permanent (frozen)</option>
                    </select>
                  </div>

                  {/* App Scopes / Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Consuming Application Scopes</label>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#0c1322] border border-[#1b2a47] rounded-lg min-h-[38px]">
                      {appTags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#111a2e] text-teal-300 font-mono text-xs border border-[#1b2a47]"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => setAppTags(appTags.filter((t) => t !== tag))}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}

                      <input
                        type="text"
                        placeholder="+ add scope tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTag.trim()) {
                            e.preventDefault();
                            if (!appTags.includes(newTag.trim())) {
                              setAppTags([...appTags, newTag.trim()]);
                            }
                            setNewTag('');
                          }
                        }}
                        className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-1 font-mono flex-1 min-w-[100px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: VARIANTS & SCHEMA */}
            {activeSection === 'VARIANTS' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Variant Dictionary & JSON Schema</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure all possible values for this flag and enforce schema integrity for structured payloads.
                  </p>
                </div>

                {/* Default Variant Selector */}
                <div className="p-4 rounded-xl bg-[#0c1322] border border-[#1b2a47] flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">Default Fallback Variant</label>
                    <p className="text-[11px] text-slate-400">
                      Served when rules do not match or when a client evaluation errors.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={defaultVariant}
                    onChange={(e) => setDefaultVariant(e.target.value)}
                    className="w-48 bg-[#111a2e] border border-[#1b2a47] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-teal-300 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Variants Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Variants Definition (Key-Value JSON)
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">Format: Valid JSON Object</span>
                  </div>
                  <div className="rounded-xl border border-[#1b2a47] bg-[#0c1322] p-3">
                    <textarea
                      value={variantsJson}
                      onChange={(e) => setVariantsJson(e.target.value)}
                      rows={8}
                      className="w-full bg-transparent text-xs font-mono text-slate-100 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* JSON Schema (for OBJECT flags) */}
                {type === 'OBJECT' && (
                  <div className="space-y-3 p-4 rounded-xl bg-[#0c1322] border border-[#1b2a47]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileJson className="w-4 h-4 text-teal-400" />
                        <label className="text-xs font-bold text-white">
                          JSON Schema Validation (Draft 2020-12 / Draft 7)
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestSchema}
                        className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all cursor-pointer"
                      >
                        Validate Schema
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Ensures payloads saved in this flag conform to enterprise schema before persistence.
                    </p>

                    <div className="rounded-lg border border-[#16223b] bg-[#070b14] p-3">
                      <textarea
                        value={schemaJson}
                        onChange={(e) => setSchemaJson(e.target.value)}
                        rows={8}
                        className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
                        placeholder="Paste JSON Schema specification here..."
                      />
                    </div>

                    {schemaTestResult && (
                      <div
                        className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                          schemaTestResult.success
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/60 border-rose-800 text-rose-300'
                        }`}
                      >
                        {schemaTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{schemaTestResult.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Section 3: DEPENDENCIES & PREREQUISITES */}
            {activeSection === 'DEPENDENCIES' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Upstream Prerequisite Dependencies
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Prerequisite flags must evaluate to a specific variant before this flag evaluates its rules.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPrerequisite}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-950 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Prerequisite</span>
                  </button>
                </div>

                {prerequisites.length === 0 ? (
                  <div className="p-10 rounded-xl bg-[#0c1322] border border-[#1b2a47] text-center space-y-2">
                    <Link2 className="w-8 h-8 text-slate-600 mx-auto" />
                    <h4 className="font-bold text-white text-xs">No Prerequisite Dependencies</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      This flag evaluates independently without requiring upstream flags to be enabled first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prerequisites.map((prereq, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-xl bg-[#0c1322] border border-[#1b2a47] flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="p-2 rounded-lg bg-[#111a2e] text-teal-400 border border-[#1b2a47]">
                            <Link2 className="w-4 h-4" />
                          </span>

                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                Prerequisite Flag
                              </label>
                              <select
                                value={prereq.flagKey}
                                onChange={(e) => handleUpdatePrerequisite(index, 'flagKey', e.target.value)}
                                className="w-full bg-[#111a2e] border border-[#1b2a47] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                              >
                                {allFlags
                                  .filter((f) => f.key !== key)
                                  .map((f) => (
                                    <option key={f.key} value={f.key}>
                                      {f.key}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                Required Variant
                              </label>
                              <input
                                type="text"
                                value={prereq.variant}
                                onChange={(e) => handleUpdatePrerequisite(index, 'variant', e.target.value)}
                                placeholder="on"
                                className="w-full bg-[#111a2e] border border-[#1b2a47] rounded-lg px-3 py-1.5 text-xs font-mono text-teal-300 font-bold focus:outline-none focus:border-teal-500"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePrerequisite(index)}
                          className="p-2 rounded-lg bg-[#111a2e] text-slate-400 hover:text-rose-400 border border-[#1b2a47]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section 4: TARGETING RULES & ROLLOUTS */}
            {activeSection === 'RULES' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Targeting Rule Hierarchy & Canary Rollouts
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Rules are evaluated in strict priority order (1, 2, 3). The first matching rule resolves.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-950 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Targeting Rule</span>
                  </button>
                </div>

                {rules.length === 0 ? (
                  <div className="p-10 rounded-xl bg-[#0c1322] border border-[#1b2a47] text-center space-y-2">
                    <Sliders className="w-8 h-8 text-slate-600 mx-auto" />
                    <h4 className="font-bold text-white text-xs">No Custom Targeting Rules</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      All incoming OFREP evaluations will resolve to default variant "{defaultVariant}".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rules.map((rule, index) => (
                      <div
                        key={rule.id || index}
                        className="p-4 rounded-xl bg-[#0c1322] border border-[#1b2a47] space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-[#16223b] pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-full bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-mono font-bold text-xs">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-white">
                              Rule #{index + 1} (Priority {rule.priority || index + 1})
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono text-[10px] font-bold">
                              ACTIVE
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRule(index)}
                              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-[#111a2e]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Condition JSON */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Condition Match Expression (JSON Context Attributes)</span>
                            {segments.length > 0 && (
                              <span className="text-teal-400 font-mono normal-case">
                                Segment templates available
                              </span>
                            )}
                          </div>
                          <textarea
                            rows={3}
                            value={JSON.stringify(rule.condition, null, 2)}
                            onChange={(e) => handleUpdateRule(index, 'condition', e.target.value)}
                            className="w-full bg-[#111a2e] border border-[#1b2a47] rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500 resize-none leading-relaxed"
                          />
                        </div>

                        {/* Serve Variant & Rollout Slider */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              Serves Variant
                            </label>
                            <input
                              type="text"
                              value={rule.variant || defaultVariant}
                              onChange={(e) => handleUpdateRule(index, 'variant', e.target.value)}
                              className="w-full bg-[#111a2e] border border-[#1b2a47] rounded-lg px-3 py-1.5 text-xs font-mono text-teal-300 font-bold focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                              <span>Gradual Canary Rollout %</span>
                              <span className="font-mono text-amber-300">
                                {rule.rollout?.percentage ? `${rule.rollout.percentage}%` : '100% Direct'}
                              </span>
                            </div>

                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={rule.rollout?.percentage || 100}
                              onChange={(e) => handleUpdateRule(index, 'percentage', e.target.value)}
                              className="w-full accent-teal-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section 5: GOVERNANCE & AUDIT */}
            {activeSection === 'GOVERNANCE' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Governance & Change Justification
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Audit change justification required for production flag changes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Change Request Ticket ID (ITSM / Jira)
                    </label>
                    <input
                      type="text"
                      value={changeTicket}
                      onChange={(e) => setChangeTicket(e.target.value)}
                      placeholder="CHG-9281"
                      className="w-full bg-[#0c1322] border border-[#1b2a47] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Author / Operator ID</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="admin-architect"
                      className="w-full bg-[#0c1322] border border-[#1b2a47] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Business Justification & Blast Radius Assessment
                  </label>
                  <textarea
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    rows={4}
                    placeholder="Provide release rationale, rollout schedule, and risk mitigation plan for audit trail..."
                    className="w-full bg-[#0c1322] border border-[#1b2a47] rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#0c1322] border border-emerald-800/60 flex items-start space-x-3 text-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-white">Governance & Audit Trail Declaration</div>
                    <div className="text-slate-400 text-[11px] leading-relaxed">
                      All modifications create an immutable audit entry in the database.
                      Production activations trigger instant SSE notifications across all listening banking pods.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pre-Flight Validation Deck & OFREP Dry-Run Sandbox (35% width) */}
        <aside className="w-[380px] xl:w-[440px] bg-[#0c1322] flex flex-col shrink-0 h-full overflow-hidden select-none">
          {/* Header */}
          <div className="p-4 border-b border-[#16223b] bg-[#090f1c] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <h4 className="font-bold text-white text-xs">Pre-Flight Validation & Simulation</h4>
            </div>
            <span className="font-mono text-[10px] text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
              Live Preview
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* 1. Validation Checklist */}
            <div className="p-3.5 rounded-xl bg-[#111a2e] border border-[#1b2a47] space-y-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Pre-Flight Checklist
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center space-x-2">
                  {key.trim() ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className={key.trim() ? 'text-slate-300' : 'text-amber-300'}>
                    Flag Key specified ({key || 'Missing'})
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">Default Variant: "{defaultVariant}"</span>
                </div>

                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">{rules.length} Custom Targeting Rules</span>
                </div>

                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">
                    {prerequisites.length} Upstream Prerequisites
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Interactive OFREP Dry-Run Evaluation Sandbox */}
            <div className="p-3.5 rounded-xl bg-[#111a2e] border border-[#1b2a47] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-teal-300 font-bold text-xs">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>OFREP Dry-Run Sandbox</span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateDryRun}
                  className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold text-[10px] transition-all cursor-pointer"
                >
                  Simulate
                </button>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Test sample user evaluation context against this draft flag before publishing.
              </p>

              {/* Sample Context Input */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-mono">Sample Context JSON:</span>
                <textarea
                  rows={4}
                  value={testContextJson}
                  onChange={(e) => setTestContextJson(e.target.value)}
                  className="w-full bg-[#070b14] border border-[#16223b] rounded-lg p-2 font-mono text-[11px] text-slate-200 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Simulation Result */}
              {dryRunResult && (
                <div className="p-3 rounded-lg bg-[#070b14] border border-teal-900/60 space-y-2">
                  {dryRunResult.error ? (
                    <div className="text-rose-300 text-[11px] font-mono">{dryRunResult.error}</div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold">Resolved Variant:</span>
                        <span className="font-mono font-bold text-teal-300 text-xs">
                          {dryRunResult.resolvedVariant}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold">Reason:</span>
                        <span className="font-mono text-emerald-400 font-semibold text-[10px]">
                          {dryRunResult.reason}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 italic">
                        Path: {dryRunResult.matchedRule}
                      </div>

                      <div className="mt-1 pt-1 border-t border-[#16223b]">
                        <span className="text-[10px] text-slate-500 block mb-0.5">Value Preview:</span>
                        <div className="font-mono text-[11px] text-emerald-300 max-h-24 overflow-y-auto">
                          {typeof dryRunResult.resolvedValue === 'object' ? (
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(dryRunResult.resolvedValue, null, 2)}
                            </pre>
                          ) : (
                            <span>{String(dryRunResult.resolvedValue)}</span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 3. Server-Side Automated Blast Radius & Dependency Impact */}
            <div className="p-3.5 rounded-xl bg-[#111a2e] border border-[#1b2a47] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-300 uppercase block">
                    Blast Radius & Dependency Impact
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Stateless multi-cohort simulation
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRunBatchImpactSimulation}
                  disabled={simulatingBatch}
                  className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold text-[10px] flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {simulatingBatch ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Simulating...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-3 h-3" />
                      <span>Analyze Impact</span>
                    </>
                  )}
                </button>
              </div>

              {batchImpactResult ? (
                <div className="space-y-2.5 pt-1">
                  {/* Blast Radius Percentage & Risk */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300">
                      Calculated Blast Radius: <strong className="font-mono text-white">{batchImpactResult.blastRadiusPercentage}%</strong>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        batchImpactResult.riskRating === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : batchImpactResult.riskRating === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {batchImpactResult.riskRating} RISK
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-[#070b14] h-2 rounded-full overflow-hidden border border-[#16223b]">
                    <div
                      className={`h-full transition-all duration-500 ${
                        batchImpactResult.riskRating === 'HIGH'
                          ? 'bg-rose-500'
                          : batchImpactResult.riskRating === 'MEDIUM'
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.max(batchImpactResult.blastRadiusPercentage, 5)}%` }}
                    />
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    {batchImpactResult.contextsWithChanges} of {batchImpactResult.totalContextsEvaluated} synthetic banking cohorts affected.
                  </div>

                  {/* Prerequisite Failure Alert */}
                  {batchImpactResult.prerequisiteFailuresCount > 0 && (
                    <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-[10px] space-y-1">
                      <div className="font-bold flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Cascading Prerequisite Failure Detected</span>
                      </div>
                      <div>
                        {batchImpactResult.prerequisiteFailuresCount} cohort(s) in downstream flags failed prerequisites due to this draft change!
                      </div>
                    </div>
                  )}

                  {/* Downstream Impacted Flags List */}
                  {batchImpactResult.downstreamImpacts.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[#16223b]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Downstream Impacted Flags ({batchImpactResult.downstreamImpacts.length})
                      </span>
                      {batchImpactResult.downstreamImpacts.map((dep) => (
                        <div
                          key={dep.flagKey}
                          className="p-2 rounded bg-[#070b14] border border-[#16223b] font-mono text-[10px] space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-slate-200 font-bold">
                            <span className="truncate">{dep.flagKey}</span>
                            <span className="text-amber-400 ml-2">{dep.impactedContexts} cohorts</span>
                          </div>
                          {dep.prerequisiteFailures > 0 && (
                            <div className="text-rose-400">
                              ⚠️ {dep.prerequisiteFailures} cohorts trigger PREREQUISITE_FAILED
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  Click <strong className="text-teal-400">Analyze Impact</strong> to simulate this proposed flag across 30+ synthetic banking cohorts (SG, HK, US, PH) and verify that no downstream dependent flags break.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
