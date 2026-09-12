/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear existing
  await knex('flag_history').del();
  await knex('flags').del();

  const sampleFlags = [
    {
      key: 'feature.chatbot-gemini-ui',
      type: 'BOOLEAN',
      state: 'ENABLED',
      default_variant: 'on',
      variants: JSON.stringify({
        on: true,
        off: false
      }),
      rules: JSON.stringify([
        {
          id: 'rule-gemini-us-disabled',
          priority: 1,
          description: 'Disable Gemini UI in US region temporarily for compliance review',
          condition: { country: 'US' },
          variant: 'off'
        },
        {
          id: 'rule-gemini-premium-enabled',
          priority: 2,
          description: 'Enable for all Premium users',
          condition: { userTier: 'PREMIUM' },
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
      default_variant: 'off',
      variants: JSON.stringify({
        on: true,
        off: false
      }),
      rules: JSON.stringify([
        {
          id: 'rule-sg-vip-access',
          priority: 1,
          description: 'Enable advanced wealth insights for Singapore Premium tier',
          condition: { country: 'SG', userTier: 'PREMIUM' },
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
      description: 'Provides AI-powered predictive wealth modeling and cashflow forecast charts',
      version: 1
    },
    {
      key: 'config.chatbot-limits',
      type: 'OBJECT',
      state: 'ENABLED',
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
    }
  ];

  await knex('flags').insert(sampleFlags);

  // Insert initial history entries
  const historyEntries = sampleFlags.map(flag => ({
    flag_key: flag.key,
    version: 1,
    snapshot: JSON.stringify(flag),
    diff: JSON.stringify({ action: 'CREATED', initial_state: flag }),
    author: 'system-seed',
    change_reason: 'Initial system seeding'
  }));

  await knex('flag_history').insert(historyEntries);
};
