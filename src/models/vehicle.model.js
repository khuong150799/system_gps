class Vehicle {
  constructor({
    device_id,
    name,
    package_service_id,
    expired_on,
    activation_date,
    warranty_expired_on,
    vehicle_type_id,
    quantity_channel,
    weight,
    note,
    is_deleted,
    is_checked,
    is_transmission,
    created_at,
    updated_at,
  }) {
    this.device_id = device_id;
    this.name = name;
    this.package_service_id = package_service_id;
    this.expired_on = expired_on;
    this.activation_date = activation_date;
    this.warranty_expired_on = warranty_expired_on;
    this.vehicle_type_id = vehicle_type_id;
    this.quantity_channel = quantity_channel;
    this.weight = weight;
    this.note = note;
    this.is_deleted = is_deleted;
    this.is_checked = is_checked;
    this.is_transmission = is_transmission;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = Vehicle;
