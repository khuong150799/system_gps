const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, query, param } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const simController = require("../controllers/sim.controller");

module.exports = (app) => {
  router.get(
    "/rows",
    [
      query("keyword", VALIDATE_DATA).isString().escape(),
      query("is_deleted").escape(),
    ],
    isAuth,
    checkPermission,
    simController.getAllRows
  );
  router.get(
    "/detail/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    simController.getById
  );
  router.post(
    "/register",
    [
      body("seri_display", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      body("seri_sim", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      body("phone", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
      body("type_id", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      body("status_id", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      body("price", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
      body("activation_date", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      body("expired_date", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA),
      body("note", NOT_EMPTY).notEmpty().isString().withMessage(VALIDATE_DATA),
    ],

    isAuth,
    checkPermission,
    simController.register
  );
  router.put(
    "/update/:id",
    [
      param("id", VALIDATE_DATA).isNumeric(),
      body("seri_display", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("seri_sim", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),

      body("type_id", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("status_id", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    isAuth,
    checkPermission,
    simController.updateById
  );
  router.delete(
    "/delete/:id",
    [param("id", VALIDATE_DATA).isNumeric()],
    isAuth,
    checkPermission,
    simController.deleteById
  );

  app.use("/api/v1/sim", router);
};
