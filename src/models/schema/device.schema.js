class DeviceSchema {
  constructor({
    dev_id,
    imei,
    model_id,
    serial,
    device_name,
    device_status_id,
    package_service_id,
    expired_on,
    activation_date,
    warranty_expired_on,
    vehicle_type_id,
    note,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.dev_id = dev_id;
    this.imei = imei;
    this.model_id = model_id;
    this.serial = serial;
    this.device_name = device_name;
    this.device_status_id = device_status_id;
    this.package_service_id = package_service_id;
    this.expired_on = expired_on;
    this.activation_date = activation_date;
    this.warranty_expired_on = warranty_expired_on;
    this.vehicle_type_id = vehicle_type_id;
    this.note = note;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = DeviceSchema;
