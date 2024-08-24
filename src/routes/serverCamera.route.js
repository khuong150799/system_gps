const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, query, param } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const serverCameraController = require("../controllers/serverCamera.controller");

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
    serverCameraController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    serverCameraController.getById
  );

  router.post(
    "/register",
    [
      body("ip", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
      body("host", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
      body("port", NOT_EMPTY).notEmpty().isNumeric().withMessage(VALIDATE_DATA),
      body("publish", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],

    isAuth,
    checkPermission,
    serverCameraController.register
  );
  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("ip", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
      body("host", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
      body("port", NOT_EMPTY).notEmpty().isNumeric().withMessage(VALIDATE_DATA),
      body("publish", NOT_EMPTY)
        .notEmpty()
        .isNumeric()
        .withMessage(VALIDATE_DATA),
    ],
    isAuth,
    checkPermission,
    serverCameraController.updateById
  );

  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    serverCameraController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    serverCameraController.updatePublish
  );

  app.use("/api/v1/sv-cam", router);
};
