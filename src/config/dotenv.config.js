require("dotenv").config();
const dotenv = require("dotenv");

function configureEnvironment() {
  const nodeEnv = process.env.NODE_ENV || "local";

  const envPath = `.env.${nodeEnv}`;

  dotenv.config({ path: envPath });

  return process.env;
}

module.exports = configureEnvironment;
