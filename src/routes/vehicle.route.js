const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { param, body, query } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const vehicleController = require("../controllers/vehicle.controller");

module.exports = (app) => {
  router.patch(
    "/update-name/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("name", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    vehicleController.updateName
  );

  router.patch(
    "/update-lock/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("is_lock", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    vehicleController.updateLock
  );

  router.patch(
    "/system-update-lock/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("is_lock", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),

      body("des", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
    ],

    vehicleController.systemUpdateLock
  );

  router.patch(
    "/update-package/:id",
    [
      param("id", VALIDATE_DATA)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("service_package_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),

      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    vehicleController.updatePackage
  );

  router.patch(
    "/update-sleep-time/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),

      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("minute", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    vehicleController.updateSleepTime
  );

  router.patch(
    "/update-expired",
    [body("djson", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA)],
    isAuth,
    checkPermission,
    vehicleController.updateExpiredOn
  );

  router.patch(
    "/promo",
    [body("djson", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA)],
    isAuth,
    checkPermission,
    vehicleController.promo
  );

  router.patch(
    "/recall-extend",
    [
      body("vehicle_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),

      body("code", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    vehicleController.recallExtend
  );

  router.patch(
    "/update-activation-date/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),

      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("activation_date", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    vehicleController.updateActivationDate
  );

  router.patch(
    "/update-warranty_expired_on/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),

      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("warranty_expired_on", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    vehicleController.updateWarrantyExpiredOn
  );

  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),

      body("vehicle_type_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("weight", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    vehicleController.updateById
  );

  router.delete(
    "/delete/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),

      query("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    vehicleController.deleteById
  );

  router.put(
    "/guarantee/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),

      body("device_id_old", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("device_id_new", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    vehicleController.guarantee
  );

  router.post(
    "/move",
    [
      body("vehicle_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("reciver", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    vehicleController.move
  );

  router.post(
    "/remote",
    [
      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("state", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("level", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    vehicleController.remote
  );

  app.use("/api/v1/vehicle", router);
};
