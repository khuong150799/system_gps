const router = require("express").Router();
const { NOT_EMPTY, VALIDATE_DATA } = require("../constants/msg.constant");
const customersController = require("../controllers/custommers.controller");
const { body, query, param } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("level_id").escape(),
      query("is_deleted").escape(),
    ],
    isAuth,
    checkPermission,
    customersController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric(), query("is_deleted").escape()],
    isAuth,
    checkPermission,
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
      body("username", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("password", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("role_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      // body("phone", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
    ],

    isAuth,
    checkPermission,
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
      // body("phone", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    customersController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    customersController.deleteById
  );

  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    customersController.updatePublish
  );

  app.use("/api/v1/customers", router);
};
