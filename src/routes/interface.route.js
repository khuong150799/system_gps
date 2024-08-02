const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, query, param } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const interfaceController = require("../controllers/interface.controller");
const multer = require("multer");
const upload = multer();

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
    interfaceController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    interfaceController.getById
  );

  router.post(
    "/register",
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "favicon", maxCount: 1 },
      { name: "banner", maxCount: 5 },
    ]),
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
      body("content", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),

      body("publish", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    isAuth,
    checkPermission,
    interfaceController.register
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
    ],
    isAuth,
    checkPermission,
    interfaceController.updateById
  );

  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    interfaceController.deleteById
  );
  router.delete(
    "/delete-image",
    [
      body("id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("path", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
      body("property", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    interfaceController.deleteImage
  );
  router.post(
    "/upload-logo",
    upload.fields([{ name: "logo", maxCount: 1 }]),
    [
      body("id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    interfaceController.uploadImage
  );
  router.post(
    "/upload-favicon",
    upload.fields([{ name: "favicon", maxCount: 1 }]),
    [
      body("id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    interfaceController.uploadImage
  );
  router.post(
    "/upload-banner",
    upload.fields([{ name: "banner", maxCount: 5 }]),
    [
      body("id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("property", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    interfaceController.uploadImage
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    interfaceController.updatePublish
  );

  app.use("/api/v1/interface", router);
};
