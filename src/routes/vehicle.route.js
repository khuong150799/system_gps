const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { param, body } = require("express-validator");
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
    "/update-package/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("service_package_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    vehicleController.updatePackage
  );
  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),

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

  app.use("/api/v1/vehicle", router);
};
