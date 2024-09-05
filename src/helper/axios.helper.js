const { default: axios } = require("axios");
const configureEnvironment = require("../config/dotenv.config");

const https = require("https");
const { SESSION_CMS2, SESSION_CMS1 } = require("../constants/global.constant");

const {
  SV_REAL_ALARM,
  SV_ASSET_STORAGE,
  SV_CMS1,
  SV_CMS2,
  ACCOUNT_CMS,
  PASSWORD_CMS,
} = configureEnvironment();
const axiosAlarm = axios.create({
  baseURL: SV_REAL_ALARM,
});

const axiosAssetStorage = axios.create({
  baseURL: SV_ASSET_STORAGE,
});

const agent = new https.Agent({
  rejectUnauthorized: false,
});

// const axiosCMS1 = axios.create({
//   baseURL: SV_CMS1,
//   timeout: 2000,
//   httpsAgent: agent,
// });

// const axiosCMS2 = axios.create({
//   baseURL: SV_CMS2,
//   timeout: 2000,
//   httpsAgent: agent,
// });

const axiosCMS1NoAuth = axios.create({
  timeout: 10000,
  httpsAgent: agent,
});

// const axiosCMS2NoAuth = axios.create({
//   baseURL: SV_CMS2,
//   timeout: 2000,
//   httpsAgent: agent,
// });

const axiosCMS = axios.create({
  timeout: 10000,
  httpsAgent: agent,
});

const axiosNoConfig = axios.create({
  httpsAgent: agent,
});

const handleRequestCMS = async (config) => {
  try {
    const baseUrl = config.params.baseUrl;

    const token = global[baseUrl] || {};
    const { session, exp } = token;

    let createSession = false;
    if (session) {
      if (Date.now() - exp > 0) {
        createSession = true;
      }
    }
    if (!session || createSession) {
      const params = {
        account: ACCOUNT_CMS,
        password: PASSWORD_CMS,
      };

      const { jsession } = await axiosCMS1NoAuth({
        method: "GET",
        url: `${baseUrl}/StandardApiAction_login.action`,
        params,
      });
      // console.log("jsession", jsession);

      if (jsession) {
        global[baseUrl] = {
          session: jsession,
          exp: Date.now() + 2 * 3600000,
        };
        config.params.jsession = jsession;
      }
    } else {
      config.params.jsession = session;
    }
    return config;
  } catch (error) {
    console.log(error);

    throw error;
  }
};

// const handleRequestCMS2 = async (config) => {
//   try {
//     const { session, exp } = global[SESSION_CMS2];

//     let createSession = false;
//     if (session) {
//       if (Date.now() - exp > 0) {
//         createSession = true;
//       }
//     }
//     if (!session || createSession) {
//       const params = {
//         account: ACCOUNT_CMS,
//         password: PASSWORD_CMS,
//       };
//       const { jsession } = await axiosCMS2NoAuth({
//         method: "GET",
//         url: `/StandardApiAction_login.action`,
//         params,
//       });
//       // console.log("jsession", jsession);

//       if (jsession) {
//         global[SESSION_CMS2] = {
//           session: jsession,
//           exp: Date.now() + 2 * 3600000,
//         };
//         config.params.jsession = jsession;
//       }
//     } else {
//       config.params.jsession = session;
//     }
//     console.log("config", config);

//     return config;
//   } catch (error) {
//     throw error;
//   }
// };

const handleResponse = (response) => {
  if (response && response.data) {
    return response.data;
  }

  return response;
};

const handleResponseError = (error) => {
  // console.log("error", error);
  // Handle errors
  throw error?.response?.data || error;
};

// axiosCMS1.interceptors.request.use(handleRequestCMS1);
// axiosCMS2.interceptors.request.use(handleRequestCMS2);
axiosCMS.interceptors.request.use(handleRequestCMS);

axiosNoConfig.interceptors.response.use(handleResponse, handleResponseError);

axiosCMS1NoAuth.interceptors.response.use(handleResponse, handleResponseError);
// axiosCMS1NoAuth.interceptors.response.use(handleResponse, handleResponseError);
// axiosCMS2NoAuth.interceptors.response.use(handleResponse, handleResponseError);
// axiosCMS1.interceptors.response.use(handleResponse, handleResponseError);
// axiosCMS2.interceptors.response.use(handleResponse, handleResponseError);

axiosCMS.interceptors.response.use(handleResponse, handleResponseError);

axiosAlarm.interceptors.response.use(handleResponse, handleResponseError);
axiosAssetStorage.interceptors.response.use(
  handleResponse,
  handleResponseError
);

module.exports = {
  axiosAlarm,
  axiosAssetStorage,
  axiosCMS,
  // axiosCMS2,
  axiosNoConfig,
  axiosCMS1NoAuth,
  // axiosCMS2NoAuth,
};
