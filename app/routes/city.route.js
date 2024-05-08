const router = require("express").Router();
const cityController = require("../controllers/city.controller");

module.exports = (app) => {
  router.get("/getall", cityController.getall);

  app.use("/api/v1/city", router);
};
