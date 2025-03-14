const { axiosNoConfig, axiosCMS } = require("../helper/axios.helper");
const {
  handleDataAddVehicleCms,
  handleDataAddDeviceCms,
  handleDataAddConfigCms,
} = require("../helper/formatDataCms.helper");

const cameraApi = {
  login: async ({ account, password, baseUrl }) => {
    const url = `${baseUrl}/StandardApiAction_login.action`;

    const res = await axiosNoConfig({
      method: "GET",
      url,
      params: { account, password },
    });

    return res;
  },

  addVehicleCMS: async ({ url, vehiIdno, devIdno }) => {
    const url_ = `${url}/StandardApiAction_addVehicle.action`;
    const params = handleDataAddVehicleCms({ vehiIdno, devIdno });
    return await axiosCMS({
      method: "GET",
      url: url_,
      params: { ...params, baseUrl: url },
    });
  },

  addDeviceCMS: async ({ url, devIdno, chnCount }) => {
    const url_ = `${url}/StandardApiAction_addDevice.action`;

    const params = handleDataAddDeviceCms({ devIdno, chnCount });
    return await axiosCMS({
      method: "GET",
      url: url_,
      params: { ...params, baseUrl: url },
    });
  },
  config: async ({ url, urlCommand, devidno, data }) => {
    const url_ = `${urlCommand}/2/74?Command=33536&DevIDNO=${devidno}`;

    const body = handleDataAddConfigCms({ data });
    // console.log("body", body);

    return await axiosCMS({
      method: "POST",
      url: url_,
      data: body,
      params: { toMap: 1, baseUrl: url },
    });
  },
};

module.exports = cameraApi;
