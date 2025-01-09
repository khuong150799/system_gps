const { axiosAlarm, axiosCMS } = require("../helper/axios.helper");

class DriverApi {
  async writeCard(data) {
    const url = "/driver/write-card";

    return await axiosAlarm({
      method: "POST",
      url,
      data,
    });
  }

  async writeCardCms({ url, params, body, port }) {
    const url_ = `${url}:16603/2/74`;

    return await axiosCMS({
      method: "POST",
      url: url_,
      params: { ...params, baseUrl: `${url}:${port}` },
      data: body,
    });
  }
}

module.exports = new DriverApi();
