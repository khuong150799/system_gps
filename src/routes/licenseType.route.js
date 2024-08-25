const licenseTypeController = require("../controllers/licenseType.controller");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");
const { isAuth } = require("../middlewares/jwt.middleware");

const router = require("express").Router();

module.exports = (app) => {
  router.get(
    "/rows",
    // isAuth,
    // checkPermission,
    licenseTypeController.getAllRows
  );
  app.use("/api/v1/license-type", router);
};
