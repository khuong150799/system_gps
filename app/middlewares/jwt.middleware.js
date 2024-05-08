const jwt = require("../helper/auth.helper");
const isAuth = async function (req, res, next) {
  // console.log(123123);
  // console.log('authorizationHeader', req.headers);
  const authorizationHeader = req.headers.authorization;
  const _token = authorizationHeader?.split(" ")[1];
  // console.log('authorizationHeader', authorizationHeader);
  if (_token) {
    try {
      await jwt
        .checkToken(_token)
        .then(({ data }) => {
          console.log(data);
          req.user_id = data?.comID;
          req.level = data?.level;
          next();
        })
        .catch((err) => {
          return res.send({
            result: false,
            error: [{ msg: err.message }],
          });
        });
      // console.log('au', authData);
      // req.auth = authData;
    } catch (error) {
      // console.log(error);
      return res.send({
        result: false,
        error: [{ msg: "Invalid token or token expired" }],
      });
    }
  } else {
    return res.send({
      result: false,
      error: [{ msg: "Token does not exist" }],
    });
  }
};

module.exports = {
  isAuth: isAuth,
};
