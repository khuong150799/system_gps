const axiosClient = require("../helper/axiosClient");

const driverApi = {
  writeCard: async (data) => {
    const url = "/driver/write-card";

    return await axiosClient({
      method: "POST",
      url,
      data,
    });
  },
};

module.exports = driverApi;
