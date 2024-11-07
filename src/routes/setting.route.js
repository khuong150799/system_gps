const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, query, param } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const settingController = require("../controllers/setting.controller");

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
    settingController.getAllRows
  );

  router.get("/list", isAuth, checkPermission, settingController.getList);

  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    settingController.getById
  );

  router.post(
    "/register",
    [
      body("title", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("keyword", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("setting_cate_id", VALIDATE_DATA).isNumeric().escape(),
      body("on_default", VALIDATE_DATA).isNumeric().escape(),
      body("is_disabled", VALIDATE_DATA).isNumeric().escape(),
      body("sort", VALIDATE_DATA).isNumeric().escape(),
      body("publish", VALIDATE_DATA).isNumeric().escape(),
    ],

    isAuth,
    checkPermission,
    settingController.register
  );

  router.post(
    "/register-user",
    [
      body("setting_id", VALIDATE_DATA).isNumeric().escape(),
      body("is_disabled", VALIDATE_DATA).isNumeric().escape(),
    ],

    isAuth,
    checkPermission,
    settingController.registerUser
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
      body("on_default", VALIDATE_DATA).isNumeric().escape(),
      body("is_disabled", VALIDATE_DATA).isNumeric().escape(),
      body("sort", VALIDATE_DATA).isNumeric().escape(),
      body("publish", VALIDATE_DATA).isNumeric().escape(),
    ],
    isAuth,
    checkPermission,
    settingController.updateById
  );

  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    settingController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    settingController.updatePublish
  );

  router.patch(
    "/update-sort/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("sort", VALIDATE_DATA).isNumeric(),
    ],
    isAuth,
    checkPermission,
    settingController.updateSort
  );

  app.use("/api/v1/setting", router);
};
