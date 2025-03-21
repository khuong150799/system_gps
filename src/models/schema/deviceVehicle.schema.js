class DeviceVehicleSchema {
  constructor({
    device_id,
    vehicle_id,
    service_package_id,
    expired_on,
    activation_date,
    warranty_expired_on,
    quantity_channel,
    quantity_channel_lock,
    type,
    is_use_gps,
    is_deleted,
    is_transmission_gps,
    is_transmission_image,
    chn_capture,
    created_at,
    updated_at,
  }) {
    this.device_id = device_id;
    this.vehicle_id = vehicle_id;
    this.service_package_id = service_package_id;
    this.expired_on = expired_on;
    this.activation_date = activation_date;
    this.warranty_expired_on = warranty_expired_on;
    this.quantity_channel = quantity_channel;
    this.quantity_channel_lock = quantity_channel_lock;
    this.type = type;
    this.is_use_gps = is_use_gps;
    this.is_deleted = is_deleted;
    this.is_transmission_gps = is_transmission_gps;
    this.is_transmission_image = is_transmission_image;
    this.chn_capture = chn_capture;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = DeviceVehicleSchema;
