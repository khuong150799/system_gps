const { axiosTransmissionInfo } = require("../helper/axios.helper");

class TransmissionApi {
  constructor() {
    this.module = "transmission";
  }
  async driver(data) {
    const url = `${this.module}/driver`;

    return await axiosTransmissionInfo({
      method: "POST",
      url,
      data,
    });
  }

  async company(data) {
    const url = `${this.module}/company`;

    return await axiosTransmissionInfo({
      method: "POST",
      url,
      data,
    });
  }

  async vehicle(data) {
    const url = `${this.module}/vehicle`;

    return await axiosTransmissionInfo({
      method: "POST",
      url,
      data,
    });
  }
}

module.exports = new TransmissionApi();
