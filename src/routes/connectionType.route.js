const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants");
const connectionTypeController = require("../controllers/connectionType.controller");
const { body, query, param } = require("express-validator");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("is_deleted").escape(),
      query("publish").escape(),
    ],
    connectionTypeController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    connectionTypeController.getById
  );
  router.post(
    "/register",
    [
      body("name", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    connectionTypeController.register
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
    connectionTypeController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    connectionTypeController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    connectionTypeController.updatePublish
  );

  app.use("/api/v1/connection-type", router);
};
