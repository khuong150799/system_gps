const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { query } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const deviceLoggingController = require("../controllers/deviceLogging.controller");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    deviceLoggingController.getAllRows
  );

  app.use("/api/v1/device-logging", router);
};
