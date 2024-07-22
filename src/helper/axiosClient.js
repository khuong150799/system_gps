const { default: axios } = require("axios");
const configureEnvironment = require("../config/dotenv.config");

const { SV_REAL_ALARM } = configureEnvironment();
const axiosClient = axios.create({
  baseURL: SV_REAL_ALARM,
});

axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }

    return response;
  },
  (error) => {
    // console.log("error", error);
    // Handle errors
    throw error;
  }
);

module.exports = axiosClient;
