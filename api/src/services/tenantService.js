const db = require('../db/connection');

class TenantService {
  /**
   * Returns all Business Units with child application metadata and flag counts.
   */
  async getAllBusinessUnits() {
    const [bus, apps, flags] = await Promise.all([
      db('business_units').select('*').orderBy('name', 'asc'),
      db('applications').select('*').orderBy('name', 'asc'),
      db('flags').select('business_unit_id', 'app_id', 'lifecycle_state')
    ]);

    return bus.map((bu) => {
      const buApps = apps
        .filter((app) => app.business_unit_id === bu.id)
        .map((app) => ({
          ...app,
          allowed_channels:
            typeof app.allowed_channels === 'string'
              ? JSON.parse(app.allowed_channels || '[]')
              : app.allowed_channels || []
        }));

      const buFlags = flags.filter((f) => f.business_unit_id === bu.id);
      const activeFlags = buFlags.filter((f) => f.lifecycle_state === 'ENABLED').length;

      return {
        ...bu,
        applicationCount: buApps.length,
        flagCount: buFlags.length,
        activeFlagCount: activeFlags,
        applications: buApps
      };
    });
  }

  /**
   * Returns a single Business Unit by ID or code.
   */
  async getBusinessUnitById(idOrCode) {
    const bu = await db('business_units')
      .where({ id: idOrCode })
      .orWhere({ code: idOrCode })
      .first();

    if (!bu) return null;

    const apps = await db('applications')
      .where({ business_unit_id: bu.id })
      .orderBy('name', 'asc');

    return {
      ...bu,
      applications: apps.map((app) => ({
        ...app,
        allowed_channels:
          typeof app.allowed_channels === 'string'
            ? JSON.parse(app.allowed_channels || '[]')
            : app.allowed_channels || []
      }))
    };
  }

  /**
   * Returns applications filtered by businessUnitId.
   */
  async getAllApplications(filters = {}) {
    let query = db('applications').select('*').orderBy('name', 'asc');

    if (filters.businessUnitId || filters.bu) {
      const buIdentifier = filters.businessUnitId || filters.bu;
      // Allow searching by id or code
      const bu = await db('business_units')
        .where({ id: buIdentifier })
        .orWhere({ code: buIdentifier })
        .first();

      if (bu) {
        query = query.where({ business_unit_id: bu.id });
      } else {
        query = query.where({ business_unit_id: buIdentifier });
      }
    }

    const apps = await query;
    return apps.map((app) => ({
      ...app,
      allowed_channels:
        typeof app.allowed_channels === 'string'
          ? JSON.parse(app.allowed_channels || '[]')
          : app.allowed_channels || []
    }));
  }

  /**
   * Validates whether an application belongs to a specified business unit.
   */
  async validateTenantAndApp(businessUnitId, appId) {
    if (!businessUnitId || !appId) return true;

    const app = await db('applications').where({ id: appId }).first();
    if (!app) {
      throw new Error(`Application "${appId}" does not exist`);
    }

    const bu = await db('business_units')
      .where({ id: businessUnitId })
      .orWhere({ code: businessUnitId })
      .first();

    if (!bu || app.business_unit_id !== bu.id) {
      throw new Error(`Application "${appId}" does not belong to Business Unit "${businessUnitId}"`);
    }

    return true;
  }
}

module.exports = new TenantService();
