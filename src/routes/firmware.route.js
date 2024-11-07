const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const firmwareController = require("../controllers/firmware.controller");
const { body, query, param } = require("express-validator");
const uploadFirmware = require("../middlewares/uploadFirmware.middleware");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");

const multer = require("multer");
const upload = multer();

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("is_deleted").escape(),
      query("model_id").escape(),
      query("publish").escape(),
    ],

    isAuth,
    checkPermission,
    firmwareController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    firmwareController.getById
  );
  router.post(
    "/register",

    // uploadFirmware.fields([
    //   { name: "firmware", maxCount: 1 },
    //   { name: "file_note", maxCount: 1 },
    // ]),
    upload.fields([
      { name: "firmware", maxCount: 1 },
      { name: "file_note", maxCount: 1 },
    ]),
    [
      body("name", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("model_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("version_hardware", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("version_software", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("checksum", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("note").escape(),
    ],
    isAuth,
    checkPermission,
    firmwareController.register
  );
  router.put(
    "/update/:id",
    // uploadFirmware.fields([
    //   { name: "firmware", maxCount: 1 },
    //   { name: "file_note", maxCount: 1 },
    // ]),
    upload.fields([
      { name: "firmware", maxCount: 1 },
      { name: "file_note", maxCount: 1 },
    ]),
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("name", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("model_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("version_hardware", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("version_software", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("checksum", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("note").escape(),
    ],
    isAuth,
    checkPermission,
    firmwareController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    firmwareController.deleteById
  );

  app.use("/api/v1/firmware", router);
};
