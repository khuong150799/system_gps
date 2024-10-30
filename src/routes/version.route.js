const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, query, param } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const versionController = require("../controllers/version.controller");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("is_deleted").escape(),
      query("publish").escape(),
    ],
    isAuth,
    checkPermission,
    versionController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    versionController.getById
  );

  router.post(
    "/register",
    [
      body("keyword", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("name", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("ios_version", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("ios_link", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      // .escape()
      body("ios_is_forced", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("ios_message", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      // .escape()
      body("android_version", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("android_link", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      // .escape()
      body("android_is_forced", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("android_message", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      // .escape()
      body("publish", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    isAuth,
    checkPermission,
    versionController.register
  );
  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("keyword", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("name", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("ios_version", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("ios_link", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      // .escape()
      body("ios_is_forced", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("ios_message", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      // .escape()
      body("android_version", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("android_link", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      // .escape()
      body("android_is_forced", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("android_message", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      // .escape()
      body("publish", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    versionController.updateById
  );

  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    versionController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    versionController.updatePublish
  );

  app.use("/api/v1/version", router);
};
