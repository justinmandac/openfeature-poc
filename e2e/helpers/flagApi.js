const { execSync } = require('child_process');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:4000';

async function setFlagState(flagKey, state) {
  const res = await fetch(`${API_URL}/api/v1/admin/flags/${encodeURIComponent(flagKey)}/state`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-author': 'playwright-e2e-runner'
    },
    body: JSON.stringify({ state })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Failed to set flag state for ${flagKey} to ${state}: ${data.error || res.statusText}`);
  }
  return res.json();
}

async function updateFlag(flagKey, updates) {
  const res = await fetch(`${API_URL}/api/v1/admin/flags/${encodeURIComponent(flagKey)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-author': 'playwright-e2e-runner'
    },
    body: JSON.stringify(updates)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Failed to update flag ${flagKey}: ${data.error || res.statusText}`);
  }
  return res.json();
}

async function getFlag(flagKey) {
  const res = await fetch(`${API_URL}/api/v1/admin/flags/${encodeURIComponent(flagKey)}`);
  if (!res.ok) {
    throw new Error(`Failed to get flag ${flagKey}`);
  }
  return res.json();
}

function resetDatabase() {
  const rootDir = path.resolve(__dirname, '../../');
  execSync('node api/src/db/runSeeds.js', { cwd: rootDir, stdio: 'pipe' });
}

module.exports = {
  API_URL,
  setFlagState,
  updateFlag,
  getFlag,
  resetDatabase
};
