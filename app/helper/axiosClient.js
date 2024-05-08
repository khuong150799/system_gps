const { default: axios } = require("axios");
require("dotenv").config();
const axiosClient = axios.create({
  baseURL: process.env.SERVER_USER,
});

axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }

    return response;
  },
  (error) => {
    // Handle errors
    throw error;
  }
);

module.exports = axiosClient;
