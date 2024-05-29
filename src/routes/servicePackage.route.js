const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants");
const servicePackageService = require("../controllers/servicePack.controller");
const { body, query, param } = require("express-validator");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("is_deleted").escape(),
      query("publish").escape(),
    ],
    servicePackageService.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    servicePackageService.getById
  );
  router.post(
    "/register",
    [
      body("code", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
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
      body("times", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("note", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    servicePackageService.register
  );
  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("code", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
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
      body("times", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("note", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    servicePackageService.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    servicePackageService.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    servicePackageService.updatePublish
  );

  app.use("/api/v1/service-package", router);
};
