const configureEnvironment = require("./dotenv.config");

const { REDIS_HOST, REDIS_PASS, REDIS_PORT } = configureEnvironment();

module.exports = {
  url: `redis://:${REDIS_PASS}@${REDIS_HOST}:${REDIS_PORT}`,
};
