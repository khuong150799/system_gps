const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.contant");
const usersController = require("../controllers/users.controller");
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
      query("role_id").escape(),
    ],
    isAuth,
    checkPermission,
    usersController.getAllRows
  );

  router.get(
    "/owner",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("customer_id", VALIDATE_DATA).isString().escape(),
      query("role_id", VALIDATE_DATA).isString().escape(),
      query("is_team", VALIDATE_DATA).isString().escape(),
    ],
    isAuth,
    checkPermission,
    usersController.getallChild
  );

  router.get(
    "/children",

    isAuth,
    checkPermission,
    usersController.getListWithUser
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    usersController.getInfo
  );

  router.get("/info", isAuth, checkPermission, usersController.getInfo);

  router.post(
    "/register-team",

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
    isAuth,
    checkPermission,
    usersController.registerTeam
  );

  router.post(
    "/register-device/:id",

    [
      body("devices", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    usersController.registerDevices
  );

  router.post(
    "/move",
    [
      body("reciver", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
      body("user_is_moved", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    usersController.move
  );
  router.post(
    "/register",
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
    isAuth,
    checkPermission,
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
    checkPermission,
    usersController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    usersController.deleteById
  );
  router.patch(
    "/reset-pass/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    usersController.resetPass
  );
  router.patch(
    "/change-pass",
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
    checkPermission,
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
