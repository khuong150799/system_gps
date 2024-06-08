class VehicleSchema {
  constructor({
    device_id,
    name,
    service_package_id,
    expired_on,
    activation_date,
    warranty_expired_on,
    vehicle_type_id,
    quantity_channel,
    weight,
    warning_speed,
    note,
    is_deleted,
    is_checked,
    is_transmission_gps,
    is_transmission_image,
    created_at,
    updated_at,
  }) {
    this.device_id = device_id;
    this.name = name;
    this.service_package_id = service_package_id;
    this.expired_on = expired_on;
    this.activation_date = activation_date;
    this.warranty_expired_on = warranty_expired_on;
    this.vehicle_type_id = vehicle_type_id;
    this.quantity_channel = quantity_channel;
    this.weight = weight;
    this.warning_speed = warning_speed;
    this.note = note;
    this.is_deleted = is_deleted;
    this.is_checked = is_checked;
    this.is_transmission_gps = is_transmission_gps;
    this.is_transmission_image = is_transmission_image;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = VehicleSchema;
