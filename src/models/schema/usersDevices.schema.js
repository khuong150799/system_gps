class UsersDevicesSchema {
  constructor({
    user_id,
    device_id,
    is_main,
    is_deleted,
    is_moved,
    created_at,
    updated_at,
  }) {
    this.user_id = user_id;
    this.device_id = device_id;
    this.is_main = is_main;
    this.is_deleted = is_deleted;
    this.is_moved = is_moved;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = UsersDevicesSchema;
