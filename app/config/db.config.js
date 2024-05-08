require("dotenv").config();
module.exports = {
  HOST: process.env.DB_HOST,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  DATABASE: process.env.DB_NAME,
  PORT: process.env.DB_PORT,
  CHARSET: process.env.DB_PR_CHARSET,
};
