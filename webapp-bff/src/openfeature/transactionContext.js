const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

class AsyncLocalStorageTransactionContextPropagator {
  getTransactionContext() {
    return asyncLocalStorage.getStore() || {};
  }

  setTransactionContext(context, callback) {
    return asyncLocalStorage.run(context, callback);
  }
}

/**
 * Express middleware to bind request user context into OpenFeature Transaction Context.
 */
function transactionContextMiddleware(req, res, next) {
  const context = {
    targetingKey: req.headers['x-targeting-key'] || req.body?.context?.targetingKey || 'anonymous-user',
    country: req.headers['x-country'] || req.body?.context?.country || 'SG',
    userTier: req.headers['x-user-tier'] || req.body?.context?.userTier || 'STANDARD',
    appId: 'webapp-bff',
    appGroup: 'financial-portal',
    ip: req.ip,
    sessionId: req.headers['x-session-id'] || `sess-${Date.now()}`
  };

  asyncLocalStorage.run(context, () => {
    req.evalContext = context;
    next();
  });
}

module.exports = {
  AsyncLocalStorageTransactionContextPropagator,
  transactionContextMiddleware,
  asyncLocalStorage
};
