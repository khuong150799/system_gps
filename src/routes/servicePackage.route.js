const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const servicePackageService = require("../controllers/servicePack.controller");
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
      query("publish").escape(),
    ],
    // isAuth,
    // checkPermission,
    servicePackageService.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    servicePackageService.getById
  );
  router.post(
    "/register",
    [
      body("name", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("fees_to_customer", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("fees_to_agency", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("fees_to_distributor", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("times", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("is_require_transmission", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    isAuth,
    checkPermission,
    servicePackageService.register
  );
  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),

      body("name", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("fees_to_customer", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("fees_to_agency", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("fees_to_distributor", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("times", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("is_require_transmission", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    servicePackageService.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    servicePackageService.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    servicePackageService.updatePublish
  );

  app.use("/api/v1/service-package", router);
};
