const jwt = require("jsonwebtoken");
const constants = require("../constants/msg.contant");

const keyTokenService = require("../services/keyToken.service");
const {
  Api401Error,
  Api403Error,
  BusinessLogicError,
} = require("../core/error.response");
const { get: getRedis, set: setRedis } = require("../models/redis.model_");
const { promisify } = require("util");
const {
  ACCESS_TOKEN_TIME_LIFE,
  ACCESS_TOKEN_SECRET_KEY,
  REFRESH_TOKEN_SECRET_KEY,
  REFRESH_TOKEN_TIME_LIFE,
} = constants;

const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

class JWTService {
  async makeAccessToken(data = {}, publishKey) {
    try {
      const secret = `${ACCESS_TOKEN_SECRET_KEY}${publishKey}`;
      const token = await makeToken(data, secret, ACCESS_TOKEN_TIME_LIFE);
      return token;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
  async makeRefreshToken(data = {}, publishKey) {
    try {
      const secret = `${REFRESH_TOKEN_SECRET_KEY}${publishKey}`;
      const refreshToken = await makeToken(
        data,
        secret,
        REFRESH_TOKEN_TIME_LIFE
      );
      return refreshToken;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
  async checkToken(token, privateKey, isAccess = true) {
    try {
      const info = parseJwt(token);
      if (!info?.clientId) {
        throw new Api403Error();
      }
      let keyStore = {};
      const dataStore = await getRedis(info.clientId);
      // console.log("dataStore", dataStore);
      if (dataStore.result && dataStore.data) {
        keyStore = JSON.parse(dataStore.data);
      } else {
        const dataStore = await keyTokenService.getData(info.clientId);
        keyStore = dataStore[0] || {};
      }
      if (Object.keys(keyStore).length) {
        const { publish_key_token, publish_key_refresh_token } = keyStore;
        const secret = isAccess
          ? `${privateKey}${publish_key_token}`
          : `${privateKey}${publish_key_refresh_token}`;
        const data = await verifyAsync(token, secret);
        if (dataStore.result && !dataStore.data) {
          await setRedis(
            info.clientId,
            JSON.stringify({
              user_id: info.user_id,
              publish_key_token,
              publish_key_refresh_token,
            })
          );
        }
        return {
          data,
          keyRefreshToken: publish_key_refresh_token,
        };
      } else {
        throw new Api403Error();
      }
    } catch (error) {
      console.log(error);
      if (error.message === "jwt expired") {
        throw new Api401Error();
      } else {
        throw new Api403Error();
      }
    }
  }
}

const parseJwt = (token) => {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
};

const makeToken = async (data = {}, secret, expiresIn) => {
  try {
    const token = await signAsync(data, secret, {
      algorithm: "HS256",
      expiresIn,
    });
    return token;
  } catch (err) {
    throw new Api401Error(err.message);
  }
};

module.exports = new JWTService();
