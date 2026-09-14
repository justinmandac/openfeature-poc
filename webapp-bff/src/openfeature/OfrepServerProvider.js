const axios = require('axios');
const EventSource = require('eventsource');
const {
  OpenFeatureEventEmitter,
  ProviderEvents,
  StandardResolutionReasons,
  GeneralError,
  FlagNotFoundError,
  TypeMismatchError
} = require('@openfeature/server-sdk');

class OfrepServerProvider {
  constructor(options = {}) {
    this.metadata = { name: 'OfrepServerProvider' };
    this.events = new OpenFeatureEventEmitter();
    this.baseUrl = options.baseUrl || process.env.API_URL || 'http://localhost:4000';
    this.sseUrl = `${this.baseUrl}/api/v1/events/flags`;
    this.eventSource = null;
    this.status = 'NOT_READY';
  }

  async initialize(context) {
    try {
      this.initSSE();
      this.status = 'READY';
      this.events.emit(ProviderEvents.Ready, { message: 'OFREP Server Provider Ready' });
    } catch (err) {
      this.status = 'ERROR';
      this.events.emit(ProviderEvents.Error, { message: err.message });
      throw err;
    }
  }

  initSSE() {
    try {
      this.eventSource = new EventSource(this.sseUrl);

      this.eventSource.addEventListener('PROVIDER_CONFIGURATION_CHANGED', (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.events.emit(ProviderEvents.ConfigurationChanged, {
            flagsChanged: payload.flagsChanged || [],
            message: `Flag configuration changed: ${payload.flagsChanged ? payload.flagsChanged.join(', ') : 'all'}`
          });
        } catch (e) {
          console.error('[OfrepServerProvider] Failed to parse SSE event:', e);
        }
      });

      this.eventSource.onerror = (err) => {
        // SSE reconnects automatically
      };
    } catch (e) {
      console.warn('[OfrepServerProvider] SSE connection failed, continuing in polling/eval mode:', e.message);
    }
  }

  async onClose() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }

  async evaluate(flagKey, defaultValue, type, evalContext) {
    try {
      const appId = evalContext?.appId || 'webapp-bff';
      const headers = {
        'X-Client-App': appId,
        'X-Channel': evalContext?.channel || 'backend'
      };
      if (evalContext?.targetingKey || evalContext?.userId) {
        headers['X-Actor'] = evalContext.targetingKey || evalContext.userId;
      }
      if (evalContext?.businessUnit) {
        headers['X-Business-Unit'] = evalContext.businessUnit;
      }

      const enrichedContext = {
        ...(evalContext || {}),
        appId,
        callerApp: appId
      };

      const response = await axios.post(
        `${this.baseUrl}/ofrep/v1/evaluate/flags/${encodeURIComponent(flagKey)}?appTag=bff&appId=${encodeURIComponent(appId)}`,
        { context: enrichedContext },
        { headers, timeout: 3000 }
      );

      const data = response.data;

      // Type checking
      if (type === 'boolean' && typeof data.value !== 'boolean') {
        throw new TypeMismatchError(`Flag ${flagKey} is not a boolean, got ${typeof data.value}`);
      }
      if (type === 'string' && typeof data.value !== 'string') {
        throw new TypeMismatchError(`Flag ${flagKey} is not a string, got ${typeof data.value}`);
      }
      if (type === 'number' && typeof data.value !== 'number') {
        throw new TypeMismatchError(`Flag ${flagKey} is not a number, got ${typeof data.value}`);
      }
      if (type === 'object' && (typeof data.value !== 'object' || data.value === null)) {
        throw new TypeMismatchError(`Flag ${flagKey} is not an object, got ${typeof data.value}`);
      }

      return {
        value: data.value,
        variant: data.variant,
        reason: data.reason || StandardResolutionReasons.TARGETING_MATCH,
        flagMetadata: data.metadata || {}
      };
    } catch (error) {
      if (error instanceof TypeMismatchError) {
        throw error;
      }
      if (error.response && error.response.status === 404) {
        throw new FlagNotFoundError(`Flag "${flagKey}" not found`);
      }
      throw new GeneralError(`OFREP evaluation failed for flag "${flagKey}": ${error.message}`);
    }
  }

  async resolveBooleanEvaluation(flagKey, defaultValue, evalContext) {
    return this.evaluate(flagKey, defaultValue, 'boolean', evalContext);
  }

  async resolveStringEvaluation(flagKey, defaultValue, evalContext) {
    return this.evaluate(flagKey, defaultValue, 'string', evalContext);
  }

  async resolveNumberEvaluation(flagKey, defaultValue, evalContext) {
    return this.evaluate(flagKey, defaultValue, 'number', evalContext);
  }

  async resolveObjectEvaluation(flagKey, defaultValue, evalContext) {
    return this.evaluate(flagKey, defaultValue, 'object', evalContext);
  }
}

module.exports = OfrepServerProvider;
