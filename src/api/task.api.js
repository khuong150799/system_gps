const { axiosCronSystem } = require("../helper/axios.helper");

class TaskApi {
  async register(body) {
    const url = `api/v1/cronjob/register-maintenance`;
    return await axiosCronSystem({
      method: "POST",
      url,
      data: body,
    });
  }

  async get() {
    const url = `api/v1/cronjob/get-maintenance`;
    return await axiosCronSystem({
      method: "GET",
      url,
    });
  }

  async delete() {
    const url = `api/v1/cronjob/delete-maintenance`;
    return await axiosCronSystem({
      method: "DELETE",
      url,
    });
  }
}

module.exports = new TaskApi();
