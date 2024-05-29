const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants");
const levelController = require("../controllers/level.controller");
const { body, query, param } = require("express-validator");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("is_deleted").escape(),
      query("publish").escape(),
    ],
    levelController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    levelController.getById
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

    levelController.register
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
    levelController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    levelController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    levelController.updatePublish
  );
  router.patch(
    "/update-sort/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("sort", VALIDATE_DATA).isNumeric(),
    ],
    levelController.updateSort
  );
  app.use("/api/v1/level", router);
};
