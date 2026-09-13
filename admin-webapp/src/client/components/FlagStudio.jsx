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
  X,
  Briefcase,
  Terminal,
  UserCheck,
  ChevronDown,
  Wand2,
  Settings2,
  Globe,
  Award,
  Users
} from 'lucide-react';
import axios from 'axios';

// Bank Customer Personas for Live Testing
const BANK_PERSONAS = [
  {
    key: 'user-sg-vip',
    name: 'Sophia Chen',
    role: 'Premier VIP',
    country: 'SG',
    tier: 'PREMIUM',
    flag: '🇸🇬',
    context: {
      targetingKey: 'user-sg-vip',
      country: 'SG',
      userTier: 'PREMIUM',
      businessUnit: 'Wealth Management',
      appId: 'webapp',
      environment: 'PROD-SG-HUB'
    }
  },
  {
    key: 'user-hk-vip',
    name: 'Marcus Leung',
    role: 'Private Wealth',
    country: 'HK',
    tier: 'PREMIUM',
    flag: '🇭🇰',
    context: {
      targetingKey: 'user-hk-vip',
      country: 'HK',
      userTier: 'PREMIUM',
      businessUnit: 'Wealth Management',
      appId: 'webapp',
      environment: 'PROD-SG-HUB'
    }
  },
  {
    key: 'user-ae-standard',
    name: 'Rashid Al-Maktoum',
    role: 'Commercial Client',
    country: 'AE',
    tier: 'STANDARD',
    flag: '🇦🇪',
    context: {
      targetingKey: 'user-ae-standard',
      country: 'AE',
      userTier: 'STANDARD',
      businessUnit: 'Treasury & Markets',
      appId: 'webapp',
      environment: 'PROD-SG-HUB'
    }
  },
  {
    key: 'user-in-standard',
    name: 'Priya Sharma',
    role: 'Standard Retail',
    country: 'IN',
    tier: 'STANDARD',
    flag: '🇮🇳',
    context: {
      targetingKey: 'user-in-standard',
      country: 'IN',
      userTier: 'STANDARD',
      businessUnit: 'Retail Banking',
      appId: 'webapp',
      environment: 'PROD-SG-HUB'
    }
  },
  {
    key: 'user-beta-01',
    name: 'Alex Rivera',
    role: 'Beta Tester',
    country: 'SG',
    tier: 'STANDARD',
    flag: '🧪',
    context: {
      targetingKey: 'user-beta-01',
      country: 'SG',
      userTier: 'STANDARD',
      businessUnit: 'Retail Banking',
      appId: 'webapp',
      environment: 'PROD-SG-HUB'
    }
  }
];

// Presets and Templates for Fast Business Flag Creation
const FLAG_TEMPLATES = [
  {
    id: 'FEATURE_RELEASE',
    title: 'Feature Release Toggle',
    badge: 'Standard Toggle',
    badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    description: 'Safe on/off switch for new web and mobile features with optional gradual percentage rollout.',
    icon: '🚀',
    keyPrefix: 'feature.',
    defaultKey: 'feature.new-capability',
    type: 'BOOLEAN',
    defaultVariant: 'off',
    variants: { on: true, off: false },
    appTags: ['webapp', 'bff'],
    descriptionText: 'Controls visibility of the new feature capability with safe fallback.',
    sampleRule: {
      id: 'rule-rollout-50',
      priority: 1,
      description: '50% Gradual canary rollout for early testers',
      condition: { country: ['SG', 'HK'] },
      variant: 'on',
      rollout: {
        attribute: 'targetingKey',
        percentage: 50,
        variant: 'on',
        fallbackVariant: 'off'
      }
    }
  },
  {
    id: 'AUDIENCE_GATE',
    title: 'Regional & Tier Gate',
    badge: 'Audience Targeting',
    badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800',
    description: 'Target specific jurisdictions (SG, HK, UAE, India) or Premier Wealth customer segments.',
    icon: '🎯',
    keyPrefix: 'feature.',
    defaultKey: 'feature.regional-premier-service',
    type: 'BOOLEAN',
    defaultVariant: 'off',
    variants: { on: true, off: false },
    appTags: ['webapp', 'bff'],
    descriptionText: 'Regional and tier-gated feature governed by cross-border regulatory rules.',
    sampleRule: {
      id: 'rule-apac-vip',
      priority: 1,
      description: 'Activate for Singapore & Hong Kong Premier Wealth accounts',
      condition: { country: ['SG', 'HK'], userTier: 'PREMIUM' },
      variant: 'on'
    }
  },
  {
    id: 'MARKETING_BANNER',
    title: 'Operational Notice / Banner',
    badge: 'Dynamic Config',
    badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800',
    description: 'Publish maintenance notices, marketing banners, and service alerts to portal users.',
    icon: '📢',
    keyPrefix: 'config.banner-',
    defaultKey: 'config.banner-announcement',
    type: 'OBJECT',
    defaultVariant: 'off',
    variants: {
      off: null,
      maintenance: {
        title: 'Scheduled Maintenance',
        message: 'Core banking transfers offline from 02:00 to 04:00 SGT for database upgrades.',
        severity: 'warning',
        dismissible: true
      },
      promo: {
        title: 'Apex Wealth Premier 2026',
        message: 'Exclusive 3.8% SGD fixed deposit yields active for accredited private wealth accounts.',
        severity: 'info',
        dismissible: true
      }
    },
    appTags: ['webapp'],
    descriptionText: 'Customer announcement banner with live severity state.',
    sampleRule: {
      id: 'rule-sg-maintenance',
      priority: 1,
      description: 'Display scheduled maintenance warning in Singapore jurisdiction',
      condition: { country: 'SG' },
      variant: 'maintenance'
    }
  },
  {
    id: 'SRE_CONFIG',
    title: 'System Limits & AI Parameters',
    badge: 'SRE Object',
    badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800',
    description: 'Tune model token budgets, temperature, and API rate limits with JSON Schema validation.',
    icon: '⚙️',
    keyPrefix: 'config.',
    defaultKey: 'config.service-limits',
    type: 'OBJECT',
    defaultVariant: 'standard',
    variants: {
      standard: { maxTokens: 500, temperature: 0.2, rateLimitPerMin: 10 },
      premium: { maxTokens: 2000, temperature: 0.7, rateLimitPerMin: 50 }
    },
    schema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['maxTokens', 'temperature'],
      properties: {
        maxTokens: { type: 'integer', minimum: 100 },
        temperature: { type: 'number', minimum: 0, maximum: 1 }
      }
    },
    appTags: ['bff', 'api'],
    descriptionText: 'Runtime service limits and quota parameters.',
    sampleRule: {
      id: 'rule-vip-allowance',
      priority: 1,
      description: 'Expanded quotas for Premier tier',
      condition: { userTier: 'PREMIUM' },
      variant: 'premium'
    }
  }
];

