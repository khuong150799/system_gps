const { axiosAssetStorage } = require("../helper/axios.helper");

class filesApi {
  async upload(data) {
    const url = "/device/firmware";

    return await axiosAssetStorage({
      method: "POST",
      url,
      data,
    });
  }

  async rename(data) {
    const url = "/device/rename";

    return await axiosAssetStorage({
      method: "PATCH",
      url,
      data,
    });
  }
  async delete(data) {
    const url = "/device/delete-firmware";

    return await axiosAssetStorage({
      method: "DELETE",
      url,
      data,
    });
  }
}

module.exports = new filesApi();
