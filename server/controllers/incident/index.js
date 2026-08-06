const createController = require('./createController');
const retrievalController = require('./retrievalController');
const statusController = require('./statusController');
const dispatchController = require('./dispatchController');
const communicationController = require('./communicationController');
const dashboardController = require('./dashboardController');
const analyticsController = require('./analyticsController');

/**
 * Unified Incident Controller Interface
 * Exports all modular controller methods under a single cohesive interface.
 */
module.exports = {
  ...createController,
  ...retrievalController,
  ...statusController,
  ...dispatchController,
  ...communicationController,
  ...dashboardController,
  ...analyticsController,
};
