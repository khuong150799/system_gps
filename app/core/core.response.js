const errorCode = require("../constants/errorCode.constant");
const statusCode = require("../constants/statusCode.constant");
const stringConstant = require("../constants/string.constant");
const getTime = require("../ultils/getTime");

const response = {
  error: {
    badRequest: (res, message = "") => {
      return res.status(statusCode.UNAUTHORIZED).json({
        error: errorCode.ERROR,
        message: `${stringConstant.res.BAD}:: ${message}`,
        time: getTime.currenUnix(),
      });
    },
    notAuth: (res) => {
      return res.status(statusCode.UNAUTHORIZED).json({
        error: errorCode.ERROR,
        message: stringConstant.res.UNAUTHORIZED,
        time: getTime.currenUnix(),
      });
    },
    notFound: (res) => {
      return res.status(statusCode.ERROR).json({
        error: errorCode.ERROR,
        message: stringConstant.res.NOTFOUND,
        time: getTime.currenUnix(),
      });
    },
    error: (res, STATUS, message) => {
      return res.status(STATUS || statusCode.ERROR).json({
        error: errorCode.ERROR,
        message: message || stringConstant.res.NOTFOUND,
        time: getTime.currenUnix(),
      });
    },
    DB: (res) => {
      // const a = 0;
      // a = 1;
      return res.status(statusCode.ERROR).json({
        error: errorCode.ERROR,
        message: stringConstant.res.DB,
        time: getTime.currenUnix(),
      });
    },

    server: (res) => {
      // const a = 0;
      // a = 1;
      return res.status(statusCode.ERROR).json({
        error: errorCode.ERROR,
        message: stringConstant.res.SERVER_ERROR,
        time: getTime.currenUnix(),
      });
    },

    invalidParams: (res) => {
      return res.status(statusCode.BAD).json({
        error: errorCode.ERROR,
        message: stringConstant.res.INVALID_PARAMS,
        time: getTime.currenUnix(),
      });
    },
  },

  info: (res, message) => {
    return res.status(statusCode.SUCCESS).json({
      error: errorCode.ERROR,
      message: message,
      time: getTime.currenUnix(),
    });
  },

  success: {
    data: (res, data, message = stringConstant.res.SUCCESS) => {
      return res.status(statusCode.SUCCESS).json({
        error: errorCode.SUCCESS,
        message: message,
        data: data || null,
        time: getTime.currenUnix(),
      });
    },
    r: (res, message = stringConstant.res.SUCCESS) => {
      return res.status(statusCode.SUCCESS).json({
        error: errorCode.SUCCESS,
        message: message,
        time: getTime.currenUnix(),
      });
    },
  },
};

module.exports = response;
