const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants");
const deviceStatusController = require("../controllers/deviceStatus.controller");
const { body, query, param } = require("express-validator");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("is_deleted").escape(),
      query("publish").escape(),
    ],
    deviceStatusController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    deviceStatusController.getById
  );
  router.post(
    "/register",
    [
      body("title", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    deviceStatusController.register
  );
  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("title", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    deviceStatusController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    deviceStatusController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    deviceStatusController.updatePublish
  );

  app.use("/api/v1/device-status", router);
};
