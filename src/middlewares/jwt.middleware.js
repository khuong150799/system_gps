const constants = require("../constants/msg.contant");
const { Api401Error, Api403Error } = require("../core/error.response");
const { checkToken } = require("../helper/auth.helper");
const { ACCESS_TOKEN_SECRET_KEY } = constants;

const isAuth = async function (req, res, next) {
  const authorizationHeader = req.headers.authorization;
  const token = authorizationHeader?.split(" ")[1];

  try {
    if (token) {
      const { data } = await checkToken(token, ACCESS_TOKEN_SECRET_KEY);
      const { userId, parentId, role, clientId, level, customerId } = data;
      req.userId = userId;
      req.role = role;
      req.level = level;
      req.customerId = customerId;
      req.clientId = clientId;
      req.parentId = parentId;
      req.attchPath = req.baseUrl + req.route.path;
      next();
    } else {
      return next(new Api403Error());
    }
  } catch (error) {
    // console.log(error);
    return next(new Api401Error(error.message));
  }
};

module.exports = {
  isAuth: isAuth,
};
