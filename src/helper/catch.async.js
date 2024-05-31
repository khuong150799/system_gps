const { validationResult } = require("express-validator");
const { BusinessLogicError } = require("../core/error.response");
const constants = require("../constants");
const statusCodes = require("../core/statusCodes");

const catchAsync = (fn) => async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new BusinessLogicError(constants.ERROR, errors.array()));
    }
    return await Promise.resolve(fn(req, res, next));
  } catch (err) {
    console.log("err", err);
    // return next(
    //   new BusinessLogicError(
    //     err?.msg ||
    //       ((err?.status === 401 || err?.status === 403) && err?.message) ||
    //       constants.SERVER_ERROR,
    //     err?.errors || [],
    //     err?.status || statusCodes.INTERNAL_SERVER_ERROR
    //   )
    // );
    return next(err);
  }
};

module.exports = catchAsync;
