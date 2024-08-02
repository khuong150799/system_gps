const { axiosAssetStorage } = require("../helper/axios.helper");

class ImageApi {
  async upload(data) {
    const url = "/images/banner";

    return await axiosAssetStorage({
      method: "POST",
      url,
      data,
    });
  }
  async delete(data) {
    const url = "/images/delete";

    return await axiosAssetStorage({
      method: "DELETE",
      url,
      data,
    });
  }
}

module.exports = new ImageApi();
