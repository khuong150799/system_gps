const response = require("../core/core.response");
const jwt = require("jsonwebtoken");

const auth = {
  token: function (req, res, next) {
    const authorizationBody = req.headers["authentication"];
    const NCC = req.headers["nc-name"];

    if (!NCC || !authorizationBody) return response.error.notAuth(res);

    const JWT_KEY = process.env.JWT_KEY;

    const token = authorizationBody?.replace("Bearer ", "");

    jwt.verify(token, JWT_KEY, (err, data) => {
      if (!data?.id) {
        return response.error.notAuth(res);
      } else {
        const body = req?.body || {};
        const query = req?.query || {};
        req.body = { ...body, userId: NCC + data?.id };
        req.query = { ...query, userId: NCC + data?.id };
        next();
      }
    });
  },
};

module.exports = auth;
