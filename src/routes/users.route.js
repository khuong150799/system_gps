const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants");
const usersController = require("../controllers/users.controller");
const { body, query, param } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("level_id").escape(),
      query("role_id").escape(),
    ],
    isAuth,
    usersController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    usersController.getById
  );

  router.get("/info", isAuth, usersController.getInfo);

  router.post(
    "/register-team",
    isAuth,
    [
      body("parent_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("name", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    usersController.registerTeam
  );

  router.post(
    "/register",
    isAuth,
    [
      body("customer_id", NOT_EMPTY)
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
    ],

    usersController.register
  );
  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("customer_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("role_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    usersController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    usersController.deleteById
  );
  router.patch(
    "/reset-pass/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    usersController.resetPass
  );
  router.patch(
    "/change-pass/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("old_password", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("new_password", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    usersController.changePass
  );
  router.post(
    "/login",
    [
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
    ],
    usersController.login
  );

  router.post(
    "/refresh-token",
    [
      body("refresh_token", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    usersController.refreshToken
  );

  router.delete("/logout", isAuth, usersController.logout);

  app.use("/api/v1/users", router);
};
