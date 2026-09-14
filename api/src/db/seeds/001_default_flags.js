/**
 * Seed 001: Multi-Tenant Enterprise Default Data
 * Seeds Business Units, Applications, Segments, and Flags with canonical naming and aliases.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear existing in reverse dependency order
  await knex('tracking_events').del();
  await knex('evaluation_metrics').del();
  await knex('scheduled_changes').del();
  await knex('flag_history').del();
  await knex('flags').del();
  await knex('segments').del();
  await knex('applications').del();
  await knex('business_units').del();

  // 1. Seed Business Units (Tenants)
  const businessUnits = [
    {
      id: 'bu-retail',
      code: 'retail',
      name: 'Retail Banking',
      lead_email: 'retail-ops@apexbank.com'
    },
    {
      id: 'bu-wealth',
      code: 'wealth',
      name: 'Wealth & Asset Management',
      lead_email: 'wealth-ops@apexbank.com'
    },
    {
      id: 'bu-cards',
      code: 'cards',
      name: 'Cards & Merchant Services',
      lead_email: 'cards-ops@apexbank.com'
    },
    {
      id: 'bu-platform',
      code: 'platform',
      name: 'Platform Operations',
      lead_email: 'sre-core@apexbank.com'
    }
  ];
  await knex('business_units').insert(businessUnits);

  // 2. Seed Applications
  const applications = [
    // Retail BU Apps
    {
      id: 'app-retail-copilot',
      business_unit_id: 'bu-retail',
      code: 'copilot',
      name: 'Apex Copilot AI Assistant',
      allowed_channels: JSON.stringify(['web', 'mobile'])
    },
    {
      id: 'app-retail-accounts',
      business_unit_id: 'bu-retail',
      code: 'accounts',
      name: 'Checking & Core Accounts Service',
      allowed_channels: JSON.stringify(['web', 'mobile', 'partner'])
    },
    {
      id: 'app-retail-loans',
      business_unit_id: 'bu-retail',
      code: 'loans',
      name: 'Consumer Lending & Loan Calculator',
      allowed_channels: JSON.stringify(['web', 'mobile'])
    },
    // Wealth BU Apps
    {
      id: 'app-wealth-advisory',
      business_unit_id: 'bu-wealth',
      code: 'advisory',
      name: 'Wealth Advisory & Forecast Widget',
      allowed_channels: JSON.stringify(['web', 'mobile'])
    },
    {
      id: 'app-wealth-portfolio',
      business_unit_id: 'bu-wealth',
      code: 'portfolio',
      name: 'Portfolio Simulation Engine',
      allowed_channels: JSON.stringify(['web', 'mobile'])
    },
    {
      id: 'app-wealth-fx',
      business_unit_id: 'bu-wealth',
      code: 'fx',
      name: 'Real-Time FX & Liquidity Rates',
      allowed_channels: JSON.stringify(['web', 'mobile', 'partner'])
    },
    // Cards BU Apps
    {
      id: 'app-cards-rewards',
      business_unit_id: 'bu-cards',
      code: 'rewards',
      name: 'Rewards & Points Multiplier Engine',
      allowed_channels: JSON.stringify(['web', 'mobile'])
    },
    {
      id: 'app-cards-controls',
      business_unit_id: 'bu-cards',
      code: 'controls',
      name: 'Card Freeze & Limits Management',
      allowed_channels: JSON.stringify(['web', 'mobile'])
    },
    // Platform BU Apps
    {
      id: 'app-platform-portal',
      business_unit_id: 'bu-platform',
      code: 'portal',
      name: 'Apex Web Portal Shell & Navigation',
      allowed_channels: JSON.stringify(['web'])
    },
    {
      id: 'app-platform-gateway',
      business_unit_id: 'bu-platform',
      code: 'gateway',
      name: 'Central Multi-Channel Feature Gateway',
      allowed_channels: JSON.stringify(['web', 'mobile', 'partner'])
    }
  ];
  await knex('applications').insert(applications);

  // 3. Seed Audience Segments (Global & BU-Scoped)
  const sampleSegments = [
    {
      id: 'segment-apac-premier',
      business_unit_id: null, // Global Enterprise Segment
      name: 'Premier Wealth Clients (SG, HK, UAE, IN)',
      description: 'High net worth clients located in Singapore, Hong Kong, UAE, and India with Premier status',
      condition: JSON.stringify({
        country: ['SG', 'HK', 'AE', 'IN'],
        userTier: 'PREMIUM'
      })
    },
    {
      id: 'segment-beta-cohort',
      business_unit_id: null, // Global Enterprise Segment
      name: 'Internal Beta Testing Cohort',
      description: 'Internal developers and product beta users testing experimental capabilities',
      condition: JSON.stringify({
        targetingKey: ['user-beta-01', 'user-beta-02', 'user-internal-test']
      })
    },
    {
      id: 'segment-wealth-accredited',
      business_unit_id: 'bu-wealth', // Scoped to Wealth BU
      name: 'Accredited Wealth Investors',
      description: 'Accredited investors eligible for private asset allocations',
      condition: JSON.stringify({
        userTier: 'PREMIUM',
        country: ['SG', 'HK']
      })
    }
  ];
  await knex('segments').insert(sampleSegments);

  // 4. Seed Flags with Hierarchical Keys, Tenancy Metadata & Backward Compatibility Aliases
  const sampleFlags = [
    {
      key: 'retail.copilot.gemini-ui',
      legacy_key: 'feature.chatbot-gemini-ui',
      business_unit_id: 'bu-retail',
      app_id: 'app-retail-copilot',
      shared_channels: JSON.stringify(['web', 'mobile']),
      is_global: false,
      type: 'BOOLEAN',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'on',
      variants: JSON.stringify({ on: true, off: false }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([
        {
          id: 'rule-gemini-in-compliance',
          priority: 1,
          description: 'Temporarily disable Gemini UI in India region for local regulatory review',
          condition: { country: 'IN' },
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
      key: 'wealth.advisory.predictive-insights',
      legacy_key: 'feature.advanced-financial-insights',
      business_unit_id: 'bu-wealth',
      app_id: 'app-wealth-advisory',
      shared_channels: JSON.stringify(['web', 'mobile']),
      is_global: false,
      type: 'BOOLEAN',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'off',
      variants: JSON.stringify({ on: true, off: false }),
      prerequisites: JSON.stringify([]),
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
      key: 'retail.copilot.limits',
      legacy_key: 'config.chatbot-limits',
      business_unit_id: 'bu-retail',
      app_id: 'app-retail-copilot',
      shared_channels: JSON.stringify(['web', 'mobile']),
      is_global: false,
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
      key: 'platform.banner.announcement',
      legacy_key: 'config.banner-announcement',
      business_unit_id: 'bu-platform',
      app_id: 'app-platform-portal',
      shared_channels: JSON.stringify(['web']),
      is_global: true,
      type: 'OBJECT',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'global-promo',
      variants: JSON.stringify({
        'global-promo': {
          title: 'Global Wealth Summit 2026',
          message: 'Discover institutional cross-border banking architectures powered by OpenFeature.',
          urgency: 'info',
          cta: { label: 'Learn More', link: 'https://openfeature.dev' }
        },
        'sg-exclusive': {
          title: '🇸🇬 Singapore Wealth Premier',
          message: 'Earn 3.8% p.a. yield on SGD fixed deposits this quarter.',
          urgency: 'success',
          cta: { label: 'Explore Rates', link: '#rates' }
        },
        'hk-exclusive': {
          title: '🇭🇰 Hong Kong Private Wealth',
          message: 'Zero-commission IPO allocations and HKD/CNH currency swaps now live.',
          urgency: 'success',
          cta: { label: 'Explore HK Offers', link: '#hk-rates' }
        },
        'uae-exclusive': {
          title: '🇦🇪 UAE Islamic & Private Banking',
          message: 'Exclusive AED sovereign sukuk offerings and physical gold custody accounts.',
          urgency: 'info',
          cta: { label: 'Discover UAE Wealth', link: '#uae-rates' }
        },
        'in-notice': {
          title: '🇮🇳 India Real-Time Settlement Notice',
          message: 'Scheduled NEFT/RTGS gateway maintenance tonight from 11:30 PM to 1:30 AM IST.',
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
          id: 'rule-hk-banner',
          priority: 2,
          description: 'Show HKD wealth management campaign for Hong Kong users',
          condition: { country: 'HK' },
          variant: 'hk-exclusive'
        },
        {
          id: 'rule-uae-banner',
          priority: 3,
          description: 'Show UAE private banking announcement for UAE users',
          condition: { country: 'AE' },
          variant: 'uae-exclusive'
        },
        {
          id: 'rule-in-banner',
          priority: 4,
          description: 'Show maintenance and settlement notice for India users',
          condition: { country: 'IN' },
          variant: 'in-notice'
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
      key: 'cards.rewards.travel-multiplier',
      legacy_key: null,
      business_unit_id: 'bu-cards',
      app_id: 'app-cards-rewards',
      shared_channels: JSON.stringify(['web', 'mobile']),
      is_global: false,
      type: 'NUMBER',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: '1x',
      variants: JSON.stringify({ '1x': 1, '2x': 2, '3x': 3 }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([
        {
          id: 'rule-cards-premier',
          priority: 1,
          description: 'Grant 3x accelerator for Premier status clients',
          condition: { userTier: 'PREMIUM' },
          variant: '3x'
        },
        {
          id: 'rule-cards-apac',
          priority: 2,
          description: 'Grant 2x accelerator for Singapore & Hong Kong standard users',
          condition: { country: ['SG', 'HK'] },
          variant: '2x'
        }
      ]),
      schema: null,
      app_tags: JSON.stringify(['webapp']),
      description: 'Travel rewards points multiplier dynamically tuned for regional spending',
      version: 1
    },
    {
      key: 'cards.controls.biometric-freeze',
      legacy_key: null,
      business_unit_id: 'bu-cards',
      app_id: 'app-cards-controls',
      shared_channels: JSON.stringify(['web', 'mobile']),
      is_global: false,
      type: 'BOOLEAN',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'on',
      variants: JSON.stringify({ on: true, off: false }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([]),
      schema: null,
      app_tags: JSON.stringify(['webapp', 'mobile-app']),
      description: 'Instant biometric card freeze and remote security lock from mobile wallet',
      version: 1
    },
    {
      key: 'wealth.portfolio.live-simulation',
      legacy_key: null,
      business_unit_id: 'bu-wealth',
      app_id: 'app-wealth-portfolio',
      shared_channels: JSON.stringify(['web', 'mobile']),
      is_global: false,
      type: 'BOOLEAN',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'on',
      variants: JSON.stringify({ on: true, off: false }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([]),
      schema: null,
      app_tags: JSON.stringify(['webapp']),
      description: 'Enables interactive Monte Carlo wealth projection sliders and asset allocation simulator',
      version: 1
    },
    {
      key: 'retail.accounts.instant-settlement',
      legacy_key: null,
      business_unit_id: 'bu-retail',
      app_id: 'app-retail-accounts',
      shared_channels: JSON.stringify(['web', 'mobile', 'partner']),
      is_global: false,
      type: 'BOOLEAN',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'on',
      variants: JSON.stringify({ on: true, off: false }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([]),
      schema: null,
      app_tags: JSON.stringify(['webapp', 'bff']),
      description: 'Real-time FAST/PayNow interbank instantaneous settlement protocol',
      version: 1
    },
    {
      key: 'platform.network.maintenance-mode',
      legacy_key: null,
      business_unit_id: 'bu-platform',
      app_id: 'app-platform-gateway',
      shared_channels: JSON.stringify(['web', 'mobile', 'partner']),
      is_global: true,
      type: 'BOOLEAN',
      state: 'DISABLED',
      lifecycle_state: 'DISABLED',
      default_variant: 'off',
      variants: JSON.stringify({ on: true, off: false }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([]),
      schema: null,
      app_tags: JSON.stringify(['webapp', 'bff', 'api']),
      description: 'Emergency institutional maintenance circuit breaker across all channels',
      version: 1
    },
    // Backward-Compatibility Seeds: Ensures direct SQL tests & legacy consumers resolve seamlessly
    {
      key: 'feature.chatbot-gemini-ui',
      legacy_key: 'retail.copilot.gemini-ui',
      business_unit_id: 'bu-retail',
      app_id: 'app-retail-copilot',
      shared_channels: JSON.stringify(['web', 'mobile']),
      is_global: false,
      type: 'BOOLEAN',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'on',
      variants: JSON.stringify({ on: true, off: false }),
      prerequisites: JSON.stringify([]),
      rules: JSON.stringify([
        {
          id: 'rule-gemini-in-compliance',
          priority: 1,
          description: 'Temporarily disable Gemini UI in India region for local regulatory review',
          condition: { country: 'IN' },
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
      legacy_key: 'wealth.advisory.predictive-insights',
      business_unit_id: 'bu-wealth',
      app_id: 'app-wealth-advisory',
      shared_channels: JSON.stringify(['web', 'mobile']),
      is_global: false,
      type: 'BOOLEAN',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'off',
      variants: JSON.stringify({ on: true, off: false }),
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
      legacy_key: 'retail.copilot.limits',
      business_unit_id: 'bu-retail',
      app_id: 'app-retail-copilot',
      shared_channels: JSON.stringify(['web', 'mobile']),
      is_global: false,
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
      legacy_key: 'platform.banner.announcement',
      business_unit_id: 'bu-platform',
      app_id: 'app-platform-portal',
      shared_channels: JSON.stringify(['web']),
      is_global: true,
      type: 'OBJECT',
      state: 'ENABLED',
      lifecycle_state: 'ENABLED',
      default_variant: 'global-promo',
      variants: JSON.stringify({
        'global-promo': {
          title: 'Global Wealth Summit 2026',
          message: 'Discover institutional cross-border banking architectures powered by OpenFeature.',
          urgency: 'info',
          cta: { label: 'Learn More', link: 'https://openfeature.dev' }
        },
        'sg-exclusive': {
          title: '🇸🇬 Singapore Wealth Premier',
          message: 'Earn 3.8% p.a. yield on SGD fixed deposits this quarter.',
          urgency: 'success',
          cta: { label: 'Explore Rates', link: '#rates' }
        },
        'hk-exclusive': {
          title: '🇭🇰 Hong Kong Private Wealth',
          message: 'Zero-commission IPO allocations and HKD/CNH currency swaps now live.',
          urgency: 'success',
          cta: { label: 'Explore HK Offers', link: '#hk-rates' }
        },
        'uae-exclusive': {
          title: '🇦🇪 UAE Islamic & Private Banking',
          message: 'Exclusive AED sovereign sukuk offerings and physical gold custody accounts.',
          urgency: 'info',
          cta: { label: 'Discover UAE Wealth', link: '#uae-rates' }
        },
        'in-notice': {
          title: '🇮🇳 India Real-Time Settlement Notice',
          message: 'Scheduled NEFT/RTGS gateway maintenance tonight from 11:30 PM to 1:30 AM IST.',
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
          id: 'rule-hk-banner',
          priority: 2,
          description: 'Show HKD wealth management campaign for Hong Kong users',
          condition: { country: 'HK' },
          variant: 'hk-exclusive'
        },
        {
          id: 'rule-uae-banner',
          priority: 3,
          description: 'Show UAE private banking announcement for UAE users',
          condition: { country: 'AE' },
          variant: 'uae-exclusive'
        },
        {
          id: 'rule-in-banner',
          priority: 4,
          description: 'Show maintenance and settlement notice for India users',
          condition: { country: 'IN' },
          variant: 'in-notice'
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
      legacy_key: null,
      business_unit_id: 'bu-wealth',
      app_id: 'app-wealth-portfolio',
      shared_channels: JSON.stringify(['web', 'mobile']),
      is_global: false,
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
      legacy_key: null,
      business_unit_id: 'bu-platform',
      app_id: 'app-platform-gateway',
      shared_channels: JSON.stringify(['web', 'mobile', 'partner']),
      is_global: true,
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

  // 5. Insert initial history entries
  const historyEntries = sampleFlags.map((flag) => ({
    flag_key: flag.key,
    business_unit_id: flag.business_unit_id,
    version: flag.version,
    snapshot: JSON.stringify(flag),
    diff: JSON.stringify({ action: 'CREATED', initial_state: flag }),
    author: 'system-seed',
    change_reason: 'Enterprise Multi-Tenancy initialization'
  }));
  await knex('flag_history').insert(historyEntries);

  // 6. Seed sample analytics data for demonstration
  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  await knex('evaluation_metrics').insert([
    { flag_key: 'retail.copilot.gemini-ui', variant: 'on', reason: 'TARGETING_MATCH', caller_app: 'webapp', channel: 'web', count: 1420, date_bucket: today, last_evaluated_at: nowIso },
    { flag_key: 'retail.copilot.gemini-ui', variant: 'on', reason: 'TARGETING_MATCH', caller_app: 'android-app', channel: 'mobile', count: 850, date_bucket: today, last_evaluated_at: nowIso },
    { flag_key: 'retail.copilot.gemini-ui', variant: 'off', reason: 'TARGETING_MATCH', caller_app: 'webapp-bff', channel: 'backend', count: 320, date_bucket: today, last_evaluated_at: nowIso },
    { flag_key: 'wealth.advisory.predictive-insights', variant: 'on', reason: 'TARGETING_MATCH', caller_app: 'webapp', channel: 'web', count: 580, date_bucket: today, last_evaluated_at: nowIso },
    { flag_key: 'wealth.advisory.predictive-insights', variant: 'off', reason: 'DEFAULT', caller_app: 'android-app', channel: 'mobile', count: 1160, date_bucket: today, last_evaluated_at: nowIso },
    { flag_key: 'cards.rewards.travel-multiplier', variant: '3x', reason: 'TARGETING_MATCH', caller_app: 'android-app', channel: 'mobile', count: 750, date_bucket: today, last_evaluated_at: nowIso },
    { flag_key: 'platform.banner.announcement', variant: 'sg-exclusive', reason: 'TARGETING_MATCH', caller_app: 'webapp', channel: 'web', count: 890, date_bucket: today, last_evaluated_at: nowIso }
  ]);

  // 7. Seed sample audit logs with caller attribution
  await knex('evaluation_logs').insert([
    {
      flag_key: 'retail.copilot.gemini-ui',
      variant: 'on',
      reason: 'TARGETING_MATCH',
      targeting_key: 'user-sg-vip',
      caller_app: 'webapp',
      channel: 'web',
      business_unit: 'bu-retail',
      context_snapshot: JSON.stringify({ targetingKey: 'user-sg-vip', userTier: 'PREMIUM', country: 'SG' }),
      evaluated_at: nowIso
    },
    {
      flag_key: 'retail.copilot.gemini-ui',
      variant: 'on',
      reason: 'TARGETING_MATCH',
      targeting_key: 'android-user-888',
      caller_app: 'android-app',
      channel: 'mobile',
      business_unit: 'bu-retail',
      context_snapshot: JSON.stringify({ targetingKey: 'android-user-888', channel: 'mobile', platform: 'android' }),
      evaluated_at: nowIso
    },
    {
      flag_key: 'wealth.advisory.predictive-insights',
      variant: 'on',
      reason: 'TARGETING_MATCH',
      targeting_key: 'user-hk-vip',
      caller_app: 'webapp',
      channel: 'web',
      business_unit: 'bu-wealth',
      context_snapshot: JSON.stringify({ targetingKey: 'user-hk-vip', userTier: 'PREMIUM', country: 'HK' }),
      evaluated_at: nowIso
    },
    {
      flag_key: 'cards.rewards.travel-multiplier',
      variant: '3x',
      reason: 'TARGETING_MATCH',
      targeting_key: 'user-sg-vip',
      caller_app: 'android-app',
      channel: 'mobile',
      business_unit: 'bu-cards',
      context_snapshot: JSON.stringify({ targetingKey: 'user-sg-vip', country: 'SG' }),
      evaluated_at: nowIso
    }
  ]);
};
