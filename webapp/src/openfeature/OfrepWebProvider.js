import {
  OpenFeatureEventEmitter,
  ProviderEvents,
  StandardResolutionReasons,
  GeneralError,
  FlagNotFoundError,
  TypeMismatchError
} from '@openfeature/web-sdk';
import axios from 'axios';

export class OfrepWebProvider {
  constructor(options = {}) {
    this.metadata = { name: 'OfrepWebProvider' };
    this.events = new OpenFeatureEventEmitter();
    this.baseUrl = options.baseUrl || 'http://localhost:4000';
    this.sseUrl = `${this.baseUrl}/api/v1/events/flags`;
    this.cachedFlags = new Map(); // flagKey -> OFREP response
    this.currentContext = {};
    this.eventSource = null;
    this.status = 'NOT_READY';
  }

  async initialize(context) {
    this.currentContext = context || {};
    try {
      await this.refreshFlags();
      this.initSSE();
      this.status = 'READY';
      this.events.emit(ProviderEvents.Ready, { message: 'OFREP Web Provider initialized' });
    } catch (err) {
      this.status = 'ERROR';
      this.events.emit(ProviderEvents.Error, { message: err.message });
      throw err;
    }
  }

  initSSE() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(this.sseUrl);

      this.eventSource.addEventListener('PROVIDER_CONFIGURATION_CHANGED', async (event) => {
        try {
          const payload = JSON.parse(event.data);
          await this.refreshFlags();
          this.events.emit(ProviderEvents.ConfigurationChanged, {
            flagsChanged: payload.flagsChanged || [],
            message: `Flags mutated in Admin API`
          });
        } catch (e) {
          console.error('[OfrepWebProvider] SSE handler error:', e);
        }
      });

      this.eventSource.onerror = () => {
        // EventSource automatically retries connection
      };
    } catch (e) {
      console.warn('[OfrepWebProvider] SSE setup failed:', e);
    }
  }

  async onContextChange(oldContext, newContext) {
    this.currentContext = newContext || {};
    await this.refreshFlags();
    this.events.emit(ProviderEvents.ConfigurationChanged, {
      message: 'Context changed, flags re-evaluated'
    });
  }

  async refreshFlags() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/ofrep/v1/evaluate/flags`,
        { context: this.currentContext },
        { timeout: 4000 }
      );

      const flags = response.data.flags || [];
      this.cachedFlags.clear();
      for (const flag of flags) {
        this.cachedFlags.set(flag.key, flag);
      }
    } catch (err) {
      console.warn('[OfrepWebProvider] Failed to bulk fetch flags:', err.message);
    }
  }

  async onClose() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }

  evaluate(flagKey, defaultValue, expectedType) {
    const cached = this.cachedFlags.get(flagKey);

    if (!cached) {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.DEFAULT,
        variant: 'default',
        flagMetadata: { missing: true }
      };
    }

    const value = cached.value;

    if (expectedType === 'boolean' && typeof value !== 'boolean') {
      throw new TypeMismatchError(`Flag ${flagKey} is not boolean`);
    }
    if (expectedType === 'string' && typeof value !== 'string') {
      throw new TypeMismatchError(`Flag ${flagKey} is not string`);
    }
    if (expectedType === 'number' && typeof value !== 'number') {
      throw new TypeMismatchError(`Flag ${flagKey} is not number`);
    }
    if (expectedType === 'object' && (typeof value !== 'object' || value === null)) {
      throw new TypeMismatchError(`Flag ${flagKey} is not object`);
    }

    return {
      value,
      variant: cached.variant,
      reason: cached.reason || StandardResolutionReasons.TARGETING_MATCH,
      flagMetadata: cached.metadata || {}
    };
  }

  resolveBooleanEvaluation(flagKey, defaultValue) {
    return this.evaluate(flagKey, defaultValue, 'boolean');
  }

  resolveStringEvaluation(flagKey, defaultValue) {
    return this.evaluate(flagKey, defaultValue, 'string');
  }

  resolveNumberEvaluation(flagKey, defaultValue) {
    return this.evaluate(flagKey, defaultValue, 'number');
  }

  resolveObjectEvaluation(flagKey, defaultValue) {
    return this.evaluate(flagKey, defaultValue, 'object');
  }
}
