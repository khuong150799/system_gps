const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, query, param } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const configTemperatureController = require("../controllers/configTemperature.controller");

module.exports = (app) => {
  // router.get(
  //   "/rows",
  //   [
  //     query("keyword", VALIDATE_DATA).isString().escape(),
  //     query("is_deleted").escape(),
  //   ],
  //   isAuth,
  //   checkPermission,
  //   configTemperatureController.getAllRows
  // );
  router.get(
    "/detail",
    isAuth,
    checkPermission,
    configTemperatureController.getById
  );

  router.post(
    "/register",
    [
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
    configTemperatureController.register
  );
  router.put(
    "/update/:id",
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
    configTemperatureController.updateById
  );

  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    configTemperatureController.deleteById
  );

  app.use("/api/v1/config-temp", router);
};
