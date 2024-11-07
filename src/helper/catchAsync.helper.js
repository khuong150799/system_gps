const { validationResult } = require("express-validator");
const { SendMissingDataError } = require("../core/error.response");

const catchAsync = (fn) => async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new SendMissingDataError(undefined, errors.array()));
    }
    return await Promise.resolve(fn(req, res, next));
  } catch (err) {
    return next(err);
  }
};

module.exports = catchAsync;
