const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, param } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const configFuelController = require("../controllers/configFuel.controller");

module.exports = (app) => {
  // router.get(
  //   "/rows",
  //   [
  //     query("keyword", VALIDATE_DATA).isString().escape(),
  //     query("is_deleted").escape(),
  //   ],
  //   isAuth,
  //   checkPermission,
  //   configFuelController.getAllRows
  // );
  router.get("/detail", isAuth, checkPermission, configFuelController.getById);

  router.post(
    "/register",
    [
      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("total_volume", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("activation_date", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("calib", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
    ],

    isAuth,
    checkPermission,
    configFuelController.register
  );
  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("total_volume", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("activation_date", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("calib", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    configFuelController.updateById
  );

  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    configFuelController.deleteById
  );

  app.use("/api/v1/config-fuel", router);
};
