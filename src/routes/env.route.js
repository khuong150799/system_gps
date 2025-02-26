const router = require("express").Router();
const { NOT_EMPTY } = require("../constants/msg.constant");
const { body } = require("express-validator");
const envController = require("../controllers/env.controller");
module.exports = (app) => {
  router.get("/rows", envController.getAll);

  router.post(
    "/register",
    [body("env", NOT_EMPTY).notEmpty()],
    envController.register
  );

  app.use("/api/v1/env", router);
};
