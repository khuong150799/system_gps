class VehicleSchema {
  constructor({
    display_name,
    name,
    vehicle_type_id,
    weight,
    chassis_number,
    business_type_id,
    warning_speed,
    note,
    is_deleted,
    is_checked,
    created_at,
    updated_at,
  }) {
    this.display_name = display_name;
    this.name = name;
    this.vehicle_type_id = vehicle_type_id;
    this.weight = weight;
    this.chassis_number = chassis_number;
    this.business_type_id = business_type_id;
    this.warning_speed = warning_speed;
    this.note = note;
    this.is_deleted = is_deleted;
    this.is_checked = is_checked;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = VehicleSchema;
