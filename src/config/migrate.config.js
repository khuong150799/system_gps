const configureEnvironment = require("./dotenv.config");

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DIALECT } =
  configureEnvironment();

module.exports = {
  defaultEnv: { ENV: "NODE_ENV" },
  local: {
    driver: DIALECT || "mysql",
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT || 3306,
  },
};
