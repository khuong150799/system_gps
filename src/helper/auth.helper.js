const jwt = require("jsonwebtoken");
const constants = require("../constants/msg.constant");

const {
  Api401Error,
  Api403Error,
  BusinessLogicError,
} = require("../core/error.response");
const { promisify } = require("util");
const {
  hGet,

  hdelOneKey,
} = require("../models/redis.model");
const { REDIS_KEY_TOKEN } = require("../constants/redis.constant");
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
    const info = parseJwt(token);
    // console.log(";info", info);

    if (!info?.clientId) {
      throw new Api403Error();
    }
    const { userId, clientId } = info;
    try {
      let keyStore = {};

      const dataStore = await hGet(REDIS_KEY_TOKEN, `${userId}/${clientId}`);
      if (dataStore.result && dataStore.data) {
        keyStore = JSON.parse(dataStore.data);
      }
      // console.log("keyStore", keyStore);

      if (!Object.keys(keyStore).length) throw new Api403Error();

      const { publish_key_token, publish_key_refresh_token } = keyStore;

      if (!publish_key_token || !publish_key_refresh_token)
        throw new Api403Error();

      const secret = isAccess
        ? `${privateKey}${publish_key_token}`
        : `${privateKey}${publish_key_refresh_token}`;
      const data = await verifyAsync(token, secret);

      return {
        data,
        keyRefreshToken: publish_key_refresh_token,
      };
    } catch (error) {
      if (!isAccess && error.message === "jwt expired") {
        await hdelOneKey(REDIS_KEY_TOKEN, `${userId}/${clientId}`);
      }
      console.log("error", error.message);
      throw error;
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