// Helper: Parse raw condition object into visual form clauses
function conditionToClauses(condition) {
  if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
    return [{ attribute: 'country', operator: 'in', values: ['SG'] }];
  }
  const clauses = [];
  for (const [key, val] of Object.entries(condition)) {
    if (key === 'segmentId' || key === 'segment') {
      clauses.push({
        attribute: 'segmentId',
        operator: 'equals',
        values: typeof val === 'string' ? [val] : Array.isArray(val) ? val : [String(val)]
      });
    } else if (Array.isArray(val)) {
      clauses.push({
        attribute: key,
        operator: 'in',
        values: val
      });
    } else if (typeof val === 'object' && val !== null) {
      if (val.in && Array.isArray(val.in)) {
        clauses.push({ attribute: key, operator: 'in', values: val.in });
      } else if (val.notIn && Array.isArray(val.notIn)) {
        clauses.push({ attribute: key, operator: 'notIn', values: val.notIn });
      } else {
        clauses.push({ attribute: key, operator: 'equals', values: [JSON.stringify(val)] });
      }
    } else {
      clauses.push({
        attribute: key,
        operator: 'equals',
        values: [String(val)]
      });
    }
  }
  return clauses.length > 0 ? clauses : [{ attribute: 'country', operator: 'in', values: ['SG'] }];
}

// Helper: Convert visual clauses back into raw condition object
function clausesToCondition(clauses) {
  const condition = {};
  for (const clause of clauses) {
    const attr = clause.attribute || 'country';
    const op = clause.operator || 'equals';
    const vals = clause.values || [];

    if (attr === 'segmentId') {
      condition.segmentId = vals[0] || 'segment-apac-premier';
    } else if (op === 'in') {
      condition[attr] = vals.length > 0 ? vals : ['SG'];
    } else if (op === 'notIn') {
      condition[attr] = { notIn: vals.length > 0 ? vals : [] };
    } else {
      condition[attr] = vals[0] !== undefined ? vals[0] : '';
    }
  }
  return condition;
}

// Helper: Generate natural language explanation for a targeting rule
function generateNaturalLanguageRule(rule, defaultVariant, segments = []) {
  if (!rule) return '';
  const clauses = conditionToClauses(rule.condition);
  const conditionDescriptions = clauses.map((c) => {
    if (c.attribute === 'segmentId') {
      const segName = segments.find((s) => s.id === c.values[0])?.name || c.values[0] || 'Audience Segment';
      return `in segment "${segName}"`;
    }
    const attrLabels = {
      country: 'Country',
      userTier: 'Customer Tier',
      targetingKey: 'User Targeting Key',
      appId: 'Application',
      businessUnit: 'Business Unit'
    };
    const attrLabel = attrLabels[c.attribute] || c.attribute;
    const valStr = c.values.join(', ') || '(none)';

    if (c.operator === 'in') {
      return `${attrLabel} is one of [${valStr}]`;
    }
    if (c.operator === 'notIn') {
      return `${attrLabel} is NOT in [${valStr}]`;
    }
    return `${attrLabel} is "${valStr}"`;
  });

  const ifPart = conditionDescriptions.length > 0 ? conditionDescriptions.join(' AND ') : 'Any incoming request';
  const targetVariant = rule.variant || defaultVariant;

  let rolloutPart = `serve variant "${targetVariant}" to 100% of matching requests`;
  if (rule.rollout?.percentage && rule.rollout.percentage < 100) {
    rolloutPart = `roll out variant "${rule.rollout.variant || targetVariant}" to ${rule.rollout.percentage}% of matching users (and "${rule.rollout.fallbackVariant || defaultVariant}" to remaining)`;
  }

  return `If ${ifPart}, then ${rolloutPart}.`;
}

