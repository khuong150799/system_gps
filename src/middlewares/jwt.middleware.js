const constants = require("../constants/msg.constant");
const { Api401Error, Api403Error } = require("../core/error.response");
const { checkToken } = require("../helper/auth.helper");
const { ACCESS_TOKEN_SECRET_KEY } = constants;

const isAuth = async function (req, res, next) {
  const authorizationHeader = req.headers.authorization;
  const token = authorizationHeader?.split(" ")[1];

  try {
    // return next();
    if (token) {
      const { data } = await checkToken(token, ACCESS_TOKEN_SECRET_KEY);
      const { userId, parentId, role, clientId, level, customerId, isMain } =
        data;
      req.userId = userId;
      req.role = role;
      req.level = level;
      req.customerId = customerId;
      req.clientId = clientId;
      req.parentId = parentId;
      req.attchPath = req.baseUrl + req.route.path;
      req.isMain = isMain;

      next();
    } else {
      return next(new Api403Error());
    }
  } catch (error) {
    // console.log(error);
    if (error.message === "jwt expired") {
      return next(new Api401Error(error.message));
    } else {
      return next(new Api403Error());
    }
  }
};

module.exports = {
  isAuth: isAuth,
};
