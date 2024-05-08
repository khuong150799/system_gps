const router = require("express").Router();
const multer = require("multer");
const categoriesController = require("../controllers/categories.controller");
const { body } = require("express-validator");
const constantNotify = require("../config/constants");
const upload = multer();

module.exports = (app) => {
  router.get("/getall", categoriesController.getall);
  router.get("/getbyid/:id", categoriesController.getById);

  router.post(
    "/register",
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "banner", maxCount: 1 },
    ]),
    [
      body("name", constantNotify.NOT_EMPTY).notEmpty(),
      body("alias", constantNotify.NOT_EMPTY).notEmpty(),
    ],
    categoriesController.register
  );
  router.put(
    "/updatebyid/:id",
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "banner", maxCount: 1 },
    ]),
    [
      body("name", constantNotify.NOT_EMPTY).notEmpty(),
      body("alias", constantNotify.NOT_EMPTY).notEmpty(),
    ],
    categoriesController.update
  );

  router.delete("/delete", categoriesController.delete);
  router.delete("/delete-image/:id", categoriesController.deleteImage);
  router.post(
    "/add-image",
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "banner", maxCount: 1 },
    ]),
    categoriesController.addImage
  );
  router.put("/update-sort/:id", categoriesController.updateSort);
  router.put("/update-publish/:id", categoriesController.updatePublish);

  app.use("/api/v1/categories", router);
};
