const { default: axios } = require("axios");
const configureEnvironment = require("../config/dotenv.config");

const { SV_REAL_ALARM, SV_ASSET_STORAGE } = configureEnvironment();
const axiosAlarm = axios.create({
  baseURL: SV_REAL_ALARM,
});

const axiosAssetStorage = axios.create({
  baseURL: SV_ASSET_STORAGE,
});

const handleRes = (response) => {
  if (response && response.data) {
    return response.data;
  }

  return response;
};

const handleError = (error) => {
  // console.log("error", error);
  // Handle errors
  throw error?.response?.data || error;
};

axiosAlarm.interceptors.response.use(handleRes, handleError);
axiosAssetStorage.interceptors.response.use(handleRes, handleError);

module.exports = { axiosAlarm, axiosAssetStorage };
