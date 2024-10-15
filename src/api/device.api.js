const { axiosAlarm } = require("../helper/axios.helper");

class DeviceApi {
  async remote(data) {
    const url = "/device/remote";

    return await axiosAlarm({
      method: "POST",
      url,
      data,
    });
  }
}

module.exports = new DeviceApi();
