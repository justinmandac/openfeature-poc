/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear existing
  await knex('tracking_events').del();
  await knex('evaluation_metrics').del();
  await knex('scheduled_changes').del();
  await knex('segments').del();
  await knex('flag_history').del();
  await knex('flags').del();

  // 1. Seed Reusable Audience Segments
  const sampleSegments = [
    {
      id: 'segment-apac-premier',
      name: 'APAC Premier Wealth Clients',
      description: 'High net worth clients located in Singapore, Philippines, and APAC hubs with Premier status',
      condition: JSON.stringify({
        country: ['SG', 'PH'],
        userTier: 'PREMIUM'
      })
    },
    {
      id: 'segment-beta-cohort',
      name: 'Internal Beta Testing Cohort',
      description: 'Internal developers and product beta users testing experimental capabilities',
      condition: JSON.stringify({
        targetingKey: ['user-beta-01', 'user-beta-02', 'user-internal-test']
      })
    }
  ];
  await knex('segments').insert(sampleSegments);

  // 2. Seed Flags with Prerequisites, Percentage Rollouts, and Lifecycle States
  const sampleFlags = [
    {
      key: 'feature.chatbot-gemini-ui',
      type: 'BOOLEAN',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'on',
      variants: JSON.stringify({
        on: true,
        off: false
      }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([
        {
          id: 'rule-gemini-us-disabled',
          priority: 1,
          description: 'Temporarily disable Gemini UI in US region for compliance review',
          condition: { country: 'US' },
          variant: 'off'
        },
        {
          id: 'rule-gemini-beta-cohort',
          priority: 2,
          description: 'Enable for Beta Cohort segment',
          condition: { segmentId: 'segment-beta-cohort' },
          variant: 'on'
        },
        {
          id: 'rule-gemini-percentage-rollout',
          priority: 3,
          description: '50% Percentage Rollout for Standard tier users',
          condition: { userTier: 'STANDARD' },
          rollout: {
            attribute: 'targetingKey',
            percentage: 50,
            variant: 'on',
            fallbackVariant: 'off'
          },
          variant: 'on'
        }
      ]),
      schema: null,
      app_tags: JSON.stringify(['webapp', 'bff']),
      description: 'Enables rich Generative UI cards (portfolio charts, loan calculators) in the chatbot',
      version: 1
    },
    {
      key: 'feature.advanced-financial-insights',
      type: 'BOOLEAN',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'off',
      variants: JSON.stringify({
        on: true,
        off: false
      }),
      // Flag prerequisite: depends on chatbot-gemini-ui being 'on'
      prerequisites: JSON.stringify([
        {
          flagKey: 'feature.chatbot-gemini-ui',
          variant: 'on'
        }
      ]),
      rules: JSON.stringify([
        {
          id: 'rule-apac-premier-segment',
          priority: 1,
          description: 'Enable advanced wealth insights for APAC Premier segment',
          condition: { segmentId: 'segment-apac-premier' },
          variant: 'on'
        },
        {
          id: 'rule-internal-tester',
          priority: 2,
          description: 'Enable for internal beta tester user',
          condition: { targetingKey: 'user-beta-01' },
          variant: 'on'
        }
      ]),
      schema: null,
      app_tags: JSON.stringify(['webapp', 'bff']),
      description: 'Provides AI-powered predictive wealth modeling and cashflow forecast charts (Requires Gemini UI)',
      version: 1
    },
    {
      key: 'config.chatbot-limits',
      type: 'OBJECT',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'standard',
      variants: JSON.stringify({
        standard: {
          maxTokens: 500,
          temperature: 0.2,
          rateLimitPerMin: 20,
          allowedTools: ['balance_lookup', 'transaction_history']
        },
        premium: {
          maxTokens: 2000,
          temperature: 0.7,
          rateLimitPerMin: 100,
          allowedTools: ['balance_lookup', 'transaction_history', 'portfolio_simulation', 'instant_transfer']
        }
      }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([
        {
          id: 'rule-premium-limits',
          priority: 1,
          description: 'Grant elevated tokens and rate limits to Premium tier',
          condition: { userTier: 'PREMIUM' },
          variant: 'premium'
        }
      ]),
      schema: JSON.stringify({
        type: 'object',
        required: ['maxTokens', 'temperature', 'rateLimitPerMin', 'allowedTools'],
        properties: {
          maxTokens: { type: 'integer', minimum: 50, maximum: 8000 },
          temperature: { type: 'number', minimum: 0, maximum: 1 },
          rateLimitPerMin: { type: 'integer', minimum: 1, maximum: 1000 },
          allowedTools: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        additionalProperties: false
      }),
      app_tags: JSON.stringify(['bff']),
      description: 'Dynamic runtime configuration for Chatbot token budget, model temperature, and allowed tools',
      version: 1
    },
    {
      key: 'config.banner-announcement',
      type: 'OBJECT',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'global-promo',
      variants: JSON.stringify({
        'global-promo': {
          title: 'Global Fintech Summit 2026',
          message: 'Discover next-gen banking architectures powered by OpenFeature.',
          urgency: 'info',
          cta: { label: 'Learn More', link: 'https://openfeature.dev' }
        },
        'sg-exclusive': {
          title: '🇸🇬 Singapore Wealth Premier',
          message: 'Earn 3.8% p.a. yield on SGD fixed deposits this quarter.',
          urgency: 'success',
          cta: { label: 'Explore Rates', link: '#rates' }
        },
        'us-maintenance': {
          title: '🇺🇸 Scheduled System Update',
          message: 'ACH instant transfers will pause tonight from 11 PM to 1 AM EST.',
          urgency: 'warning',
          cta: { label: 'System Status', link: '#status' }
        }
      }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([
        {
          id: 'rule-sg-banner',
          priority: 1,
          description: 'Show SGD deposit campaign for Singapore users',
          condition: { country: 'SG' },
          variant: 'sg-exclusive'
        },
        {
          id: 'rule-us-banner',
          priority: 2,
          description: 'Show maintenance notification for US users',
          condition: { country: 'US' },
          variant: 'us-maintenance'
        }
      ]),
      schema: JSON.stringify({
        type: 'object',
        required: ['title', 'message', 'urgency', 'cta'],
        properties: {
          title: { type: 'string', minLength: 3 },
          message: { type: 'string', minLength: 5 },
          urgency: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
          cta: {
            type: 'object',
            required: ['label', 'link'],
            properties: {
              label: { type: 'string' },
              link: { type: 'string' }
            }
          }
        },
        additionalProperties: false
      }),
      app_tags: JSON.stringify(['webapp']),
      description: 'Dynamic contextual banner announcement with targeting rules per country',
      version: 1
    },
    {
      key: 'feature.crypto-staking-pools',
      type: 'BOOLEAN',
      state: 'DISABLED',
      lifecycle_state: 'DRAFT',
      default_variant: 'off',
      variants: JSON.stringify({ on: true, off: false }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([]),
      schema: null,
      app_tags: JSON.stringify(['webapp', 'bff']),
      description: 'High-yield staking protocol integration (Currently in Draft specification)',
      version: 1
    },
    {
      key: 'config.legacy-auth-migration',
      type: 'STRING',
      state: 'ENABLED',
      lifecycle_state: 'GRADUATED',
      graduated_variant: 'v2-oauth',
      default_variant: 'v2-oauth',
      variants: JSON.stringify({ 'v1-basic': 'BasicAuth', 'v2-oauth': 'OAuth2.1-PKCE' }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([]),
      schema: null,
      app_tags: JSON.stringify(['api', 'bff']),
      description: 'Completed migration to OAuth 2.1 authentication (Graduated feature / Permanent)',
      version: 3
    }
  ];

  await knex('flags').insert(sampleFlags);

  // Insert initial history entries
  const historyEntries = sampleFlags.map(flag => ({
    flag_key: flag.key,
    version: flag.version,
    snapshot: JSON.stringify(flag),
    diff: JSON.stringify({ action: 'CREATED', initial_state: flag }),
    author: 'system-seed',
    change_reason: 'TPO enhancement system seeding'
  }));

  await knex('flag_history').insert(historyEntries);

  // Seed sample analytics data for demonstration
  const today = new Date().toISOString().slice(0, 10);
  await knex('evaluation_metrics').insert([
    { flag_key: 'feature.chatbot-gemini-ui', variant: 'on', reason: 'TARGETING_MATCH', count: 1420, date_bucket: today },
    { flag_key: 'feature.chatbot-gemini-ui', variant: 'off', reason: 'TARGETING_MATCH', count: 320, date_bucket: today },
    { flag_key: 'feature.advanced-financial-insights', variant: 'on', reason: 'TARGETING_MATCH', count: 580, date_bucket: today },
    { flag_key: 'feature.advanced-financial-insights', variant: 'off', reason: 'DEFAULT', count: 1160, date_bucket: today },
    { flag_key: 'config.banner-announcement', variant: 'sg-exclusive', reason: 'TARGETING_MATCH', count: 890, date_bucket: today },
    { flag_key: 'config.banner-announcement', variant: 'us-maintenance', reason: 'TARGETING_MATCH', count: 410, date_bucket: today },
    { flag_key: 'config.banner-announcement', variant: 'global-promo', reason: 'DEFAULT', count: 440, date_bucket: today }
  ]);
};
