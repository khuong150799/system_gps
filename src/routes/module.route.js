const router = require("express").Router();
const constants = require("../constants/msg.contant");
const moduleController = require("../controllers/module.controller");
const { body } = require("express-validator");
const { isAuth } = require("../middlewares/jwt.middleware");
const {
  checkPermission,
} = require("../middlewares/checkPermission.middleware");

module.exports = (app) => {
  router.get("/tree", isAuth, checkPermission, moduleController.getTree);
  router.get("/rows", isAuth, checkPermission, moduleController.getAllRows);
  router.get("/detail/:id", isAuth, checkPermission, moduleController.getById);
  router.post(
    "/register",
    [body("name", constants.NOT_EMPTY).notEmpty()],

    isAuth,
    checkPermission,
    moduleController.register
  );
  router.put(
    "/update/:id",
    [body("name", constants.NOT_EMPTY).notEmpty()],
    isAuth,
    checkPermission,
    moduleController.updateById
  );
  router.delete(
    "/delete/:id",
    isAuth,
    checkPermission,
    moduleController.deleteById
  );
  router.patch(
    "/update-publish/:id",
    isAuth,
    checkPermission,
    moduleController.updatePublish
  );
  router.patch(
    "/update-sort/:id",
    isAuth,
    checkPermission,
    moduleController.updateSort
  );
  app.use("/api/v1/module", router);
};
