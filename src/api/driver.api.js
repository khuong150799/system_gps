const { axiosAlarm } = require("../helper/axios.helper");

class DriverApi {
  async writeCard(data) {
    const url = "/driver/write-card";

    return await axiosAlarm({
      method: "POST",
      url,
      data,
    });
  }
}

module.exports = new DriverApi();
