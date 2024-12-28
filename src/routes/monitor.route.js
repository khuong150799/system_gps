const router = require("express").Router();

const monitorController = require("../controllers/monitor.controller");

module.exports = (app) => {
  router.get("/check", monitorController.check);

  app.use("/api/v1/monitor", router);
};
