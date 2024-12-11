class DeviceLoggingSchema {
  constructor({
    user_id,
    device_id,
    vehicle_id,
    ip,
    os,
    des,
    action,
    gps,
    is_deleted,
    created_at,
  }) {
    this.user_id = user_id;
    this.device_id = device_id;
    this.vehicle_id = vehicle_id;
    this.ip = ip;
    this.os = os;
    this.gps = gps;
    this.des = des;
    this.action = action;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
  }
}
module.exports = DeviceLoggingSchema;
