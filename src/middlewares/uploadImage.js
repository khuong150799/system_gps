const multer = require("multer");
const { existsSync, mkdirSync } = require("node:fs");
const path = require("node:path");

// Đường dẫn lưu hình ảnh
const dirImage = "./uploads/que/images";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!existsSync(dirImage)) {
      mkdirSync(dirImage, { recursive: true });
    }

    const math = ["image/png", "image/jpeg", "image/jpg"];
    if (math.indexOf(file.mimetype) === -1) {
      const errorMess = `The file <strong>${file.originalname}</strong> is invalid. Only allowed to upload image jpeg or png.`;
      return cb(errorMess, null);
    }

    cb(null, dirImage);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() +
      new Date().getTime() +
      new Date().getDate() +
      new Date().getMonth();
    cb(
      null,
      file.fieldname + "_" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const uploadImage = multer({
  storage: storage,
});

module.exports = uploadImage;
