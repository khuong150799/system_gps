const router = require("express").Router();
const constants = require("../constants");
const moduleController = require("../controllers/module.controller");
const { body } = require("express-validator");

module.exports = (app) => {
  router.get("/tree", moduleController.getTree);
  router.get("/rows", moduleController.getAllRows);
  router.get("/detail/:id", moduleController.getById);
  router.post(
    "/register",
    [body("name", constants.NOT_EMPTY).notEmpty()],

    moduleController.register
  );
  router.put(
    "/update/:id",
    [body("name", constants.NOT_EMPTY).notEmpty()],
    moduleController.updateById
  );
  router.delete("/delete/:id", moduleController.deleteById);
  router.patch("/update-publish/:id", moduleController.updatePublish);
  router.patch("/update-sort/:id", moduleController.updateSort);
  app.use("/api/v1/module", router);
};
