const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, query } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const typeAiSafeController = require("../controllers/typeAiSafe.controller");

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
    typeAiSafeController.getAllRows
  );

  // router.get(
  //   "/rows-used",
  //   [
  //     query("keyword", VALIDATE_DATA).isString().escape(),
  //     query("is_deleted").escape(),
  //     query("publish").escape(),
  //   ],
  //   isAuth,
  //   checkPermission,
  //   renewalCodeController.getAllRowsUsed
  // );

  // router.post(
  //   "/register",
  //   [
  //     body("quantity", NOT_EMPTY)
  //       .notEmpty()
  //       .isNumeric()
  //       .withMessage(VALIDATE_DATA),
  //     body("type", NOT_EMPTY)
  //       .notEmpty()
  //       .isNumeric()
  //       .withMessage(VALIDATE_DATA)
  //       .escape(),
  //   ],

  //   isAuth,
  //   checkPermission,
  //   renewalCodeController.register
  // );

  app.use("/api/v1/type-ai-safe", router);
};
