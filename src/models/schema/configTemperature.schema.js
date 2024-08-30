class ConfigTemperatureSchema {
  constructor({
    vehicle_id,
    device_id,
    activation_date,
    is_deleted,
    note,
    created_at,
    updated_at,
  }) {
    this.vehicle_id = vehicle_id;
    this.device_id = device_id;
    this.activation_date = activation_date;
    this.is_deleted = is_deleted;
    this.note = note;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = ConfigTemperatureSchema;
