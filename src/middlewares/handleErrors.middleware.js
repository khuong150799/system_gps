// const instanceDiscord = require("../config/discord.config");
const {
  Api404Error,
  BaseError,
  BusinessLogicError,
  Api401Error,
  Api403Error,
} = require("../core/error.response");

const logError = (err) => {
  console.error("logErrorMiddleware::::", err?.message || err?.msg);
};

const logErrorMiddleware = (err, req, res, next) => {
  logError(err);
  // if (err.status !== 401) {
  //   instanceDiscord.sendToFormatCode({
  //     code: {
  //       dataSend: req.method === "GET" ? req.query : req.body,
  //       status: err.status,
  //       message: err.message || "Internal server error",
  //       errors: err.errors,
  //     },
  //     message: `${req.get("host")}${req.originalUrl}`,
  //     title: `Method: ${req.method}`,
  //   });
  // }

  next(err);
};

const returnError = (error, req, res, next) => {
  const statusCode = error.status || 500;

  return res.status(statusCode).json({
    result: false,
    status: statusCode,
    message: error.message || "Internal server error",
    errors: error.errors,
  });
};

const isOperationalError = (error) => {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
};

const is404Handler = (req, res, next) => {
  const error = new Api404Error();
  next(error);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new BusinessLogicError(message);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new BusinessLogicError(message);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  console.log(errors);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new BusinessLogicError(message);
};

const handlerJWTError = (err) => {
  console.error(err);
  const message = `Invalid token. Please login again!`;
  return new Api401Error(message);
};

const handlerJWTExpiredError = (err) => {
  console.error(err);
  const message = `Your token has expired! Please log in again.`;
  return new Api403Error(message);
};

module.exports = {
  logError,
  logErrorMiddleware,
  returnError,
  isOperationalError,
  is404Handler,
};
