const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, param, query } = require("express-validator");
const maintenanceController = require("../controllers/maintenance.controller");
module.exports = (app) => {
  router.get("/rows", maintenanceController.getAll);

  router.post("/register", maintenanceController.add);

  router.get("/render_app", maintenanceController.renderApp);

  router.delete("/delete", maintenanceController.deleteById);

  app.use("/api/v1/maintenance", router);
};
