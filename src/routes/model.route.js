const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants");
const modelController = require("../controllers/model.controller");
const { body, query, param } = require("express-validator");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("disk_id").escape(),
      query("type").escape(),
      query("connection_type_id").escape(),
      query("is_deleted").escape(),
      query("publish").escape(),
    ],
    modelController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    modelController.getById
  );
  router.post(
    "/register",
    [
      body("name", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("made_in", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("type", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("disk_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("connection_type_id", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("quantity_channel", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("note", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("is_gps", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    modelController.register
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
      body("made_in", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("type", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("disk_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("connection_type_id", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("quantity_channel", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("note", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("is_gps", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    modelController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    modelController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    modelController.updatePublish
  );

  app.use("/api/v1/model", router);
};
