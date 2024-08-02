const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, query, param } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const settingCateController = require("../controllers/settingCate.controller");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("is_deleted").escape(),
      query("publish").escape(),
    ],
    // isAuth,
    // checkPermission,
    settingCateController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    // isAuth,
    // checkPermission,
    settingCateController.getById
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

    // isAuth,
    // checkPermission,
    settingCateController.register
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
    // isAuth,
    // checkPermission,
    settingCateController.updateById
  );

  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    // isAuth,
    // checkPermission,
    settingCateController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("publish", VALIDATE_DATA).isNumeric(),
    ],
    // isAuth,
    // checkPermission,
    settingCateController.updatePublish
  );

  router.patch(
    "/update-sort/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("sort", VALIDATE_DATA).isNumeric(),
    ],
    // isAuth,
    // checkPermission,
    settingCateController.updateSort
  );

  app.use("/api/v1/setting-cate", router);
};
