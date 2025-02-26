const router = require("express").Router();
const { VALIDATE_DATA, NOT_EMPTY } = require("../constants/msg.constant");
const { body, param } = require("express-validator");
const cameraController = require("../controllers/camera.controller");
module.exports = (app) => {
  // config-vehicle-info
  router.post(
    "/config-vehicle-info/:imei",
    [
      param("imei", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("dev_id", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("vehicle_name", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("color", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("area_code", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("manufacturer", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("frame_number", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("license_plate_type", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("engine_number", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    cameraController.configVehicleInfo
  );
  // config-acc
  router.post(
    "/config-acc/:imei",
    [
      param("imei", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("acc_off_delay", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("acc_off_time", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("sleep_mode", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("sleep_time", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    cameraController.configACC
  );
  //  fatigue-mode
  router.post(
    "/fatigue-mode/:imei",
    [
      param("imei", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("active", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("warning_horn", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("voice_sound", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("active_io", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("warning_time_before", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("warning_time", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("warning_night_before", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("warning_night", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    cameraController.fatigueMode
  );
  //  over-speed
  router.post(
    "/over-speed/:imei",
    [
      param("imei", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("active", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("warning_horn", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("voice_sound", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("active_io", NOT_EMPTY)
        .notEmpty()
        .isString()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("early_warning", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("warning_duration_1", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("warning_speed", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
      body("warning_duration_2", NOT_EMPTY)
        .notEmpty()
        .isInt()
        .withMessage(VALIDATE_DATA)
        .escape(),
    ],
    cameraController.overSpeed
  );
  //   config-mirror
  router.post("/config-mirror/:imei", cameraController.configMirror);

  app.use("/api/v1/camera", router);
};
