class VehicleTypeModel {
  constructor({
    name,
    vehicle_icon_id,
    max_speed,
    rule,
    publish,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.name = name;
    this.vehicle_icon_id = vehicle_icon_id;
    this.max_speed = max_speed;
    this.rule = rule;
    this.publish = publish;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = VehicleTypeModel;
