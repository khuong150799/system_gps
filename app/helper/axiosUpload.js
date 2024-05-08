const { default: axios } = require('axios');
require('dotenv').config();
const axiosUpload = axios.create({
  baseURL: process.env.SERVER_IMAGE_FILE,
});

axiosUpload.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }

    return response;
  },
  (error) => {
    // Handle errors
    throw error;
  },
);

module.exports = axiosUpload;
