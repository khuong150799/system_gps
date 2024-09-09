class DeviceExtendSchema {
  constructor({
    device_id,
    expired_on_old,
    extend_date,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.device_id = device_id;
    this.expired_on_old = expired_on_old;
    this.extend_date = extend_date;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = DeviceExtendSchema;
