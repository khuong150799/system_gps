const router = require("express").Router();
const { NOT_EMPTY, VALIDATE_DATA } = require("../constants");
const driverController = require("../controllers/driver.controller");
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
      query("customer_id").escape(),
      query("is_check").escape(),
      query("is_deleted").escape(),
    ],
    isAuth,
    checkPermission,
    driverController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric(), query("is_deleted").escape()],
    isAuth,
    checkPermission,
    driverController.getById
  );
  router.post(
    "/register",
    [
      body("customer_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("name", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),

      body("license_number", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("license_type_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("gender", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("is_actived", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],

    isAuth,
    checkPermission,
    driverController.register
  );
  router.put(
    "/update/:id",
    [
      [param("id", VALIDATE_DATA).isNumeric()],
      body("customer_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("name", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),

      body("license_number", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("license_type_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("gender", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("is_actived", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    driverController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    driverController.deleteById
  );
  router.patch(
    "/update-active/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("is_actived", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    driverController.updateActived
  );
  router.patch(
    "/update-check/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("is_check", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    driverController.updateCheck
  );
  app.use("/api/v1/driver", router);
};
