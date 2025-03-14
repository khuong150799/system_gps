const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, param } = require("express-validator");
const commandController = require("../controllers/command.controller");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");

module.exports = (app) => {
  router.get(
    "/details/:imei",
    [param("imei", NOT_EMPTY).notEmpty()],
    isAuth,
    // checkPermission,
    commandController.getConfigByImei
  );

  router.post(
    "/restart",
    [body("device_id", NOT_EMPTY).notEmpty()],
    isAuth,
    // checkPermission,
    commandController.restart
  );

  router.post(
    "/peripheral",
    [
      body("device_id", NOT_EMPTY).notEmpty(),
      body("type", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .isInt({ min: 1, max: 3 })
        .withMessage("Type must be between 1 and 3"),
      body("baudrate", NOT_EMPTY).notEmpty(),
    ],
    isAuth,
    // checkPermission,
    commandController.peripheral
  );

  router.post(
    "/buzzer-alarm",
    [
      body("device_id", NOT_EMPTY).notEmpty(),
      body("index", NOT_EMPTY).notEmpty(),
      body("control", NOT_EMPTY).notEmpty(),
    ],
    isAuth,
    // checkPermission,
    commandController.buzzerAlarm
  );

  router.post(
    "/set-temperate-enable",
    [
      body("device_id", NOT_EMPTY).notEmpty(),
      body("control", NOT_EMPTY).notEmpty().isInt().withMessage(VALIDATE_DATA),
    ],
    isAuth,
    // checkPermission,
    commandController.setTemperateEnable
  );

  router.post(
    "/driver-login",
    [
      body("device_id", NOT_EMPTY).notEmpty(),
      body("type", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .isInt({ min: 1, max: 2 })
        .withMessage("1. Login. 2. Logout"),
      body("driver_id", NOT_EMPTY).notEmpty(),
      body("name", NOT_EMPTY).notEmpty(),
    ],
    isAuth,
    // checkPermission,
    commandController.driverLogin
  );

  router.post(
    "/set-driving-break-time",
    [
      body("device_id", NOT_EMPTY).notEmpty(),
      body("time", NOT_EMPTY).notEmpty(),
    ],
    isAuth,
    // checkPermission,
    commandController.setDrivingBreakTime
  );

  app.use("/api/v1/command", router);
};
