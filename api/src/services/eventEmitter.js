const { EventEmitter } = require('events');

class FlagEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
  }

  addClient(res) {
    this.clients.add(res);

    // Initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to OpenFeature event stream', timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  /**
   * Broadcasts OpenFeature configuration changed event to all connected clients.
   *
   * @param {Object} changeInfo Details of the flag mutation
   */
  broadcastChange(changeInfo) {
    const payload = {
      event: 'PROVIDER_CONFIGURATION_CHANGED',
      flagsChanged: [changeInfo.key],
      appTags: changeInfo.appTags || [],
      action: changeInfo.action || 'UPDATED',
      version: changeInfo.version,
      timestamp: new Date().toISOString()
    };

    const dataString = `event: PROVIDER_CONFIGURATION_CHANGED\ndata: ${JSON.stringify(payload)}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(dataString);
      } catch (err) {
        console.error('Error writing to SSE client:', err);
        this.clients.delete(client);
      }
    }

    this.emit('flag_changed', payload);
  }

  getClientCount() {
    return this.clients.size;
  }
}

const flagEvents = new FlagEventEmitter();

module.exports = flagEvents;
