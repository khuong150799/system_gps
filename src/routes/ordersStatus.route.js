const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants");
const ordersStatusController = require("../controllers/ordersStatus.controller");
const { body, query, param } = require("express-validator");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("is_deleted").escape(),
      query("publish").escape(),
    ],
    ordersStatusController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    ordersStatusController.getById
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

    ordersStatusController.register
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
    ordersStatusController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    ordersStatusController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    ordersStatusController.updatePublish
  );

  app.use("/api/v1/orders-status", router);
};
