class UsersDevicesModel {
  constructor({ user_id, device_id, created_at, updated_at }) {
    this.user_id = user_id;
    this.device_id = device_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = UsersDevicesModel;
