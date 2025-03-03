const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
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
      query("is_team").escape(),
      query("role_id").escape(),
    ],
    isAuth,
    checkPermission,
    usersController.getAllRows
  );

  router.get(
    "/lock-extend",
    isAuth,
    checkPermission,
    usersController.getLockExtend
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
    "/teams",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("user_id", VALIDATE_DATA).isString().escape(),
    ],
    isAuth,
    checkPermission,
    usersController.getTeamsWithUser
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    usersController.getbyid
  );

  router.get("/info", isAuth, checkPermission, usersController.getInfo);

  router.get(
    "/detail-not-auth/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    // isAuth,
    // checkPermission,
    usersController.getbyid
  );

  router.get(
    "/device-add",
    isAuth,
    checkPermission,
    usersController.getDeviceAdd
  );

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
      body("parent_id", NOT_EMPTY)
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

  router.delete(
    "/delete-device/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("device_id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    usersController.deleteDevice
  );

  router.delete(
    "/unlock-extend/:id",
    isAuth,
    checkPermission,
    usersController.unlockExtend
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
    // checkPermission,
    usersController.changePass
  );

  router.get(
    "/login-customer/:username",
    [
      param("username", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    usersController.loginCustomer
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

  router.patch(
    "/update-actived/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("is_actived", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    usersController.updateActive
  );

  router.patch(
    "/update-username",
    [
      body("username", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    usersController.updateUsername
  );

  app.use("/api/v1/users", router);
};
