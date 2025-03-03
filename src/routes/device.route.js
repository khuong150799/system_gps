const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const deviceController = require("../controllers/device.controller");
const { body, query, param } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("is_deleted").escape(),
      query("model_id").escape(),
      query("start_warranty_expired_on").escape(),
      query("end_warranty_expired_on").escape(),
      query("start_activation_date").escape(),
      query("end_activation_date").escape(),
    ],
    isAuth,
    checkPermission,
    deviceController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    deviceController.getById
  );

  router.get(
    "/check-outside/:imei",
    [
      param("imei", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    // isAuth,
    deviceController.checkOutside
  );

  router.get(
    "/check-inside/:imei",
    [
      param("imei", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    deviceController.checkInside
  );

  router.get(
    "/reference/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    deviceController.reference
  );
  router.get(
    "/reference-notify/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    (req, res, next) => {
      req.parentId = null;
      next();
    },

    deviceController.reference
  );
  router.post(
    "/activation-outside",
    [
      body("name", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("username", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("password", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("vehicle", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("type", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("imei", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("quantity_channel", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("service_package_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    // isAuth,
    // checkPermission,
    deviceController.activationOutside
  );

  router.post(
    "/activation-inside",
    [
      body("user_id").escape(),
      // body("vehicle", NOT_EMPTY)
      //   .notEmpty()
      //   .isString()
      //   .withMessage(VALIDATE_DATA)
      //   .escape(),
      // body("type", NOT_EMPTY)
      //   .notEmpty()
      //   .isNumeric()
      //   .withMessage(VALIDATE_DATA)
      //   .escape(),
      body("imei", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("quantity_channel", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("service_package_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("is_check_exited", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("is_use_gps", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      // body("activation_date", NOT_EMPTY)
      //   .notEmpty()
      //   .isNumeric()
      //   .withMessage(VALIDATE_DATA)
      //   .escape(),
      // body("expired_on", NOT_EMPTY)
      //   .notEmpty()
      //   .isNumeric()
      //   .withMessage(VALIDATE_DATA)
      //   .escape(),
      // body("warranty_expired_on", NOT_EMPTY)
      //   .notEmpty()
      //   .isNumeric()
      //   .withMessage(VALIDATE_DATA)
      //   .escape(),
    ],

    isAuth,
    checkPermission,
    deviceController.activationInside
  );

  router.put(
    "/service-reservation/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("duration", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    deviceController.serviceReservation
  );

  router.post(
    "/register",
    [
      body("dev_id", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      // .escape(),
      body("imei", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
      // .escape(),
      body("model_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    isAuth,
    checkPermission,
    deviceController.register
  );
  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("dev_id", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("imei", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("model_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("device_status_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    deviceController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    deviceController.deleteById
  );

  app.use("/api/v1/device", router);
};
