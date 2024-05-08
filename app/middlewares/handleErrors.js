const constantNotify = require("../config/constants");

const handleErrors = async (err, req, res, next) => {
  console.log("1111", err);
  try {
    res.send({
      result: false,
      error: Array.isArray(err)
        ? err
        : Object.keys(err).length
        ? [err]
        : [{ msg: constantNotify.SERVER_ERROR }],
    });
  } catch (error) {
    res.send({
      result: false,
      error: [{ msg: constantNotify.SERVER_ERROR }],
    });
  }
};
module.exports = handleErrors;
