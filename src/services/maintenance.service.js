const maintenanceModel = require("../models/maintenance.model");
const { BusinessLogicError } = require("../core/error.response");

class MaintenanceService {
  async getAll(query) {
    try {
      const data = await maintenanceModel.getAll(query);
      return data;
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async renderApp() {
    try {
      const data = await maintenanceModel.renderApp();
      return data;
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async add(payload) {
    try {
      const data = await maintenanceModel.add(payload);
      return data;
    } catch (error) {
      console.log(error);
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async deleteById() {
    try {
      const data = await maintenanceModel.deleteById();
      return data;
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }
}

module.exports = new MaintenanceService();
