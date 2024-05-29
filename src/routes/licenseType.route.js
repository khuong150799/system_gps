const licenseTypeController = require("../controllers/licenseType.controller");

const router = require("express").Router();

module.exports = (app) => {
  router.get("/rows", licenseTypeController.getAllRows);
  app.use("/api/v1/license-type", router);
};
