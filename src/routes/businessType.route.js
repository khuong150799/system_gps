const businessTypeController = require("../controllers/businessType.controller");
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
    businessTypeController.getAllRows
  );
  app.use("/api/v1/business-type", router);
};
