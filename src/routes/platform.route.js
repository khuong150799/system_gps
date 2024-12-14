const router = require("express").Router();
const { VALIDATE_DATA } = require("../constants/msg.constant");
const { query } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const platformController = require("../controllers/platform.controller");

module.exports = (app) => {
  router.get(
    "/rows",
    [query("keyword", VALIDATE_DATA).isString().escape()],
    isAuth,
    checkPermission,
    platformController.getAllRows
  );

  app.use("/api/v1/platform", router);
};
