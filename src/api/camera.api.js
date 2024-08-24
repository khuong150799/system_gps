const {
  // axiosCMS1,
  // axiosCMS2,
  axiosNoConfig,
  axiosCMS,
  axiosCMS1NoAuth,
  // axiosCMS2NoAuth,
} = require("../helper/axios.helper");
const {
  handleDataAddVehicleCms,
  handleDataAddDeviceCms,
} = require("../ultils/getDataSendCms");
// const { Unix2String } = require("../ultils/getTime");

const cameraApi = {
  login: async ({ account, password, baseUrl }) => {
    const url = `${baseUrl}/StandardApiAction_login.action`;

    return await axiosNoConfig({
      method: "GET",
      url,
      params: { account, password },
    });
  },

  addVehicleCMS1: async ({ url, vehiIdno, devIdno }) => {
    const url_ = `${url}/StandardApiAction_addVehicle.action`;
    const params = handleDataAddVehicleCms({ vehiIdno, devIdno });
    return await axiosCMS({
      method: "GET",
      url: url_,
      params: { ...params, baseUrl: url },
    });
  },
  // addVehicleCMS2: async ({ vehiIdno, devIdno }) => {
  //   const url = "StandardApiAction_addVehicle.action";

  //   const params = handleDataAddVehicleCms({ vehiIdno, devIdno });
  //   return await axiosCMS2({
  //     method: "GET",
  //     url,
  //     params,
  //   });
  // },

  addDeviceCMS1: async ({ url, devIdno, chnCount }) => {
    const url_ = `${url}/StandardApiAction_addDevice.action`;

    const params = handleDataAddDeviceCms({ devIdno, chnCount });
    return await axiosCMS({
      method: "GET",
      url: url_,
      params: { ...params, baseUrl: url },
    });
  },
  // addDeviceCMS2: async ({ devIdno, chnCount }) => {
  //   const url = "StandardApiAction_addDevice.action";

  //   const params = handleDataAddDeviceCms({ devIdno, chnCount });
  //   return await axiosCMS2({
  //     method: "GET",
  //     url,
  //     params,
  //   });
  // },
};

module.exports = cameraApi;
