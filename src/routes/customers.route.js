const router = require("express").Router();
const { NOT_EMPTY, VALIDATE_DATA } = require("../constants");
const customersController = require("../controllers/custommers.controller");
const { body, query, param } = require("express-validator");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("level_id").escape(),
      query("is_deleted").escape(),
    ],
    customersController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric(), query("is_deleted").escape()],
    customersController.getById
  );
  router.post(
    "/register",
    [
      body("name", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
      body("level_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],

    customersController.register
  );
  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("name", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
      body("level_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    customersController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    customersController.deleteById
  );

  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    customersController.updatePublish
  );

  app.use("/api/v1/customers", router);
};
