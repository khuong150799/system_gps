const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants");
const firmwareController = require("../controllers/firmware.controller");
const { body, query, param } = require("express-validator");
const uploadFirmware = require("../middlewares/uploadFirmware");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("is_deleted").escape(),
      query("model_id").escape(),
      query("publish").escape(),
    ],
    firmwareController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    firmwareController.getById
  );
  router.post(
    "/register",

    uploadFirmware.fields([
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
    firmwareController.register
  );
  router.put(
    "/update/:id",
    uploadFirmware.fields([
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
    firmwareController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    firmwareController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    firmwareController.updatePublish
  );

  app.use("/api/v1/firmware", router);
};
