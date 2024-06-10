const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.contant");
const levelController = require("../controllers/level.controller");
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
      query("is_deleted").escape(),
      query("publish").escape(),
    ],
    isAuth,
    checkPermission,
    levelController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    levelController.getById
  );

  router.get(
    "/get-permission/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    levelController.getPermission
  );

  router.get(
    "/get-module/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    levelController.getModule
  );
  router.post(
    "/register-permission",
    [
      body("id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("permissions", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    isAuth,
    checkPermission,
    levelController.registerPermission
  );

  router.post(
    "/register-module",
    [
      body("id", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("modules", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],

    isAuth,
    checkPermission,
    levelController.registerModule
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

    isAuth,
    checkPermission,
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
    isAuth,
    checkPermission,
    levelController.updateById
  );

  router.delete(
    "/delete-permission/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("permissions", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    levelController.deletePermission
  );

  router.delete(
    "/delete-module/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("modules", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    levelController.deleteModule
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    levelController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    levelController.updatePublish
  );
  router.patch(
    "/update-sort/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("sort", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    levelController.updateSort
  );
  app.use("/api/v1/level", router);
};
