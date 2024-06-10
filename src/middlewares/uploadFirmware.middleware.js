const multer = require("multer");
const { existsSync, mkdirSync } = require("node:fs");
const path = require("node:path");
const { BusinessLogicError } = require("../core/error.response");

// Đường dẫn lưu file
const dirFirmware = "./uploads/device/firmware";
const dirFileNote = "./uploads/device/note";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!existsSync(dirFirmware)) {
      mkdirSync(dirFirmware, { recursive: true });
    }
    if (!existsSync(dirFileNote)) {
      mkdirSync(dirFileNote, { recursive: true });
    }
    console.log(file);
    const math = [".bin", ".txt"];
    if (math.indexOf(path.extname(file.originalname)) === -1) {
      const errorMess = new BusinessLogicError(
        "The server does not support this file type"
      );
      return cb(errorMess, null);
    }

    cb(
      null,
      path.extname(file.originalname) === ".bin" ? dirFirmware : dirFileNote
    );
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const uploadFirmware = multer({
  storage: storage,
});

module.exports = uploadFirmware;