export default function FlagStudio({
  flag,
  isEditing,
  apiUrl,
  onClose,
  onSaved,
  allFlags = [],
  environment = 'PROD-US-EAST'
}) {
  // Studio Mode: BUSINESS (Default visual no-code) vs SRE (Technical JSON/schema)
  const [studioMode, setStudioMode] = useState(() => {
    try {
      return localStorage.getItem('of_studio_mode_pref') || 'BUSINESS';
    } catch {
      return 'BUSINESS';
    }
  });

  const handleModeChange = (newMode) => {
    setStudioMode(newMode);
    try {
      localStorage.setItem('of_studio_mode_pref', newMode);
    } catch {}
  };

  // Studio Navigation Tabs
  const [activeSection, setActiveSection] = useState('IDENTITY'); // IDENTITY, VARIANTS, DEPENDENCIES, RULES, GOVERNANCE

  // Template Picker State (Shown on new flag creation)
  const [selectedTemplateId, setSelectedTemplateId] = useState(isEditing ? null : 'FEATURE_RELEASE');
  const [showTemplateModal, setShowTemplateModal] = useState(!isEditing);

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
  const [author, setAuthor] = useState('bizops-manager');

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

  // Visual rule JSON editor expansion toggles (index map)
  const [expandedJsonRules, setExpandedJsonRules] = useState({});

  // Pre-Flight Simulation & Validation State
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [schemaTestResult, setSchemaTestResult] = useState(null);

  // Right-hand simulation tab: 'PERSONAS' (Business) or 'RAW_JSON' (SRE)
  const [simulationTab, setSimulationTab] = useState('PERSONAS');
  const [selectedPersonaKey, setSelectedPersonaKey] = useState('user-sg-vip');
  const [personaVerdict, setPersonaVerdict] = useState(null);

  const [testContextJson, setTestContextJson] = useState(
    JSON.stringify(
      {
        targetingKey: 'sg-wealth-client-88',
        country: 'SG',
        businessUnit: 'Wealth Management',
        userTier: 'PREMIUM',
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

  // Apply Template
  const handleApplyTemplate = (templateId) => {
    const template = FLAG_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedTemplateId(templateId);
    setKey(template.defaultKey);
    setType(template.type);
    setDefaultVariant(template.defaultVariant);
    setVariantsJson(JSON.stringify(template.variants, null, 2));
    setAppTags(template.appTags);
    setDescription(template.descriptionText);
    if (template.schema) {
      setSchemaJson(JSON.stringify(template.schema, null, 2));
    } else {
      setSchemaJson('');
    }
    if (template.sampleRule) {
      setRules([template.sampleRule]);
    } else {
      setRules([]);
    }
    setShowTemplateModal(false);
  };

  // Handle Type Change
  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'BOOLEAN') {
      setVariantsJson(JSON.stringify({ on: true, off: false }, null, 2));
      setDefaultVariant('on');
      setSchemaJson('');
    } else if (newType === 'STRING') {
      setVariantsJson(JSON.stringify({ standard: 'Standard Feature', preview: 'Preview Beta' }, null, 2));
      setDefaultVariant('standard');
      setSchemaJson('');
    } else if (newType === 'NUMBER') {
      setVariantsJson(JSON.stringify({ baseline: 10, boosted: 50 }, null, 2));
      setDefaultVariant('baseline');
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

  // Prerequisite Handlers
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

  // Rule Handlers
  const handleAddRule = () => {
    const newRule = {
      id: `rule-${Date.now().toString().slice(-4)}`,
      priority: rules.length + 1,
      description: 'Target specific region, tier, or percentage',
      condition: { country: ['SG'] },
      variant: defaultVariant
    };
    setRules([...rules, newRule]);
  };

  const handleUpdateRule = (index, field, value) => {
    const updated = [...rules];
    if (field === 'condition') {
      try {
        updated[index].condition = typeof value === 'object' ? value : JSON.parse(value);
      } catch (e) {
        // preserve input
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

  // Visual Clause Manipulation for a Rule
  const handleUpdateRuleClause = (ruleIdx, clauseIdx, field, value) => {
    const updated = [...rules];
    const clauses = conditionToClauses(updated[ruleIdx].condition);
    clauses[clauseIdx][field] = value;
    updated[ruleIdx].condition = clausesToCondition(clauses);
    setRules(updated);
  };

  const handleAddRuleClause = (ruleIdx) => {
    const updated = [...rules];
    const clauses = conditionToClauses(updated[ruleIdx].condition);
    clauses.push({ attribute: 'userTier', operator: 'equals', values: ['PREMIUM'] });
    updated[ruleIdx].condition = clausesToCondition(clauses);
    setRules(updated);
  };

  const handleRemoveRuleClause = (ruleIdx, clauseIdx) => {
    const updated = [...rules];
    let clauses = conditionToClauses(updated[ruleIdx].condition);
    clauses = clauses.filter((_, i) => i !== clauseIdx);
    if (clauses.length === 0) {
      clauses.push({ attribute: 'country', operator: 'in', values: ['SG'] });
    }
    updated[ruleIdx].condition = clausesToCondition(clauses);
    setRules(updated);
  };

  // Run Persona Evaluation Simulation
  useEffect(() => {
    const persona = BANK_PERSONAS.find((p) => p.key === selectedPersonaKey) || BANK_PERSONAS[0];
    if (!persona) return;

    try {
      let parsedVariants = {};
      try {
        parsedVariants = JSON.parse(variantsJson);
      } catch {
        parsedVariants = { [defaultVariant]: true };
      }

      if (lifecycleState === 'DISABLED') {
        setPersonaVerdict({
          variant: defaultVariant,
          value: parsedVariants[defaultVariant],
          reason: 'DISABLED',
          matchedRuleText: 'Flag is Disabled. Safely serves default fallback variant to all users.'
        });
        return;
      }

      // Check prerequisites
      for (const prereq of prerequisites) {
        const prereqFlag = allFlags.find((f) => f.key === prereq.flagKey);
        if (prereqFlag && prereqFlag.state === 'DISABLED') {
          setPersonaVerdict({
            variant: defaultVariant,
            value: parsedVariants[defaultVariant],
            reason: 'PREREQUISITE_FAILED',
            matchedRuleText: `Prerequisite "${prereq.flagKey}" is disabled in runtime.`
          });
          return;
        }
      }

      // Check Rules
      let matched = null;
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        let ruleMatches = true;

        if (rule.condition) {
          for (const [prop, targetVal] of Object.entries(rule.condition)) {
            if (prop === 'segmentId') {
              const seg = segments.find((s) => s.id === targetVal);
              if (seg) {
                try {
                  const segCond = JSON.parse(seg.condition);
                  for (const [sProp, sVal] of Object.entries(segCond)) {
                    const ctxVal = persona.context[sProp];
                    if (Array.isArray(sVal)) {
                      if (!sVal.includes(ctxVal)) ruleMatches = false;
                    } else if (ctxVal !== sVal) {
                      ruleMatches = false;
                    }
                  }
                } catch {}
              }
              continue;
            }

            const ctxVal = persona.context[prop];
            if (Array.isArray(targetVal)) {
              if (!targetVal.includes(ctxVal)) ruleMatches = false;
            } else if (typeof targetVal === 'object' && targetVal !== null) {
              if (targetVal.in && !targetVal.in.includes(ctxVal)) ruleMatches = false;
              if (targetVal.notIn && targetVal.notIn.includes(ctxVal)) ruleMatches = false;
            } else if (targetVal !== ctxVal) {
              ruleMatches = false;
            }
          }
        }

        if (ruleMatches) {
          matched = { rule, index: i + 1 };
          break;
        }
      }

      if (matched) {
        let variantToServe = matched.rule.variant || defaultVariant;
        let explanation = `Matched Rule #${matched.index}: ${matched.rule.description || 'Custom targeting match'}`;
        if (matched.rule.rollout) {
          explanation += ` (${matched.rule.rollout.percentage}% Canary Rollout)`;
        }
        setPersonaVerdict({
          variant: variantToServe,
          value: parsedVariants[variantToServe],
          reason: 'TARGETING_MATCH',
          matchedRuleText: explanation
        });
      } else {
        setPersonaVerdict({
          variant: defaultVariant,
          value: parsedVariants[defaultVariant],
          reason: 'DEFAULT',
          matchedRuleText: `No custom rules matched. Safely serves default variant "${defaultVariant}".`
        });
      }
    } catch (err) {
      setPersonaVerdict({
        variant: defaultVariant,
        value: null,
        reason: 'ERROR',
        matchedRuleText: `Simulation error: ${err.message}`
      });
    }
  }, [selectedPersonaKey, rules, variantsJson, defaultVariant, lifecycleState, prerequisites, allFlags, segments]);

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

  // Run Raw Context Dry-Run
  const handleSimulateDryRun = () => {
    try {
      let parsedVariants = JSON.parse(variantsJson);
      let parsedContext = JSON.parse(testContextJson);

      if (lifecycleState === 'DISABLED') {
        setDryRunResult({
          resolvedVariant: defaultVariant,
          resolvedValue: parsedVariants[defaultVariant],
          reason: 'DISABLED',
          matchedRule: 'Flag Disabled (Safely returns default variant)'
        });
        return;
      }

      let matched = null;
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        let ruleMatches = true;

        if (rule.condition) {
          for (const [prop, targetVal] of Object.entries(rule.condition)) {
            const ctxVal = parsedContext[prop];
            if (Array.isArray(targetVal)) {
              if (!targetVal.includes(ctxVal)) ruleMatches = false;
            } else if (targetVal !== ctxVal) {
              ruleMatches = false;
            }
          }
        }

        if (ruleMatches) {
          matched = { rule, index: i + 1 };
          break;
        }
      }

      if (matched) {
        setDryRunResult({
          resolvedVariant: matched.rule.variant,
          resolvedValue: parsedVariants[matched.rule.variant],
          reason: 'TARGETING_MATCH',
          matchedRule: `Matched Rule #${matched.index}`
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
      setDryRunResult({ error: err.message });
    }
  };

  // Run Server-Side Batch Impact Simulation
  const handleRunBatchImpactSimulation = async () => {
    try {
      setSimulatingBatch(true);
      const parsedVariants = JSON.parse(variantsJson);
      let parsedSchema = null;
      if (schemaJson.trim()) {
        try {
          parsedSchema = JSON.parse(schemaJson);
        } catch {}
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

      const res = await axios.post(`${apiUrl}/api/v1/admin/simulate-impact`, { proposedFlag });
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

    let parsedVariants, parsedSchema = null;
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
    { id: 'IDENTITY', label: '1. Identity & Scope' },
    { id: 'VARIANTS', label: '2. Values & Variants' },
    { id: 'DEPENDENCIES', label: `3. Dependencies (${prerequisites.length})` },
    { id: 'RULES', label: `4. Targeting Rules (${rules.length})` },
    { id: 'GOVERNANCE', label: '5. Governance & Audit' }
  ];

  const parsedVariantsObj = (() => {
    try {
      return JSON.parse(variantsJson);
    } catch {
      return {};
    }
  })();

  const availableVariantKeys = Object.keys(parsedVariantsObj);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col h-screen w-screen overflow-hidden select-none font-sans">
      {/* Template Selection Modal (Shown on creation) */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg">
                  ✨
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Choose a Flag Template
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Select a battle-tested template tailored to your business or technical release workflow.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FLAG_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl.id)}
                  className="p-4 rounded-xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{tmpl.icon}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${tmpl.badgeColor}`}>
                      {tmpl.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-zinc-100">
                    {tmpl.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedTemplateId(null);
                  setShowTemplateModal(false);
                }}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Start from blank custom flag
              </button>
              <span className="text-[11px] text-zinc-500 font-mono">
                You can switch between Business and SRE modes anytime.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Studio Command Bar */}
      <header className="h-16 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left: Exit & Flag Metadata */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Studio</span>
          </button>

          <div className="h-6 w-px bg-zinc-800" />

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-semibold text-sm text-white tracking-tight">
                {key || 'untitled.flag'}
              </span>

              <span className="px-2 py-0.2 rounded text-[10px] font-medium font-mono bg-zinc-800 text-zinc-200 border border-zinc-700">
                {type}
              </span>

              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                {lifecycleState}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              {isEditing ? 'Editing Flag Definition' : 'Authoring New OpenFeature Flag'}
            </div>
          </div>
        </div>

        {/* Center: DUAL-MODE SWITCHER (Business Mode vs SRE Mode) */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 shadow-inner">
          <button
            type="button"
            onClick={() => handleModeChange('BUSINESS')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              studioMode === 'BUSINESS'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Business Mode</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('SRE')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              studioMode === 'SRE'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SRE / Advanced</span>
          </button>
        </div>

        {/* Right: Actions & Template Picker Trigger */}
        <div className="flex items-center space-x-3">
          {!isEditing && (
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-medium cursor-pointer transition-colors"
              title="Browse flag creation templates"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Templates</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Discard
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs shadow-sm flex items-center space-x-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-900" />
                <span>Publishing to OFREP Engine...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-zinc-950" />
                <span>{isEditing ? 'Save & Deploy Changes' : 'Publish Flag'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Body: 2-Column Split Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Column: Authoring Workbench */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-800 overflow-hidden bg-zinc-950">
          {/* Studio Steps Navigation Bar */}
          <div className="h-12 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    activeSection === sec.id
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Mode Banner Indicator */}
            <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-zinc-400">
              {studioMode === 'BUSINESS' ? (
                <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                  <Briefcase className="w-3 h-3" />
                  <span>Visual No-Code Builder Active</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/60">
                  <Terminal className="w-3 h-3" />
                  <span>SRE Code & Schema Mode Active</span>
                </span>
              )}
            </div>
          </div>

          {/* Step Contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {validationError && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center space-x-3 text-xs animate-in fade-in duration-150">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{validationError}</span>
              </div>
            )}

            {/* Section 1: IDENTITY & SCOPES */}
            {activeSection === 'IDENTITY' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Identity, Key & Target Scopes</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {studioMode === 'BUSINESS'
                      ? 'Set the flag key, human-readable description, and target application scopes.'
                      : 'Define canonical OpenFeature namespace key, data primitive, and consuming service tags.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Flag Key */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Unique Flag Identifier Key *</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Immutable once published</span>
                    </label>
                    <input
                      type="text"
                      disabled={isEditing}
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="e.g. feature.wealth-forecast or config.chatbot-limits"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-zinc-500 disabled:opacity-50"
                    />
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-500">
                      <span>Quick Prefixes:</span>
                      <button
                        type="button"
                        onClick={() => setKey('feature.')}
                        className="hover:text-zinc-300 font-mono underline"
                      >
                        feature.
                      </button>
                      <span>&bull;</span>
                      <button
                        type="button"
                        onClick={() => setKey('config.')}
                        className="hover:text-zinc-300 font-mono underline"
                      >
                        config.
                      </button>
                    </div>
                  </div>

                  {/* Flag Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">OpenFeature Return Type *</label>
                    <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                      {['BOOLEAN', 'OBJECT', 'STRING', 'NUMBER'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          disabled={isEditing}
                          onClick={() => handleTypeChange(t)}
                          className={`py-1.5 px-2 rounded-md text-[11px] font-mono font-semibold transition-colors text-center ${
                            type === t
                              ? 'bg-zinc-100 text-zinc-950 shadow-xs'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white'
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
                  <label className="text-xs font-semibold text-zinc-300">Descriptive Purpose & Business Context</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Explain what this flag enables, the business rationale, and expected customer impact..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Lifecycle State & Scopes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Flag Lifecycle State</label>
                    <select
                      value={lifecycleState}
                      onChange={(e) => setLifecycleState(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                    >
                      <option value="ENABLED">ENABLED — Active & evaluating rules</option>
                      <option value="DISABLED">DISABLED — Safely returns default fallback</option>
                      <option value="DRAFT">DRAFT — Not evaluable in production</option>
                      <option value="GRADUATED">GRADUATED — Feature permanent (frozen)</option>
                    </select>
                  </div>

                  {/* App Scopes / Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Consuming Application Scopes</label>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-zinc-900 border border-zinc-800 rounded-lg min-h-[38px]">
                      {appTags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-xs border border-zinc-700"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => setAppTags(appTags.filter((t) => t !== tag))}
                            className="text-zinc-500 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}

                      <input
                        type="text"
                        placeholder="+ add scope..."
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
                        className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none px-1 font-mono flex-1 min-w-[100px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: VARIANTS & VALUES */}
            {activeSection === 'VARIANTS' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Variant Dictionary & Return Values</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {studioMode === 'BUSINESS'
                      ? 'Configure the possible outcomes of this flag and select the default fallback.'
                      : 'Manage JSON variant dictionary and enforce schema constraints for structured payloads.'}
                  </p>
                </div>

                {/* Default Fallback Selector */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">Default Fallback Variant</label>
                    <p className="text-[11px] text-zinc-400">
                      Served when no targeting rules match or when evaluation errors.
                    </p>
                  </div>
                  <select
                    value={defaultVariant}
                    onChange={(e) => setDefaultVariant(e.target.value)}
                    className="w-48 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                  >
                    {availableVariantKeys.map((vk) => (
                      <option key={vk} value={vk}>
                        {vk} {vk === defaultVariant ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* BUSINESS MODE: Visual Variant Cards */}
                {studioMode === 'BUSINESS' && type === 'BOOLEAN' ? (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-zinc-300 block">Feature Variations</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ON Card */}
                      <div
                        onClick={() => setDefaultVariant('on')}
                        className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          defaultVariant === 'on'
                            ? 'bg-emerald-950/40 border-emerald-600 ring-1 ring-emerald-500'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs font-mono text-emerald-400">🟢 Variant: ON</span>
                          <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                            true
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">
                          Feature is active and enabled for the user.
                        </p>
                        <div className="text-[11px] text-zinc-500 flex items-center space-x-1.5 pt-1">
                          <input
                            type="radio"
                            name="defaultVariantRadio"
                            checked={defaultVariant === 'on'}
                            onChange={() => setDefaultVariant('on')}
                            className="accent-emerald-500"
                          />
                          <span>{defaultVariant === 'on' ? 'Active Default Fallback' : 'Click to set as default'}</span>
                        </div>
                      </div>

                      {/* OFF Card */}
                      <div
                        onClick={() => setDefaultVariant('off')}
                        className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          defaultVariant === 'off'
                            ? 'bg-zinc-800 border-zinc-500 ring-1 ring-zinc-400'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs font-mono text-zinc-300">⚪ Variant: OFF</span>
                          <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                            false
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">
                          Feature is disabled. Clean baseline experience is served.
                        </p>
                        <div className="text-[11px] text-zinc-500 flex items-center space-x-1.5 pt-1">
                          <input
                            type="radio"
                            name="defaultVariantRadio"
                            checked={defaultVariant === 'off'}
                            onChange={() => setDefaultVariant('off')}
                            className="accent-zinc-400"
                          />
                          <span>{defaultVariant === 'off' ? 'Active Default Fallback' : 'Click to set as default'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SRE MODE or Non-Boolean: Full Raw JSON & Schema */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300">
                          Variants Dictionary (Key-Value JSON)
                        </label>
                        <span className="text-[11px] text-zinc-500 font-mono">Valid JSON Object</span>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                        <textarea
                          value={variantsJson}
                          onChange={(e) => setVariantsJson(e.target.value)}
                          rows={6}
                          className="w-full bg-transparent text-xs font-mono text-zinc-200 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* JSON Schema Validator for OBJECT */}
                    {type === 'OBJECT' && (
                      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-zinc-200">
                              JSON Schema Validator (Draft 2020-12)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleTestSchema}
                            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700"
                          >
                            Validate Schema
                          </button>
                        </div>

                        <textarea
                          rows={4}
                          value={schemaJson}
                          onChange={(e) => setSchemaJson(e.target.value)}
                          placeholder="JSON Schema specification..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none"
                        />

                        {schemaTestResult && (
                          <div
                            className={`p-2.5 rounded text-xs ${
                              schemaTestResult.success
                                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                                : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                            }`}
                          >
                            {schemaTestResult.message}
                          </div>
                        )}
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
                    <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
                      Upstream Prerequisite Dependencies
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Ensure parent flags evaluate to specific variants before this flag is evaluated.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPrerequisite}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Prerequisite</span>
                  </button>
                </div>

                {prerequisites.length === 0 ? (
                  <div className="p-10 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
                    <Link2 className="w-8 h-8 text-zinc-600 mx-auto" />
                    <h4 className="font-semibold text-zinc-200 text-xs">No Prerequisite Dependencies</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      This flag evaluates independently without requiring upstream flags to be active first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prerequisites.map((prereq, index) => {
                      const targetParentFlag = allFlags.find((f) => f.key === prereq.flagKey);
                      const parentVariants = targetParentFlag
                        ? Object.keys(targetParentFlag.variants || {})
                        : ['on', 'off'];

                      return (
                        <div
                          key={index}
                          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="p-1.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                                <Link2 className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-semibold text-zinc-200">
                                Prerequisite #{index + 1}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePrerequisite(index)}
                              className="p-1 rounded text-zinc-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
                                Requires Flag
                              </label>
                              <select
                                value={prereq.flagKey}
                                onChange={(e) => handleUpdatePrerequisite(index, 'flagKey', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
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
                              <label className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
                                To Equal Variant
                              </label>
                              <select
                                value={prereq.variant}
                                onChange={(e) => handleUpdatePrerequisite(index, 'variant', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 font-semibold focus:outline-none focus:border-zinc-500 cursor-pointer"
                              >
                                {parentVariants.map((pv) => (
                                  <option key={pv} value={pv}>
                                    {pv}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="text-[11px] text-zinc-400 bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 flex items-center space-x-1.5">
                            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>
                              This flag will only evaluate if <strong>{prereq.flagKey}</strong> resolves to{' '}
                              <strong className="text-zinc-200 font-mono">{prereq.variant}</strong>.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Section 4: TARGETING RULES & ROLLOUTS */}
            {activeSection === 'RULES' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
                      Targeting Rules & Audience Rollout
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {studioMode === 'BUSINESS'
                        ? 'Build visual "IF / THEN" rules to target customer segments, countries, and canary percentages.'
                        : 'Manage hierarchical evaluation expressions (priority order 1, 2, 3) and hashing attributes.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Targeting Rule</span>
                  </button>
                </div>

                {rules.length === 0 ? (
                  <div className="p-10 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
                    <Sliders className="w-8 h-8 text-zinc-600 mx-auto" />
                    <h4 className="font-semibold text-zinc-200 text-xs">No Custom Targeting Rules</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      All incoming client evaluations will resolve to default fallback variant "{defaultVariant}".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {rules.map((rule, index) => {
                      const clauses = conditionToClauses(rule.condition);
                      const isJsonExpanded = expandedJsonRules[index] || studioMode === 'SRE';
                      const naturalSummary = generateNaturalLanguageRule(rule, defaultVariant, segments);

                      return (
                        <div
                          key={rule.id || index}
                          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-sm"
                        >
                          {/* Rule Header Bar */}
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <div className="flex items-center space-x-2.5">
                              <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-mono font-bold text-xs">
                                {index + 1}
                              </span>
                              <input
                                type="text"
                                placeholder="Rule title or business description..."
                                value={rule.description || ''}
                                onChange={(e) => handleUpdateRule(index, 'description', e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1 text-xs font-semibold text-zinc-100 w-72 focus:outline-none focus:border-zinc-500"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Toggle Raw JSON View */}
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedJsonRules((prev) => ({
                                    ...prev,
                                    [index]: !prev[index]
                                  }))
                                }
                                className="text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded border border-zinc-850 hover:bg-zinc-800 flex items-center space-x-1"
                              >
                                <Code2 className="w-3 h-3" />
                                <span>{isJsonExpanded ? 'Visual View' : 'JSON View'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveRule(index)}
                                className="p-1 rounded text-zinc-500 hover:text-rose-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* IF BLOCK: Condition Builder */}
                          {!isJsonExpanded ? (
                            <div className="space-y-3">
                              <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
                                <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 font-mono border border-blue-800">
                                  IF
                                </span>
                                <span>Targeting Conditions (All must match):</span>
                              </div>

                              <div className="space-y-2 pl-2 border-l-2 border-zinc-800">
                                {clauses.map((clause, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      {/* Attribute Selector */}
                                      <select
                                        value={clause.attribute}
                                        onChange={(e) =>
                                          handleUpdateRuleClause(index, cIdx, 'attribute', e.target.value)
                                        }
                                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 font-medium focus:outline-none"
                                      >
                                        <option value="country">🌍 Country / Region (country)</option>
                                        <option value="userTier">💎 Customer Tier (userTier)</option>
                                        <option value="segmentId">👥 Audience Segment (segmentId)</option>
                                        <option value="targetingKey">👤 User ID (targetingKey)</option>
                                        <option value="appId">📱 Application (appId)</option>
                                        <option value="businessUnit">🏢 Business Unit (businessUnit)</option>
                                      </select>

                                      {/* Operator */}
                                      <select
                                        value={clause.operator}
                                        onChange={(e) =>
                                          handleUpdateRuleClause(index, cIdx, 'operator', e.target.value)
                                        }
                                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-300 focus:outline-none"
                                      >
                                        <option value="in">is one of</option>
                                        <option value="equals">equals</option>
                                        <option value="notIn">is not in</option>
                                      </select>

                                      {clauses.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveRuleClause(index, cIdx)}
                                          className="text-zinc-500 hover:text-rose-400 p-1"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Value Inputs Based on Attribute */}
                                    <div className="pt-1">
                                      {clause.attribute === 'country' && (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {['SG', 'HK', 'AE', 'IN'].map((geo) => {
                                            const isSelected = clause.values.includes(geo);
                                            const flagEmoji =
                                              geo === 'SG' ? '🇸🇬' : geo === 'HK' ? '🇭🇰' : geo === 'AE' ? '🇦🇪' : '🇮🇳';
                                            return (
                                              <button
                                                key={geo}
                                                type="button"
                                                onClick={() => {
                                                  const newVals = isSelected
                                                    ? clause.values.filter((v) => v !== geo)
                                                    : [...clause.values, geo];
                                                  handleUpdateRuleClause(index, cIdx, 'values', newVals);
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center space-x-1 ${
                                                  isSelected
                                                    ? 'bg-blue-950 text-blue-200 border-blue-700 font-semibold'
                                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                                                }`}
                                              >
                                                <span>{flagEmoji}</span>
                                                <span>{geo}</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {clause.attribute === 'userTier' && (
                                        <div className="flex items-center space-x-2">
                                          {['PREMIUM', 'VIP', 'STANDARD'].map((t) => {
                                            const isSelected = clause.values.includes(t);
                                            return (
                                              <button
                                                key={t}
                                                type="button"
                                                onClick={() => {
                                                  handleUpdateRuleClause(index, cIdx, 'values', [t]);
                                                }}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                                  isSelected
                                                    ? 'bg-indigo-950 text-indigo-200 border-indigo-700'
                                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                                                }`}
                                              >
                                                {t}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {clause.attribute === 'segmentId' && (
                                        <select
                                          value={clause.values[0] || ''}
                                          onChange={(e) =>
                                            handleUpdateRuleClause(index, cIdx, 'values', [e.target.value])
                                          }
                                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
                                        >
                                          {segments.map((s) => (
                                            <option key={s.id} value={s.id}>
                                              {s.name} ({s.id})
                                            </option>
                                          ))}
                                        </select>
                                      )}

                                      {clause.attribute !== 'country' &&
                                        clause.attribute !== 'userTier' &&
                                        clause.attribute !== 'segmentId' && (
                                          <input
                                            type="text"
                                            value={clause.values.join(', ')}
                                            onChange={(e) =>
                                              handleUpdateRuleClause(
                                                index,
                                                cIdx,
                                                'values',
                                                e.target.value.split(',').map((v) => v.trim())
                                              )
                                            }
                                            placeholder="Enter comma-separated values (e.g. user-sg-vip, user-hk-vip)..."
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-xs text-zinc-200 font-mono focus:outline-none"
                                          />
                                        )}
                                    </div>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => handleAddRuleClause(index)}
                                  className="text-[11px] font-semibold text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-900 border border-zinc-800 flex items-center space-x-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Another Condition (AND)</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* SRE Mode: Raw JSON Condition Editor */
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-semibold text-zinc-400">
                                Match Condition Expression (JSON)
                              </span>
                              <textarea
                                rows={3}
                                value={JSON.stringify(rule.condition, null, 2)}
                                onChange={(e) => handleUpdateRule(index, 'condition', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none resize-none"
                              />
                            </div>
                          )}

                          {/* THEN BLOCK: Serves Variant & Rollout Slider */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
                            <div>
                              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1 flex items-center space-x-1.5">
                                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-800">
                                  THEN
                                </span>
                                <span>Serve Variant</span>
                              </label>
                              <select
                                value={rule.variant || defaultVariant}
                                onChange={(e) => handleUpdateRule(index, 'variant', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-emerald-400 focus:outline-none cursor-pointer"
                              >
                                {availableVariantKeys.map((vk) => (
                                  <option key={vk} value={vk}>
                                    Variant: {vk}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                                <span>Gradual Canary Rollout %</span>
                                <span className="font-mono text-amber-400 text-xs">
                                  {rule.rollout?.percentage ? `${rule.rollout.percentage}% Canary` : '100% Direct'}
                                </span>
                              </div>

                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={rule.rollout?.percentage || 100}
                                onChange={(e) => handleUpdateRule(index, 'percentage', e.target.value)}
                                className="w-full accent-zinc-200 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Natural Language Translation Callout */}
                          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-300 flex items-start space-x-2">
                            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{naturalSummary}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Section 5: GOVERNANCE & AUDIT */}
            {activeSection === 'GOVERNANCE' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
                    Governance & Release Audit Trail
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Production activations require change rationale and ITSM tracking declaration.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Change Request Ticket ID (ITSM / Jira)
                    </label>
                    <input
                      type="text"
                      value={changeTicket}
                      onChange={(e) => setChangeTicket(e.target.value)}
                      placeholder="CHG-9281"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Author / Operator ID</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="bizops-manager"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Business Justification & Release Notes
                  </label>
                  <textarea
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    rows={4}
                    placeholder="Provide release rationale, rollout schedule, and risk mitigation plan for the audit trail..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 leading-relaxed"
                  />
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start space-x-3 text-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-zinc-200">Immutable Audit Trail Declaration</div>
                    <div className="text-zinc-400 text-[11px] leading-relaxed">
                      All changes are cryptographically stamped with author identity, timestamp, and previous state.
                      OFREP caching layer will invalidate instantaneously across connected banking pods.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pre-Flight Simulation Deck & Persona Testing (35% width) */}
        <aside className="w-[380px] xl:w-[440px] bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 h-full overflow-hidden select-none">
          {/* Header & Tabs */}
          <div className="p-3 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setSimulationTab('PERSONAS')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  simulationTab === 'PERSONAS'
                    ? 'bg-zinc-100 text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                👤 Customer Personas
              </button>
              <button
                type="button"
                onClick={() => setSimulationTab('RAW_JSON')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  simulationTab === 'RAW_JSON'
                    ? 'bg-zinc-100 text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                💻 SRE Context & Matrix
              </button>
            </div>

            <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              Live Evaluation
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* BUSINESS SIMULATION TAB: Customer Personas */}
            {simulationTab === 'PERSONAS' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                    Test Against Banking Persona
                  </label>

                  <div className="grid grid-cols-1 gap-1.5">
                    {BANK_PERSONAS.map((p) => {
                      const isSelected = p.key === selectedPersonaKey;
                      return (
                        <div
                          key={p.key}
                          onClick={() => setSelectedPersonaKey(p.key)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-zinc-800 border-zinc-500 ring-1 ring-zinc-400 text-white'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="text-base">{p.flag}</span>
                            <div>
                              <div className="font-semibold text-xs text-white">{p.name}</div>
                              <div className="text-[10px] text-zinc-400">
                                {p.role} &bull; {p.country} ({p.tier})
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Verdict Card */}
                {personaVerdict && (
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Evaluation Verdict
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                          personaVerdict.variant === 'on' || personaVerdict.variant === 'premium'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        SERVES: {personaVerdict.variant}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-300 bg-zinc-900 p-3 rounded-lg border border-zinc-850 space-y-1">
                      <div className="text-zinc-400 text-[10px] uppercase font-mono">Reason:</div>
                      <div className="font-medium text-zinc-200">{personaVerdict.matchedRuleText}</div>
                    </div>

                    <div className="text-[10px] text-zinc-400 space-y-1">
                      <div className="uppercase font-mono text-zinc-500">Value Payload Preview:</div>
                      <pre className="p-2 rounded bg-zinc-900 border border-zinc-850 font-mono text-[11px] text-zinc-200 overflow-x-auto">
                        {typeof personaVerdict.value === 'object'
                          ? JSON.stringify(personaVerdict.value, null, 2)
                          : String(personaVerdict.value)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SRE SIMULATION TAB: Raw JSON & 48-Context Matrix */}
            {simulationTab === 'RAW_JSON' && (
              <div className="space-y-4">
                {/* 1. Validation Checklist */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                    Pre-Flight Checklist
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center space-x-2">
                      {key.trim() ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className={key.trim() ? 'text-zinc-300' : 'text-amber-400'}>
                        Flag Key specified ({key || 'Missing'})
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-zinc-300">Default Variant: "{defaultVariant}"</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-zinc-300">{rules.length} Custom Targeting Rules</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-zinc-300">{prerequisites.length} Upstream Prerequisites</span>
                    </div>
                  </div>
                </div>

                {/* 2. Interactive OFREP Dry-Run Sandbox */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-zinc-200 font-semibold text-xs">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>OFREP Dry-Run Sandbox</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateDryRun}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-[10px] transition-colors cursor-pointer"
                    >
                      Simulate
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-mono">Sample Context JSON:</span>
                    <textarea
                      rows={4}
                      value={testContextJson}
                      onChange={(e) => setTestContextJson(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-[11px] text-zinc-200 focus:outline-none"
                    />
                  </div>

                  {dryRunResult && (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                      {dryRunResult.error ? (
                        <div className="text-rose-300 text-[11px] font-mono">{dryRunResult.error}</div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400 font-medium">Resolved Variant:</span>
                            <span className="font-mono font-semibold text-zinc-100 text-xs">
                              {dryRunResult.resolvedVariant}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 italic">
                            Path: {dryRunResult.matchedRule}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Batch What-If Impact Simulation */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-zinc-200 font-semibold text-xs">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>48-Context Matrix Simulation</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunBatchImpactSimulation}
                      disabled={simulatingBatch}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-[10px] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {simulatingBatch ? 'Testing...' : 'Run Matrix'}
                    </button>
                  </div>

                  {batchImpactResult && (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Changed Contexts:</span>
                        <span className="font-mono font-bold text-amber-400">
                          {batchImpactResult.changedCount} / {batchImpactResult.totalEvaluated}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Blast Radius Exposure:</span>
                        <span className="font-mono font-bold text-zinc-200">
                          {batchImpactResult.percentageChanged}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
